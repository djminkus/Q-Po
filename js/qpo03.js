console.log("RESET" + Date());
var c = new Raphael("raphContainer", containerWidth(), 600);
var debug;
function containerWidth(){
  if(debug){
    var width = 900;
  } else {
    var width = 600;
  }
  return width;
}

/** Q-PO : a JS game by @akaDavidGarrett
SHORT-TERM TODO:
  Destroy interval-based animations in-game (shots, bombs)
  Implement pause function
  Balance shot animations (red v. blue)

LONG-TERM TODO:
  See Issues/Feature Requests on Github:
    https://github.com/djminkus/QPO/issues
  Create a tutorial
  Make menus keyboard-controlled
  Make a server
  Enable PVP (Implement user login system)
  Implement Ranking System
  Implement Subscription System
  Throw $$ tourney
Contents of this code: (updated June 2)
  VAR DECLARATIONS

  UNIT CONSTRUCTORS

  GUI ELEMENTS


  INCREMENT FUNCTIONS
    updateAU() -- updates which unit is highlighted with orange
      (keyboard presses queue moves for the Active Unit)
    tick() -- makes the seconds clock tick down
    newTurn() -- starts a new turn, called every 3 seconds
    detectCollisions() -- detects collisions between game objects, called every 17 ms

  KEYDOWN HANDLER : detects and responds to keyboard input (arrows, spacebar, enter)

  SCREEN FUNCTIONS
    countdownScreen() -- Shows 3,2,1, then calls startGame()
    startGame() -- draws GUI, spawns units, and starts the game clock and collisionDetector
    endGame() -- removes the game gui elements and shows a menu
    newRound() -- called when player presses "new round" button --
      hides the end-of-game menu and calls countdownScreen() again
    goMainMenu() --

How to read this code:
  Start with the startGame() and newTurn() functions. They will reference
    the other functions in a logical order.
  To understand the first thing you see when you load the page,
    look at qpo-menuscreen.js. When a new game is started, countdownScreen()
    is called. This leads to startGame() being called, which leads to newTurn()
    being called every three seconds.
*/

qpoGame = {
  "gui" : {
    "debug" : {}
  },
  "unit" : {},
  "bomb" : {},
};

function setup(){ //set up global vars and stuff
  activeScreen = "menu"; //can be "menu", "game", "tut", or "other"
  timeScale = 1; //for debugging. Bigger means slower
  COLOR_DICT = {
    "blue": "#0055bb",
    "red": "#bb0000",
    "orange": "#ffbb66",
    "shot color": "#00bb55",
    "bomb color": "#bb00bb",
  };
  blueMovesQueue = [];
  redMovesQueue = [];
  shots = [];
  bombs = [];
  //bsplicers = [];
  moves = ["moveUp","moveDown","moveLeft","moveRight","shoot","bomb","stay"];
  gui = c.set();
  activeUnit = 0;
  newGames = 0;
  gameEnding = false;
  playerColor = "blue";
  opponentColor = "red";
  guiCoords = {
    "gameBoard" : {
      "squareSize" : 0,
      "columns" : 0,
      "rows" : 0,
      "leftWall" : 0,
      "rightWall" : 0,
      "topWall" : 0,
      "bottomWall" : 0,
      "width" : 600,
      "height" : 600
    },
    "debug" : {
      "width":300,
      "height":600
    }
  };
  bombSize = 100;
  debug = false;
}

setup();


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
  return this;
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
    unit.phys.stop();
    unit.phys.animate({"opacity":0},2000,function(){unit.phys.hide()});

    switch(unit.team){
      case opponentColor:
        opponentDead++;
        break;
      case playerColor:
        playerDead++;
        var number = unit.num;
        controlPanel.actives[number].hide();
        controlPanel.actives[number] = controlPanel.icons.xs[number];
        gui.push(controlPanel.actives[number]);
        controlPanel.actives[number].show();
        updateAU(teamSize);
        break;
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
    bomb = new startBomb(unit);
    improveBomb(bomb);
    finishBomb(bomb);
    bomb.next();
  }
  unit.shoot = function(){
    unit.status = "shoot";
    var shot, anim;
    switch(unit.team){
      case "blue":
        shot = c.rect(25 + 50*unit.x + 22,
                      127 + 50*unit.y, 6,2);
        anim = Raphael.animation({"height":25, "y": shot.attr('y') + 0}, 500*timeScale, function(){
          shot.animate({"y": shot.attr('y') + 125*7}, 3000*7);
        });
        break;
      case "red":
        shot = c.rect(25 + 50*unit.x + 22,
                      72 + 50*unit.y,6,2);
        anim = Raphael.animation({"height":25, "y": shot.attr('y') - 25}, 500*timeScale, function(){
          shot.animate({"y": shot.attr('y') - 125*7}, 3000*7);
        });
        break;
    }
    shot.attr({"fill":COLOR_DICT["shot color"],
               "opacity":.5,
               "stroke":COLOR_DICT["shot color"]});
    shot.data("team",unit.team);
    shot.animate(anim);
    gui.push(shot);
    shots.push(shot);
  }
  unit.stay = function(){
    unit.status = "stay";
  }
}

function findSlot(array){
  var slot = 0
  while(slot < array.length){
    if(!array[slot]){
      break;
    }
    slot += 1;
  }
  return slot;
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

  //put this in the "bombs" array:
  var ind = findSlot(bombs);
  this.index = ind;
  bombs[this.index] = this;

  return this;
}
function improveBomb(bomb){
  bomb.phys.attr({"fill":COLOR_DICT["bomb color"],
             "opacity":.5,
             "stroke":COLOR_DICT["bomb color"]});
  bomb.explode = function(){
    bomb.exploded = true;
    bomb.timer = -1;
    var cx = bomb.phys.getBBox().x;
    var cy = bomb.phys.getBBox().y;
    bomb.phys.stop();

    var anim = Raphael.animation({
      "16.6%": {
        "y": cy - (bombSize/2 - 7),
        "x": cx - (bombSize/2 - 7),
        "width": bombSize,
        "height": bombSize
      },
      "100%":{
        "y":cy+7,
        "x":cx+7,
        "width":0,
        "height":0
      }
    }, 3000*timeScale, function(){
      bombs[bomb.index] = false;
    });
    bomb.phys.animate(anim);
  }
}
function finishBomb(bomb){
  bomb.next = function(){
    if (bomb.timer == 0){
      bomb.explode();
    } else if (bomb.timer > 0 ){
      var bombAnim;
      switch(bomb.team){
        case "blue":
          bombAnim = Raphael.animation({"y":bomb.phys.attr('y') + 50}, 3000*timeScale, function(){bomb.next()} );
          bomb.phys.animate(bombAnim);
          break;
        case "red":
          bombAnim = Raphael.animation({"y":bomb.phys.attr('y') - 50}, 3000*timeScale, function(){bomb.next()} );
          bomb.phys.animate(bombAnim);
          break;
      }
    }
    bomb.timer = bomb.timer - 1;
  }
}

//GUI ELEMENTS
function setUpGameClock(){
  var initialSeconds = 180;
  gameClock = c.text(450, 345, "" + initialSeconds)
    .data("value",180)
    .attr({'font-size': 30});
  gui.push(gameClock);
}
function drawBoard(cols, rows){
  var outline = c.rect(25, 75, 350, 350).attr({
    "stroke-width": 3
  });
  gui.push(outline);
  guiCoords.gameBoard.columns = cols;
  guiCoords.gameBoard.rows = rows;

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
function placeUnits(difficulty){
  blueUnits = [];
  redUnits = [];
  switch(difficulty){
    case "hard":
      blueUnits[2] = new startUnit("blue",5,1,2);
      improveUnit(blueUnits[2]);
      finishUnit(blueUnits[2]);
      redUnits[2] = new startUnit("red",5,5,"");
      improveUnit(redUnits[2]);
      finishUnit(redUnits[2]);
    case "medium":
      blueUnits[1] = new startUnit("blue",1,1,1);
      improveUnit(blueUnits[1]);
      finishUnit(blueUnits[1]);
      redUnits[1] = new startUnit("red",1,5,"");
      improveUnit(redUnits[1]);
      finishUnit(redUnits[1]);
    case "beginner":
      blueUnits[0] = new startUnit("blue",3,1,0);
      improveUnit(blueUnits[0]);
      finishUnit(blueUnits[0]);
      redUnits[0] = new startUnit("red",3,5,"");
      improveUnit(redUnits[0]);
      finishUnit(redUnits[0]);
      break;
    default:
      break;
  }

  units = []; //all Units (red and blue);
  for (var i=0;i<blueUnits.length;i++){
    units.push(blueUnits[i]);
    units.push(redUnits[i]); //assumes blueUnits.length =
    														//        redUnits.length
  //evens are blue, odds are red, low numbers to the left
  }

  blueUnits[0].activate();
  controlPanel.resetIcons();
}
function placeUnitsTut(){
  blueUnits = [];
  redUnits = [];
  blueUnits[0] = new startUnit("blue",3,1,0);
  redUnits[0] = new startUnit("red",3,5,"");
  improveUnit(blueUnits[0]);
  improveUnit(redUnits[0]);
  finishUnit(blueUnits[0]);
  finishUnit(redUnits[0]);
  units = []; //all Units (red and blue);
  for (var i=0;i<blueUnits.length;i++){
    units.push(blueUnits[i]);
    units.push(redUnits[i]); //assumes blueUnits.length =
                                //        redUnits.length
  //evens are blue, odds are red, low numbers to the left
  }

  blueUnits[0].activate();
  controlPanel.resetIcons();
}
gens = [85+115, 475, 20, 10, 40]; //centers and radius -- for controlPanel
coords = [gens[0]+gens[2], gens[0]-gens[2], //x ends -- for controlPanel
          gens[1]+gens[2], gens[1]-gens[2]]; //y ends --for controlPanel
          //0 is left , 1 is right, 2 is up, 3 is down
function startControlPanel(){
  this.outline = c.rect(25, 425, 350, 100).attr({
    "stroke-width": 3
  });
  this.secLine1 = c.path("M"+ 140 + ",425 L" +
                        140 +",525");
  this.secLine2 = c.path("M"+ 260 + ",425 L" +
                        260 +",525");
  this.oranges = c.set().push(
    c.rect(28+114, 428, 116, 94),
    c.rect(28, 428, 110, 94),
    c.rect(28+114+120, 428, 110, 94)
  ).attr({"stroke":COLOR_DICT["orange"],"stroke-width":4,}).hide();
  this.icons = {
    "circles" : [c.circle(gens[0],gens[1],gens[2]*1/2)],
    "leftArrows" : [c.path("M" + coords[0] + "," + gens[1] +
                            "L" + coords[1] + "," + gens[1] +
                            "L" + gens[0] + "," + coords[2] +
                            "L" + coords[1] + "," + gens[1] +
                            "L" + gens[0] + "," + coords[3])],
    "rightArrows": [c.path("M" + coords[1] + "," + gens[1] +
                            "L" + coords[0] + "," + gens[1] +
                            "L" + gens[0] + "," + coords[3] +
                            "L" + coords[0] + "," + gens[1] +
                            "L" + gens[0] + "," + coords[2])],
    "upArrows": [c.path("M" + gens[0] + "," + coords[2] +
                            "L" + gens[0] + "," + coords[3] +
                            "L" + coords[1] + "," + gens[1] +
                            "L" + gens[0] + "," + coords[3] +
                            "L" + coords[0] + "," + gens[1])] ,
    "downArrows": [c.path("M" + gens[0] + "," + coords[3] +
                            "L" + gens[0] + "," + coords[2] +
                            "L" + coords[0] + "," + gens[1] +
                            "L" + gens[0] + "," + coords[2] +
                            "L" + coords[1] + "," + gens[1])] ,
    "rects": [c.rect(gens[0]-gens[3]/2*2/3, gens[1]-gens[4]/2*2/3,
                     gens[3]*2/3,gens[4]*2/3).attr({"fill":COLOR_DICT["shot color"],
                                            "stroke":COLOR_DICT["shot color"],
                                            "opacity":.6})] ,
    "xs" : [c.path("M" + (gens[0] - 15) + "," + (gens[1] - 15) +
                    "L" + gens[0] + "," + gens[1] +
                    "L" + (gens[0] + 15) + "," + (gens[1] - 15) +
                    "L" + gens[0] + "," + gens[1] +
                    "L" + (gens[0] - 15) + "," + (gens[1] + 15) +
                    "L" + gens[0] + "," + gens[1] +
                    "L" + (gens[0] + 15) + "," + (gens[1] + 15))
              .attr({"stroke":"red","stroke-width":2})] ,
    "bombs": [c.rect(gens[0]-gens[3], gens[1]-gens[3],
                     2*gens[3],2*gens[3]).attr({"fill":COLOR_DICT["bomb color"],
                                            "stroke":COLOR_DICT["bomb color"],
                                            "opacity":.6})] ,
  }
  this.actives = [];
  this.all = c.set();
}
function finishControlPanel(cp){
  for ( var i=1;i<3;i++ ){
    cp.icons.circles[i] = cp.icons.circles[0].clone().attr(
      {"transform":("t" +115*Math.pow(-1,i) + "," + 0)});
    cp.icons.rightArrows[i] = cp.icons.rightArrows[0].clone().attr(
      {"transform":("t" +115*Math.pow(-1,i) + "," + 0)});
    cp.icons.leftArrows[i] = cp.icons.leftArrows[0].clone().attr(
      {"transform":("t" +115*Math.pow(-1,i) + "," + 0)});
    cp.icons.upArrows[i] = cp.icons.upArrows[0].clone().attr(
      {"transform":("t" +115*Math.pow(-1,i) + "," + 0)});
    cp.icons.downArrows[i] = cp.icons.downArrows[0].clone().attr(
      {"transform":("t" +115*Math.pow(-1,i) + "," + 0)});
    cp.icons.rects[i] = cp.icons.rects[0].clone().attr(
      {"transform":("t" +115*Math.pow(-1,i) + "," + 0)});
    cp.icons.xs[i] = cp.icons.xs[0].clone().attr(
      {"transform":("t" +115*Math.pow(-1,i) + "," + 0)});
    cp.icons.bombs[i] = cp.icons.bombs[0].clone().attr(
      {"transform":("t" +115*Math.pow(-1,i) + "," + 0)});
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
      cp.icons.circles[i].hide();

      try {
        if (blueUnits[i].alive){
          cp.icons.xs[i].hide();
          cp.actives[i] = cp.icons.circles[i];
          gui.push(controlPanel.actives[i]);
        } else {
          cp.actives[i]=cp.icons.xs[i];
          gui.push(controlPanel.actives[i]);
        }
      }
      catch(e){ //if blueUnits doesn't exist... show xs.
        cp.actives[i] = cp.icons.xs[i];
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
function turnTimer(){
  //creates a global var "timer" that is a pie/clock-like thingy that
  //  will start at full every three seconds, and changes color as it shrinks
  c.customAttributes.segment = function (x, y, r, a1, a2) {
    var flag = (a2 - a1) > 180,
    color = (a2 - a1 + 120) / (360*5)  ;
    a1 = (a1 % 360) * Math.PI / 180;
    a2 = (a2 % 360) * Math.PI / 180;
    return {
      path: [["M", x, y], ["l", r * Math.cos(a1), r * Math.sin(a1)], ["A", r, r, 0, +flag, 1, x + r * Math.cos(a2), y + r * Math.sin(a2)], ["z"]],
      fill: "hsb(" + color + ", .75, .8)"
    };
  };
  timer = c.path().attr({segment: [450, 250, 50, -90, 269],"stroke":"none"});
  gui.push(timer);
}
function debugPanel(){
  this.border = c.rect(guiCoords.gameBoard.width, 0, guiCoords.debug.width, guiCoords.debug.height)
    .attr({"stroke-width":2,"stroke":"blue"});
  this.title = c.text(900 - guiCoords.debug.width/2 , 30, "debug")
    .attr({"font-family":"'Open Sans',sans-serif","font-size":30});
  this.line1 = c.text(900 - guiCoords.debug.width/2, 70, "line1")
    .attr({"font-family":"'Open Sans',sans-serif","font-size":15});
  this.line2 = c.text(900 - guiCoords.debug.width/2, 100, "line2")
    .attr({"font-family":"'Open Sans',sans-serif","font-size":15});
  this.line3 = c.text(900 - guiCoords.debug.width/2, 130, "line3")
    .attr({"font-family":"'Open Sans',sans-serif","font-size":15});
  this.set = c.set().push(this.border,this.title,this.line1,this.line2,this.line3);
  gui.push(this.set);
  return this;
}
function drawGUI(){
  if (debug){
    qpoGame.gui.debug = new debugPanel();
  }
  turnTimer();
  setUpGameClock();
  drawBoard(7,7); // create the board
  controlPanel = new startControlPanel();
  finishControlPanel(controlPanel);
}

//INCREMENT FUNCTIONS (no new Raph elements created)
function updateAU(ts){
  /*
  highlight the new active unit,
  highlight the new part of the control panel,
  update the "activeUnit" var

  if 1v1, just keep current unit active.
  if 2v2, check if other unit is alive, and switch to it if so.
  if 3v3, check if next unit it alive, and switch to it if so.
  */
  switch(ts){
    case 1:
      break;
    case 2:
      switch(activeUnit){
          case 0:
            blueUnits[1].activate();
            blueUnits[0].deactivate();
            controlPanel.oranges[0].hide();
            controlPanel.oranges[1].show();
            activeUnit++;
            if (blueUnits[1].alive){
              break;
            }
          case 1:
            blueUnits[0].activate();
            blueUnits[1].deactivate();
            controlPanel.oranges[1].hide();
            controlPanel.oranges[0].show();
            activeUnit = 0;
            if (blueUnits[0].alive){
              break;
            }
          default:
            "unexpected switch condition";
            break;
        }
      break;
    case 3:
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
          if (blueUnits[2].alive){
            blueUnits[2].activate();
            blueUnits[1].deactivate();
            controlPanel.oranges[1].hide();
            controlPanel.oranges[2].show();
            activeUnit = 0;
          }
          break;
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
      break;
    default:
      console.log("unexpected switch condition");
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

  //update debug:
  if (debug){
    qpoGame.gui.debug.line1.attr({"text": "bombs: " + bombs });
  }

}
function newTurn(ts){ //pass in teamSize
  /** NEWTURN FUNCTION
  called every time the game
  clock is divisible by 3
   */
  turnNumber++;
  //execute all moves and reset control panel:
  for (var i=0; i<teamSize; i++){
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

  controlPanel.resetIcons();
  timer.attr({segment: [450, 250, 50, -90, 269]});
  timer.animate({segment: [450, 250, 50, -90, -90]}, 3000);
  blueMovesQueue = [];
}
function detectCollisions(ts){
  /* COLLISION DETECTION, a function
  to be called every 17 ms */
  var splicers = []; //used for destroying references to shots once they're gone
  //iterate over shots --> units and bombs
  //iterate over bombs --> bombs and units
  //Next, iterate over units --> units, and maybe shots --> shots
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
        if(bombs[j]){
          //   When a shot hits an unexploded bomb,
          // explode the bomb and get rid of the shot
          var bBox = bombs[j].phys.getBBox();
          var nBOB = bBox.y;
          var wBOB = bBox.x;
          var sBOB = bBox.y + bBox.height;
          var eBOB = bBox.x + bBox.width;

          if( (( nBOB < nBOS && nBOS < sBOB ) || //vertical overlap
                ( nBOB < sBOS && sBOS < sBOB )) &&
                (( wBOB < wBOS && wBOS < eBOB ) || //horizontal overlap
                ( wBOB < eBOS && eBOS < eBOB )) &&
                !(shots[i].data("hidden")) &&
                !(bombs[j].exploded)) {
            //console.log("bomb " + j + " hit shot " +i);
            shots[i].hide(); //make the shot disappear
            bombs[j].explode();
            shots[i].data("hidden",true);
            splicers.push(i);
          }
        }
      } //end iterating over bombs within shots
    }
  } //end iterating over shots

  if (bombs.length > 0){ //iterate over bombs (after checking if "bombs" exists)
    for (var i=0; i<bombs.length; i++) { //iterate over bombs
      if (bombs[i]){ //check if a bomb exists at index i
        var sBOB = bombs[i].phys.getBBox().y2;
        var nBOB = bombs[i].phys.getBBox().y;
        var eBOB = bombs[i].phys.getBBox().x2;
        var wBOB = bombs[i].phys.getBBox().x;
        //if an unexploded bomb hits a wall, explode it:
        if ( !(bombs[i].exploded) && (sBOB>425 || nBOB<75)){
          bombs[i].explode();
          //console.log("bomb " + i +" hit a wall");
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
            //console.log("bomb " + i + " hit unit " +j);
            if ( !(bombs[i].exploded)){
              bombs[i].explode();
            }
          }
        }//end iterating over units within bombs
        for (var j=0; j<bombs.length; j++) { //iterate over bombs within bombs
          if(bombs[j]){
            // When a bomb hits an unexploded bomb,
            // explode the bomb and get rid of the shot
            var nBOB2 = bombs[j].phys.getBBox().y;
            var wBOB2 = bombs[j].phys.getBBox().x;
            var sBOB2 = bombs[j].phys.getBBox().y + bombs[j].phys.getBBox().height;
            var eBOB2 = bombs[j].phys.getBBox().x + bombs[j].phys.getBBox().width;

            if( !(i==j) && //make sure we're really looking at 2 bombs.
                  (( nBOB2 <= nBOB && nBOB <= sBOB2 ) || //vertical overlap
                  ( nBOB2 <= sBOB && sBOB <= sBOB2 )) &&
                  (( wBOB2 <= wBOB && wBOB <= eBOB2 ) || //horizontal overlap
                  ( wBOB2 <= eBOB && eBOB <= eBOB2 )) &&
                  (!(bombs[i].exploded) || // make sure at least one is not-exploded
                  !(bombs[j].exploded))) {
              //explode any un-exploded ones:
              //console.log("bomb " + i + "hit bomb " + j);
              if (!(bombs[i].exploded)) {bombs[i].explode()}
              if (!(bombs[j].exploded)) {bombs[j].explode()}
            }

          } //end chekcing if bomb at index j exists
        } //end iterating over bombs within bombs
      } //end checking of bomb at index i exists
    }//end iterating over bombs
  } //end iterating over bombs after checking if bombs exists

  // Splice shots out of the shots array, one by one.
  while (splicers.length > 0) {
    shots.splice(splicers[0],1);
    splicers.splice(0,1);
    for (var i=0;i<splicers.length;i++){
      splicers[i] -= 1;
    }
  }

  if ((opponentDead==ts || playerDead==ts) && gameEnding == false){
    var gameResult;
    if(opponentDead==playerDead){
      gameResult = "tie";
    } else if (opponentDead == ts) {
      gameResult = "win";
    } else {
      gameResult = "lose";
    }
    gameEnding = true;
    mainMenu.blackness.animate({"opacity": .9},2000);
    gui.toBack();
    setTimeout(function(){
      endGame(gameResult);
    },2000);
  }
}

//LISTEN FOR INPUT
$(window).keydown(function(event){
  switch (activeScreen){
    case "menu":
      switch(event.keyCode){
        case 13: //enter
          event.preventDefault();
          //TODO: make it execute the highlighted button's onClick function
          break;
        default:
          //console.log("#EasterEgg");
      }
      break;
    case "game":
      switch (event.keyCode){
        case 81: //q
          event.preventDefault();
          blueMovesQueue[activeUnit] = "bomb";
          controlPanel.actives[activeUnit].hide();
          controlPanel.actives[activeUnit] =
            controlPanel.icons.bombs[activeUnit];
          gui.push(controlPanel.actives[activeUnit]);
          controlPanel.actives[activeUnit].show();
          updateAU(teamSize);
          break;
        case 69: //e
          event.preventDefault();
          blueMovesQueue[activeUnit] ="shoot";
          controlPanel.actives[activeUnit].hide();
          controlPanel.actives[activeUnit] =
            controlPanel.icons.rects[activeUnit];
          gui.push(controlPanel.actives[activeUnit]);
          controlPanel.actives[activeUnit].show();
          updateAU(teamSize);
          break;
        case 65: //a
          event.preventDefault();
          blueMovesQueue[activeUnit]="moveLeft";
          controlPanel.actives[activeUnit].hide();
          controlPanel.actives[activeUnit] =
            controlPanel.icons.leftArrows[activeUnit];
          gui.push(controlPanel.actives[activeUnit]);
          controlPanel.actives[activeUnit].show();
          updateAU(teamSize);
          break;
        case 87: //w
          event.preventDefault();
          blueMovesQueue[activeUnit] = "moveUp";
          controlPanel.actives[activeUnit].hide();
          controlPanel.actives[activeUnit] =
            controlPanel.icons.upArrows[activeUnit];
          controlPanel.actives[activeUnit].show();
          updateAU(teamSize);
          break;
        case 68: //d
          event.preventDefault();
          blueMovesQueue[activeUnit] ="moveRight";
          controlPanel.actives[activeUnit].hide();
          controlPanel.actives[activeUnit] =
            controlPanel.icons.rightArrows[activeUnit];
          controlPanel.actives[activeUnit].show();
          updateAU(teamSize);
          break;
        case 83: //"s" key
          event.preventDefault();
          blueMovesQueue[activeUnit] = "moveDown" ;
          controlPanel.actives[activeUnit].hide();
          controlPanel.actives[activeUnit] =
            controlPanel.icons.downArrows[activeUnit];
          controlPanel.actives[activeUnit].show();
          updateAU(teamSize);
          break;
        case 88: //"x" key
          blueMovesQueue[activeUnit] = "stay";
          controlPanel.actives[activeUnit].hide();
          controlPanel.actives[activeUnit] =
            controlPanel.icons.circles[activeUnit];
          controlPanel.actives[activeUnit].show();
          updateAU(teamSize);
          break;
        case 27: //escape key
          gui.pause();

        default: //anything else
          ;
      }
      break;
    case "tut":
      switch(event.keyCode){
        case 13: //enter
          tutFuncs["enter"]();
          break;
        case 69: //"e"
          tutFuncs["ekey"]();
          break;
        default:
          //console.log("you pressed key " + event.keyCode);
          break;
      }
      break;
    case "other":
      break;
      default:
      ;
  }
});

//"SCREEN" FUNCTIONS
function countdownScreen(difficulty){
  var numbers = c.text(c.width/2,c.height/2,"3")
    .attr({"font-size":72,"fill":"white"});
  setTimeout(
    function(){numbers.attr({"text":"2"})},
    1000);
  setTimeout(
    function(){numbers.attr({"text":"1"})},
    2000);
  setTimeout(function(){
             mainMenu.blackness.animate({"opacity":0},200,"<")},
             2800);
  setTimeout(function(){numbers.remove()},3000);
  setTimeout(function(){startGame(difficulty);},3000);
  activeScreen="other";
}
function startGame(difficulty){
  /*
  if (newGames > 0){
    moveTimer.redo();
  } */
  teamSize = (function(diff){
    switch(diff){
      case "hard":
        return 3;
        break;
      case "medium":
        return 2;
        break;
      case "beginner":
        return 1;
        break;
      default:
        break;
    }
  })(difficulty);

  turnNumber = 0;
  opponentDead = 0;
  playerDead = 0;

  drawGUI();
  placeUnits(difficulty); // puts the units on the board
  activeUnit = 0;
  setTimeout(function(){clockUpdater = setInterval(tick,1000*timeScale);},2000*timeScale);
  gameEnding = false;
  collisionDetector = setInterval(function(){detectCollisions(teamSize)},17);
  timer.animate({segment: [450, 250, 50, -90, -90]}, 3000*timeScale);
  activeScreen = "game";
  console.log('NEW GAME');
}
function startHowTo(){
  /*

  opponentDead = 0;
  playerDead = 0;
  drawGUI();
  placeUnitsTut();
  */
  turnNumber = 0;

  howToPage = {};
  howToPage.chapter = 0;

  //CHAPTER 0 STUFF:
  howToPage.unit = c.rect(300, 125,
      50,50).attr({"fill":COLOR_DICT["blue"],"opacity":.7});

  var demoShot = function(){
    howToPage.shot = c.rect(300 + 22, 125 + 50, 6, 2)
      .attr({"fill":COLOR_DICT["shot color"], "opacity":.5,
        "stroke":COLOR_DICT["shot color"]});
    anim = Raphael.animation({
      "0%" : {"height":2, "y": 175},
      "33.3%" : {"height": 25},
      "66.6%" : {"y": 200},
      "100%" : {"y": 225, "height":0}
      }, 1500*timeScale
    ); //end anim
    howToPage.shot.animate(anim);
  };
  demoShot();
  howToPage.shooter = setInterval(demoShot, 10000); //end setInterval

  var demoBomb = function(){
    howToPage.bomb = c.rect(300 + 18, 125 + 50 + 18, 14, 14)
      .attr({"fill":COLOR_DICT["bomb color"], "opacity":.5,
        "stroke":COLOR_DICT["bomb color"]});
    anim = Raphael.animation({
      "0%" : {"y": 193},
      "66.6%" : {"y": 210},
      "100%" : {"y": 218, "height":0}
      }, 1500*timeScale
    ); //end anim
    howToPage.bomb.animate(anim);
  };
  howToPage.bomberT = setTimeout(function(){
    demoBomb();
    howToPage.bomber = setInterval(demoBomb, 10000);
  }, 2000);

  setTimeout(function(){
    howToPage.unit.animate({"x":250},3000);
    howToPage.lefter = setInterval(function(){howToPage.unit.animate({"x":250},3000);},10000);
  }, 4000);

  setTimeout(function(){
    howToPage.unit.animate({"x":300},3000);
    howToPage.righter = setInterval(function(){howToPage.unit.animate({"x":300},3000);},10000);
  }, 7000);

  howToPage.unitText = c.set().push(
      c.text(300,320-25,"This is a unit. Units move once per turn. ").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(300,350-25,"Win the round by destroying enemy units.").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(300,380-25,"").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
  );

  howToPage.chapter0 = c.set().push( howToPage.unitText, howToPage.unit, howToPage.shot, howToPage.bomb);

  //CHAPTER 1 STUFF:
  howToPage.keys = c.set().push(
    c.rect(40, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(100, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(160, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(50, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(110, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(170, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.text(65, 65, "Q").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(125, 65, "W").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(185, 65, "E").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(75, 125, "A").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(135, 125, "S").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(195, 125, "D").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
  );
  howToPage.labels = c.set().push(

    c.path("M50,30 L-20,-20").attr({"stroke":"white","stroke-width":2}),
    c.path("M125,30 L125,-10").attr({"stroke":"white","stroke-width":2}),
    c.path("M190,30 L240,-10").attr({"stroke":"white","stroke-width":2}),
    c.path("M40,150 L-20,200").attr({"stroke":"white","stroke-width":2}),
    c.path("M130,160 L130,200").attr({"stroke":"white","stroke-width":2}),
    c.path("M200,160 L240,200").attr({"stroke":"white","stroke-width":2}),

    c.text(55 - 3*30, 35 - 3*30 + 20, "Bomb").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(125, 65 - 3*30, "Move Up").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(185 + 3*30, 65 - 3*30, "Shoot").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(65 - 3*30, 155 + 3*30 - 20, "Move Left").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(135, 125 + 3*30, "Move Down").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(195 + 3*30, 125 + 3*30, "Move Right").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
  );

  howToPage.keys.transform("t170,170");
  howToPage.labels.transform("t170,170");

  howToPage.chapter1 = c.set().push(howToPage.keys, howToPage.labels).hide();

  //CHAPTER 2 STUFF:
  howToPage.turnText = c.set().push(
    c.text(300,320-25,"This is the turn timer. It counts down").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(300,350-25,"once every three seconds or so. Every time it").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(300,380-25,"reaches 0, your units execute your moves.").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
  );
  howToPage.chapter2 = c.set().push( howToPage.turnText ).hide();

  howToPage.tryText = c.set().push(
    c.text(300,320-75,"Now it's time to play your first game.").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(300,350-75,"It's you against the computer.").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(300,380-75,"Good luck!").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
  );
  howToPage.chapter3 = c.set().push(howToPage.tryText).hide();

  howToPage.next = c.set().push(
    c.rect(530,260,50,80).attr({"fill":"black"}),
    c.path("M550,290 L560,300 550,310")
  ).attr({"stroke-width":2,"stroke":"white"}).click(function(e){

    switch(howToPage.chapter){
      case 0:
        howToPage.circles[0].attr({"stroke":"white","fill":"none"});
        howToPage.circles[1].attr({"stroke":"white","fill":COLOR_DICT["shot color"]});

        clearInterval(howToPage.shooter);
        clearTimeout(howToPage.bomberT);
        clearInterval(howToPage.bomber);
        clearInterval(howToPage.lefter);
        clearInterval(howToPage.righter);
        howToPage.title.attr({"text":"Controls"});
        howToPage.chapter0.hide();
        howToPage.chapter1.show();
        break;
      case 1:
        howToPage.circles[1].attr({"stroke":"white","fill":"none"});
        howToPage.circles[2].attr({"stroke":"white","fill":COLOR_DICT["shot color"]});

        howToPage.title.attr({"text":"Turns"});
        howToPage.keys.hide();
        howToPage.labels.hide();
        turnTimer();
        timer.attr({"transform":"t-150,-75"});
        timer.animate({segment: [450, 250, 50, -90, -90]}, 3000);
        timerInterval = setInterval(function(){
          timer.attr({segment: [450, 250, 50, -90, 269]});
          timer.animate({segment: [450, 250, 50, -90, -90]}, 3000);
          blueMovesQueue = [];
        },3000);
        howToPage.chapter2.show();

        break;
      case 2:
        howToPage.circles[2].attr({"stroke":"white","fill":"none"});
        howToPage.circles[3].attr({"stroke":"white","fill":COLOR_DICT["shot color"]});

        //howToPage.title.attr({"text":"Try it out"});
        howToPage.title.hide();
        howToPage.chapter2.hide();
        timer.hide();
        clearInterval(timerInterval);
        howToPage.chapter3.show();

        break;
      case 3:
        howToPage.all.remove();
        diffic = "beginner";
        countdownScreen(diffic);
        break;
      default:
        ;
    }
    howToPage.chapter++;

  });

  howToPage.title = c.text(300,50,"Units").attr({"fill":"white","font-size":40,"font-family":"'Open Sans',sans-serif"});
  //q = bomb, e = shoot

  howToPage.circles = c.set().push(
    c.circle(285,450,5).attr({"stroke":"white","fill":COLOR_DICT["shot color"]}),
    c.circle(300,450,5).attr({"stroke":"white"}),
    c.circle(315,450,5).attr({"stroke":"white"}),
    c.circle(330,450,5).attr({"stroke":"white"})
  );

  howToPage.backToMainButton = new button("Main Menu",300,520,function(e){
    activeScreen="menu";
    /*howToPage.keys.hide();
    howToPage.title.hide();
    howToPage.circles.hide();
    howToPage.next.hide();
    howToPage.backToMainButton.set.hide();
    */
    howToPage.all.remove();
    mainMenu.showAll();
    timer.remove();
    clearInterval(timerInterval);
  });

  howToPage.all=c.set().push(howToPage.circles, howToPage.title, howToPage.next,
    howToPage.keys, howToPage.labels, howToPage.backToMainButton.set,
    howToPage.chapter0, howToPage.chapter1, howToPage.chapter2, howToPage.chapter3);
} //end startHowTo()

function endGame(result){
  clearInterval(clockUpdater);
  clearInterval(collisionDetector);
  //console.log(gui);
  gui.stop();
  gui.remove();
  shots = [];
  bombs = [];
  var gameOverBG = c.rect(180,40,240,60).attr({"fill":"white"});
  var gameOverText = c.text(300,70,"round over")
    .attr({"font-size":50,"fill":"white"});
  switch (result){
    case "tie":
      gameOverText.attr({"text":"tie!"})
      break;
    case "lose":
      gameOverText.attr({"text":"You lost.", "fill":"red"})
      break;
    case "win":
      gameOverText.attr({"text":"You won!", "fill":COLOR_DICT["shot color"]})
      break;
    default:
      break;
  }
  //mainMenu.blackness.attr({"opacity": .9 });
  var again = new button("New Round",300,160,newRound);
  var back = new button("Main Menu",300,260,goMainMenu);
  endGameElements = c.set().push(gameOverText,gameOverBG,again.set,back.set);
  //console.log(endGameElements);
  activeScreen="menu";
}
function newRound(){
  endGameElements.remove();
  newGames++;
  return countdownScreen(diffic);
}
function goMainMenu(){
  endGameElements.remove();
  mainMenu.showAll();
  activeScreen = "menu";
  mainMenu.blackness.attr({"opacity":.9});
}
