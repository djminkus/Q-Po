/* TUTORIAL PAGE

modules
=======
1. Text to display
2. Highlighter
3. Demonstration
4. Interaction

tutorial chapters
========
Welcome to QPO! [x]
Units [x]
Turns [x]
Moving
Shooting
Bombs
*/

drawGUI();
activeScreen = "tut";
var tutStatus = -1;
var blue0, red0, turnNumber;

tutObj = function(headline, body, x, y, highx, highy, highSizeModx, highSizeMody, hideHigh, prompt){
  this.pane = c.rect(x,y,250,120).attr({"fill":"black"});
  this.head = c.text(x+125, y+30, headline).attr({"font-size":30,"font-family":"'Open Sans',sans-serif","fill":"white"});
  this.bod1 = c.text(x+125, y+55, body[0]).attr({"font-size":15,"font-family":"'Open Sans',sans-serif","fill":"white"});
  this.bod2 = c.text(x+125, y+70, body[1]).attr({"font-size":15,"font-family":"'Open Sans',sans-serif","fill":"white"});
  this.bod3 = c.text(x+125, y+85, body[2]).attr({"font-size":15,"font-family":"'Open Sans',sans-serif","fill":"white"});
  this.prom = c.text(x+125, y+105, prompt).attr({"font-size":15,"font-family":"'Open Sans',sans-serif","fill":"red"});
  this.high = c.rect(highx, highy, 70+highSizeModx, 70+highSizeMody).attr({
    "fill":"none","stroke":COLOR_DICT["orange"],"stroke-width":4});
  if (hideHigh) { this.high.hide(); }
  this.all = c.set().push(this.pane,this.head,this.bod1,this.bod2,this.bod3,this.prom,this.high);

}

var tutObjs = [
  new tutObj("Welcome!",["Hi! You must be new. We'll get", "you up to speed in no time.",""],50,50,0,0,0,0,true,
    "Press enter to continue."),
  new tutObj("Units",["This is a unit. Destroy enemy", "units to win the round.",""],150,50,65,115,0,0,false,
    "Press enter to continue."),
  new tutObj("Turns",["This is the turn timer.", "One turn takes 3 seconds.",
    "Each unit gets one move per turn."],250,50,380,180,70,70,false,
    "Press enter to continue."),
  new tutObj("Control Panel",["This is the control panel. It shows", "you your plans. Every command",
    "you give shows up here."],100,250,10,410,320,60,false,
    "Press enter to continue."),
  new tutObj("Control Panel",["When the turn timer hits 0, your", "units follow your commands. Let's",
    'try it out.'],100,250,10,410,320,60,false,
    "Press enter to continue."),
  new tutObj("Moving",["", "units follow your commands. Let's",
    'learn some commands!'],100,250,10,410,320,60,false,
    "Press enter to continue."),
]

for(i=1; i<tutObjs.length; i++){
  tutObjs[i].all.hide(); //hide all the ones except the first one
}
tutStatus=0;
controlPanel.oranges[0].hide();

transition = function(old){
  tutObjs[old].all.remove();
  tutObjs[old+1].all.show();
  tutStatus = old+1;
}

tutFuncs = {
  enter: function(){
    console.log("tutStatus is " +tutStatus);
    switch(tutStatus){
      case 0: //transition from "welcome" to "units"
        transition(0);
        /*tutObjs[0].all.remove();
        tutObjs[1].all.show();
        tutStatus=1;
        */
        blue0 = startUnit("blue",1,1,0);
        improveUnit(blue0);
        finishUnit(blue0);
        red0 = startUnit("red",1,5,0);
        improveUnit(red0);
        finishUnit(red0);
        red0.rect.toBack();
        controlPanel.oranges[0].show();
        controlPanel.icons.xs[0].hide();
        controlPanel.icons.circles[0].show();
        break;
      case 1: //transition from "units" to "turns"
        transition(1);
        var timerAnim = Raphael.animation({
          "0%" : {segment: [450, 250, 50, -90, 269]},
          "100%" : {segment: [450, 250, 50, -90, -90]}
        }, 3000).repeat("Infinity");
        timer.animate(timerAnim);
        break;
      case 2: //transition from "turns" to "control panel 1"
        transition(2);
        timer.stop();
        timer.attr({segment: [450, 250, 50, -90, 269]});
        break;
      case 3: //transition from "control panel 1" to "control panel 2"
        transition(3);
        break;
      case 4: //transition from "control panel 2" to "shoot"
        transition(4);
        break;
      default:
        console.log("You forgot a 'break', David.");
    }
  },
  ekey: function(){
    //blue0.shoot();
  },
}
