var yes = $("#yes");

var activeScreen = "menu"; //type of screen that's active -- can be "menu", "game", "tut", or "other"
//activeMenu = []; //a list of button objects within the current menu
var activeMenu = "main"; //the key within "menus" of the currently-displayed menu
var menus = {
  "main" : null,
  "multiP" : null,
  "selectD" : null,
  "endG" : null,
  "selectP" : null
};

var activeButton = "singleP"; //the key within "buttons" of the orange-highlighted button
var buttons = {
  "singleP": null,
  "multiP" : null,
  "selectP" : null,
  "beginner" : null,
  "medium" : null,
  "hard" : null,
  "newR" : null,
  "selectD" : null,
  "mainM" : null
}
var buttonsKeys = ["singleP","multiP","selectP","beginner","medium","hard","newR","selectD","mainM"];
var activeSession = null;

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

buttonList = function(buttonsInOrder){
  //pass in a list of the buttons in the order they appear on the list.
  this.activeIndex = 0;
  this.buttons = buttonsInOrder;
  this.next = function(){
    this.buttons[this.activeIndex].deactivate();
    if (this.activeIndex == this.buttons.length - 1){ //if last button is highlighted, return to first button:
      this.activeIndex = 0;
    } else { //otherwise, increment this.activeIndex by 1:
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
  /* old stuff
    switch(whichWay){
      case "next": //.next() method of menu object called
        break;
      case "previous":
        if (activeIndex == 0){ //if first button is highlighted, go to last button:
          this.activeIndex = this.buttons.length-1 ;
        } else { //otherwise, decrement this.activeIndex:
          this.activeIndex -= 1;
        }
        break;
      default :
        console.log("unexpected");
        break;
    }
  */
  //return this;
}

/*
menu = function(name,buttonArgs){
};
*/

var makeMainMenu = function(){
  activeMenu = "main";
  menus["main"] = this;

  //1st layer (background)
  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black"});

  //2nd layer (animation)
  this.unit = makeUnit("red",3,7.5,0);
  this.otherUnit = makeUnit("blue",1,2,1);
  this.animate = function(){
    //order the layers properly:
    mainMenu.unit.phys.toBack();
    mainMenu.otherUnit.phys.toBack();
    mainMenu.blackness.toBack();

    //make the red unit move right and the blue unit fire a bomb every three turns, starting this turn
    mainMenu.unit.moveRight();
    mainMenu.otherUnit.bomb();
    mainMenu.bombCounter = 1;
    mainMenu.all.push(qpo.bombs[(mainMenu.bombCounter-1) % 2].phys);
    // bombs[(mainMenu.bombCounter-1) % 2].phys.toBack();
    mainMenu.mmrai = setInterval(
      function(){
        mainMenu.unit.moveRight();
        mainMenu.otherUnit.bomb();
        mainMenu.bombCounter++;
        mainMenu.all.push(qpo.bombs[(mainMenu.bombCounter-1) % 2].phys);
        // console.log("main menu right anim!");
      },
    9000*qpo.timeScale)//mmrai = Main Menu Rightward Animation Interval

    //make the red unit move left and blue move right every 3 "turns", starting in two turns
    mainMenu.turn2 = setTimeout(
      function(){
        mainMenu.mmlai = setInterval(
          function(){
            mainMenu.unit.moveLeft();
            mainMenu.otherUnit.moveRight();
            // console.log("main menu left anim!")
          }, 9000*qpo.timeScale);
        mainMenu.unit.moveLeft();
        mainMenu.otherUnit.moveRight();
      },
    6000*qpo.timeScale);

    //make the red unit shoot and the blue unit move left every 3 "turns", starting in 1 turn
    mainMenu.turn1 = setTimeout(
      function(){
        mainMenu.mmsai = setInterval(function(){
          qpo.shots[mainMenu.shotCounter-1].hide();
          mainMenu.unit.shoot();
          mainMenu.shotCounter++;
          qpo.shots[mainMenu.shotCounter-1].toBack();
          mainMenu.blackness.toBack();
          mainMenu.otherUnit.moveLeft();
          // console.log("main menu shoot anim!");
        }, 9000*qpo.timeScale);
        mainMenu.unit.shoot();
        qpo.shots[0].toBack();
        mainMenu.shotCounter = 1;
        mainMenu.blackness.toBack();
        mainMenu.otherUnit.moveLeft();
      },
    3000*qpo.timeScale);

    // mainMenu.blackness.toBack();
  };

  //3rd layer (2nd background)
  // this.miniblackness = c.rect(0,0,c.width-200,c.height-200).attr({"fill":"black","opacity":1}); // to leave a "window" for the anim

  //4th layer (title, menu buttons)
  this.title = c.text(300,100,"Q-PO").attr({"font-size":120,"fill":"white","font-family":"'Open Sans',sans-serif"});
  this.singlePlayerButton = new button("Single-Player",300,250,function(e){
    selectDifficultyMenu = makeSelectDifficultyMenu();
    mainMenu.hideAll();
    // mainMenu.all.hide();
    qpoGame.multiplayer = false;
    activeSession = new session("singlePlayer");
  }, 30, true, "singleP");
  this.multiplayerButton = new button("Multiplayer",300,340,function(e){
    mainMenu.multiplayerButton.deactivate();
    qpo.multiplayerMenu = makeMultiplayerMenu();
    // selectDifficultyMenu = makeSelectDifficultyMenu();
    // mainMenu.all.hide();
    mainMenu.hideAll();
    qpoGame.multiplayer = true;
  }, 10, false, "multiP"),

  /* selectProfileButton = new button("Select Profile",300,450,function(e){
    mainMenu.selectProfileButton.deactivate();
    selectProfileMenu = makeSelectProfileMenu();
     mainMenu.all.hide();
   }, 30, false, "selectP"); */

  /* howToPlayButton = new button("How to Play",300,390,function(e){
    mainMenu.all.hide();
    mainMenu.blackness.show();
    startHowTo(); //this function is defined in "qpo03.js"
  }); */

  this.buttonList = new buttonList([this.singlePlayerButton, this.multiplayerButton]);

  /*
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
  this.all.push(this.title, this.blackness,
    this.singlePlayerButton.set, this.multiplayerButton.set,
    this.unit.phys, this.otherUnit.phys);

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

  //for changing button highlight:
  this.next = function(){
    this.buttonList.next();
  };
  this.previous = function(){
    this.buttonList.previous();
  };

  this.show = function(){
    mainMenu.showAll();
  };
  return this;
};

var mainMenu = new makeMainMenu();
mainMenu.animate(); //could be better designed but oh well

/*
var mainMenu = {
  blackness: c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9}),
  title : c.text(300,100,"Q-PO").attr({"font-size":120,"fill":"white","font-family":"'Open Sans',sans-serif"}),
  singlePlayerButton : new button("Single-Player",300,270,function(e){
    selectDifficultyMenu = makeSelectDifficultyMenu();
    mainMenu.all.hide();
    qpoGame.multiplayer = false;
    activeSession = new session("singlePlayer");
  }, 30, true, "singleP"),
  multiplayerButton : new button("Multiplayer",300,360,function(e){
    mainMenu.multiplayerButton.deactivate();
    selectDifficultyMenu = makeSelectDifficultyMenu();
    mainMenu.all.hide();
    qpoGame.multiplayer = true;
    activeSession = new session("multiplayer");
  }, 10, false, "multiP"),
  // selectProfileButton : new button("Select Profile",300,450,function(e){
  //   mainMenu.selectProfileButton.deactivate();
  //   selectProfileMenu = makeSelectProfileMenu();
  //   mainMenu.all.hide();
  // }, 30, false, "selectP"),
  // howToPlayButton: new button("How to Play",300,390,function(e){
  //   mainMenu.all.hide();
  //   mainMenu.blackness.show();
  //   startHowTo(); //this function is defined in "qpo03.js"
  // }),
  buttonList : new buttonList([this.singlePlayerButton, this.multiplayerButton]),
  all : c.set(),
  showAll: function(){
    mainMenu.all.show();
    mainMenu.blackness.toBack();
  },
  next: function(){
    console.log("next button!");
    this.buttonList.next();
  },
  previous: function(){
    console.log("previous!");
    this.buttonList.previous();
  }
};
menus.main = mainMenu;
mainMenu.all.push(mainMenu.blackness, mainMenu.title,
  mainMenu.singlePlayerButton.set, mainMenu.multiplayerButton.set);
*/
// mainMenu.all.push(mainMenu.selectProfileButton.set);

var makeMultiplayerMenu = function(){
  menus["multiP"] = this;
  activeSession = new session("multiplayer");
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

var makeSelectDifficultyMenu = function(){
    activeMenu = "selectD";
    menus["selectD"] = this;
    // mainMenu.unit.kill();
    //activeMenu = this;
    // modes : { 0: Single-Player, 1: Multiplayer}
    this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":1});
    this.title = c.text(300,50,"Select Difficulty").attr({"font-size":50,"fill":"white","font-family":"'Open Sans',sans-serif"});

    this.beginner = new button("Beginner",300,230-40,function(e){
      this.close();
      // this.all.hide();
      diffic = "1";
      countdownScreen(diffic);
      mainMenu.blackness.show();
    },0,true, "beginner");

    this.medium = new button("Medium",300,320-40,function(e){
      this.close();
      // this.all.hide();
      diffic = "2";
      countdownScreen(diffic);
      mainMenu.blackness.show();
    },-15,false, "medium");

    this.hard = new button("Hard",300,410-40,function(e){
      this.close();
      // this.all.hide();
      diffic = "3";
      countdownScreen(diffic);
      mainMenu.blackness.show();
    }, -15,false, "hard");

    this.units = [
      makeUnit("red",2.4,1.8), makeUnit("blue",7.7,1.8),
      makeUnit("red",2.45, 3.6), makeUnit("red",1.25, 3.6),   makeUnit("blue",7.65, 3.6), makeUnit("blue",8.85, 3.6),
      makeUnit("red",2.9, 5.4), makeUnit("red",1.7, 5.4), makeUnit("red",0.5, 5.4),
        makeUnit("blue",7.2, 5.4), makeUnit("blue",8.4, 5.4), makeUnit("blue",9.6, 5.4)
    ];

    this.all = c.set().push(this.blackness, this.title, this.beginner.set, this.medium.set, this.hard.set);

    this.close = function(){
      // this.all.hide();
      this.all.remove();
      for (var i=0; i<this.units.length; i++){
        this.units[i].kill();
        this.units[i].phys.hide();
      }
    }

    this.next = function(){
      if (this.beginner.active == true){
        this.beginner.deactivate();
        this.medium.activate();
      } else if (this.medium.active == true){
        this.medium.deactivate();
        this.hard.activate();
      } else if (this.hard.active == true){
        this.hard.deactivate();
        this.beginner.activate();
      }
    }
    this.previous = function(){
      if (this.beginner.active == true){
        this.beginner.deactivate();
        this.hard.activate();
      } else if (this.medium.active == true){
        this.medium.deactivate();
        this.beginner.activate();
      } else if (this.hard.active == true){
        this.hard.deactivate();
        this.medium.activate();
      }
    }
    this.up = function(){
      goMainMenu();
    }

    return this;
}

var makeEndGameMenu = function(result){
  menus["endG"] = this;
  activeMenu = "endG";

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
  this.barGraph = activeSession.displayResults(result);

  // create teh buttons
  this.again = new button("New Round",300,260+25,newRound,0,true,"newR");         //make the New Round button
  this.back = new button("Main Menu",300,440+25,goMainMenu,0,false,"mainM");               // make the Main Menu button
  this.selectDiff = new button("Select Difficulty",300,350+25,function(e){ //make the Select Diffuculty button
    endGameMenu.all.hide();
    selectDifficultyMenu = makeSelectDifficultyMenu();
  }, 60,false,"selectD");

  this.all = c.set().push(this.gameOverText,this.again.set,this.back.set,
    this.selectDiff.set,this.barGraph,this.statusPanel);
  //console.log(endGameElements);
  activeScreen="menu";

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
  menus[activeMenu].close();
  /*
  switch (activeMenu){
    case "selectD":
      selectDifficultyMenu.all.remove();
      break;
    case "endG":
      endGameMenu.all.remove();
      break;
    case "selectP":
      selectProfileMenu.all.remove();
      break;
    default:
      console.log("this was unexpected");
      break;
  }
  */
  mainMenu.showAll();
  activeScreen = "menu";
  activeMenu = "main";
  mainMenu.blackness.attr({"opacity":1});
  mainMenu.singlePlayerButton.activate();
}
