var yes = $("#yes");

button = function(text,x,y,onclick){
  this.rectEl = c.rect( x-(text.length)*11, y-30, text.length*22,60 ).attr({
    "fill":"#000000","stroke":"white","stroke-width":2});
  this.textEl = c.text(x,y,text).attr({"font-size":30,"fill":"white","font-family":"'Open Sans',sans-serif"});
  this.set = c.set().push(this.textEl,this.rectEl);
  this.set.click(function(){onclick()});
}

var mainMenu = {
  blackness: c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9}),
  title : c.text(300,100,"Q-PO").attr({"font-size":120,"fill":"white","font-family":"'Open Sans',sans-serif"}),

  startGameButton : new button("Start Game",300,270,function(e){
    difficultySelectMenu = selectDifficulty();
    //countdownScreen(); //shows numeric countdown
    mainMenu.all.hide();
    //mainMenu.blackness.show();
  }),
  howToPlayButton: new button("How to Play",300,390,function(e){
    mainMenu.all.hide();
    mainMenu.blackness.show();

    startHowTo(); //this function is defined in "qpo03.js"
  }),
  //pressEnter : c.text(300,340,"press enter to start").attr({"font-size":15,"fill":"white"}),

  all : c.set(),
  showAll: function(){
    mainMenu.all.show();
    mainMenu.blackness.toBack();
  },
};

mainMenu.all.push(mainMenu.blackness, mainMenu.title, mainMenu.startGameButton.set,
  mainMenu.howToPlayButton.set);

var selectDifficulty = function(){
    this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9});
    this.title = c.text(300,60,"Select Difficulty").attr({"font-size":40,"fill":"white","font-family":"'Open Sans',sans-serif"});

    this.beginner = new button("Beginner",300,200-40,function(e){
      this.all.hide();
      diffic = "beginner"
      countdownScreen(diffic);
      mainMenu.blackness.show();
    });

    this.medium = new button("Medium",300,320-40,function(e){
      this.all.hide();
      diffic = "medium";
      countdownScreen(diffic);
      mainMenu.blackness.show();
    });

    this.hard = new button("Hard",300,440-40,function(e){
      this.all.hide();
      diffic = "hard"
      countdownScreen(diffic);
      mainMenu.blackness.show();
    });

    this.all = c.set().push(this.blackness, this.title, this.beginner.set, this.medium.set, this.hard.set);
    return this;
}

//difficultySelectMenu.all.push(difficultySelectMenu.blackness, difficultySelectMenu.title);
//difficultySelectMenu.all.remove();