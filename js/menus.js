var yes = $("#yes");

button = function(text,x,y,onclick,adj){
  /*
  x is x center, y is y center
  adj is button width adjustment (+ value --> thinner button)
  */
  if (adj===undefined){
    var adj = 0;
  }
  this.rectEl = c.rect( x- (text.length)*11 + adj, y-30, text.length*22 - 2*adj , 60 ).attr({
    "fill":"#000000","stroke":"white","stroke-width":2});
  this.textEl = c.text(x,y,text).attr({"font-size":30,"fill":"white","font-family":"'Open Sans',sans-serif"});
  this.set = c.set().push(this.textEl,this.rectEl);
  this.set.click(function(){onclick()});
}
menuList = function(items){
  
}

var mainMenu = {
  blackness: c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9}),
  title : c.text(300,100,"Q-PO").attr({"font-size":120,"fill":"white","font-family":"'Open Sans',sans-serif"}),

  singlePlayerButton : new button("Single-Player",300,270,function(e){
    difficultySelectMenu = selectDifficulty();
    //countdownScreen(); //shows numeric countdown
    mainMenu.all.hide();
    qpoGame.multiplayer = false;
    //mainMenu.blackness.show();
  }, 30),
  multiplayerButton : new button("Multiplayer",300,360,function(e){
    difficultySelectMenu = selectDifficulty();
    //countdownScreen(); //shows numeric countdown
    mainMenu.all.hide();
    qpoGame.multiplayer = true;
    //mainMenu.blackness.show();
  }, 10),


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
};

mainMenu.all.push(mainMenu.blackness, mainMenu.title,
  mainMenu.singlePlayerButton.set, mainMenu.multiplayerButton.set);

var selectDifficulty = function(){
    // modes : { 0: Single-Player, 1: Multiplayer}
    this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9});
    this.title = c.text(300,60,"Select Difficulty").attr({"font-size":40,"fill":"white","font-family":"'Open Sans',sans-serif"});

    this.beginner = new button("Beginner",300,200-40,function(e){
      this.all.hide();
      diffic = "beginner";
      countdownScreen(diffic);
      mainMenu.blackness.show();
    });

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
    return this;
}

var makeEndGameMenu = function(result){
  this.gameOverBG = c.rect(10,10,containerWidth()-20,130).attr({"fill":"white"});
  this.gameOverText = c.text(300,70,"round over")
    .attr({"font-size":50,"fill":"black"});
  switch (result){
    case "tie":
      this.gameOverText.attr({"text":"tie!"});
      break;
    case "red":
      if (!qpoGame.multiplayer){
        this.gameOverText.attr({"text":"Defeat."});
      } else {
        this.gameOverText.attr({"text":"Red wins!"});
      }
      break;
    case "blue":
      if (!qpoGame.multiplayer){
        this.gameOverText.attr({"text":"Victory!"});
      } else {
        this.gameOverText.attr({"text":"Blue wins!"});
      }
      break;
    default:
      break;
  }
  //mainMenu.blackness.attr({"opacity": .9 });
  this.again = new button("New Round",300,220,newRound);
  this.back = new button("Main Menu",300,420,goMainMenu);
  this.selectDiff = new button("Select Difficulty",300,320,function(e){
    endGameMenu.all.hide();
    difficultySelectMenu = selectDifficulty();
  }, 60);

  this.all = c.set().push(this.gameOverText,this.gameOverBG,this.again.set,this.back.set,this.selectDiff.set);
  //console.log(endGameElements);
  activeScreen="menu";
  return this;
};

//difficultySelectMenu.all.push(difficultySelectMenu.blackness, difficultySelectMenu.title);
//difficultySelectMenu.all.remove();
