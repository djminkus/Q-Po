var yes = $("#yes");

button = function(text,x,y,onclick){
  this.rectEl = c.rect( x-(text.length)*11, y-30, text.length*22,60 ).attr({
    "fill":"#000000","stroke":COLOR_DICT["orange"],"stroke-width":4});
  this.textEl = c.text(x,y,text).attr({"font-size":30,"fill":"white","font-family":"'Open Sans',sans-serif"});
  this.set = c.set().push(this.textEl,this.rectEl);
  this.set.click(function(){onclick()});
}

var menuScreen = {
  blackness: c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9}),
  title : c.text(300,100,"Q-PO").attr({"font-size":120,"fill":"white","font-family":"'Open Sans',sans-serif"}),

  startGameButton : new button("Start Game",300,270,function(e){
    countdownScreen(); //shows numeric countdown
    menuScreen.all.hide();
    menuScreen.blackness.show();
  }),
  howToPlayButton: new button("How to Play",300,390,function(e){
    console.log("this button kind of work now");
    activeScreen="game";
    menuScreen.all.hide();
    menuScreen.blackness.show();

    startHowTo(); //this function is defined in "qpo03.js"
  }),
  //pressEnter : c.text(300,340,"press enter to start").attr({"font-size":15,"fill":"white"}),

  all : c.set(),
  showAll: function(){
    menuScreen.all.show();
    menuScreen.blackness.toBack();
  },
};

menuScreen.all.push(menuScreen.blackness, menuScreen.title,menuScreen.startGameButton.set,
  menuScreen.howToPlayButton.set);
