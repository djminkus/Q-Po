//Set up the menu objects and open the title screen.

c.customAttributes.qpoText = function(size, fill){ //style text white with Open Sans family and "size" font-size.
  return {
    "font-size": size,
    "fill": (fill || "white"),
    "font-family":"'Orbitron',sans-serif"
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
      this.title = c.text(c.width/2, 60, this.titleStr).attr({qpoText:[this.TITLE_SIZE]});
      this.layer1 = c.set().push(this.background, this.title);

      this.board = new qpo.Board(1, 7, 200, 120, 40);
      qpo.board = this.board;
      this.layer2 = c.set().push(this.board.all)

      this.cl.render();

      this.next = this.cl.next;
      this.previous = this.cl.previous;

      this.all = c.set().push(this.layer1, this.layer2);
      for(var i=0; i < this.cl.length; i++){ this.all.push(this.cl.list[i].raphs); }
      qpo.fadeIn(this.all);
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

      this.next = function(){console.log('why u do taht?')};
      this.previous = function(){console.log('whyyyyyyyy')};
    }.bind(this);
  }

  this.parent = qpo.menus[parent] || 'title';
  this.up = function(){ this.close('parent'); }

  this.close = function(status){ //clear the canvas
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
        default : { qpo.menus[status].open(); }
      }
    }.bind(this));
  }.bind(this);

  return this;
}

qpo.CursorList = function(list, initialCursorPosition){ // A list with a "selected" or "active" item
  list===null ? this.list = new Array() : this.list=list ;
  this.length = this.list.length;
  this.cursorPosition = initialCursorPosition || 0;
  this.selectedItem = this.list[this.cursorPosition];

  this.render = function(){ // generate the raphs
    // console.log('CursorList rendered'); //success
    for (var i=0; i<this.length; i++){ this.list[i].render(); } //render each item in the list
    try{this.selectedItem.activate()}
    catch(err){console.log('placeholder menu.')};
  }.bind(this);

  this.next = function(){
    this.selectedItem.deactivate();
    this.cursorPosition++;
    if(this.cursorPosition >= this.list.length){this.cursorPosition = 0}; //loop back to start
    this.selectedItem = this.list[this.cursorPosition];
    this.selectedItem.activate();
  }.bind(this); // <-- THIS is when to use .bind() (function's identifier passed to another object)
  this.previous = function(){
    this.selectedItem.deactivate();
    this.cursorPosition--;
    if(this.cursorPosition == -1){this.cursorPosition = this.list.length-1}; //loop back to start
    this.selectedItem = this.list[this.cursorPosition];
    this.selectedItem.activate();
  }.bind(this);

  return this;
}

qpo.MenuOption = function(gx, gy, textStr, action, menu, active){ // AKA UnitButton
  //pass in a spawn point, some text, and a function to execute when this option is chosen
  qpo.guiDimens.squareSize = 50;
  this.gx = gx;
  this.gy = gy;
  var mtr = qpo.guiDimens.squareSize;
  this.textStr = textStr;
  this.active = active || false;

  this.render = function(){ //do all the stuff that creates or changes Raph els
    // console.log('menu option ' + this.textStr + ' rendered'); //success
    this.unit = new qpo.Unit('blue', this.gx, this.gy); // arg 'num' gets set to 0

    this.text = qpo.xtext(this.unit.rect.attr('x')+this.unit.tx()+mtr*5/4,
      this.unit.rect.attr('y')+this.unit.ty()+mtr/2, this.textStr, 20);
    // this.text = c.text(this.unit.rect.attr('x')+this.unit.tx()+mtr*10/4, this.unit.rect.attr('y')+this.unit.ty()+mtr/2, this.textStr)
    //   .attr({qpoText:[20]});
    if(this.active){this.text.attr({'fill':qpo.COLOR_DICT['orange']})} //highlight it if active

    this.raphs = c.set(this.text, this.unit.phys);

    this.activate = function(){
      this.text.attr({'fill':qpo.COLOR_DICT['orange']});
      this.active = true;
    }
    this.deactivate = function(){
      this.text.attr({'fill':qpo.COLOR_DICT['foreground']});
      this.active = false;
    }
  }

  this.action = action; //a function
  this.menu = menu; //the menu object that it belongs to
  return this;
}

qpo.makeMuteButton = function(){ //make an icon that can mute the music when clicked
  qpo.muteButton = c.path("M-4,-4 L4,-4 L10,-10 L10,10 L4,4 L-4,4 L-4,-4")
    .attr({"stroke-width":2, "stroke":qpo.COLOR_DICT["green"],
      "fill":qpo.COLOR_DICT["green"], "opacity":1})
    .transform("t15,580")
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

qpo.makeMenus = function(){
  qpo.mode = "menu"; // Type of screen that's active -- can be "menu", "game", "tut", or "other"

  qpo.menus = {};

  qpo.menus['Main Menu'] = new qpo.Menu('Main Menu', [
    new qpo.MenuOption(0,1,'Play', function(){}, 'Main Menu', true),
    new qpo.MenuOption(0,3,'Controls', function(){}, 'Main Menu'),
    new qpo.MenuOption(0,5,'Compete', function(){}, 'Main Menu')
  ], 'title');
  qpo.menus['Main Menu'].up = function(){qpo.menus['Main Menu'].close('title')};

  qpo.menus['Game Setup'] = new qpo.Menu('Game Setup', [
    new qpo.MenuOption(0,1,'2v2', function(){}, 'Game Setup', true),
    new qpo.MenuOption(0,3,'4v4', function(){}, 'Game Setup', false),
    new qpo.MenuOption(0,5,'6v6', function(){}, 'Game Setup', false)
  ], 'Main Menu');
  qpo.menus['Controls'] = new qpo.Menu('Controls', null, 'Main Menu', true);
  qpo.menus['Compete'] = new qpo.Menu('Compete', null, 'Main Menu', true);

  qpo.menus['Match Complete'] = new qpo.Menu('Match Complete',[
    new qpo.MenuOption(0,1, 'Main Menu', function(){}, 'Match Complete', true)
  ], 'Main Menu');

  qpo.menus['Main Menu'].cl.list[0].action = function(){ qpo.menus['Main Menu'].close('Game Setup'); }
  qpo.menus['Main Menu'].cl.list[1].action = function(){ qpo.menus['Main Menu'].close('Controls'); }
  qpo.menus['Main Menu'].cl.list[2].action = function(){ qpo.menus['Main Menu'].close('Compete'); }

  qpo.menus['Game Setup'].cl.list[0].action = function(){ qpo.menus['Game Setup'].close('2v2'); }
  qpo.menus['Game Setup'].cl.list[1].action = function(){ qpo.menus['Game Setup'].close('4v4'); }
  qpo.menus['Game Setup'].cl.list[2].action = function(){ qpo.menus['Game Setup'].close('6v6'); }


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
  qpo.activeGame = new qpo.Game(11,3,false,false,true); //just to define the unit size


  //2ND LAYER (foreground) : board, then units that spell "Q-Po", then prompt
  var UNIT_LENGTH = qpo.guiDimens.squareSize;
  var adj = -5;
  var grid_start = 2;
  qpo.guiCoords.gameBoard.leftWall = adj + UNIT_LENGTH*grid_start;
  qpo.guiCoords.gameBoard.topWall = adj + UNIT_LENGTH*grid_start;
  this.board = new qpo.Board(17,7, qpo.guiCoords.gameBoard.leftWall, qpo.guiCoords.gameBoard.rightWall);
  qpo.board = this.board;
  this.board.all.transform('t' + -(UNIT_LENGTH) + ',' + -(UNIT_LENGTH));
  this.layer2 = c.set().push(this.board.all);
  //Spawn units in the shape of the letters "Q-Po".
  this.qUnits = new Array();
  this.qRaphs = c.set();
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
  for(var i=0; i<this.qUnits.length; i++){ this.qRaphs.push(this.qUnits[i].phys); }

  this.dash = (new qpo.Unit('red',5,2,5)).phys;

  this.pUnits = new Array();
  this.pRaphs = c.set();
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
  for(var i=0; i<this.pUnits.length; i++){ this.pRaphs.push(this.pUnits[i].phys); }

  this.oUnits = new Array();
  this.oRaphs = c.set();
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
  for(var i=0; i<this.oUnits.length; i++){ this.oRaphs.push(this.oUnits[i].phys); }

  this.title = c.set(this.qRaphs, this.dash, this.pRaphs, this.oRaphs);
  this.layer2.push(this.title, this.board);


  //3rd layer (prompt)
  this.promptt = c.text(qpo.guiDimens.gpWidth/2, qpo.guiDimens.gpHeight/2, "Press enter to start")
    .attr({qpoText:[32,qpo.COLOR_DICT["red"]], "opacity":1});
  qpo.blink(this.promptt);
  this.layer3 = c.set().push(this.promptt);

  this.all = c.set();
  this.all.push(this.layer1, this.layer2, this.layer3);
  this.all.attr({'opacity':0});
  qpo.fadeIn(this.all);

  this.close = function(){ //clear screen and make main menu
    // for (var i = 0; i < qpo.shots.length; i++){if (qpo.shots[i]) {qpo.shots[i].remove();}} //remove shots
    // for (var i = 0; i < qpo.bombs.length; i++){if (qpo.bombs[i]) {qpo.bombs[i].phys.remove();}} //remove bombs
    this.promptt.stop();
    qpo.fadeOut(this.promptt, function(){}, 200);
    qpo.fadeOut(this.all, function(){
      c.clear();
      qpo.shots = [];
      qpo.bombs = [];

      qpo.guiCoords.gameBoard.leftWall = 25;
      qpo.guiCoords.gameBoard.topWall = 75;

      qpo.menus['Main Menu'].open();
    }, 400);
  };

  return this;
}

//CREATE TITLE SCREEN:
qpo.titleScreen = new qpo.displayTitleScreen();
qpo.makeMenus();
