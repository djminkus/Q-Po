qpo.menus = {
  "main" : null,
  "multiP" : null,
  "gameS" : null,
  "customG" : null,
  "endG" : null,
  "selectP" : null
};
qpo.mode = "menu"; // Type of screen that's active -- can be "menu", "game", "tut", or "other"
var activeMenu = "title"; // The key within "qpo.menus" of the currently-displayed menu
// So, qpo.menus[activeMenu] will return the actual menu object that is "active", aka displayed
var activeButton; // The key within "buttons" of the orange-highlighted button
var buttonsKeys = ["singleP","multiP","selectP","customG","startG","newR","gameS","mainM", "tut"];
qpo.activeSession = null;

c.customAttributes.qpoText = function(size, fill){ //style text white with Open Sans family and "size" font-size.
  return {
    "font-size": size,
    "fill": (fill || "white"),
    "font-family":"'Open Sans',sans-serif"
  };
}

button = function(text,x,y,onclick,adj,active,nameStr){
  //  x is x-center of button.
  //  y is y-center of button.
  //  adj is button width adjustment (positive value --> thinner button)
  if(adj===undefined){var adj = 0;} //set adjustment to 0 default
  this.name = nameStr; //they key within "buttons" that'll have this button as a value
  this.rectEl = c.rect((x- text.length*11 + adj), y-30, (text.length*22 - 2*adj), 60, 5).attr({
    "fill":"#000000","stroke":"white","stroke-width":2});
  this.textEl = c.text(x,y,text).attr({"font-size":30,"fill":"white","font-family":"'Open Sans',sans-serif"});
  this.set = c.set().push(this.textEl,this.rectEl);
  this.set.click(function(){onclick()});
  this.active = active || false ;
  this.activate = function(){
    this.rectEl.attr({"stroke":qpo.COLOR_DICT["orange"], "stroke-width":4});
    activeButton = this;
    this.active = true;
  }
  this.deactivate = function(){
    this.rectEl.attr({"stroke":"white", "stroke-width":2});
    activeButton = null;
    this.active = false;
  }
  if(active){this.activate();}
  this.onclick = function(){onclick()};
  // console.log(this);
  return this;
}

qpo.Highlight = function(x1,y1,width,height){ //not used yet
  this.rect = c.rect(x1,y1,width,height).attr({"stroke": qpo.COLOR_DICT["orange"], "stroke-width":4});
  this.change = function(dx,dy,xRatio,yRatio){ //change the highlight
    console.log(this); //should return the Highlight object
    //dx, dy is change in x1 and y1
    //xRatio, y ratio are fractional changes in width and height, respectively
    this.rect.attr({'x':(this.rect.x+dx),'y':(this.rect.y+dy),
      "width": (this.rect.width*xRatio), "height":(this.rect.height*yRatio)});
  }; //if this is buggy, try ".bind(this)"
  return this;
}

slider = function(label, min, max, defaultt, y, spawnActive){
  //label is the word. y is the y coordinate
  var MARGIN = 100;
  var PANEL_WIDTH = qpo.guiCoords.gamePanel.width;
  var SLIDER_WIDTH =  PANEL_WIDTH - 2*MARGIN;
  var CENTER = PANEL_WIDTH/2;
  var KNOB_SIZE = 32;
  var GROOVE_HEIGHT = 8;
  var LABEL_DROP = 35; //amount by which label is below slider itself
  var LEFT_SIDE = MARGIN;
  var RIGHT_WIDE = PANEL_WIDTH-MARGIN;
  var RANGE = max-min;

  this.label = c.text(CENTER,y+LABEL_DROP,label).attr({qpoText: 20});
  this.min = min;
  this.max = max;
  this.range = RANGE;
  this.value = defaultt; //start at default value
  this.isActive = spawnActive;

  this.groove = c.rect(MARGIN, y-4, SLIDER_WIDTH, GROOVE_HEIGHT).attr({"stroke":"white", "stroke-width":3});

  this.xPositions = new Array();
  for(var i=0; i<this.range+1; i++){
    this.xPositions.push(LEFT_SIDE + i*SLIDER_WIDTH/this.range);
  }

  this.knobRect = c.rect((this.xPositions[this.value-this.min]) - KNOB_SIZE/2, y - KNOB_SIZE/2,
    KNOB_SIZE, KNOB_SIZE, 3).attr({"stroke":"white", "stroke-width":4, "fill":"black"});
  this.knobDisplay = c.text((this.xPositions[this.value-this.min]), y, this.value).attr({qpoText:10});
  this.knob = c.set(this.knobDisplay, this.knobRect);

  this.plus = function(){
    if (this.value < this.max){ //reposition the knob and increment its value
      this.value++;
      this.knobDisplay.attr({"text": this.value, "x": (this.xPositions[this.value-this.min]) });
      this.knobRect.attr({"x": (this.xPositions[this.value-this.min] - KNOB_SIZE/2)});
    }
  }
  this.minus = function(){
    if (this.value > this.min){
      this.value--;
      this.knobDisplay.attr({"text":this.value, "x":(this.xPositions[this.value-this.min]) });
      this.knobRect.attr({"x": (this.xPositions[this.value-this.min] - KNOB_SIZE/2) });    }
  }

  this.set = c.set(this.label, this.knob, this.groove);

  this.activate = function(){ //colors knob orange and sets this.isActive to true
    this.knobRect.attr({"stroke":qpo.COLOR_DICT["orange"]});
    this.isActive = true;
  };
  this.deactivate = function(){
    this.knobRect.attr({"stroke":"white"});
    this.isActive = false;
  };
  if(spawnActive){ //activate the thing if it's supposed to start as active.
    this.activate();
  }

  return this;
}

//ONLY IMPLEMENTED IN MAINMENU (NOT IN OTHER MENUS)
buttonList = function(buttonsInOrder){
  //pass in a list of the buttons in the order they appear on the list.
  this.activeIndex = 0;
  this.buttons = buttonsInOrder;
  this.next = function(){ //highlight the next button on the list
    this.buttons[this.activeIndex].deactivate();
    if (this.activeIndex == this.buttons.length - 1){ this.activeIndex = 0; } // loop back to first button
    else { this.activeIndex += 1; }
    this.buttons[this.activeIndex].activate();
  }
  this.previous = function(){ //highlight the previous button on the list
    this.buttons[this.activeIndex].deactivate();
    if (this.activeIndex == 0){ this.activeIndex = this.buttons.length-1; } // highlight last button if first is active
    else { this.activeIndex -= 1; }
    this.buttons[this.activeIndex].activate();
  }
  this.raphs = c.set();
  for(var i=0; i<this.buttons.length; i++){this.raphs.push(this.buttons[i].set);} //populate raphs with buttons
  return this;
}

// qpo.Menu = function(name, title, items){ // draft for a "Menu" class
//   // name is name for qpo.menus (ex. "mainM")
//   // title is title string (ex. "Game Setup")
//   // items is an array of things that can be highlighted and acted upon (buttons, sliders)
//   qpo.menus[name] = this;
//   qpo.mode = "menu";
//   activeMenu = name;
//   this.all = c.set();
//   this.title = c.text(300,100,title).attr({qpoText:[120]});
//   this.up = function(){ // return to previous screen/menu
//
//   };
//   this.close = function(){ // remove this menu's Raphael elements & deactivate it
//     c.clear();
//   };
//   this.enter = function(){ //called when enter key is struck. Change as highlight changes.
//     ;
//   }
// };

/* ------------------------------------- */

qpo.makeMuteButton = function(){
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
    });
}

qpo.makeTitleScreen = function(){
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
  this.board = qpo.drawBoard(17,7); //note: board's Raphs now found in qpo.gui and this.board
  // qpo.gui.transform('t' + -(UNIT_LENGTH) + ',' + -(UNIT_LENGTH));
  this.board.transform('t' + -(UNIT_LENGTH) + ',' + -(UNIT_LENGTH));

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
      qpo.menus.main = new qpo.makeMainMenu();
    }, 400);
  };

  return this;
}

//CREATE TITLE SCREEN:
qpo.titleScreen = new qpo.makeTitleScreen();

qpo.makeMenu = function(which){ //not implemented yet.
  activeMenu = which;
  switch(which){
    case 'main':
      break;
    case 'multiP':
      break;
    case 'gameS':
      break;
    case 'customG':
      break;
    case 'endG':
      break;
    case 'selectP':
      break;
    default:
      console.log('this was unexpected');
  }
}

qpo.makeMainMenu = function(letters){
  activeMenu = "main";
  activeButton = "tut"
  qpo.menus["main"] = this;
  qpo.mode = "menu";

  //1st layer (blackness and letters)
  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black"});
  this.title = c.text(300,100,"Main Menu").attr({qpoText:[50]});
  this.layer1 = c.set().push(this.blackness, this.title);
  if(letters){ //make letters and add to layer1
    this.letters = c.set().push(
      c.text(500,500,"q"),
      c.text(520,500,"w"),
      c.text(540,500,"e"),
      c.text(510,520,"a"),
      c.text(530,520,"s"),
      c.text(550,520,"d"),
      c.text(520,540,"x")
    ).attr({qpoText: [20]});
    this.layer1.push(this.letters);
  }

  qpo.makeMuteButton();

  //2nd layer (animation)
  this.layer2 = c.set();
  qpo.activeGame = new qpo.Game(7,3,false,false,true); //just to define the unit size and all
  // this.unit = makeUnit("red",3,8,0);
  // this.otherUnit = makeUnit("blue",1,2,1);
  // this.animate = function(){
  //   //order the layers properly:
  //   qpo.menus.main.unit.phys.toBack();
  //   qpo.menus.main.otherUnit.phys.toBack();
  //   qpo.menus.main.blackness.toBack();
  //
  //   //make the red unit move right and the blue unit fire a bomb every three turns, starting this turn
  //   qpo.menus.main.unit.moveRight();
  //   qpo.menus.main.otherUnit.bomb();
  //   qpo.menus.main.bombCounter = 1;
  //   qpo.menus.main.all.push(qpo.bombs[(qpo.menus.main.bombCounter-1) % 2].phys);
  //   // bombs[(qpo.menus.main.bombCounter-1) % 2].phys.toBack();
  //   qpo.menus.main.mmrai = setInterval(
  //     function(){
  //       qpo.menus.main.unit.moveRight();
  //       qpo.menus.main.otherUnit.bomb();
  //       qpo.menus.main.bombCounter++;
  //       qpo.menus.main.all.push(qpo.bombs[(qpo.menus.main.bombCounter-1) % 2].phys);
  //       // console.log("main menu right anim!");
  //     },
  //   9000*qpo.timeScale); //mmrai = Main Menu Rightward Animation Interval
  //
  //   //make the red unit move left and blue move right every 3 "turns", starting in two turns
  //   qpo.menus.main.turn2 = setTimeout(
  //     function(){
  //       qpo.menus.main.mmlai = setInterval( //leftward anim
  //         function(){
  //           qpo.menus.main.unit.moveLeft();
  //           qpo.menus.main.otherUnit.moveRight();
  //           // console.log("main menu left anim!")
  //         }, 9000*qpo.timeScale);
  //       qpo.menus.main.unit.moveLeft();
  //       qpo.menus.main.otherUnit.moveRight();
  //     },
  //   6000*qpo.timeScale);
  //
  //   //make the red unit shoot and the blue unit move left every 3 "turns", starting in 1 turn
  //   qpo.menus.main.turn1 = setTimeout(
  //     function(){
  //       qpo.menus.main.mmsai = setInterval(function(){
  //         qpo.shots[qpo.menus.main.shotCounter-1].hide();
  //         qpo.menus.main.unit.shoot();
  //         qpo.menus.main.shotCounter++;
  //         qpo.shots[qpo.menus.main.shotCounter-1].toBack();
  //         qpo.menus.main.blackness.toBack();
  //         qpo.menus.main.otherUnit.moveLeft();
  //         // console.log("main menu shoot anim!");
  //       }, 9000*qpo.timeScale);
  //       qpo.menus.main.unit.shoot();
  //       qpo.shots[0].toBack();
  //       qpo.menus.main.shotCounter = 1;
  //       qpo.menus.main.blackness.toBack();
  //       qpo.menus.main.otherUnit.moveLeft();
  //     },
  //   3000*qpo.timeScale);
  // };
  // this.layer2.push(this.unit.phys, this.otherUnit.phys);

  //3rd layer (title, menu buttons)
  // this.title = c.text(300,100,"Q-Po").attr({qpoText:[120,'white']});
  var vert = -50;
  this.tutorialButton = new button("Tutorial",300,250+vert,function(e){
    qpo.mode = "tut";
    qpo.menus.main.close('tut');
  }, 15, true, "tut");
  this.singlePlayerButton = new button("Single-Player",300,340+vert,function(e){
    qpo.menus.main.close('sp');
  }, 30, false, "singleP");
  this.multiplayerButton = new button("Multiplayer",300,430+vert,function(e){
    qpo.menus.main.multiplayerButton.deactivate();
    qpo.menus.main.close('mp')
  }, 10, false, "multiP");
  this.layer3 = c.set().push(this.title, this.tutorialButton.set, this.singlePlayerButton.set,
    this.multiplayerButton.set);

  this.buttonList = new buttonList([this.tutorialButton, this.singlePlayerButton, this.multiplayerButton]);

  /* "w" and "s" indicators near buttons
  this.w = c.set(
    c.text(430,250,"w").attr({"fill":"white","font-family":"'Open Sans',sans-serif"}),
    c.rect(420,240,20,20,5).attr({"stroke":"white"})
  )
  this.s = c.set(
    c.text(430,340,"s").attr({"fill":"white","font-family":"'Open Sans',sans-serif"}),
    c.rect(420,330,20,20,5).attr({"stroke":"white"})
  )
  */

  this.all = c.set();
  this.all.push(
    this.title,
    this.blackness,
    this.singlePlayerButton.set,
    this.multiplayerButton.set,
    this.tutorialButton.set
    // this.buttonList.raphs,
    // this.unit.phys, this.otherUnit.phys
  );
  if(letters){this.all.push(this.letters);}
  this.all.attr({'opacity':0});
  qpo.fadeIn(this.all);

  this.close = function(status){
    clearInterval(this.mmsai); //main menu stop animation interval
    clearInterval(this.mmrai); //main menu right animation interval
    clearInterval(this.mmlai); //main menu left animation interval
    clearTimeout(this.turn1, this.turn2); //queued animations
    qpo.fadeOut(this.all, function(){ //clear arrays
      // for (var i = 0; i < qpo.shots.length; i++){if (qpo.shots[i]) {qpo.shots[i].remove();}} //remove shots
      // for (var i = 0; i < qpo.bombs.length; i++){if (qpo.bombs[i]) {qpo.bombs[i].phys.remove();}} //remove bombs
      qpo.shots = new Array();
      qpo.bombs = new Array();
      // this.unit.instakill(); //remove unit
      // this.otherUnit.instakill(); //remove other unit
      this.all.remove();
      c.clear();
      switch(status){ //decide what to do depending on why menu was closed
        case 'tut': //enter Tutorial
          qpo.multiplayer = false;
          qpo.tut = new qpo.Tut();
          break;
        case 'sp': //single player. make setup menu, make new session
          gameSetupMenu = new qpo.makeGameSetupMenu();
          qpo.multiplayer = false;
          if(qpo.trainingMode){ // If training, do "new session('ravn'/'rivn'/'nvn')"
            switch(qpo.trainerOpponent){
              case "random": {
                qpo.activeSession = new session("ravn"); //neural versus random session
                break;
              }
              case "neural": {
                qpo.activeSession = new session("nvn"); //neural versus neural session
                break;
              }
              case "rigid": {
                qpo.activeSession = new session("rivn"); //neural versus rigid session
                break;
              }
              default: {
                console.log("OOPS. WAT");
                break;
              }
            }
          }
          else{ qpo.activeSession = new session("pvn"); } //new 'human vs neural' session
          break;
        case 'mp': //multiplayer. make multiplayer menu, make new session
          qpo.multiplayerMenu = new qpo.makeMultiplayerMenu();
          qpo.multiplayer = true;
          qpo.activeSession = new session('pvp');
          break;
        default:
          console.log('unexpected...');
      }
    }.bind(this));
  };

  //for changing button highlight:
  this.next = function(){ this.buttonList.next(); };
  this.previous = function(){ this.buttonList.previous(); };

  return this;
};

qpo.makeGameSetupMenu = function(){
  activeMenu = "gameS";
  qpo.menus["gameS"] = this;
  // qpo.menus.main.unit.kill();
  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":1});
  this.title = c.text(300,100,"Game Setup").attr({"font-size":50,"fill":"white","font-family":"'Open Sans',sans-serif"});

  qpo.makeMuteButton();

  this.quickPlay = new button("Quick-Play",qpo.guiDimens.gpWidth/2,250, (function(e){
    this.close();
    settings = [7,3,'single',false,true]; //q,po,multi,music,respawn
    qpo.countdownScreen(settings);
  }).bind(this), 0, true, "quickP")

  this.customGame = new button("Custom Game",qpo.guiDimens.gpWidth/2,340, (function(e){
    this.close();
    qpo.menus["customG"] = new qpo.makeCustomGameMenu();
  }).bind(this), 0, false, "customG");

  this.all = c.set().push(this.blackness, this.title, this.quickPlay.set, this.customGame.set);

  this.close = function(){
    this.all.remove();
    c.clear();
    activeButton = null;
  }

  this.next = function(){
    if (this.quickPlay.active == true){
      this.quickPlay.deactivate();
      this.customGame.activate();
    } else {
      this.customGame.deactivate();
      this.quickPlay.activate();
    }
  }
  this.previous = function(){
    if (this.quickPlay.active == true){
      this.quickPlay.deactivate();
      this.customGame.activate();
    } else {
      this.customGame.deactivate();
      this.quickPlay.activate();
    }
  }
  this.up = function(){
    this.close();
    qpo.menus.main = new qpo.makeMainMenu();
  }

  this.all.hide();
  qpo.fadeIn(this.all);
  return this;
}

qpo.makeCustomGameMenu = function(){
  activeMenu = "customG";
  qpo.menus["customG"] = this;

  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":1});
  this.title = c.text(300,50,"Custom Game").attr({"font-size":50,"fill":"white","font-family":"'Open Sans',sans-serif"});

  this.qSlider = new slider("Q", 4, 20, 8, 160, true);
  this.poSlider = new slider("Po", 1, 7, 4, 260, false);

  this.startGame = new button("Start Game", qpo.guiDimens.gpWidth/2, 360, (function(e){
    this.close();
    var settings = [this.qSlider.value,this.poSlider.value,false,true,true]; //[q,po,multi,music,respawn]
    qpo.countdownScreen(settings);
  }).bind(this), 0, false, "startG");

  this.active = this.qSlider;
  this.activeIndex = 0; //index in this.items of active (orange) thing.

  this.items = [this.qSlider, this.poSlider, this.startGame];

  this.all = c.set(this.blackness, this.title, this.qSlider.set, this.poSlider.set, this.startGame.set);

  this.close = function(){
    this.all.remove();
    c.clear();
  }

  this.next = function(){
    if (this.activeIndex < this.items.length-1){ //active is not last item.
      this.active.deactivate();
      this.activeIndex++;
      this.active=this.items[this.activeIndex];
      this.active.activate();
    }
  }
  this.previous = function(){ //active
    if (this.activeIndex > 0){ //active is not first item.
      this.active.deactivate();
      this.activeIndex--;
      this.active=this.items[this.activeIndex];
      this.active.activate();
    }
  }
  this.up = function(){
    gameSetupMenu = qpo.makeGameSetupMenu();
  }

  return this;
}

qpo.makeEndGameMenu = function(result){
  qpo.menus["endG"] = this;
  activeMenu = "endG";

  this.blackness = c.rect(0,0, qpo.guiCoords.gamePanel.width, qpo.guiCoords.gamePanel.height)
    .attr({"fill":"black","opacity":0.9});

  this.statusPanel = c.rect(0,0,600,100).attr({"fill":"#111111"});

  // create teh big text:
  this.gameOverText = c.text(300,50,"round over")
    .attr({qpoText:[60,"black"]});
  // set teh big text to "Victory"/"Tie"/etc:
  switch (result){
    case "tie":
      this.gameOverText.attr({"text":"tie!","fill":qpo.COLOR_DICT["grey"]});
      break;
    case "red":
      if (!qpo.multiplayer){
        this.gameOverText.attr({"text":"Defeat.","fill":qpo.COLOR_DICT["red"]});
      } else {
        this.gameOverText.attr({"text":"Red wins!","fill":qpo.COLOR_DICT["red"]});
      }
      break;
    case "blue":
      if (!qpo.multiplayer){
        this.gameOverText.attr({"text":"Victory!","fill":qpo.COLOR_DICT["blue"]});
      } else {
        this.gameOverText.attr({"text":"Blue wins!","fill":qpo.COLOR_DICT["blue"]});
      }
      break;
    default:
      break;
  }

  // create teh bar graph:
  this.barGraph = qpo.activeSession.displayResults(result);

  // create teh buttons
  this.again = new button("New Round",300,260+25,newRound,0,true,"newR");         //make the New Round button
  this.back = new button("Main Menu",300,440+25,function(){                       // make the Main Menu button
    this.close();
    qpo.menus['main'] = new qpo.makeMainMenu();
  }.bind(this),0,false,"mainM");
  this.selectDiff = new button("Select Difficulty",300,350+25,function(e){ //make the Select Diffuculty button
    this.close();
    qpo.menus['gameS'] = new qpo.makeGameSetupMenu();
  }.bind(this), 60,false,"gameS");

  this.all = c.set().push(this.gameOverText,this.again.set,this.back.set,
    this.selectDiff.set,this.barGraph,this.statusPanel, this.blackness);
  qpo.mode="menu";

  this.close = function(){
    this.all.remove();
    c.clear();
  }

  this.next = function(){
    if (this.again.active == true){
      this.again.deactivate();
      this.selectDiff.activate();
      //console.log("again button was active, now sd button is");
    } else if (this.selectDiff.active == true){
      this.selectDiff.deactivate();
      this.back.activate();
      //console.log("med button was active, now hard button is");
    } else if (this.back.active == true){
      this.back.deactivate();
      this.again.activate();
    }
  }
  this.previous = function(){
    if (this.again.active == true){
      this.again.deactivate();
      this.back.activate();
    } else if (this.selectDiff.active == true){
      this.selectDiff.deactivate();
      this.again.activate();
    } else if (this.back.active == true){
      this.back.deactivate();
      this.selectDiff.activate();
    }
  }
  this.up = function(){
    this.close();
    qpo.menus.main = new qpo.makeMainMenu();
  }

  return this;
};

qpo.makeMultiplayerMenu = function(){
  qpo.menus["multiP"] = this;
  activeMenu = "multiP";

  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":1});
  this.title = c.text(300,100,"coming soon!").attr({"font-size":60,"fill":"white","font-family":"'Open Sans',sans-serif"});

  qpo.makeMuteButton();

  this.all = c.set().push(this.blackness,this.title);

  this.up = function(){
    this.close();
    // console.log(this); //prints the makeMultiplayerMenu object, as expected
    qpo.menus.main = new qpo.makeMainMenu();
  }
  this.close = function(){
    this.all.remove();
    c.clear();
  }
  return this;
}
