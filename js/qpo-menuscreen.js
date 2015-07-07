var yes = $("#yes");

button = function(text,x,y,onclick){
  this.rectEl = c.rect( x-(text.length)*11, y-30, text.length*22,60 ).attr({
    "fill":"#666666","stroke":COLOR_DICT["orange"],"stroke-width":4});
  this.textEl = c.text(x,y,text).attr({"font-size":30,"fill":"white","font-family":"'Open Sans',sans-serif"});
  this.set = c.set().push(this.textEl,this.rectEl);
  this.set.click(function(){onclick()});
}

var menuScreen = {
  blackness: c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9}),
  title : c.text(300,100,"Q-PO").attr({"font-size":120,"fill":"white"}),

  button : c.rect(210,270,180,60).attr({"fill":"#666666","stroke":COLOR_DICT["orange"],"stroke-width":4}),
  startGame : c.text(300,300,"Start Game").attr({"font-size":30,"fill":"white"}),
  //pressEnter : c.text(300,340,"press enter to start").attr({"font-size":15,"fill":"white"}),
  // when ^^^ uncommented, add menuScreen.pressEnter to menuScreen.all.push(...) (line 22)
  all : c.set().push(this.blackness,this.title,this.button,this.startGame)
}
menuScreen.all.push(menuScreen.title,menuScreen.button,menuScreen.startGame);

menuScreen.showAll = function(){
  menuScreen.all.show();
  menuScreen.blackness.toBack();
}



menuScreen.startGame.click(function(e){
  countdownScreen(); //shows numeric countdown
  //menuScreen.title.hide();
  //menuScreen.startGame.hide();
  //menuScreen.button.hide();
  menuScreen.all.hide();
  //menuScreen.starterButton.remove(); //DOESN'T WORK

});
