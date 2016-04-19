qpo.menus = {
  "main" : null,
  "multiP" : null,
  "gameS" : null,
  "customG" : null,
  "endG" : null,
  "selectP" : null
};
qpo.mode = "menu"; //type of screen that's active -- can be "menu", "game", "tut", or "other"
//activeMenu = []; //a list of button objects within the current menu
var activeMenu = "main"; //the key within "qpo.menus" of the currently-displayed menu
var activeButton = "singleP"; //the key within "buttons" of the orange-highlighted button
var buttons = {
  "singleP": null,
  "multiP" : null,
  "quickP" : null,
  "newR" : null,
  "gameS" : null,
  "customG" : null,
  "startG" : null,
  "mainM" : null
}
var buttonsKeys = ["singleP","multiP","selectP","customG","startG","newR","gameS","mainM"];
qpo.activeSession = null;

c.customAttributes.qpoText = function(size){ //style text white with Open Sans family and "size" font-size.
  return {
    "font-size": size,
    "fill": "white",
    "font-family":"'Open Sans',sans-serif"
  };
}

button = function(text,x,y,onclick,adj,active,nameStr){
  /*
  x is x-center of button, y is y-center of button
  adj is button width adjustment (positive value --> thinner button)
  */
  if (adj===undefined){
    var adj = 0;
  }
  this.name = nameStr; //they key within "buttons" that'll have this button as a value
  this.rectEl = c.rect( x- (text.length)*11 + adj, y-30, text.length*22 - 2*adj , 60 ).attr({
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
  if (active){
    this.activate();
  }
  this.onclick = function(){onclick()};
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
    KNOB_SIZE, KNOB_SIZE).attr({"stroke":"white", "stroke-width":4, "fill":"black"});
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
  this.next = function(){
    this.buttons[this.activeIndex].deactivate();
    if (this.activeIndex == this.buttons.length - 1){ //if last button is highlighted, return to first button:
      this.activeIndex = 0;
    }
    else { //otherwise, increment this.activeIndex by 1:
      this.activeIndex += 1;
    }
    this.buttons[this.activeIndex].activate();
  }
  this.previous = function(){
    this.buttons[this.activeIndex].deactivate();
    if (this.activeIndex == 0){ //if first button is highlighted, go to last button:
      this.activeIndex = this.buttons.length-1;
    } else { //otherwise, decrement this.activeIndex by 1:
      this.activeIndex -= 1;
    }
    this.buttons[this.activeIndex].activate();
  }
}

Menu = function(name, buttonArgs){
  qpo.menus[name] = this;
  this.buttonList = new buttonList(buttonArgs);
  this.next = function(){ //select next item in this menu

  };
  this.previous = function(){ //select previous item in this menu

  };
  this.up = function(){ // return to previous screen/menu

  };
  this.close = function(){ // remove this menu's Raphael elements & deactivate it

  };
};

var makeMainMenu = function(){
  activeMenu = "main";
  qpo.menus["main"] = this;
  //console.log(this);

  this.open = function(){

  }

  //1st layer (background)
  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black"});
  this.letters = c.set().push(
    c.text(500,500,"q"),
    c.text(520,500,"w"),
    c.text(540,500,"e"),
    c.text(510,520,"a"),
    c.text(530,520,"s"),
    c.text(550,520,"d"),
    c.text(520,540,"x")
  ).attr({qpoText: 20});

  //2nd layer (animation)
  qpo.activeGame = new qpo.Game(7,3,false,false); //to define the unit size and all
  this.unit = makeUnit("red",3,7.5,0);
  this.otherUnit = makeUnit("blue",1,2,1);
  this.animate = function(){
    //order the layers properly:
    qpo.menus.main.unit.phys.toBack();
    qpo.menus.main.otherUnit.phys.toBack();
    qpo.menus.main.blackness.toBack();

    //make the red unit move right and the blue unit fire a bomb every three turns, starting this turn
    qpo.menus.main.unit.moveRight();
    qpo.menus.main.otherUnit.bomb();
    qpo.menus.main.bombCounter = 1;
    qpo.menus.main.all.push(qpo.bombs[(qpo.menus.main.bombCounter-1) % 2].phys);
    // bombs[(qpo.menus.main.bombCounter-1) % 2].phys.toBack();
    qpo.menus.main.mmrai = setInterval(
      function(){
        qpo.menus.main.unit.moveRight();
        qpo.menus.main.otherUnit.bomb();
        qpo.menus.main.bombCounter++;
        qpo.menus.main.all.push(qpo.bombs[(qpo.menus.main.bombCounter-1) % 2].phys);
        // console.log("main menu right anim!");
      },
    9000*qpo.timeScale)//mmrai = Main Menu Rightward Animation Interval

    //make the red unit move left and blue move right every 3 "turns", starting in two turns
    qpo.menus.main.turn2 = setTimeout(
      function(){
        qpo.menus.main.mmlai = setInterval(
          function(){
            qpo.menus.main.unit.moveLeft();
            qpo.menus.main.otherUnit.moveRight();
            // console.log("main menu left anim!")
          }, 9000*qpo.timeScale);
        qpo.menus.main.unit.moveLeft();
        qpo.menus.main.otherUnit.moveRight();
      },
    6000*qpo.timeScale);

    //make the red unit shoot and the blue unit move left every 3 "turns", starting in 1 turn
    qpo.menus.main.turn1 = setTimeout(
      function(){
        qpo.menus.main.mmsai = setInterval(function(){
          qpo.shots[qpo.menus.main.shotCounter-1].hide();
          qpo.menus.main.unit.shoot();
          qpo.menus.main.shotCounter++;
          qpo.shots[qpo.menus.main.shotCounter-1].toBack();
          qpo.menus.main.blackness.toBack();
          qpo.menus.main.otherUnit.moveLeft();
          // console.log("main menu shoot anim!");
        }, 9000*qpo.timeScale);
        qpo.menus.main.unit.shoot();
        qpo.shots[0].toBack();
        qpo.menus.main.shotCounter = 1;
        qpo.menus.main.blackness.toBack();
        qpo.menus.main.otherUnit.moveLeft();
      },
    3000*qpo.timeScale);

    // qpo.menus.main.blackness.toBack();
  };

  //3rd layer (title, menu buttons)
  this.title = c.text(300,100,"Q-PO").attr({"font-size":120,"fill":"white","font-family":"'Open Sans',sans-serif"});
  this.singlePlayerButton = new button("Single-Player",300,250,function(e){
    gameSetupMenu = new makeGameSetupMenu();
    qpo.menus.main.hideAll();
    qpoGame.multiplayer = false;
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
    else{
      qpo.activeSession = new session("pvn"); //human versus neural session
    }
  }, 30, true, "singleP");
  this.multiplayerButton = new button("Multiplayer",300,340,function(e){
    qpo.menus.main.multiplayerButton.deactivate();
    qpo.multiplayerMenu = new makeMultiplayerMenu();
    qpo.menus.main.hideAll();
    qpoGame.multiplayer = true;
    qpo.activeSession = new session('pvp');
  }, 10, false, "multiP");

  this.buttonList = new buttonList([this.singlePlayerButton, this.multiplayerButton]);

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
  this.all.push(this.title, this.blackness, this.letters,
    this.singlePlayerButton.set, this.multiplayerButton.set,
    this.unit.phys, this.otherUnit.phys);

  // this.song = new Audio("music/stars.mp3"); // Uncomment once there are different
  // this.song.play();                         //   songs for different menus.

  this.showAll = function(){
    this.all.show();
    this.unit = makeUnit("red",3,7.5,0);
    this.otherUnit = makeUnit("blue",1,2,1);
    this.animate();
    this.blackness.toBack();
  };
  this.hideAll = function(){
    this.all.hide();
    clearInterval(this.mmsai);
    clearInterval(this.mmrai);
    clearInterval(this.mmlai);
    clearTimeout(this.turn1,this.turn2);
    for (var i = 0; i < qpo.shots.length; i++){
      if (qpo.shots[i]) {qpo.shots[i].remove();}
    }
    for (var i = 0; i < qpo.bombs.length; i++){
      if (qpo.bombs[i]) {qpo.bombs[i].phys.remove();}
    }
    this.unit.instakill();
    this.otherUnit.instakill();
  }

  this.close = function(){
    this.all.remove();
  };

  //for changing button highlight:
  this.next = function(){
    this.buttonList.next();
  };
  this.previous = function(){
    this.buttonList.previous();
  };
  this.show = function(){
    qpo.menus.main.showAll();
  };
  return this;
};

//CREATE MAIN MENU:
qpo.menus.main = new makeMainMenu();
qpo.menus.main.animate(); //could be better designed but oh well
qpo.muteButton = c.path("M-4,-4 L4,-4 L10,-10 L10,10 L4,4 L-4,4 L-4,-4")
  .attr({"stroke-width":2, "stroke":qpo.COLOR_DICT["green"],
    "fill":qpo.COLOR_DICT["green"], "opacity":0.7})
  .transform("t15,580")
  .click(function(){
    switch(qpo.menuSong.volume){
      case 1: { qpo.menuSong.volume = 0.2; break;}
      case 0.2: { qpo.menuSong.volume = 0; break; }
      case 0: { qpo.menuSong.volume = 1; break; }
      default: {console.log("this was unexpected"); break;}
    }
  });

var makeMultiplayerMenu = function(){ //fill this in later
  qpo.menus["multiP"] = this;
  qpo.activeSession = new session("multiplayer");
  activeMenu = "multiP";

  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":1});
  this.title = c.text(300,100,"coming soon!").attr({"font-size":60,"fill":"white","font-family":"'Open Sans',sans-serif"});

  this.all = c.set().push(this.blackness,this.title);

  this.up = function(){
    goMainMenu();
  }

  this.close = function(){
    // this.all.hide();
    this.all.remove();
  }

  return this;
}

var makeGameSetupMenu = function(){
    activeMenu = "gameS";
    qpo.menus["gameS"] = this;
    // qpo.menus.main.unit.kill();
    // activeMenu = this;
    // modes : { 0: Single-Player, 1: Multiplayer}
    this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":1});
    this.title = c.text(300,50,"Game Setup").attr({"font-size":50,"fill":"white","font-family":"'Open Sans',sans-serif"});

    this.quickPlay = new button("Quick-Play",qpo.guiDimens.gpWidth/2,190, (function(e){
      this.close();
      settings = [8,4]; //q,po
      countdownScreen(settings);
      qpo.menus.main.blackness.show();
    }).bind(this), 0, true, "quickP")

    this.customGame = new button("Custom Game",qpo.guiDimens.gpWidth/2,280, (function(e){
      this.close(); //wrong. this tries to close the window.
      qpo.menus.main.blackness.show();
      qpo.menus["customG"] = new makeCustomGameMenu();
    }).bind(this), 0, false, "customG");

    this.all = c.set().push(this.blackness, this.title, this.quickPlay.set, this.customGame.set);

    this.close = function(){
      this.all.remove();
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
      goMainMenu();
    }

    return this;
}

var makeCustomGameMenu = function(){
    activeMenu = "customG";
    qpo.menus["customG"] = this;

    this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":1});
    this.title = c.text(300,50,"Custom Game").attr({"font-size":50,"fill":"white","font-family":"'Open Sans',sans-serif"});

    this.qSlider = new slider("Q", 4, 20, 8, 160, true);
    this.poSlider = new slider("PO", 1, 7, 4, 260, false);

    this.startGame = new button("Start Game", qpo.guiDimens.gpWidth/2, 360, (function(e){
      //this.activate();
      this.close();
      var settings = [this.qSlider.value,this.poSlider.value]; //[q,po]
      countdownScreen(settings);
      qpo.menus.main.blackness.show();
    }).bind(this), 0, false, "startG");

    this.active = this.qSlider;
    this.activeIndex = 0; //index in this.items of active (orange) thing.

    this.items = [this.qSlider, this.poSlider, this.startGame];

    this.all = c.set(this.blackness, this.title, this.qSlider.set, this.poSlider.set, this.startGame.set);

    this.close = function(){
      this.all.remove();
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
      gameSetupMenu = makeGameSetupMenu();
    }

    return this;
}

var makeEndGameMenu = function(result){
  qpo.menus["endG"] = this;
  activeMenu = "endG";

  this.blackness = c.rect(0,0, qpo.guiCoords.gamePanel.width, qpo.guiCoords.gamePanel.height)
    .attr({"fill":"black","opacity":0.9});

  this.statusPanel = c.rect(0,0,600,100).attr({"fill":"#111111"});

  // create teh big text:
  this.gameOverText = c.text(300,50,"round over")
    .attr({"font-size":50,"fill":"black"});
  // set teh big text to "Victory"/"Tie"/etc:
  switch (result){
    case "tie":
      this.gameOverText.attr({"text":"tie!","fill":qpo.COLOR_DICT["grey"]});
      break;
    case "red":
      if (!qpoGame.multiplayer){
        this.gameOverText.attr({"text":"Defeat.","fill":qpo.COLOR_DICT["red"]});
      } else {
        this.gameOverText.attr({"text":"Red wins!","fill":qpo.COLOR_DICT["red"]});
      }
      break;
    case "blue":
      if (!qpoGame.multiplayer){
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
  this.back = new button("Main Menu",300,440+25,goMainMenu,0,false,"mainM");               // make the Main Menu button
  this.selectDiff = new button("Select Difficulty",300,350+25,function(e){ //make the Select Diffuculty button
    qpo.menus["endG"].all.hide();
    gameSetupMenu = makeGameSetupMenu();
  }, 60,false,"gameS");

  this.all = c.set().push(this.gameOverText,this.again.set,this.back.set,
    this.selectDiff.set,this.barGraph,this.statusPanel, this.blackness);
  qpo.mode="menu";

  this.close = function(){
    this.all.remove();
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
    goMainMenu();
  }

  return this;
};

function goMainMenu(){
  qpo.menus[activeMenu].close();
  qpo.menus.main.showAll();
  qpo.mode = "menu";
  activeMenu = "main";
  qpo.menus.main.blackness.attr({"opacity":1});
  qpo.menus.main.singlePlayerButton.activate();
};
