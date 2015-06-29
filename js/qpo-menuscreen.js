var yes = $("#yes");

button = function(text,x,y,onclick){
  this.rectEl = c.rect( x-(text.length)*9, y-30, text.length*18,60 ).attr({
    "fill":"#666666","stroke":"#666666"});
  this.textEl = c.text(x,y,text).attr({"font-size":30,"fill":"white","font-family":"'Open Sans',sans-serif"});
  this.set = c.set().push(this.textEl,this.rectEl);
  this.set.click(function(){onclick()});
}

var menuScreen = {
  blackness: c.rect(0,0,c.width,c.height).attr({"fill":"black","opacity":.9}),
  title : c.text(300,100,"Q-po").attr({"font-size":120,"fill":"white"}),

  button : c.rect(210,270,180,60).attr({"fill":"#666666","stroke":"#666666"}),
  startGame : c.text(300,300,"Start Game").attr({"font-size":30,"fill":"white"}),
  starterButton : c.set().push(this.button,this.startGame),

  all : c.set().push(this.blackness,this.title,this.button,this.startGame),
  //showAll : menuScreen.all.show()
}

menuScreen.showAll = function(){ menuScreen.all.show(); }

/* THESE DON'T WORK (IDK WHY)
menuScreen.starterButton.mouseover(function(e){
  yes.css("cursor","pointer");
});

menuScreen.starterButton.mouseout(function(e){
  yes.css("cursor","default");
});
*/

menuScreen.startGame.click(function(e){
  countdownScreen(); //shows numeric countdown
  menuScreen.title.remove();
  menuScreen.startGame.remove();
  menuScreen.button.remove();
  //menuScreen.starterButton.remove(); //DOESN'T WORK

});
