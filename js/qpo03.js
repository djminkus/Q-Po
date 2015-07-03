console.log("RESET " + Date());
var c = new Raphael("raphContainer", 600, 600);

/* Q-PO : a JS game by @akaDavidGarrett
SHORT-TERM TODO:
  Debug bombs
LONG-TERM TODO:
  Create a tutorial
  Make menus keyboard-controlled
  Make a server
  Enable PVP
  Implement Ranking System
  Implement Subscription System
  $$ tourney
Contents of this code: (updated June 2)
  VAR DECLARATIONS
  UNIT CONSTRUCTORS
  GUI ELEMENTS
  INCREMENT FUNCTIONS
  KEYDOWN HANDLER
  SCREEN FUNCTIONS
How to read this code:
  Start with the startGame() and newTurn() functions. They will reference
    the other functions in a logical order.
  To understand the first thing you see when you load the page,
    look at qpo-menuscreen.js. When a new game is started, countdownScreen()
    is called. This leads to startGame() being called, which leads to newTurn()
    being called every three seconds.
*/

var timeScale = 1; //for debugging. Bigger means slower
var COLOR_DICT = {
  "blue": "#0055bb",
  "red": "#bb0000",
  "orange": "#ffbb66",
  "shot color": "#00bb55",
  "bomb color": "#bb00bb"
};
var blueMovesQueue = [];
var redMovesQueue = [];
var shots = [];
var bombs = [];
var bsplicers = [];
var moves = ["moveUp","moveDown","moveLeft","moveRight","shoot","bomb","stay"];
var gui = c.set();
var activeUnit = 0;
var newGames = 0;

var playerColor = "blue";

//CREATE UNIT TYPE/CLASS
function startUnit(color, gx, gy, num){
  //for now, only blue units are numbered (6-20-15)
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
  this.status = "stay"; //what's it doing now?
  this.alive = true;
}
function improveUnit(unit){
  unit.phys.push(unit.rect);
  gui.push(unit.phys);
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
  unit.kill = function(){
    unit.alive = false;
    unit.phys.hide();
    switch(unit.team){
      case "red":
        redDead++;
        break;
      case "blue":
        blueDead++;
        var number = unit.num;
        controlPanel.actives[number].hide();
        controlPanel.actives[number] = controlPanel.icons.xs[number];
        gui.push(controlPanel.actives[number]);
        controlPanel.actives[number].show();
        updateAU();
        break;
    }
    if (redDead==3 || blueDead==3){
      endGame();
    }
  }
  unit.moveLeft = function(){
    if (unit.x > 0) {
      unit.status = "left";
      unit.x = unit.x - 1;
      unit.relx = unit.relx - 1;
      var anim = Raphael.animation({
        "transform":unit.trans()
      },3000*timeScale);
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
      },3000*timeScale);
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
      },3000*timeScale);
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
      },3000*timeScale);
      unit.phys.animate(anim);
    }
  }
  unit.bomb = function(){
    unit.status = "bomb";
    var bomb;
    //var anim = Raphael.animation({"height":25},1000*timeScale);
    switch(unit.team){
      case "blue":
        bomb = c.rect(25 + 50*unit.x + 18,
                      143 + 50*unit.y,14,14);
        gui.push(bomb);
        break;
      case "red":
        bomb = c.rect(25 + 50*unit.x + 18,
                      43 + 50*unit.y,14,14);
        gui.push(bomb);
        break;
    }

    bomb.attr({"fill":COLOR_DICT["bomb color"],
               "opacity":.5,
               "stroke":COLOR_DICT["bomb color"]});
    bomb.data("team",unit.team);
    bomb.data("timer",3);
    bomb.data("exploded",false);
    //bomb.animate(anim);
    bombs.push(bomb);
  }
  unit.shoot = function(){
    unit.status = "shoot";
    var shot;
    var anim = Raphael.animation({"height":25},1000*timeScale);
    switch(unit.team){
      case "blue":
        shot = c.rect(25 + 50*unit.x + 22,
                      127 + 50*unit.y,6,2);
        gui.push(shot);
        break;
      case "red":
        shot = c.rect(25 + 50*unit.x + 22,
                      72 + 50*unit.y,6,2);
        gui.push(shot);
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


//CREATE BOMB TYPE/CLASS -- not implemented (see "explode()")
function startBomb(su){ //su = source unit
  this.team = su.team;
  this.timer = 3;
  this.exploded = false;
  switch(this.team){
    case "blue":
      this.phys = c.rect(25 + 50*su.x + 18,
                    143 + 50*su.y,14,14);
      break;
    case "red":
      this.phys = c.rect(25 + 50*su.x + 18,
                    43 + 50*su.y,14,14);
      break;
  }
  gui.push(this.phys);
}
function improveBomb(bomb){
  bomb.phys.attr({"fill":COLOR_DICT["bomb color"],
             "opacity":.5,
             "stroke":COLOR_DICT["bomb color"]});
  //bomb.phys.animate({})
  bomb.explode = function(){
    bomb.exploded = true;
    bomb.timer = -1;
    var cx = bomb.phys.getBBox().x;
    var cy = bomb.phys.getBBox().y;
    bomb.phys.stop();

    var anim = Raphael.animation({
      "16.6%": {
        "y":cy-68,
        "x":cx-68,
        "width":150,
        "height":150
      },
      "100%":{
        "y":cy+7,
        "x":cx+7,
        "width":0,
        "height":0
      }
    },3000*timeScale);
    bomb.phys.animate(anim);

    setTimeout(function(){
      bsplicers.push(index);
      console.log("bomb "+index+" splicing");
    },3000*timeScale);

  }
}
function finishBomb(bomb){
  bomb.next = function(){
    if (bomb.timer == 0){
      bomb.timer = bomb.timer - 1;
      bomb.explode();
    } else if (bomb.timer > 0 ){
      var bombAnim;
      bomb.timer = bomb.timer-1;
      switch(bomb.team){
        case "blue":
          bombAnim = Raphael.animation({"y":50+bombs[i].attr('y')},3000*timeScale);
          bombs[i].y += 50;
          bombs[i].animate(bombAnim);
          break;
        case "red":
          bombAnim = Raphael.animation({"y":bombs[i].attr('y')-50},3000*timeScale);
          bombs[i].y -= 50;
          bombs[i].animate(bombAnim);
          break;
      }
    }
  }
}

function explode(index){
  bombs[index].data("exploded",true);
  bombs[index].data("timer",-1);
  var cx = bombs[index].getBBox().x;
  var cy = bombs[index].getBBox().y;
  bombs[index].stop();

  var anim = Raphael.animation({
    "16.6%": {
      "y":cy-68,
      "x":cx-68,
      "width":150,
      "height":150
    },
    "100%":{
      "y":cy+7,
      "x":cx+7,
      "width":0,
      "height":0
    }
  },3000*timeScale);
  bombs[index].animate(anim);
  console.log("bomb "+index+" exploded");
  /*
  var anim2 = Raphael.animation({
    "y":cy+7,
    "x":cx+7,
    "width":0,
    "height":0,
  },2000*timeScale);
  setTimeout(function(){
    bombs[index].animate(anim2);
    console.log("bomb "+index+" fading");
  },500*timeScale);
  */
  setTimeout(function(){
    bsplicers.push(index);
    console.log("bomb "+index+" splicing");
  },3000*timeScale);
}

//GUI ELEMENTS
mtScaler= 15;
RS = [1*mtScaler,3*mtScaler,4*mtScaler];
//IDEA: MAKE DOTTED CIRCLES ROTATE,
//  IN OPPOSITE DIRECTIONS
function setUpGameClock(){
  var initialSeconds = 180;
  gameClock = c.text(450, 345, "" + initialSeconds)
    .data("value",180)
    .attr({'font-size': 30});
  gui.push(gameClock);
}
function drawBoard(){
  var outline = c.rect(25, 75, 350, 350).attr({
    "stroke-width": 3
  });
  gui.push(outline);

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
  gui.push(horizLines,vertLines);
}
function placeUnits(){
  blueUnits = [];
  redUnits = [];
  blueUnits[0] = new startUnit("blue",1,1,0);
  blueUnits[1] = new startUnit("blue",3,1,1);
  blueUnits[2] = new startUnit("blue",5,1,2);
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
  //evens are blue, odds are red, low numbers to the left
  }

  blueUnits[0].activate();
}
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
    "xs" : [c.path("M" + (gens[0] - 15) + "," + (gens[1] - 15) +
                    "L" + gens[0] + "," + gens[1] +
                    "L" + (gens[0] + 15) + "," + (gens[1] - 15) +
                    "L" + gens[0] + "," + gens[1] +
                    "L" + (gens[0] - 15) + "," + (gens[1] + 15) +
                    "L" + gens[0] + "," + gens[1] +
                    "L" + (gens[0] + 15) + "," + (gens[1] + 15))] ,
    "bombs": [c.rect(gens[0]-gens[3], gens[1]-gens[3],
                     2*gens[3],2*gens[3])] ,
  }
  this.actives = [];
  this.all = c.set();
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
    cp.icons.xs[i] = cp.icons.xs[0].clone().attr(
      {"transform":("t" +115*i + "," + 0)});
    cp.icons.bombs[i] = cp.icons.bombs[0].clone().attr(
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
      cp.icons.bombs[i].hide();

      if (blueUnits[i].alive){
        cp.icons.xs[i].hide();
        cp.actives[i] = cp.icons.circles[i];
        gui.push(controlPanel.actives[i]);
      }
      cp.actives[i].show();
    }
  }
  cp.resetIcons();
  cp.all.push(cp.outline, cp.secLine1, cp.secLine2, cp.oranges,
    cp.icons.circles, cp.icons.rightArrows, cp.icons.leftArrows,
    cp.icons.upArrows, cp.icons.downArrows, cp.icons.xs,
    cp.icons.rects, cp.icons.bombs, cp.actives);
  gui.push(cp.all);
}

//NON-GUI FUNCS (no new Raph elements created)
function updateAU(){
  /*
  highlight the new active unit and
  update the "activeUnit" var
  */
  switch(activeUnit){
    case 0:
      blueUnits[1].activate();
      blueUnits[0].deactivate();
      blueUnits[2].deactivate();
      controlPanel.oranges[0].hide();
      controlPanel.oranges[1].show();
      activeUnit++;
      if (blueUnits[1].alive){
        break;
      }
    case 1:
      blueUnits[2].activate();
      blueUnits[0].deactivate();
      blueUnits[1].deactivate();
      controlPanel.oranges[1].hide();
      controlPanel.oranges[2].show();
      activeUnit++;
      if (blueUnits[2].alive){
        break;
      }
    case 2:
      if (blueUnits[0].alive){
        blueUnits[0].activate();
        blueUnits[1].deactivate();
        blueUnits[2].deactivate();
        controlPanel.oranges[2].hide();
        controlPanel.oranges[0].show();
        activeUnit = 0;
      } else if (blueUnits[1].alive){
        blueUnits[1].activate();
        blueUnits[0].deactivate();
        blueUnits[2].deactivate();
        controlPanel.oranges[2].hide();
        controlPanel.oranges[1].show();
        activeUnit = 1;
      }
      break;
  }
}
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
function newTurn(){
  /** NEWTURN FUNCTION
  called every time the game
  clock is divisible by 3
   */
  moveTimer.orangeOne.animate(moveTimer.orangeAnim);
  turnNumber++;
  moveTimer.turnCounter.attr({"text":turnNumber});
  //execute all moves and reset control panel:
  for (var i=0; i<3; i++){
    //generate random moves for red
    redMovesQueue[i] = moves[Math.round(Math.random()*6)]
    //execute all moves
    if (blueUnits[i].alive){
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
        case "bomb" :
          blueUnits[i].bomb();
          break;
        case "stay" :
          blueUnits[i].stay();
          break;
      }
    }
    if (redUnits[i].alive){
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
        case "bomb" :
          redUnits[i].bomb();
        case "stay" :
          redUnits[i].stay();
      }
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
        shotAnim = Raphael.animation({"y":100+shots[i].attr('y')},3000*timeScale);
        shots[i].y += 100;
        break;
      case "red":
        shotAnim = Raphael.animation({"y":shots[i].attr('y')-100},3000*timeScale);
        shots[i].y -= 100;
        break;
    }
    shots[i].animate(shotAnim);
  }

  //animate all bombs:
  for (var i = 0; i<bombs.length; i++){
    console.log("bomb "+i+"'s timer reads " + bombs[i].data("timer"));
    if (bombs[i].data("timer") == 0){
      bombs[i].data("timer", bombs[i].data("timer")-1 ) ;
      explode(i);
    } else if (bombs[i].data("timer") > 0 ){
      var bombAnim;
      bombs[i].data("timer", bombs[i].data("timer")-1 ) ;
      switch(bombs[i].data("team")){
        case "blue":
          bombAnim = Raphael.animation({"y":50+bombs[i].attr('y')},3000*timeScale);
          bombs[i].y += 50;
          bombs[i].animate(bombAnim);
          break;
        case "red":
          bombAnim = Raphael.animation({"y":bombs[i].attr('y')-50},3000*timeScale);
          bombs[i].y -= 50;
          bombs[i].animate(bombAnim);
          break;
      }
    }
  }
  controlPanel.resetIcons();
  blueMovesQueue = [];
}
function detectCollisions(){
  /* COLLISION DETECTION, a function
  to be called every 17 ms */
  var splicers = [];
  for (var i=0; i<shots.length; i++) { //iterate over shots
    var sBOS = shots[i].getBBox().y2;
    var nBOS = shots[i].getBBox().y;
    var eBOS = shots[i].getBBox().x2;
    var wBOS = shots[i].getBBox().x;
    //check for wall hit:
    if (sBOS>425 || nBOS<75){
      shots[i].hide(); //make the shot disappear
      shots[i].data("hidden",true);
      splicers.push(i);
    }
    for (var j=0; j<units.length; j++) { //iterate over units within shots
      /*
      When a shot and a unit collide, hide both
      the shot and the unit from the board,
      tell them they're hidden (Element.data("hidden",true))
      and remove them from their respective arrays
      */

      var nBOU = units[j].rect.getBBox().y;
      var wBOU = units[j].rect.getBBox().x;
      var sBOU = nBOU + 50;
      var eBOU = wBOU + 50;

      if( (( nBOU < nBOS && nBOS < sBOU ) || //vertical overlap
          ( nBOU < sBOS && sBOS < sBOU )) &&
          (( wBOU < wBOS && wBOS < eBOU ) || //horizontal overlap
          ( wBOU < eBOS && eBOS < eBOU )) &&
          !(shots[i].data("hidden")) &&
          (units[j].alive)) {
        shots[i].hide(); //make the shot disappear
        units[j].kill();
        shots[i].data("hidden",true);
        splicers.push(i);
      }
    }//end iterating over units within shots
    if (bombs.length > 0){
      for (var j=0; j<bombs.length; j++) { //iterate over bombs within shots
        //   When a shot hits an unexploded bomb,
        // explode the bomb and get rid of the shot
        var bBox = bombs[j].getBBox();
        var nBOB = bBox.y;
        var wBOB = bBox.x;
        var sBOB = bBox.y + bBox.height;
        var eBOB = bBox.x + bBox.width;

        if( (( nBOB < nBOS && nBOS < sBOB ) || //vertical overlap
              ( nBOB < sBOS && sBOS < sBOB )) &&
              (( wBOB < wBOS && wBOS < eBOB ) || //horizontal overlap
              ( wBOB < eBOS && eBOS < eBOB )) &&
              !(shots[i].data("hidden")) &&
              !(bombs[j].data("exploded"))) {
          console.log("bomb " + j + " hit shot " +i);
          shots[i].hide(); //make the shot disappear
          explode(j);
          shots[i].data("hidden",true);
          splicers.push(i);
        }
      }
    }//end iterating over bombs within shots
  } //end iterating over shots

  if (bombs.length > 0){ //iterate over bombs
    for (var i=0; i<bombs.length; i++) {
      var sBOB = bombs[i].getBBox().y2;
      var nBOB = bombs[i].getBBox().y;
      var eBOB = bombs[i].getBBox().x2;
      var wBOB = bombs[i].getBBox().x;
      //if an unexploded bomb hits a wall, explode it:
      if ( !(bombs[i].data("exploded")) && (sBOB>425 || nBOB<75)){
        explode(i);
        console.log("bomb " + i +" hit a wall");
      }
      for (var j=0; j<units.length; j++) { //iterate over units within bombs
        /*
        When a bomb and a unit collide, kill the unit
        and check if the bomb is exploded. If the bomb
        is not exploded, explode it.
        */

        var nBOU = units[j].rect.getBBox().y;
        var wBOU = units[j].rect.getBBox().x;
        var sBOU = nBOU + 50;
        var eBOU = wBOU + 50;

        if( (( nBOU < nBOB && nBOB < sBOU ) || //vertical overlap
            ( nBOU < sBOB && sBOB < sBOU ) ||
            ( nBOB < nBOU && nBOU < sBOB ) || //vertical overlap
            ( nBOB < sBOU && sBOU < sBOB )) &&
            (( wBOU < wBOB && wBOB < eBOU ) || //horizontal overlap
            ( wBOU < eBOB && eBOB < eBOU ) ||
            ( wBOB < wBOU && wBOU < eBOB ) ||
            ( wBOB < eBOU && eBOU < eBOB )) &&
            (units[j].alive)) {
          units[j].kill();
          console.log("bomb " + i + " hit unit " +j);
          if ( !(bombs[i].data("exploded"))){
            explode(i);
          }
        }
      }//end iterating over units within bombs
      for (var j=0; j<bombs.length; j++) { //iterate over bombs within bombs
        // When a bomb hits an unexploded bomb,
        // explode the bomb and get rid of the shot
        var nBOB2 = bombs[j].getBBox().y;
        var wBOB2 = bombs[j].getBBox().x;
        var sBOB2 = bombs[j].getBBox().y + bombs[j].getBBox().height;
        var eBOB2 = bombs[j].getBBox().x + bombs[j].getBBox().width;

        if( !(i==j) && //make sure we're really looking at 2 bombs.
              (( nBOB2 <= nBOB && nBOB <= sBOB2 ) || //vertical overlap
              ( nBOB2 <= sBOB && sBOB <= sBOB2 )) &&
              (( wBOB2 <= wBOB && wBOB <= eBOB2 ) || //horizontal overlap
              ( wBOB2 <= eBOB && eBOB <= eBOB2 )) &&
              (!(bombs[i].data("exploded")) || // make sure at least one is not-exploded
              !(bombs[j].data("exploded")))) {
          //explode any un-exploded ones:
          console.log("bomb " + i + "hit bomb " + j);
          if (!(bombs[i].data("exploded"))) {explode(i)}
          if (!(bombs[j].data("exploded"))) {explode(j)}
        }
      }
    }//end iterating over bombs within bombs
  } //end iterating over bombs

  // Splice shots out of the shots array, one by one.
  while (splicers.length > 0) {
    shots.splice(splicers[0],1);
    splicers.splice(0,1);
    for (var i=0;i<splicers.length;i++){
      splicers[i] -= 1;
    }
  }

  // Let's take care of the bombs array while we're at it.
  while (bsplicers.length > 0) {
    bombs.splice(bsplicers[0],1);
    bsplicers.splice(0,1);
    for (var i=0;i<bsplicers.length;i++){
      bsplicers[i]-=1;
    }
  }
  bsplicers = [];

}



//LISTEN FOR INPUT
$(window).keydown(function(event){
  switch (event.keyCode){
    case 13: //enter
    	event.preventDefault();
      blueMovesQueue[activeUnit] = "bomb";
      controlPanel.actives[activeUnit].hide();
      controlPanel.actives[activeUnit] =
        controlPanel.icons.bombs[activeUnit];
      gui.push(controlPanel.actives[activeUnit]);
      controlPanel.actives[activeUnit].show();
      updateAU();
      break;
    case 32: //spacebar
      event.preventDefault();
      blueMovesQueue[activeUnit] ="shoot";
      controlPanel.actives[activeUnit].hide();
      controlPanel.actives[activeUnit] =
        controlPanel.icons.rects[activeUnit];
      gui.push(controlPanel.actives[activeUnit]);
      controlPanel.actives[activeUnit].show();
      updateAU();
      break;
    case 37: //LEFT ARROW
      event.preventDefault();
      blueMovesQueue[activeUnit]="moveLeft";
      controlPanel.actives[activeUnit].hide();
      controlPanel.actives[activeUnit] =
        controlPanel.icons.leftArrows[activeUnit];
      gui.push(controlPanel.actives[activeUnit]);
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

//"SCREEN" FUNCTIONS
function countdownScreen(){
  var numbers = c.text(c.width/2,c.height/2,"3")
    .attr({"font-size":72,"fill":"white"});
  setTimeout(
    function(){numbers.attr({"text":"2"})},
    1000);
  setTimeout(
    function(){numbers.attr({"text":"1"})},
    2000);
  setTimeout(function(){
             menuScreen.blackness.animate({"opacity":0},200,"<")},
             2800);
  setTimeout(function(){numbers.remove()},3000);
  setTimeout(startGame,3000);
}
function startGame(){
  /*
  if (newGames > 0){
    moveTimer.redo();
  } */
  moveTimer = {
    all : c.set(),
    litCircle : c.circle(200,37,RS[0]),
    midCircle : c.circle(200,37,RS[1]).attr({
      "stroke-dasharray": "- "
    }),
    bigCircle : c.circle(200,37,RS[2]).attr({
      "stroke-dasharray":". "}),
    orangeOne : c.circle(200, 37,RS[0]).attr({
      "stroke-width": 2,
      "stroke": COLOR_DICT["orange"],
    }),
    turnCounter : c.text(200,38,0),
    orangeAnim :
      Raphael.animation({
        "50%": { r: RS[2] },
        "100%": {  r: RS[0] }
      }, 3000*timeScale),
    finish : function(){
      this.all.push(moveTimer.litCircle, moveTimer.midCircle, moveTimer.bigCircle,
        moveTimer.orangeOne, moveTimer.turnCounter);
      this.all.transform("t250,230");
      gui.push(moveTimer.all);
    },
    redo : function(){
      this.all = c.set();
      this.litCircle = c.circle(200,37,RS[0]);
      this.midCircle = c.circle(200,37,RS[1]).attr({
        "stroke-dasharray": "- "
      });
      this.bigCircle = c.circle(200,37,RS[2]).attr({
        "stroke-dasharray":". "});
      this.orangeOne = c.circle(200, 37,RS[0]).attr({
        "stroke-width": 2,
        "stroke": COLOR_DICT["orange"],
      });
      this.turnCounter = c.text(200,38,0);
      this.orangeAnim =
        Raphael.animation({
          "50%": { r: RS[2] },
          "100%": {  r: RS[0] }
        }, 3000*timeScale);
    }
  }
  moveTimer.finish();
  moveTimer.orangeOne.animate(moveTimer.orangeAnim);
  turnNumber = 0;
  redDead = 0;
  blueDead = 0;
  setUpGameClock();
  drawBoard(); // create the board
  placeUnits(); // puts the units on the board
  activeUnit = 0;
  controlPanel = new startControlPanel();
  finishControlPanel(controlPanel);
  setTimeout(function(){clockUpdater = setInterval(tick,1000*timeScale);},2000*timeScale);
  collisionDetector = setInterval(detectCollisions,17);
  console.log('NEW GAME')
}
function endGame(){
  clearInterval(clockUpdater);
  clearInterval(collisionDetector);
  gui.remove();
  shots = [];
  bombs = [];
  var gameOver = c.text(300,70,"round over")
    .attr({"font-size":50,"fill":"white"});
  if (blueDead == redDead) {
    gameOver.attr({"text":"tie!"})
  } else if (blueDead > redDead) {
    gameOver.attr({"text":"You lost!", "fill":"red"})
  } else {
    gameOver.attr({"text":"You won!", "fill":"green"})
  }
  menuScreen.blackness.attr({"opacity": .9 });
  var again = new button("New Round",300,160,newRound);
  var back = new button("Main Menu",300,260,goMainMenu);
  endGameElements = c.set().push(gameOver,again.set,back.set)
}
function newRound(){
  endGameElements.remove();
  newGames++;
  return countdownScreen();
}
function goMainMenu(){
  endGameElements.remove();
}
