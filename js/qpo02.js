//BASIC SETUP
console.log("RESET " + Date());
//set up a Raphael canvas according to the game window
var c = new Raphael("yes", window.innerWidth - 10, window.innerHeight - 10);
/*
var consoles = [
  c.text(200,540, "con1"),
  c.text(200,560, "con2"),
  c.text(200,580, "con3"),
  c.text(200,600, "con4"),
];
function log(index,message){
  consoles[index].attr({"text":message});
}
*/

//RESET BUTTON
/*
var resetButton = c.set();
resetSquare=c.rect(20,10,120,40).attr({"fill":"blue"})
resetText = c.text(80,30,"click to reset").attr(
  {"font-size":20,"fill":"white"});
resetButton.push(resetText);
resetSquare.click(function(){reset(e)});
*/

var reset = function(e){
  //TODO:
  /* implement a reset function here,
  put all pieces in original places,
  restart the game timer,
  and restart the move timer animation.
  */
  c.clear();
  startGame();
  //log(0,"click!");
}


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

//black one
/*
var blackOne = c.circle(200,37,8).attr({
  "stroke":"#333"

var blackAnim =
  Raphael.animation({
    "0%" : {
      r: "9"
    },
    "25%": {
      r: "19"
    },
    "50%":{
      r: "29"
    },
    "75%": {
      r: "19"
    },
    "100%": {
      r: "9"
    }
  }, 6000).repeat(Infinity)
;
});
blackOne.animate(blackAnim);
*/


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

function tick(){
  clock = gameClock.data("value");
  gameClock.data("value",clock-1);
  gameClock.attr({"text":clock-1});
  if (clock % 3 == 0){
      newTurn();
  }
  if (clock == 1) {
    endGame();
  }
}

function startGame(){
  turnNumber = 0;
  redDead = 0;
  blueDead = 0;
  setUpGameClock();
  drawBoard(); // create the board
  placeUnits(); // puts the units on the board
  controlPanel = new startControlPanel();
  finishControlPanel(controlPanel);
  clockUpdater = setInterval(tick,1000);
  collisionDetector = setInterval(detectCollisions,17);
}
startGame();

/* COLLISION DETECTION, a function
to be called every 17 ms */
function detectCollisions(){
  for (var i=0; i<shots.length; i++) { //iterate over shots
    var southBorderOfShot = shots[i].getBBox().y2;
    var northBorderOfShot = shots[i].getBBox().y;
    var eastBorderOfShot = shots[i].getBBox().x2;
    var westBorderOfShot = shots[i].getBBox().x;
    /*
    If south border of shot
    is further south
    than the south border of the board,
    the shot has collided with the wall
    */
    if (southBorderOfShot>425 || northBorderOfShot<75){
      shots[i].hide(); //make the shot disappear
      shots[i].data("hidden",true);
      shots.splice(i,1);
    }
    for (var j=0; j<units.length; j++) { //iterate over units
      /*

      IF...
      the south side of the shot
      is further south
      than the north border of the unit
      by 50 pixels or less,
      AND the east side of the shot
      is further east
      than the west border of the unit
      by 50 pixels or less,
      AND the shot is not hidden,
      AND the unit is not hidden,
      they've collided.

      When a shot and a unit collide, hide both
      the shot and the unit from the board,
      tell them they're hidden (Element.data("hidden",true))
      and remove them from their respective arrays
      */

      var northBorderOfUnit = units[j].rect.getBBox().y;
      var nsDifference = southBorderOfShot - northBorderOfUnit;
      var westBorderOfUnit = units[j].rect.getBBox().x;
      var ewDifference = eastBorderOfShot - westBorderOfUnit;
      if( 0 < nsDifference && nsDifference < 50 &&
          0 < ewDifference && ewDifference < 50 &&
          !(shots[i].data("hidden")) &&
          !(units[j].rect.data("hidden")) ){

        //1. add condition for north border of shot,
        // 2. let red units survive shooting,
        // 3. stop red units from shooting while dead

        shots[i].hide(); //make the shot disappear
        units[j].phys.hide(); //"kill" the unit
        shots[i].data("hidden",true);
        units[j].rect.data("hidden",true);
        shots.splice(i,1);
        units.splice(j,1);
        switch(units[j].team){
          case "red":
            redDead++;
            break;
          case "blue":
            blueDead++;
            break;
        }
        if (redDead==3 || blueDead ==3){
          endGame();
        }


      }
    }
  }
}

//stops the clock
// TO-DO: show a results screen
function endGame(){
  clearInterval(clockUpdater);
  clearInterval(collisionDetector);
  c.clear();
  var gameOver = c.text(250,250,"round over")
    .attr({"font-size":50});
}

//CREATE UNIT TYPE
function startUnit(color, gx, gy, num){
  this.team = color;
  this.rect = c.rect(25+50*gx, 75+50*gy,
      50,50).attr({"fill":COLOR_DICT[color],"opacity":.7});
  //this.icon = c.circle(25+50*gx+25,75+50*gy+25,7);
  this.phys = c.set();
  this.x = gx; //absolute grid position
  this.y = gy;
  this.relx = 0; //relative grid position
  this.rely = 0;
  this.num = num; //which unit is it?
  this.marker = c.text(50+50*gx,100+50*gy,num);
  this.status = "stay"; //what's it doing now?
}

function improveUnit(unit){
  unit.phys.push(unit.rect,unit.marker);
  unit.trans = function(){
    return "t" + 50*unit.relx + "," +
      50*unit.rely;
  }
}

function finishUnit(unit){
  //TODO: make the icon move with the rects
  unit.activate = function(){
    unit.rect.attr({"stroke":COLOR_DICT["orange"],
                              "stroke-width":4});
  }
  unit.deactivate = function(){
    unit.rect.attr({"stroke":"black",
                     "stroke-width":1});
  }
  unit.moveLeft = function(){
    if (unit.x > 0) {
      unit.status = "left";
      unit.x = unit.x - 1;
      unit.relx = unit.relx - 1;
      var anim = Raphael.animation({
        "transform":unit.trans()
      },3000);
      unit.phys.animate(anim);
    }
  }
  unit.moveUp = function(){
  if (unit.y > 0) {
      unit.status = "up";
      unit.y = unit.y - 1;
      unit.rely = unit.rely - 1;
      var anim = Raphael.animation({
        "transform":unit.trans()
      },3000);
      unit.phys.animate(anim);
    }
  }
  unit.moveRight = function(){
    if (unit.x < 6) {
      unit.status = "right";
      unit.x = unit.x + 1;
      unit.relx = unit.relx + 1;
      var anim = Raphael.animation({
        "transform":unit.trans()
      },3000);
      unit.phys.animate(anim);
    }
  }
  unit.moveDown = function(){
    if (unit.y < 6) {
      unit.status = "down";
      unit.y = unit.y + 1;
      unit.rely = unit.rely + 1;
      var anim = Raphael.animation({
        "transform":unit.trans()
      },3000);
      unit.phys.animate(anim);
    }
  }
  unit.bomb = function(){
    unit.status = "bomb";
  }
  unit.shoot = function(){
    unit.status = "shoot";
    var shot;
    var anim = Raphael.animation({"height":25},1000);
    switch(unit.team){
      case "blue":
        shot = c.rect(25 + 50*unit.x + 22,
                      125 + 50*unit.y,6,2);

        break;
      case "red":
        shot = c.rect(25 + 50*unit.x + 22,
                      75 + 50*unit.y,6,2);
        break;
    }

    shot.attr({"fill":COLOR_DICT["shot color"],
               "opacity":.5,
               "stroke":COLOR_DICT["shot color"]});
    shot.data("team",unit.team);
    shot.animate(anim);
    shots.push(shot);
  }
  unit.stay = function(){
    unit.status = "stay";
  }
}

/** NEWTURN FUNCTION
called every time the game
clock is divisible by 3
 */
function newTurn(){
  timeTurn = new Date().getTime(); //milliseconds
  orangeOne.animate(orangeAnim);
  turnNumber++;
  turnCounter.attr({"text":turnNumber});
  //execute all moves and reset control panel:
  for (var i=0; i<3; i++){
    //generate random moves for red
    redMovesQueue[i] = moves[Math.round(Math.random()*5)]
    //execute all moves
    switch(blueMovesQueue[i]) {
      case "moveLeft" :
        blueUnits[i].moveLeft();
        break;
      case "moveUp" :
        blueUnits[i].moveUp();
        break;
      case "moveRight" :
        blueUnits[i].moveRight();
        break;
      case "moveDown" :
        blueUnits[i].moveDown();
        break;
      case "shoot" :
        blueUnits[i].shoot();
        break;
      case "stay" :
        blueUnits[i].stay();
        break;
    }
    switch(redMovesQueue[i]) {
      case "moveLeft" :
        redUnits[i].moveLeft();
        break;
      case "moveUp" :
        redUnits[i].moveUp();
        break;
      case "moveRight" :
        redUnits[i].moveRight();
        break;
      case "moveDown" :
        redUnits[i].moveDown();
        break;
      case "shoot" :
        redUnits[i].shoot();
        break;
      case "stay" :
        redUnits[i].stay();
    }
    /* update control panel
    controlPanel.actives[i].hide();
    controlPanel.actives[i] = controlPanel.icons.circles[i];
    controlpanel.actives[i].show();
    */
  }

  //animate all shots:
  for (var i = 0; i<shots.length; i++){
    var shotAnim;
    switch(shots[i].data("team")){
      case "blue":
        shotAnim = Raphael.animation({"y":100+shots[i].attr('y')},3000);
        shots[i].y += 100;
        break;
      case "red":
        shotAnim = Raphael.animation({"y":shots[i].attr('y')-100},3000);
        shots[i].y -= 100;
        console.log("red shot anim");
        break;
    }
    shots[i].animate(shotAnim);
  }
  /*
  activeUnit = 0;
  blueUnits[0].activate();
  blueUnits[1].deactivate();
  blueUnits[2].deactivate();
  */
  controlPanel.resetIcons();
  blueMovesQueue = [];
}

//LISTEN FOR INPUT
$(window).keydown(function(event){
  switch (event.keyCode){
    case 13: //enter
    	event.preventDefault();
      blueMovesQueue[activeUnit] = "bomb";
      //updateCons(activeUnit,blueMovesQueue[activeUnit]);
      updateAU();
      break;
    case 32: //spacebar
      event.preventDefault();
      blueMovesQueue[activeUnit] ="shoot";
      controlPanel.actives[activeUnit].hide();
      controlPanel.actives[activeUnit] =
        controlPanel.icons.rects[activeUnit];
      controlPanel.actives[activeUnit].show();
      updateAU();
      break;
    case 37: //LEFT ARROW
      event.preventDefault();
      blueMovesQueue[activeUnit]="moveLeft";
      controlPanel.actives[activeUnit].hide();
      controlPanel.actives[activeUnit] =
        controlPanel.icons.leftArrows[activeUnit];
      controlPanel.actives[activeUnit].show();
      updateAU();
      break;
    case 38: //up arrow
      event.preventDefault();
      blueMovesQueue[activeUnit] = "moveUp";
      controlPanel.actives[activeUnit].hide();
      controlPanel.actives[activeUnit] =
        controlPanel.icons.upArrows[activeUnit];
      controlPanel.actives[activeUnit].show();
      updateAU();
      break;
    case 39: //right arrow
      event.preventDefault();
      blueMovesQueue[activeUnit] ="moveRight";
      controlPanel.actives[activeUnit].hide();
      controlPanel.actives[activeUnit] =
        controlPanel.icons.rightArrows[activeUnit];
      controlPanel.actives[activeUnit].show();
      updateAU();
      break;
    case 40: //down arrow
      event.preventDefault();
      blueMovesQueue[activeUnit] = "moveDown" ;
      controlPanel.actives[activeUnit].hide();
      controlPanel.actives[activeUnit] =
        controlPanel.icons.downArrows[activeUnit];
      controlPanel.actives[activeUnit].show();
      updateAU();
      break;
    case 83: //"s" key
      blueMovesQueue[activeUnit] = "stay";
      controlPanel.actives[activeUnit].hide();
      controlPanel.actives[activeUnit] =
        controlPanel.icons.circles[activeUnit];
      controlPanel.actives[activeUnit].show();
      updateAU();
      break;
    default: //anything else
      ;
  }
});
