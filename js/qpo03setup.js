//BASIC SETUP
console.log("RESET " + Date());
//set up a Raphael canvas according to the game window
var c = new Raphael("yes", window.innerWidth - 10, window.innerHeight - 10);

/** Q-PO : a JS game
by @akaDavidGarrett

SHORT-TERM TODO:
  just ctrl+f "TODO"

LONG-TERM TODO:
Implement "bomb" command
Create Spawn System
Create Scoreboard
Make a server
Enable PVP
Implement Ranking System
Advertise ($$ tourney?)

	  Contents of this code: (updated May 17)
      MOVE TIMER -- A 3-second animation
      GAME CLOCK -- Yep.
      GAME BOARD (middle) -- lines 88-109
      UNIT OBJECT -- Colored squares are player units
      COMMAND CENTER (bottom) -- shows players their units
        and the commands they've submitted to them
        (advanced players may want to hide this)
    Sequence of events:
      draw board
      do countdown
      get both players' starting moves
*/

var COLOR_DICT = {
  "blue": "#0055bb",
  "red": "#bb0000",
  "orange": "#ffbb66",
  "shot color": "#00bb55"
};
var playerColor = "blue";
var blueMovesQueue = [];
var redMovesQueue = [];
var moves = ["moveUp","moveDown","moveLeft","moveRight","shoot","stay"];
var activeUnit = 0;
var shots = [];

//MOVE TIMER
var moveTimer = c.set();
var mtScaler = 15;
var RS = [1*mtScaler,3*mtScaler,4*mtScaler];
var litCircle = c.circle(200,37,RS[0]);
var midCircle = c.circle(200,37,RS[1]).attr({
  "stroke-dasharray": "- "
});
var bigCircle = c.circle(200,37,RS[2]).attr({
  "stroke-dasharray":". "});
var orangeOne = c.circle(200, 37, RS[0]).attr({
  "stroke-width": 2,
  "stroke": COLOR_DICT["orange"],
});
var turnCounter = c.text(200,38,0);
moveTimer.push(litCircle, midCircle, bigCircle, orangeOne,turnCounter);
moveTimer.transform("t 250,230");
var orangeAnim =
  Raphael.animation({
    "50%": { r: RS[2] },
    "100%": {  r: RS[0] }
  }, 3000);


//IDEA: MAKE DOTTED CIRCLES ROTATE,
//  IN OPPOSITE DIRECTIONS

/** GAME CLOCK
*/
function setUpGameClock(){
  var initialSeconds = 183;
  gameClock = c.text(450, 345, "" + initialSeconds)
    .data("value",183)
    .attr({'font-size': 30});
}

//GAME BOARD
function drawBoard(){
 var outline = c.rect(25, 75, 350, 350).attr({
    "stroke-width": 3
  });

  c.setStart();
  var hl1 = c.path("M25,125 L375,125");
  var hl2 = c.path("M25,175 L375,175");
  var hl3 = c.path("M25,225 L375,225");
  var hl4 = c.path("M25,275 L375,275");
  var hl5 = c.path("M25,325 L375,325");
  var hl6 = c.path("M25,375 L375,375");
  var horizLines = c.setFinish();
  c.setStart();
  var vl1 = c.path("M75,75 L75,425");
  var vl2 = c.path("M125,75 L125,425");
  var vl3 = c.path("M175,75 L175,425");
  var vl4 = c.path("M225,75 L225,425");
  var vl5 = c.path("M275,75 L275,425");
  var vl6 = c.path("M325,75 L325,425");
  var vertLines = c.setFinish();
}

function placeUnits(){
  blueUnits = [];
  redUnits = [];
  blueUnits[0] = new startUnit("blue",1,1,"");
  blueUnits[1] = new startUnit("blue",3,1,"");
  blueUnits[2] = new startUnit("blue",5,1,"");
  redUnits[0] = new startUnit("red",1,5,"");
  redUnits[1] = new startUnit("red",3,5,"");
  redUnits[2] = new startUnit("red",5,5,"");
  improveUnit(blueUnits[0]);
  improveUnit(blueUnits[1]);
  improveUnit(blueUnits[2]);
  improveUnit(redUnits[0]);
  improveUnit(redUnits[1]);
  improveUnit(redUnits[2]);
  finishUnit(blueUnits[0]);
  finishUnit(blueUnits[1]);
  finishUnit(blueUnits[2]);
  finishUnit(redUnits[0]);
  finishUnit(redUnits[1]);
  finishUnit(redUnits[2]);
  units = []; //all Units (red and blue);
  for (var i=0;i<blueUnits.length;i++){
    units.push(blueUnits[i]);
    units.push(redUnits[i]); //assumes blueUnits.length =
    														//        redUnits.length
  }

  blueUnits[0].activate();
}

//CONTROL PANEL -- TODO: Add icons for shoot
gens = [85,475,20,10,40]; //centers and radius
coords = [gens[0]+gens[2],gens[0]-gens[2], //x ends
          gens[1]+gens[2],gens[1]-gens[2]]; //y ends
function startControlPanel(){
  this.outline = c.rect(25, 425, 350, 100).attr({
    "stroke-width": 3
  });
  this.secLine1 = c.path("M"+ 140 + ",425 L" +
                        140 +",525");
  this.secLine2 = c.path("M"+ 260 + ",425 L" +
                        260 +",525");
  this.oranges = c.set().push(
    c.rect(28,428,110,94),
    c.rect(28+114,428,116,94),
    c.rect(28+114+120,428,110,94)
  ).attr({"stroke":COLOR_DICT["orange"],"stroke-width":4,})
  .hide();
  this.icons = {
    "circles" : [c.circle(gens[0],gens[1],gens[2])],
    "leftArrows" : [c.path("M" + coords[0] + "," + gens[1] +
                            "L" + coords[1] + "," + gens[1] +
                            "L" + gens[0] + "," + coords[2])],
    "rightArrows": [c.path("M" + coords[1] + "," + gens[1] +
                            "L" + coords[0] + "," + gens[1] +
                            "L" + gens[0] + "," + coords[3])],
    "upArrows": [c.path("M" + gens[0] + "," + coords[2] +
                            "L" + gens[0] + "," + coords[3] +
                            "L" + coords[1] + "," + gens[1])] ,
    "downArrows": [c.path("M" + gens[0] + "," + coords[3] +
                            "L" + gens[0] + "," + coords[2] +
                            "L" + coords[0] + "," + gens[1])] ,
    "rects": [c.rect(gens[0]-gens[3]/2, gens[1]-gens[4]/2,
                     gens[3],gens[4])] ,
  }
  this.actives = [];
}
function finishControlPanel(cp){
  for ( var i=1;i<3;i++ ){
    cp.icons.circles[i] = cp.icons.circles[0].clone().attr(
      {"transform":("t" +115*i + "," + 0)});
    cp.icons.rightArrows[i] = cp.icons.rightArrows[0].clone().attr(
      {"transform":("t" +115*i + "," + 0)});
    cp.icons.leftArrows[i] = cp.icons.leftArrows[0].clone().attr(
      {"transform":("t" +115*i + "," + 0)});
    cp.icons.upArrows[i] = cp.icons.upArrows[0].clone().attr(
      {"transform":("t" +115*i + "," + 0)});
    cp.icons.downArrows[i] = cp.icons.downArrows[0].clone().attr(
      {"transform":("t" +115*i + "," + 0)});
    cp.icons.rects[i] = cp.icons.rects[0].clone().attr(
      {"transform":("t" +115*i + "," + 0)});
    }

  cp.oranges[0].show();
  cp.resetIcons = function(){
    for ( var i=0;i<3;i++ ){
      cp.icons.rightArrows[i].hide();
      cp.icons.leftArrows[i].hide();
      cp.icons.upArrows[i].hide();
      cp.icons.downArrows[i].hide();
      cp.icons.rects[i].hide();
      cp.actives[i] = cp.icons.circles[i];
      cp.actives[i].show();
    }
  }
  cp.resetIcons();
}

/*
highlight the new active unit and
update the "activeUnit" var
*/
function updateAU(){
  switch(activeUnit){
    case 0:
      blueUnits[1].activate();
      blueUnits[0].deactivate();
      blueUnits[2].deactivate();
      controlPanel.oranges[0].hide();
      controlPanel.oranges[1].show();
      activeUnit++;
      break;
    case 1:
      blueUnits[2].activate();
      blueUnits[0].deactivate();
      blueUnits[1].deactivate();
      controlPanel.oranges[1].hide();
      controlPanel.oranges[2].show();
      activeUnit++;
      break;
    case 2:
      blueUnits[0].activate();
      blueUnits[1].deactivate();
      blueUnits[2].deactivate();
      controlPanel.oranges[2].hide();
      controlPanel.oranges[0].show();
      activeUnit = 0;
      break;
  }
}

var blackness = c.rect(0,0,c.width,c.height)
    .attr({"fill":"black","opacity":0})
//COUNTDOWN SCREEN
function countdownScreen(){
  blackness.attr({"opacity":.9})
  var numbers = c.text(c.width/2,c.height/2,"3")
    .attr({"font-size":72,"fill":"white"});
  setTimeout(
    function(){numbers.attr({"text":"2"})},
    1000);
  setTimeout(
    function(){numbers.attr({"text":"1"})},
    2000);
  setTimeout(
    function(){numbers.attr({"text":"Q-Po",
                             "fill":"black"})},
    3000);
  setTimeout(function(){
             blackness.animate({"opacity":0},200,"<")},
             2800);
  setTimeout(function(){numbers.remove()},4000);
  setTimeout(startGame,3000);
}
//countdownScreen(); //disabled for devving
