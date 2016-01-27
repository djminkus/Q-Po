
var yes = $("#yes");

// mLog("yes");
// mLog2('yes');

var activeScreen = "menu"; //type of screen that's active -- can be "menu", "game", "tut", or "other"
//activeMenu = []; //a list of button objects within the current menu
var activeMenu = "main"; //the key within "menus" of the currently-displayed menu
var menus = {
  "main" : null,
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
    this.rectEl.attr({"stroke":COLOR_DICT["orange"], "stroke-width":4});
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

  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9});
  this.title = c.text(300,100,"Q-PO").attr({"font-size":120,"fill":"white","font-family":"'Open Sans',sans-serif"});

  this.singlePlayerButton = new button("Single-Player",300,270,function(e){
    selectDifficultyMenu = makeSelectDifficultyMenu();
    mainMenu.all.hide();
    qpoGame.multiplayer = false;
    activeSession = new session("singlePlayer");
  }, 30, true, "singleP");
  this.multiplayerButton = new button("Multiplayer",300,360,function(e){
    mainMenu.multiplayerButton.deactivate();
    selectDifficultyMenu = makeSelectDifficultyMenu();
    mainMenu.all.hide();
    qpoGame.multiplayer = true;
    activeSession = new session("multiplayer");
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
  this.all = c.set();
  this.all.push(this.title,this.blackness,this.singlePlayerButton.set,this.multiplayerButton.set);

  this.showAll = function(){
    this.all.show();
    this.blackness.toBack();
  };
  this.next = function(){
    this.buttonList.next();
  };
  this.previous = function(){
    this.buttonList.previous();
  };
  // mlog("this");
  return this;

};

var mainMenu = new makeMainMenu();

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

var makeSelectDifficultyMenu = function(){
    activeMenu = "selectD";
    menus["selectD"] = this;
    //activeMenu = this;
    // modes : { 0: Single-Player, 1: Multiplayer}
    this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9});
    this.title = c.text(300,50,"Select Difficulty").attr({"font-size":50,"fill":"white","font-family":"'Open Sans',sans-serif"});

    this.beginner = new button("Beginner",300,230-40,function(e){
      this.all.hide();
      diffic = "1";
      countdownScreen(diffic);
      mainMenu.blackness.show();
    },0,true, "beginner");

    this.medium = new button("Medium",300,320-40,function(e){
      this.all.hide();
      diffic = "2";
      countdownScreen(diffic);
      mainMenu.blackness.show();
    },-15,false, "medium");

    this.hard = new button("Hard",300,410-40,function(e){
      this.all.hide();
      diffic = "3";
      countdownScreen(diffic);
      mainMenu.blackness.show();
    }, -15,false, "hard");

    this.all = c.set().push(this.blackness, this.title, this.beginner.set, this.medium.set, this.hard.set);

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
      this.gameOverText.attr({"text":"tie!","fill":COLOR_DICT["grey"]});
      break;
    case "red":
      if (!qpoGame.multiplayer){
        this.gameOverText.attr({"text":"Defeat.","fill":COLOR_DICT["red"]});
      } else {
        this.gameOverText.attr({"text":"Red wins!","fill":COLOR_DICT["red"]});
      }
      break;
    case "blue":
      if (!qpoGame.multiplayer){
        this.gameOverText.attr({"text":"Victory!","fill":COLOR_DICT["blue"]});
      } else {
        this.gameOverText.attr({"text":"Blue wins!","fill":COLOR_DICT["blue"]});
      }
      break;
    default:
      break;
  }

  // create teh bar graph:
  this.barGraph = activeSession.displayResults();

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

/*
var makeSelectProfileMenu = function(){

  menus["selectProfile"] = this;
  activeMenu = "selectProfile";

  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9});

  // create teh big text:
  this.mainText = c.text(300,50,"Select Profile")
    .attr({"font-size":50,"fill":"white"});

  // create teh buttons
  //this.again = new button("New Round",300,250+25,newRound,0,true);         //make the New Round button
  this.mainMenuButton = new button("Main Menu",300,450+25,goMainMenu, 0, true, "mainM");  // make the Main Menu button

  this.all = c.set().push(this.mainText, this.mainMenuButton.set, this.blackness);
  //console.log(endGameElements);
  activeScreen="menu";

  this.up = function(){
    goMainMenu();
  }

  return this;
}
*/

function goMainMenu(){
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
  mainMenu.showAll();
  activeScreen = "menu";
  activeMenu = "main";
  mainMenu.blackness.attr({"opacity":.9});
  mainMenu.singlePlayerButton.activate();
}
