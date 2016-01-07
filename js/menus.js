var yes = $("#yes");
//var activeMenu = mainMenu;
var menus = {
  "main" : null,
  "selectD" : null,
  "endG" : null
}

button = function(text,x,y,onclick,adj,active){
  /*
  x is x-center of button, y is y-center of button
  adj is button width adjustment (positive value --> thinner button)
  */
  if (adj===undefined){
    var adj = 0;
  }
  this.rectEl = c.rect( x- (text.length)*11 + adj, y-30, text.length*22 - 2*adj , 60 ).attr({
    "fill":"#000000","stroke":"white","stroke-width":2});
  this.textEl = c.text(x,y,text).attr({"font-size":30,"fill":"white","font-family":"'Open Sans',sans-serif"});
  this.set = c.set().push(this.textEl,this.rectEl);
  this.set.click(function(){onclick()});
  this.active = active || false ;
  this.activate = function(){
    this.rectEl.attr({"stroke":COLOR_DICT["orange"], "stroke-width":4});
    activeButton = this;
    this.active = true
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

var mainMenu = {
  blackness: c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9}),
  title : c.text(300,100,"Q-PO").attr({"font-size":120,"fill":"white","font-family":"'Open Sans',sans-serif"}),

  singlePlayerButton : new button("Single-Player",300,270,function(e){
    difficultySelectMenu = selectDifficulty();
    mainMenu.all.hide();
    qpoGame.multiplayer = false;
    //mainMenu.blackness.show();
  }, 30, true),
  multiplayerButton : new button("Multiplayer",300,360,function(e){
    difficultySelectMenu = selectDifficulty();
    mainMenu.all.hide();
    qpoGame.multiplayer = true;
    //mainMenu.blackness.show();
  }, 10, false),

  /*
  howToPlayButton: new button("How to Play",300,390,function(e){
    mainMenu.all.hide();
    mainMenu.blackness.show();
    startHowTo(); //this function is defined in "qpo03.js"
  }),
  */
  //pressEnter : c.text(300,340,"press enter to start").attr({"font-size":15,"fill":"white"}),

  all : c.set(),
  showAll: function(){
    mainMenu.all.show();
    mainMenu.blackness.toBack();
  },
  next: function(){
    if (this.multiplayerButton.active == true){
      this.multiplayerButton.deactivate();
      this.singlePlayerButton.activate();
      console.log("mp button was active, now sp button is");
    } else {
      this.singlePlayerButton.deactivate();
      this.multiplayerButton.activate();
      console.log("sp button was active, now mp button is");
    }
    console.log("next!");
  },
  previous: function(){
    if (this.multiplayerButton.active == true){
      this.multiplayerButton.deactivate();
      this.singlePlayerButton.activate();
      console.log("mp button was active, now sp button is");
    } else {
      this.singlePlayerButton.deactivate();
      this.multiplayerButton.activate();
      console.log("sp button was active, now mp button is");
    }
    console.log("previous!");
  }
};

menus.main = mainMenu;
mainMenu.all.push(mainMenu.blackness, mainMenu.title,
  mainMenu.singlePlayerButton.set, mainMenu.multiplayerButton.set);
//activeMenu = [mainMenu.singlePlayerButton, mainMenu.multiplayerButton];
console.log(activeMenu[activeButton]);
console.log(activeButton);

var selectDifficulty = function(){
    activeMenu = "selectD";
    menus["selectD"] = this;
    //activeMenu = this;
    // modes : { 0: Single-Player, 1: Multiplayer}
    this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9});
    this.title = c.text(300,60,"Select Difficulty").attr({"font-size":40,"fill":"white","font-family":"'Open Sans',sans-serif"});

    this.beginner = new button("Beginner",300,200-40,function(e){
      this.all.hide();
      diffic = "beginner";
      countdownScreen(diffic);
      mainMenu.blackness.show();
    },0,true);

    this.medium = new button("Medium",300,320-40,function(e){
      this.all.hide();
      diffic = "medium";
      countdownScreen(diffic);
      mainMenu.blackness.show();
    }, -15);

    this.hard = new button("Hard",300,440-40,function(e){
      this.all.hide();
      diffic = "hard";
      countdownScreen(diffic);
      mainMenu.blackness.show();
    }, -15);

    this.all = c.set().push(this.blackness, this.title, this.beginner.set, this.medium.set, this.hard.set);


    this.next = function(){
      if (this.beginner.active == true){
        this.beginner.deactivate();
        this.medium.activate();
        console.log("beg button was active, now med button is");
      } else if (this.medium.active == true){
        this.medium.deactivate();
        this.hard.activate();
        console.log("med button was active, now hard button is");
      } else if (this.hard.active == true){
        this.hard.deactivate();
        this.beginner.activate();
      }
      console.log("next!");
    }
    this.previous = function(){
      if (this.beginner.active == true){
        this.beginner.deactivate();
        this.hard.activate();
        console.log("beg button was active, now hard button is");
      } else if (this.medium.active == true){
        this.medium.deactivate();
        this.beginner.activate();
        console.log("med button was active, now beg button is");
      } else if (this.hard.active == true){
        this.hard.deactivate();
        this.medium.activate();
        console.log("hard button was active, now med button is");
      }
      console.log("previous!");
    }

    return this;
}

var makeEndGameMenu = function(result){
  menus["endG"] = this;
  activeMenu = "endG";
  //this.gameOverBG = c.rect(10,10,containerWidth()-20,130).attr({"fill":"white"});
  this.gameOverText = c.text(300,70,"round over")
    .attr({"font-size":50,"fill":"black"});
  switch (result){
    case "tie":
      this.gameOverText.attr({"text":"tie!"});
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
        this.gameOverText.attr({"text":"Victory!","fill":COLOR_DICT["shot color"]});
      } else {
        this.gameOverText.attr({"text":"Blue wins!","fill":COLOR_DICT["blue"]});
      }
      break;
    default:
      break;
  }
  //mainMenu.blackness.attr({"opacity": .9 });
  this.again = new button("New Round",300,220,newRound,0,true);
  this.back = new button("Main Menu",300,420,goMainMenu);
  this.selectDiff = new button("Select Difficulty",300,320,function(e){
    endGameMenu.all.hide();
    difficultySelectMenu = selectDifficulty();
  }, 60);

  this.all = c.set().push(this.gameOverText,this.again.set,this.back.set,this.selectDiff.set);
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
    console.log("next!");
  }
  this.previous = function(){
    if (this.again.active == true){
      this.again.deactivate();
      this.back.activate();
      console.log("agin button was active, now sd button is");
    } else if (this.selectDiff.active == true){
      this.selectDiff.deactivate();
      this.again.activate();
      console.log("sd button was active, now back button is");
    } else if (this.back.active == true){
      this.back.deactivate();
      this.selectDiff.activate();
      console.log("back button was active, now ag button is");
    }
    console.log("previous!");
  }

  return this;
};

//difficultySelectMenu.all.push(difficultySelectMenu.blackness, difficultySelectMenu.title);
//difficultySelectMenu.all.remove();
