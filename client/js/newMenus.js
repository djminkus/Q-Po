//Set up the menu objects and open the title screen.

qpo.font = 'Orbitron';
switch(qpo.font){ //for easy font switching
  case 'Righteous':{
    WebFontConfig = { google: { families: [ 'Righteous::latin' ] } };
    break;
  }
  case 'Poppins':{
    WebFontConfig = { google: { families: [ 'Poppins:400,300,500,600,700:latin' ] } };
    break;
  }
  case 'Oxygen':{
    WebFontConfig = { google: { families: [ 'Oxygen:300,400,700:latin' ] } };
    break;
  }
  case 'Varela':{
    WebFontConfig = { google: { families: [ 'Varela+Round::latin' ] } };
    break;
  }
  case 'Questrial':{
    WebFontConfig = { google: { families: [ 'Questrial::latin' ] } };
    break;
  }
  case 'Orbitron':{
    WebFontConfig = { google: { families: [ 'Orbitron:400,500,700,900:latin' ] } };
    break;
  }
  case 'Open Sans':{
    WebFontConfig = { google: { families: [ 'Open+Sans:300,400:latin' ] } };
    break;
  }
}
(function() { //inject the Google webfont script
  var wf = document.createElement('script');
  wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
  wf.type = 'text/javascript';
  wf.async = 'true';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(wf, s);
})();
qpo.activeMenuOptAtts = {'fill':qpo.COLOR_DICT['orange'], 'opacity':1}
qpo.inactiveMenuOptAtts = {'fill':'grey', 'opacity':1}

c.customAttributes.qpoText = function(size, fill){ //style text white with Open Sans family and "size" font-size.
  return {
    "font-size": size,
    "fill": (fill || "white"),
    "font-family":" '" + qpo.font + "',sans-serif"
    // "font-family":"'Poppins',sans-serif"
    // "font-family":"'Oxygen',sans-serif"
    // "font-family":"'Varela Round',sans-serif"
    // "font-family":"'Questrial',sans-serif"
    // "font-family":"'Orbitron',sans-serif"
    // "font-family":"'Open Sans',sans-serif"
    // "font-family":"sans-serif"
  };
}
qpo.xtext = function(x, y, str, size, color){ //make a Raphael text el with its left end at x and centered vertically on y
  var size = size || 10;
  var color = color || qpo.COLOR_DICT['foreground'];
  var el = c.text(x,y,str).attr({qpoText:[size, color]});
  el.attr({'x':el.getBBox().x2});
  // el.attr({'x':el.getBBox().x2, 'y':el.getBBox().y2}); //for y-adjusted text
  return el;
}
qpo.makeBits = function(x1, y1, xRange, yRange, colors, number){
  //colors is an array of color strings
  var bits = c.set()
  for(i=0; i<number; i++){
    var size = 13 * Math.random() // 0 to 13
    var time = 67 * size //blink time in ms

    var x = x1 + xRange*Math.random()
    var y = y1 + yRange*Math.random()

    //make a new bit (circle or square)
    var newBit
    var b = Math.floor(2*Math.random()) // 0 or 1
    if(b){ newBit = c.rect(x, y, size, size) }
    else { newBit = c.circle(x, y, size/Math.sqrt(2)) }

    //choose its color
    var colorInd = Math.floor(colors.length*Math.random())
    newBit.attr({'stroke':colors[colorInd]})

    qpo.blink(newBit, time)

    bits.push(newBit)
  }
  bits.attr({'fill':'none', 'stroke-width': 2})
  return bits
}

qpo.Menu = function(titleStr, itemList, parent, placeholder, makeDoodad){ // A Menu contains a CursorList of MenuOptions
  this.titleStr = titleStr
  this.TITLE_SIZE = 40
  this.makeDoodad = makeDoodad || function(){return c.circle(-5,-5, 1)} // A function that returns a raph set

  this.isPlaceholder = placeholder || false
  this.cl = new qpo.CursorList(itemList)

  this.open = function(h){ // (re)create all the raphs for this menu.
    //h is index (in this.cl) of menu option to highlight on load.
    var h = h || 0;
    qpo.mode = 'menu';
    qpo.activeMenu = this.titleStr;

    this.background = c.rect(0,0, c.width, c.height).attr({'fill':qpo.COLOR_DICT['background']});
    this.title = c.text(c.width/2, 60, this.titleStr).attr({qpoText:[this.TITLE_SIZE, qpo.COLOR_DICT['foreground']]});
    this.layer1 = c.set().push(this.background, this.title);

    qpo.makeMuteButton();

    // this.board = new qpo.Board(1, 7, 200, 120, 40);
    // qpo.board = this.board;
    // this.layer2 = c.set().push(this.board.all);

    this.cl.render();
    // this.cl.select(h);

    this.doodad = this.makeDoodad()

    this.next = this.cl.next;
    this.previous = this.cl.previous;

    this.all = c.set().push(this.layer1, this.layer2, this.doodad);
    for(var i=0; i < this.cl.length; i++){ this.all.push(this.cl.list[i].raphs); }
    qpo.fadeIn(this.all, 500);
    qpo.fadeInGlow(qpo.glows);
  }

  this.parent = qpo.menus[parent] || 'title'
  this.up = function(){ this.close({'destination':'parent'}) }

  this.close = function(obj, time){ //clear the canvas and open the next screen
    qpo.ignore(time)
    this.all.stop()
    qpo.fadeOutGlow(qpo.glows, function(){}, time);
    qpo.fadeOut(this.all, function(){
      c.clear();
      this.all = null; //remove reference to raphs too
      switch(obj.destination){
        case 'title': { qpo.titleScreen = new qpo.displayTitleScreen(); break; }
        case 'parent' : { this.parent.open(); break; }
        case 'mission' : { qpo.missions[obj.missionNum].begin(); break;}
        case 'game' : { qpo.activeGame = new qpo.Game(obj.gameArgs); break; }
        default : {
          try{qpo.menus[obj].open();}
          catch(e){console.log(obj, qpo.menus[obj])}
        }
      }
    }.bind(this), time);
  }.bind(this);

  return this
}
qpo.CursorList = function(list, initialCursorPosition){ // A list with a "selected" or "active" item
  // Methods break unless each item in "list" has a "render()" method

  list===null ? this.list = new Array() : this.list=list ;
  this.length = this.list.length;
  this.cursorPosition = initialCursorPosition || 0;
  this.selectedItem = this.list[this.cursorPosition];

  this.select = function(index){
    this.selectedItem.deactivate();
    this.cursorPosition = index;
    this.selectedItem = this.list[this.cursorPosition];
    this.selectedItem.activate();
  }

  this.rendered = false;

  this.render = function(){ // Generate the raphs.
    // console.log('CursorList rendered'); //success
    for (var i=0; i<this.length; i++){ this.list[i].render(); } //render each item in the list
    try{this.selectedItem.activate()}
    catch(err){console.log('placeholder menu, or unexpected error')};
    this.rendered = true;
  }.bind(this);

  this.addItem = function(item){
    this.list.push(item)
    if(this.rendered){item.render()}
  }

  this.next = function(){
    if(this.cursorPosition>=this.list.length-1){this.select(0)}
    else{this.select(this.cursorPosition+1)}
  }.bind(this); // <-- THIS is when to use .bind() (function's identifier passed to another object)
  this.previous = function(){
    if(this.cursorPosition==0){this.select(this.list.length-1)}
    else{this.select(this.cursorPosition-1)}
  }.bind(this);

  return this;
}
qpo.MenuOption = function(x, y, textStr, action, menu, active, order, color, index){ // AKA UnitButton
  //pass in a spawn point, some text, and a function to execute when this option is chosen
  this.index = index;
  this.color = color || 'blue';
  this.x = x
  this.y = y
  qpo.guiDimens.squareSize = 50;
  var mtr = qpo.guiDimens.squareSize;
  this.textStr = textStr;
  this.active = active || false;

  this.render = function(){ //do all the stuff that creates or changes Raph els
    this.menu = qpo.menus[menu]; //the menu object that it belongs to

    // this.unit = new qpo.Unit(this.color, this.gx, this.gy); // arg 'num' gets set to 0
    // this.unit.setLevel(4);
    // this.unit.applyCoating('none');
    // if(order){this.unit.setIcon(order)}

    // this.active ? (this.icon = qpo.arrow(x, y, qpo.COLOR_DICT['orange'], 'right')) : (this.icon = c.circle(x, y, 5).attr({'fill':qpo.COLOR_DICT['foreground'], 'stroke':'none'}))

    this.text = qpo.xtext(x+mtr*2/4, y, this.textStr, 20)
    this.text.attr(qpo.inactiveMenuOptAtts);
    if(this.active){this.text.attr(qpo.activeMenuOptAtts)} //highlight it if active

    this.raphs = c.set(this.icon, this.text);

    this.activate = function(){
      this.icon = qpo.arrow(this.x, this.y, qpo.COLOR_DICT['orange'], 'right')
      this.text.attr(qpo.activeMenuOptAtts);
      qpo.blink(this.text);
      qpo.blink(this.icon);
      this.active = true;
    }
    this.deactivate = function(){
      this.text.stop();
      this.icon.stop();
      this.text.attr(qpo.inactiveMenuOptAtts);
      this.icon.remove()
      this.active = false;
    }

    this.raphs.hover(function(){
      this.raphs.attr({'cursor':'crosshair'});
      if(!this.active){this.menu.cl.select(this.index)}
    },
      function(){ this.raphs.attr({'cursor':'default'}); },
    this, this);
    this.raphs.click(function(){this.action()}.bind(this));
  }

  this.action = action; //a function

  return this;
}

qpo.makeMuteButton = function(){ //make an icon that can mute the music when clicked
  qpo.muteButton = c.path("M-4,-4 L4,-4 L10,-10 L10,10 L4,4 L-4,4 L-4,-4")
    .attr({"stroke-width":2, "stroke":qpo.COLOR_DICT["green"],
      "fill":qpo.COLOR_DICT["green"], "opacity":1})
    .transform("t15,500")
    .click(function(){
      switch(qpo.menuSong.volume){
        case 1: { qpo.menuSong.volume = 0.2; break;}
        case 0.2: { qpo.menuSong.volume = 0; break; }
        case 0: { qpo.menuSong.volume = 1; break; }
        default: {console.log("this was unexpected"); break;}
      }
    }
  );
}

qpo.makeMenus = function(){ //Lay out the menu skeletons (without creating Raphael elements, except the Main Menu's)
  qpo.mode = "menu" // Type of screen that's active -- can be "menu", "game", "tut", or "other"

  qpo.menus = {}
  var x = 50
  var yStart = 100
  var yInt = 50


  var bitsX = 250
  var bitsY = 100
  var bitsXR = 270
  var bitsYR = 400
  //make all the menus:
  qpo.menus['Main Menu'] = new qpo.Menu('Main Menu', [
    new qpo.MenuOption(x, yStart + yInt,'Campaign', function(){}, 'Main Menu', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'vs. Computer', function(){}, 'Main Menu', false, 'stay', 'blue', 1),
    new qpo.MenuOption(x, yStart + 3*yInt,'Multiplayer', function(){}, 'Main Menu', false, 'stay', 'blue', 2),
    new qpo.MenuOption(x, yStart + 4*yInt,'Settings', function(){}, 'Main Menu', false, 'stay', 'blue', 3)
  ], 'title', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, qpo.colors, 29)});
  qpo.menus['Main Menu'].up = function(){qpo.menus['Main Menu'].close({'destination':'title'})};
  qpo.menus['Main Menu'].cl.list[0].action = function(){ qpo.menus['Main Menu'].close('Campaign'); }
  qpo.menus['Main Menu'].cl.list[1].action = function(){ qpo.menus['Main Menu'].close('vs. Computer'); }
  qpo.menus['Main Menu'].cl.list[2].action = function(){ qpo.menus['Main Menu'].close('Multiplayer'); }
  qpo.menus['Main Menu'].cl.list[3].action = function(){ qpo.menus['Main Menu'].close('Settings'); }

  qpo.menus['Campaign'] = new qpo.Menu('Campaign', [
    new qpo.MenuOption(x, yStart + yInt,'Mission 1', function(){}, 'Campaign', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'Mission 2', function(){}, 'Campaign', false, 'stay', 'blue', 1),
    new qpo.MenuOption(x, yStart + 3*yInt,'Mission 3', function(){}, 'Campaign', false, 'stay', 'blue', 2),
    new qpo.MenuOption(x, yStart + 4*yInt,'Mission 4', function(){}, 'Campaign', false, 'stay', 'blue', 3)
  ], 'Main Menu', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.blue], 29)});
  qpo.menus['Campaign'].cl.list[0].action = function(){ qpo.menus['Campaign'].close({
    'destination':'mission',
    'missionNum':1
  }, 1000); }
  // qpo.menus['Campaign'].cl.list[1].action = function(){ qpo.menus['Campaign'].close('Mission 2', 1000); }
  // qpo.menus['Campaign'].cl.list[2].action = function(){ qpo.menus['Campaign'].close('Mission 3', 1000); }
  // qpo.menus['Campaign'].cl.list[3].action = function(){ qpo.menus['Campaign'].close('Mission 4', 1000); }

  qpo.menus['vs. Computer'] = new qpo.Menu('vs. Computer', [
    new qpo.MenuOption(x, yStart + yInt,'2-Po', function(){}, 'vs. Computer', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'3-Po', function(){}, 'vs. Computer', false, 'stay', 'blue', 1),
    new qpo.MenuOption(x, yStart + 3*yInt,'4-Po', function(){}, 'vs. Computer', false, 'stay', 'blue', 2)
  ], 'Main Menu', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.red], 29)});
  qpo.menus['vs. Computer'].cl.list[0].action = function(){ qpo.menus['vs. Computer'].close({
    'destination':'game',
    'gameArgs': {
      'type':'single', 'q':8, 'po':4, 'ppt': 2,
      'bluePlayers': [qpo.user.toPlayer({'team':'blue', 'number': 0})]
    }
  }, 1000); }
  qpo.menus['vs. Computer'].cl.list[1].action = function(){ qpo.menus['vs. Computer'].close({
    'destination':'game',
    'gameArgs': {
      'type':'single', 'q':9, 'po':9, 'ppt': 3,
      'bluePlayers': [qpo.user.toPlayer({'team':'blue', 'number': 0})]
    }
  }, 1000); }
  qpo.menus['vs. Computer'].cl.list[2].action = function(){ qpo.menus['vs. Computer'].close({
    'destination':'game',
    'gameArgs': {
      'type':'single', 'q':11, 'po':12, 'ppt':3,
      'bluePlayers': [qpo.user.toPlayer({'team':'blue', 'number': 0})]
    }
  }, 1000); }

  qpo.menus['Multiplayer'] = new qpo.Menu('Multiplayer', [
    new qpo.MenuOption(x, yStart + yInt,'2-Po', function(){}, 'Multiplayer', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'3-Po', function(){}, 'Multiplayer', false, 'stay', 'blue', 1),
    new qpo.MenuOption(x, yStart + 3*yInt,'4-Po', function(){}, 'Multiplayer', false, 'stay', 'blue', 2)
  ], 'Main Menu', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.green], 29)});
  qpo.menus['Multiplayer'].cl.list[0].action = function(){ qpo.menus['Multiplayer'].close({
    'destination':'game',
    'type':'multi', 'q':7, 'po':2
  }, 1000); }
  qpo.menus['Multiplayer'].cl.list[1].action = function(){ qpo.menus['Multiplayer'].close({
    'destination':'game',
    'type':'multi', 'q':8, 'po':3
  }, 1000); }
  qpo.menus['Multiplayer'].cl.list[2].action = function(){ qpo.menus['Multiplayer'].close({
    'destination':'game',
    'type':'multi', 'q':9, 'po':4
  }, 1000); }

  qpo.menus['Settings'] = new qpo.Menu('Settings', [
    new qpo.MenuOption(x, yStart + 1*yInt,'coming', function(){}, 'Settings', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'soon', function(){}, 'Settings', false, 'stay', 'blue', 1)
  ], 'Main Menu', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.orange], 29)});
  qpo.menus['Settings'].cl.list[0].action = function(){ qpo.menus['Settings'].close({'destination':'parent'}); }
  qpo.menus['Settings'].cl.list[1].action = function(){ qpo.menus['Settings'].close({'destination':'parent'}); }

  qpo.menus['Match Complete'] = new qpo.Menu('Match Complete',[
    new qpo.MenuOption(x, yStart + 1*yInt, 'Main Menu', function(){}, 'Match Complete', true, 'stay', 'blue', 0)
  ], 'Main Menu', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.purple], 29)});
  qpo.menus['Match Complete'].cl.list[0].action = function(){ qpo.menus['Match Complete'].close({'destination':'parent'}); }
}
qpo.displayTitleScreen = function(){ //Called whenever title screen is displayed
  qpo.activeMenu = "title";
  qpo.mode = "menu";
  qpo.activeMission = qpo.missions[0] = new qpo.Mission([false,0,false])

  //1ST LAYER (background blackness)
  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black"});
  this.layer1 = c.set().push(this.blackness);

  // qpo.makeMuteButton();
  // qpo.activeGame = new qpo.Game(11, 3, false, false, true); //needed for menus. UNACCEPTABLE.

  //2ND LAYER (foreground) :
  this.bits = c.set()
  this.bitsLeft = c.set();
  this.bitsRight = c.set();
  var colors = [qpo.COLOR_DICT['green'], qpo.COLOR_DICT['purple']]
  for (var i=0; i<23; i++){ //generate some pixelly starlike things.
    var size = 13 * Math.random()
    var time = 67*size

    var ind = Math.floor(2*Math.random())
    var color1 = colors[ind]
    var color2
    ind ? (color2 = colors[ind-1]) : (color2 = colors[ind+1])

    var x = c.width/2*Math.random()
    var y = c.height*Math.random()


    var newBit1 = c.rect(x, y, size, size).attr({'stroke':color1}).data('i', i)
    qpo.blink(newBit1, time)
    var newBit2 = c.circle(c.width-x, c.height-y, size/Math.sqrt(2)).attr({'stroke':color2}).data('i', i)
    qpo.blink(newBit2, time)

    this.bits.push(newBit1, newBit2)
    this.bitsLeft.push(newBit1)
    this.bitsRight.push(newBit2)
  }
  this.bits.attr({'fill':'none', 'stroke-width': 2});
  this.layer2 = c.set().push(this.bits);

  //3rd layer (board, title, and prompt)
  var m = 100;
  this.board = new qpo.Board(2,1, c.width/2-m, c.height/2 - m*3/2, m);
  this.title = c.text(c.width/2, c.height/2-m, 'Q-Po').attr({qpoText:64})
  this.promptt = c.text(c.width/2, c.height/2+m, "press spacebar to start")
    .attr({qpoText:[32, qpo.COLOR_DICT["orange"]]});
  qpo.blink(this.promptt);
  this.layer3 = c.set().push(this.board.all, this.title, this.promptt);

  this.all = c.set();
  this.all.push(this.layer1, this.layer2, this.layer3);
  this.all.attr({'opacity':0});
  qpo.fadeIn(this.all);

  this.close = function(){ //clear screen and make main menu
    // this.all.stop();

    var timeScale = 4
    var totalLength = 500 //length of closing animation if timeScale is 1
    var HW = c.width/2 //half width

    var bitAnimLength = .2
    this.bitsLeft.forEach(function(item, index){
      var DISPLACEMENT = 1 - ( item.getBBox().x / HW ) // displacement from center
      var DELAY = DISPLACEMENT * ( (1-bitAnimLength) * timeScale)
      // console.log(delay)
      setTimeout(function(){
        item.animate({'transform':'t-'+(HW + DISPLACEMENT + 20)+',0'}, (bitAnimLength*totalLength*timeScale), '>')
        // console.log(item)
        // debugger;
      }.bind(this), DELAY)
    })
    this.bitsRight.forEach(function(item, index){
      var DISPLACEMENT = 1 - (c.width-item.getBBox().x2)/HW
      var DELAY = DISPLACEMENT * (1-bitAnimLength * timeScale)
      setTimeout(function(){
        item.animate({'transform':'t'+(HW + DISPLACEMENT + 20)+',0'}, (bitAnimLength*totalLength*timeScale), '>')
      }.bind(this), DELAY)
    })
    qpo.ignore(400*timeScale)
    this.promptt.stop();
    qpo.fadeOut(this.promptt, function(){}, .25*totalLength*timeScale);
    qpo.fadeOutGlow(qpo.glows, function(){}, .25*totalLength*timeScale);
    qpo.fadeOut(this.board.all, function(){}, .25*totalLength*timeScale);
    this.title.animate({
      '40%': {'opacity':.3},
      '100%': {'opacity':1}
    }, .4*totalLength*timeScale, function(){ qpo.glows.push( this.title.glow({'color':'white'}) ) }.bind(this) )
    setTimeout(function(){
      qpo.fadeOutGlow(qpo.glows, function(){}, .6*totalLength*timeScale)
      qpo.fadeOut(this.title, function(){
        c.clear();
        qpo.guiCoords.gameBoard.leftWall = 25;
        qpo.guiCoords.gameBoard.topWall = 75;
        qpo.menus['Main Menu'].open();
      }, .6*totalLength*timeScale)
    }.bind(this), .4*totalLength*timeScale)
  };
  this.all.click(function(){ this.close() }.bind(this));

  return this;
}

//CREATE TITLE SCREEN AND MENUS:
qpo.titleScreen = new qpo.displayTitleScreen(); // ******
qpo.makeMenus();
if(qpo.devMode){ qpo.user = localStorage['minx'] || new qpo.User('devMinx')}
else {qpo.user = localStorage['user'] || new qpo.User('epicGuest');}
