
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
