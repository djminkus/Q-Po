//Set up the menu objects and open the title screen.

c.customAttributes.qpoText = function(size, fill){ //style text white with Open Sans family and "size" font-size.
  return {
    "font-size": size,
    "fill": (fill || "white"),
    "font-family":"'Open Sans',sans-serif"
  };
}

qpo.CursorList = function(list, initialCursorPosition){
  this.list = list;
  this.cursorPosition = initialCursorPosition || 0;
  this.selectedItem = this.list[this.cursorPosition];
  this.selectedItem.activate();
  this.next = function(){
    this.selectedItem.deactivate();
    this.cursorPosition++;
    if(this.cursorPosition >= this.list.length){this.cursorPosition = 0}; //loop back to start
    this.selectedItem = this.list[this.cursorPosition];
    this.selectedItem.activate();
  }
  this.previous = function(){
    this.selectedItem.deactivate();
    this.cursorPosition--;
    if(this.cursorPosition == -1){this.cursorPosition = this.list.length-1}; //loop back to start
    this.selectedItem = this.list[this.cursorPosition];
    this.selectedItem.activate();
  }

  return this;
}

qpo.MenuOption = function(unit, textStr, action, menu){ /* AKA UnitButton */
  //pass in a Unit, some text, and a function to execute when this option is chosen
  this.textStr = textStr;
  this.unit = unit;

  this.text = c.text(unit.rect.attr('x')+unit.tx()+mtr/2, unit.rect.attr('y')+unit.ty()+mtr/2, textStr)
    .attr({qpoText:[20]});

  this.activate = function(){
    this.text.attr({'fill':qpo.COLOR_DICT['orange']});
  }
  this.deactivate = function(){
    this.text.attr({'fill':qpo.COLOR_DICT['foreground']});
  }

  this.action = action();

  this.raphs = c.set(this.text, this.unit.phys);

  this.menu = menu; //the menu object that it belongs to
}

qpo.Menu = function(titleStr, itemList, parent){
  //itemList is list of highlightables on this menu (buttons, sliders, etc)
  //parent is the identifier of the menu that should be accessed when "backspace" is pressed
  qpo.mode = 'menu';
  this.titleStr = titleStr;

  if (itemList){
    this.cl = new qpo.CursorList(itemList);
    //this.cl.selectedItem

    this.next = this.cl.next();
    this.previous = this.cl.previous();
  }

  this.parent = qpo.menus[parent] || 'title';
  this.up = function(){
    this.close();
    if (this.parent == 'title') { qpo.displayTitleScreen(); }
    else { this.parent.open(); }
  }

  this.open = function(){ //(re)create all the raphs for this menu.
    this.background = c.rect(0,0, c.width, c.height).attr({'fill':qpo.COLOR_DICT['background']});
    this.title = c.text(c.width/2, 60, this.titleStr).attr({qpoText:[50]});
    this.layer1 = c.set().push(this.background, this.title);

    this.board = qpo.Board(7,5, 25, 100);
    this.layer2 = c.set().push(this.board.all)

    this.all = c.set().push(this.layer1, this.layer2);

    for(var i=0; i < itemList.list.length; i++){ this.all.push(itemList.list[i].all); }
  }

  this.close = function(){
    c.clear();
    this.all = null; //remove reference to raphs too
  }

  return this;
}

//DO SOME SETUP:
qpo.mode = "menu"; // Type of screen that's active -- can be "menu", "game", "tut", or "other"
qpo.menus = { //Define menu structure
  "Main Menu" : new qpo.Menu('Main Menu', [], 'title'),
  "Multiplayer" : new qpo.Menu('Multiplayer', null, 'Main Menu'),
  "Single-Player" : new qpo.Menu('Single-Player', null, 'Main Menu'),
  "Match Results" : new qpo.Menu('Match Results', null, 'Main Menu'),
  "Demo" : new qpo.Menu('Demo', null, 'Main Menu') //TODO: add 1-Po, 4-Po, and 7-Po buttons
};

qpo.displayTitleScreen = function(){ //Called whenever title screen is displayed
  activeMenu = "title";
  qpo.menus["title"] = this;
  qpo.mode = "menu";

  //1ST LAYER (background blackness)
  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black"});
  this.layer1 = c.set().push(this.blackness);

  qpo.makeMuteButton();

  qpo.activeGame = new qpo.Game(11,3,false,false,true); //just to define the unit size
  //Find unit size
  var UNIT_LENGTH = qpo.guiDimens.squareSize;
  //Draw a grid of crosses covering the whole screen.
  var x_adj = -5;
  var y_adj = -5;
  var x_start = 2;
  var y_start = 2;
  qpo.guiCoords.gameBoard.leftWall = x_adj + UNIT_LENGTH*x_start;
  qpo.guiCoords.gameBoard.topWall = y_adj + UNIT_LENGTH*y_start;
  this.board = qpo.Board(17,7, qpo.guiCoords.gameBoard.leftWall, qpo.guiCoords.gameBoard.rightWall);
  this.board.all.transform('t' + -(UNIT_LENGTH) + ',' + -(UNIT_LENGTH));

  //2ND LAYER (foreground)
  this.layer2 = c.set();
  //Spawn units in the shape of the letters "Q-Po".
  this.qUnits = new Array();
  this.qRaphs = c.set();
  this.qUnits.push(
    new makeUnit('blue', 1,0,0),
    new makeUnit('blue', 0,1,1),
    new makeUnit('blue', 2,0,2),
    new makeUnit('blue', 3,1,3),
    new makeUnit('blue', 3,2,4),
    new makeUnit('red', 0,2,0),
    new makeUnit('red', 1,3,1),
    new makeUnit('red', 2,3,2),
    new makeUnit('red', 3,4,3),
    new makeUnit('red', 4,4,4)
  );
  for(var i=0; i<this.qUnits.length; i++){ this.qRaphs.push(this.qUnits[i].phys); }

  this.dash = (new makeUnit('red',5,2,5)).phys;

  this.pUnits = new Array();
  this.pRaphs = c.set();
  this.pUnits.push(
    new makeUnit('blue', 7,0,5),
    new makeUnit('blue', 8,0,6),
    new makeUnit('blue', 9,0,7),
    new makeUnit('blue', 7,1,8),
    new makeUnit('blue', 9,1,9),
    new makeUnit('red', 7,2,6),
    new makeUnit('red', 8,2,7),
    new makeUnit('red', 9,2,8),
    new makeUnit('red', 7,3,9)
  );
  for(var i=0; i<this.pUnits.length; i++){ this.pRaphs.push(this.pUnits[i].phys); }

  this.oUnits = new Array();
  this.oRaphs = c.set();
  this.oUnits.push(
    new makeUnit('blue', 12,0,10),
    new makeUnit('blue', 13,0,11),
    new makeUnit('blue', 11,1,12),
    new makeUnit('blue', 14,1,13),
    new makeUnit('red', 12,3,10),
    new makeUnit('red', 13,3,11),
    new makeUnit('red', 11,2,12),
    new makeUnit('red', 14,2,13)
  );
  for(var i=0; i<this.oUnits.length; i++){ this.oRaphs.push(this.oUnits[i].phys); }

  this.title = c.set(this.qRaphs, this.dash, this.pRaphs, this.oRaphs);
  this.layer2.push(this.title, this.board);

  //3rd layer (prompt)
  this.promptt = c.text(qpo.guiDimens.gpWidth/2, qpo.guiDimens.gpHeight/2, "Press enter to start")
    .attr({qpoText:[32,qpo.COLOR_DICT["red"]], "opacity":0.8});
  qpo.blink(this.promptt);
  this.layer3 = c.set().push(this.promptt);

  this.all = c.set();
  this.all.push(this.layer1, this.layer2, this.layer3);

  this.close = function(){ //clear screen and make main menu
    // for (var i = 0; i < qpo.shots.length; i++){if (qpo.shots[i]) {qpo.shots[i].remove();}} //remove shots
    // for (var i = 0; i < qpo.bombs.length; i++){if (qpo.bombs[i]) {qpo.bombs[i].phys.remove();}} //remove bombs
    qpo.fadeOut(this.promptt, function(){}, 200);
    qpo.fadeOut(this.all, function(){
      c.clear();
      qpo.shots = [];
      qpo.bombs = [];

      qpo.guiCoords.gameBoard.leftWall = 25;
      qpo.guiCoords.gameBoard.topWall = 75;
      // create the main menu
      qpo.menus.main = new qpo.Menu('Main Menu', /*TODO: create each button of the main menu in this list: */ [], 'title');
    }, 400);
  };

  return this;
}

//CREATE TITLE SCREEN:
qpo.titleScreen = new qpo.displayTitleScreen();
