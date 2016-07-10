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

qpo.upr = 5; //upper panel corner radius
qpo.upperPanel = function(titleEl){ //return the top white panel Raph
  var box = titleEl.getBBox();
  var xMargin = 20; //Left-right
  var topMargin = 60;
  var botMargin = 10; //bottom
  var panelWidth = box.width + 2 * xMargin;
  var panelHeight = box.height + botMargin + topMargin;
  var panel = c.rect(box.x - xMargin, box.y - topMargin, panelWidth, panelHeight, qpo.upr)
    .insertBefore(titleEl)
    .attr({'fill':qpo.COLOR_DICT['foreground'],'stroke':'none'});
  titleEl.attr({'fill': qpo.COLOR_DICT['background']})
  // qpo.glows.push(panel.glow({'color':qpo.COLOR_DICT['foreground']}))
  return panel;
}

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
  // var w = el.getBBox().width;
  // var h = el.getBBox().height;
  // var lx = el.getBBox().x; //left x
  // var ty = el.getBBox().y; //top y
  el.attr({'x':el.getBBox().x2});
  // el.attr({'x':el.getBBox().x2, 'y':el.getBBox().y2}); //for y-adjusted text
  return el;
}

qpo.Menu = function(titleStr, itemList, parent, placeholder){ // A Menu contains a CursorList of MenuOptions
  this.titleStr = titleStr;
  this.TITLE_SIZE = 40;

  this.isPlaceholder = placeholder || false;
  if ( this.isPlaceholder == false ){ //make a real menu.
    this.cl = new qpo.CursorList(itemList);

    this.open = function(){ // (re)create all the raphs for this menu.
      qpo.mode = 'menu';
      qpo.activeMenu = this.titleStr;

      this.background = c.rect(0,0, c.width, c.height).attr({'fill':qpo.COLOR_DICT['background']});
      this.title = c.text(c.width/2, 60, this.titleStr).attr({qpoText:[this.TITLE_SIZE, qpo.COLOR_DICT['foreground']]});
      // this.upperPanel = qpo.upperPanel(this.title);
      this.layer1 = c.set().push(this.background, this.title, this.upperPanel);

      qpo.makeMuteButton();

      this.board = new qpo.Board(1, 7, 200, 120, 40);
      qpo.board = this.board;
      this.layer2 = c.set().push(this.board.all);

      this.cl.render();

      this.next = this.cl.next;
      this.previous = this.cl.previous;

      this.all = c.set().push(this.layer1, this.layer2);
      for(var i=0; i < this.cl.length; i++){ this.all.push(this.cl.list[i].raphs); }
      qpo.fadeIn(this.all);
      qpo.fadeInGlow(qpo.glows);
    }.bind(this);
  }
  else { // make a placeholder menu
    this.open = function(){ // (re)create all the raphs for this menu.
      qpo.mode = 'menu';
      qpo.activeMenu = this.titleStr;

      this.background = c.rect(0,0, c.width, c.height).attr({'fill':qpo.COLOR_DICT['background']});
      this.comingSoon = c.text(c.width/2, c.height/2, 'Coming Soon!').attr({qpoText:[50]});
      this.all = c.set().push(this.background, this.comingSoon);
      qpo.fadeIn(this.all);
    }.bind(this);
  }

  this.parent = qpo.menus[parent] || 'title';
  this.up = function(){ this.close('parent'); }

  this.close = function(status, time){ //clear the canvas and open the next screen
    qpo.ignoreInput = true;
    qpo.fadeOutGlow(qpo.glows, function(){qpo.ignoreInput = false;}, time);
    qpo.fadeOut(this.all, function(){
      c.clear();
      this.all = null; //remove reference to raphs too
      switch(status){
        case 'title': {
          qpo.titleScreen = new qpo.displayTitleScreen();
          break;
        }
        case 'parent' : {
          this.parent.open();
          break;
        }
        case '2v2': {
          qpo.startGame(qpo.settings2v2, true, true, qpo.gameLength);
          break;
        }
        case '4v4': {
          qpo.startGame(qpo.settings4v4, true, true, qpo.gameLength);
          break;
        }
        case '6v6': {
          qpo.startGame(qpo.settings6v6, true, true, qpo.gameLength);
          break;
        }
        case '2v2m': {
          qpo.startGame(qpo.settings2v2multi, true, true, qpo.gameLength);
          break;
        }
        case '6v6m': {
          qpo.startGame(qpo.settings6v6multi, true, true, qpo.gameLength);
          break;
        }
        default : { qpo.menus[status].open(); }
      }
    }.bind(this), time);
  }.bind(this);

  return this;
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
qpo.MenuOption = function(gx, gy, textStr, action, menu, active, order, color, index){ // AKA UnitButton
  //pass in a spawn point, some text, and a function to execute when this option is chosen
  this.index = index;
  this.color = color || 'blue';
  qpo.guiDimens.squareSize = 50;
  this.gx = gx;
  this.gy = gy;
  var mtr = qpo.guiDimens.squareSize;
  this.textStr = textStr;
  this.active = active || false;

  this.render = function(){ //do all the stuff that creates or changes Raph els
    this.menu = qpo.menus[menu]; //the menu object that it belongs to

    this.unit = new qpo.Unit(this.color, this.gx, this.gy); // arg 'num' gets set to 0
    if(order){this.unit.setIcon(order)}

    this.text = qpo.xtext(this.unit.rect.attr('x')+this.unit.tx()+mtr*5/4,
      this.unit.rect.attr('y')+this.unit.ty()+mtr/2, this.textStr, 20);
    // this.text = c.text(this.unit.rect.attr('x')+this.unit.tx()+mtr*10/4, this.unit.rect.attr('y')+this.unit.ty()+mtr/2, this.textStr)
    //   .attr({qpoText:[20]});
    if(this.active){this.text.attr({'fill':qpo.COLOR_DICT['orange']})} //highlight it if active

    this.raphs = c.set(this.text, this.unit.phys);

    this.activate = function(){
      this.text.attr({'fill':qpo.COLOR_DICT['orange']});
      this.unit.activate();
      this.active = true;
    }
    this.deactivate = function(){
      this.text.attr({'fill':qpo.COLOR_DICT['foreground']});
      this.unit.deactivate();
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
  qpo.mode = "menu"; // Type of screen that's active -- can be "menu", "game", "tut", or "other"

  qpo.menus = {};

  //make all the menus:
  qpo.menus['Main Menu'] = new qpo.Menu('Main Menu', [
    new qpo.MenuOption(0,1,'Play', function(){}, 'Main Menu', true, 'moveRight', 'blue', 0),
    new qpo.MenuOption(0,3,'How To Play', function(){}, 'Main Menu', false, 'shoot', 'blue', 1),
    new qpo.MenuOption(0,5,'Compete', function(){}, 'Main Menu', false, 'bomb', 'red', 2)
  ], 'title');
  qpo.menus['Main Menu'].up = function(){qpo.menus['Main Menu'].close('title')};

  qpo.menus['Game Setup'] = new qpo.Menu('Game Setup', [
    new qpo.MenuOption(0,1,'2v2', function(){}, 'Game Setup', true, 'stay', 'blue', 0),
    new qpo.MenuOption(0,3,'4v4', function(){}, 'Game Setup', false, 'shoot', 'blue', 1),
    new qpo.MenuOption(0,5,'6v6', function(){}, 'Game Setup', false, 'bomb', 'red', 2)
  ], 'Main Menu');
  qpo.menus['How To Play'] = new qpo.Menu('How To Play', null, 'Main Menu', true);
  qpo.menus['Compete'] = new qpo.Menu('Compete', [
    new qpo.MenuOption(0,1,'2v2', function(){}, 'Compete', true, 'stay', 'blue', 0),
    new qpo.MenuOption(0,3,'6v6', function(){}, 'Compete', false, 'stay', 'blue', 1)
  ], 'Main Menu', false);

  qpo.menus['Match Complete'] = new qpo.Menu('Match Complete',[
    new qpo.MenuOption(0,1, 'Main Menu', function(){}, 'Match Complete', true, 'stay', 'blue', 0)
  ], 'Main Menu');

  //customize the "How To Play" menu:
  qpo.menus['How To Play'].open = (function(){
    var original = qpo.menus['How To Play'].open;
    return function() {
        // Use .apply() to call the baseline "open" function within this scope:
        var result = original.apply(this, arguments);

        // Then do some custom stuff because this menu is different from normal:
        var menu = qpo.menus['How To Play'];
        menu.comingSoon.remove();

        var texts = [
          'Q-Po is turn-based.', //0
          'To score, reach their end zone or destroy their units.', //1
          ' CONTROLS ', //2
          'KEY', //3
          'q',
          'e',
          'w/a/s/d',
          'x',
          'arrow keys',
          'backspace/delete',
          'ACTION', //10
          'bomb',
          'shoot',
          'move left/up/right/down',
          'stay',
          'change active unit', //15
          'go to previous menu' //16
        ]
        var set = c.set(); //set for texts, title, and upperPanel
        for(ind in texts){ //Create raph els from the texts array
          ind = parseInt(ind);
          var y = 140 + ind*40;
          var color;
          switch(ind){ //prep the color of the text
            case 4:
            case 11: { // q/bomb (purple)
              color = 'purple';
              break;
            }
            case 5:
            case 12: { // e/shoot (green)
              color = 'green';
              break;
            }
            case 8:
            case 15: { // arrow keys/select unit (orange)
              color = 'orange';
              break;
            }
            default: { color = 'foreground'; } //white
          }
          switch(ind){ //create the text in the correct place
            case 0:
            case 1: { y -= 20 }
            case 2: { //cases 0-2 (centered elements)
              set.push(c.text(c.width/2, y, texts[ind]).attr({qpoText:[20]}))
              break;
            }
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9: { //cases 3-9 (left column)
              set.push(qpo.xtext(100, y, texts[ind], 20, qpo.COLOR_DICT[color]));
              break;
            }
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
            case 16: { //cases 10-16 (right column)
              y = 140 + (ind-7)*40;
              set.push(qpo.xtext(320, y, texts[ind], 20, qpo.COLOR_DICT[color]));
              break;
            }
          }
        }

        var upperPanel, title;
        menu.title = title = c.text(c.width/2, 60, 'How To Play').attr({qpoText:[qpo.menus['How To Play'].TITLE_SIZE, qpo.COLOR_DICT['foreground']]});
        // menu.upperPanel = upperPanel = qpo.upperPanel(menu.title);

        menu.all.push(set,
          //  upperPanel,
           title);
        qpo.fadeIn(menu.all);

        return result;
    };
  })();

  //make menu options do what they're supposed to:
  qpo.menus['Main Menu'].cl.list[0].action = function(){ qpo.menus['Main Menu'].close('Game Setup'); }
  qpo.menus['Main Menu'].cl.list[1].action = function(){ qpo.menus['Main Menu'].close('How To Play'); }
  qpo.menus['Main Menu'].cl.list[2].action = function(){ qpo.menus['Main Menu'].close('Compete'); }

  qpo.menus['Game Setup'].cl.list[0].action = function(){ qpo.menus['Game Setup'].close('2v2', 1000); }
  qpo.menus['Game Setup'].cl.list[1].action = function(){ qpo.menus['Game Setup'].close('4v4', 1000); }
  qpo.menus['Game Setup'].cl.list[2].action = function(){ qpo.menus['Game Setup'].close('6v6', 1000); }

  qpo.menus['Compete'].cl.list[0].action = function(){ qpo.menus['Compete'].close('2v2m', 1000); }
  qpo.menus['Compete'].cl.list[1].action = function(){ qpo.menus['Compete'].close('6v6m', 1000); }

  qpo.menus['Match Complete'].cl.list[0].action = function(){ qpo.menus['Match Complete'].close('parent'); }

  // qpo.menus['Multiplayer'] =  new qpo.Menu('Multiplayer', null, 'Main Menu');

  // qpo.menus['Match Results'] = new qpo.Menu('Match Results', null, 'Main Menu');
  // qpo.menus['Demo'] = new qpo.Menu('Demo', null, 'Main Menu'); //TODO: add 1-Po, 4-Po, and 7-Po buttons
}
qpo.displayTitleScreen = function(){ //Called whenever title screen is displayed
  qpo.activeMenu = "title";
  // qpo.menus["title"] = this;
  qpo.mode = "menu";

  //1ST LAYER (background blackness)
  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black"});
  this.layer1 = c.set().push(this.blackness);

  qpo.makeMuteButton();
  qpo.activeGame = new qpo.Game(11, 3, false, false, true); //just to define the unit size

  //2ND LAYER (foreground) : board, then units that spell "Q-Po"
  var UNIT_LENGTH = qpo.guiDimens.squareSize;
  var adj = -5;
  var grid_start = 2;
  qpo.guiCoords.gameBoard.leftWall = adj + UNIT_LENGTH*grid_start;
  qpo.guiCoords.gameBoard.topWall = adj + UNIT_LENGTH*grid_start;
  this.board = new qpo.Board(17,7, qpo.guiCoords.gameBoard.leftWall, qpo.guiCoords.gameBoard.rightWall);
  qpo.board = this.board;
  this.board.all.transform('t' + -(UNIT_LENGTH) + ',' + -(UNIT_LENGTH));
  qpo.glows.transform('t' + -(UNIT_LENGTH) + ',' + -(UNIT_LENGTH));
  this.layer2 = c.set().push(this.board.all);
  //Spawn units in the shape of the letters "Q-Po".
  this.qUnits = new Array();
  this.qUnits.push(
    new qpo.Unit('blue', 1,0,0),
    new qpo.Unit('blue', 0,1,1),
    new qpo.Unit('blue', 2,0,2),
    new qpo.Unit('blue', 3,1,3),
    new qpo.Unit('blue', 3,2,4),
    new qpo.Unit('red', 0,2,0),
    new qpo.Unit('red', 1,3,1),
    new qpo.Unit('red', 2,3,2),
    new qpo.Unit('red', 3,4,3),
    new qpo.Unit('red', 4,4,4)
  );
  this.qRaphs = c.set();
  for(var i=0; i<this.qUnits.length; i++){ //randomize icons and store to set
    this.qUnits[i].randomIcon();
    this.qRaphs.push(this.qUnits[i].phys);
  }

  this.dashUnit = new qpo.Unit('red',5,2,5);
  this.dashUnit.randomIcon();
  this.dash = this.dashUnit.phys;

  this.pUnits = new Array();
  this.pUnits.push(
    new qpo.Unit('blue', 7,0,5),
    new qpo.Unit('blue', 8,0,6),
    new qpo.Unit('blue', 9,0,7),
    new qpo.Unit('blue', 7,1,8),
    new qpo.Unit('blue', 9,1,9),
    new qpo.Unit('red', 7,2,6),
    new qpo.Unit('red', 8,2,7),
    new qpo.Unit('red', 9,2,8),
    new qpo.Unit('red', 7,3,9)
  );
  this.pRaphs = c.set();
  for(var i=0; i<this.pUnits.length; i++){ //randomize icons and store to set
     this.pUnits[i].randomIcon();
     this.pRaphs.push(this.pUnits[i].phys);
   }

  this.oUnits = new Array();
  this.oUnits.push(
    new qpo.Unit('blue', 12,0,10),
    new qpo.Unit('blue', 13,0,11),
    new qpo.Unit('blue', 11,1,12),
    new qpo.Unit('blue', 14,1,13),
    new qpo.Unit('red', 12,3,10),
    new qpo.Unit('red', 13,3,11),
    new qpo.Unit('red', 11,2,12),
    new qpo.Unit('red', 14,2,13)
  );
  this.oRaphs = c.set();
  for(var i=0; i<this.oUnits.length; i++){ //randomize icons and store to set
    this.oUnits[i].randomIcon();
    this.oRaphs.push(this.oUnits[i].phys);
  }

  this.title = c.set(this.qRaphs, this.dash, this.pRaphs, this.oRaphs);
  this.layer2.push(this.title, this.board);

  //3rd layer (prompt)
  this.promptt = c.text(qpo.guiDimens.gpWidth/2, qpo.guiDimens.gpHeight/2, "Press enter to start")
    .attr({qpoText:[32,qpo.COLOR_DICT["orange"]], "opacity":1});
  qpo.blink(this.promptt);
  this.layer3 = c.set().push(this.promptt);

  this.all = c.set();
  this.all.push(this.layer1, this.layer2, this.layer3);
  this.all.attr({'opacity':0});
  qpo.fadeIn(this.all);

  this.close = function(){ //clear screen and make main menu
    qpo.fadeOutGlow(qpo.glows);
    this.promptt.stop();
    qpo.fadeOut(this.promptt, function(){}, 200);
    qpo.fadeOut(this.all, function(){
      c.clear();
      qpo.guiCoords.gameBoard.leftWall = 25;
      qpo.guiCoords.gameBoard.topWall = 75;
      qpo.menus['Main Menu'].open();
    }, 400);
  };

  return this;
}

//CREATE TITLE SCREEN AND MENUS:
qpo.titleScreen = new qpo.displayTitleScreen(); // ******
qpo.makeMenus();
qpo.user = localStorage['player'] || new qpo.Player(null, 'epicGuest', 'human', null);
