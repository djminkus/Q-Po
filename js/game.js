console.log("RESET " + Date());
var c = new Raphael("raphContainer", containerWidth(), 600); //create the Raphael canvas
var debug; //debug mode on? Set to true or false in "setup()"
function containerWidth(){ //generate width of Raphael canvas based on debug status
  if(debug){
    var width = 900;
  } else {
    var width = 600;
  }
  return width;
}

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

/** Q-PO : a JS game by @akaDavidGarrett

How to get familiar with the code:
  Start with the startGame() and newTurn() functions. They will reference
    the other functions in a logical order.
  To understand the first thing you see when you load the page,
    look at menus.js. When a new game is started, countdownScreen()
    is called. This leads to startGame() being called, which leads to newTurn()
    being called every three seconds.

SHORT-TERM TODO:
  [   ] Realign menu options (left) and game results page (show player rating)
  [   ] Create smarter AI
  [   ] Fix glitch where blue loses if both teams' last units die simultaneously
  [   ] Enable "go back" in menus via backspace (keycode 8)
  [ x ] Make game keep track of win/loss ratio in each session
  [ x ] In single-player sessions, give player a rating based on
          record at various levels vs. computer.
  [ x ] Fix glitch where when you return to the main screen,
      enter doesn't work until up/down are pressed
  [   ] Make units stop in place after each turn? (Don't bother until you decide:
          Is it a good idea to allow units one "motion" and one "attack/technique" each turn?)
  [ x ] make turn length tweakable (DONE -- via timeScale [in "setup()"])
  [ x ] Make menus keyboard-controlled
  [ x ] Make walls stop units' motion in wall's direction
  [ x ] Fix unit movement animations (currently depend on unit's grid position)
  [ x ] Balance shot animations (red v. blue)

LONG-TERM TODO:
  See Issues/Feature Requests on Github:
    https://github.com/djminkus/QPO/issues
  [   ] adjust tutorial
  Make a server
  Enable PVP (Implement user login system)
  Implement Ranking System
  Implement Subscription System
  Throw $$ tourney
  [   ] Implement pause function
  [ x ] Create a tutorial


Contents of this code: (updated June 2, 2015)
  VAR DECLARATIONS

  UNIT CONSTRUCTORS

  GUI ELEMENTS


  INCREMENT FUNCTIONS
    updateBlueAU() -- updates which unit is highlighted with orange
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


*/

qpoGame = {
  "gui" : {
    "debug" : {}
  },
  "unit" : {},
  "bomb" : {},
  "multiplayer":false
};

function setup(){ //set up global vars and stuff
  timeScale = .5; //Bigger means slower
  COLOR_DICT = {
    "blue": "#0055bb",
    "red": "#bb0000",
    "orange": "#ffbb66",
    "shot color": "#00bb55",
    "bomb color": "#bb00bb",
    "grey": "#bbbbbb",
    "purple":"#cc66ff"
  };
  blueMovesQueue = [];
  redMovesQueue = [];
  shots = [];
  bombs = [];
  //bsplicers = [];
  moves = ["moveUp","moveDown","moveLeft","moveRight","shoot","bomb","stay"];
  gui = c.set();
  blueActiveUnit = 0;
  redActiveUnit = 0;
  newGames = 0;
  game = {
    "paused":false,
  }
  gameEnding = false;
  playerColor = "blue";
  opponentColor = "red";
  guiCoords = {
    "gameBoard" : {
      "squareSize" : 50,
      "columns" : 7,
      "rows" : 7,
      "leftWall" : 25,
      "topWall" : 75
    },
    "gamePanel" : {
      "width" : 600,
      "height" : 600
    },
    "debug" : {
      "width":300,
      "height":600
    }
  };
  guiCoords.gameBoard.width = guiCoords.gameBoard.columns * guiCoords.gameBoard.squareSize,
  guiCoords.gameBoard.height = guiCoords.gameBoard.rows * guiCoords.gameBoard.squareSize;
  guiCoords.gameBoard.rightWall = guiCoords.gameBoard.leftWall + guiCoords.gameBoard.width;
  guiCoords.gameBoard.bottomWall = guiCoords.gameBoard.topWall + guiCoords.gameBoard.height;
  bombSize = 100;
  debug = false;
}

setup();

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

//GUI ELEMENTS
function setUpGameClock(){
  var initialSeconds = 180;
  gameClock = c.text(450, 345, "" + initialSeconds)
    .data("value",180)
    .attr({'font-size': 30});
  gui.push(gameClock);
}
function drawBoard(cols, rows){
  var outline = c.rect(guiCoords.gameBoard.leftWall, guiCoords.gameBoard.topWall,
                       guiCoords.gameBoard.width, guiCoords.gameBoard.height).attr({
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
    case "3":
      blueUnits[0] =  makeUnit("blue",1,1,0);
      redUnits[0] = makeUnit("red",1,5,0);
      blueUnits[1] = makeUnit("blue",3,1,1);
      redUnits[1] = makeUnit("red",3,5,1);
      blueUnits[2] = makeUnit("blue",5,1,2);
      redUnits[2] = makeUnit("red",5,5,2);
      break;
    case "2":
      blueUnits[0] =  makeUnit("blue",2,1,0);
      redUnits[0] = makeUnit("red",2,5,0);
      blueUnits[1] = makeUnit("blue",4,1,1);
      redUnits[1] = makeUnit("red",4,5,1);
      break;
    case "1":
      blueUnits[0] =  makeUnit("blue",3,1,0);
      redUnits[0] = makeUnit("red",3,5,0);
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
  if(qpoGame.multiplayer){
    redUnits[0].activate();
  }
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
//generators :
gens = [85, 475, 20, 10, 40]; //centers and radius -- for controlPanel
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
    c.rect(28, 428, 110, 94),
    c.rect(28+114, 428, 116, 94),
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

  timer = c.path().attr({segment: [450, 250, 50, -90, 269],"stroke":"none"});
  gui.push(timer);
}
function debugPanel(){
  this.border = c.rect(guiCoords.gamePanel.width, 0, guiCoords.debug.width, guiCoords.debug.height)
    .attr({"stroke-width":2,"stroke":"blue"});
  this.title = c.text(900 - guiCoords.debug.width/2, 30, "debug")
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
function updateBlueAU(ts){
  /*
  highlight the new active unit,
  highlight the new part of the control panel,
  update the "blueActiveUnit" var and the "red" one

  if 1v1, just keep current unit active.
  if 2v2, check if other unit is alive, and switch to it if so.
  if 3v3, check if next unit it alive, and switch to it if so.
  */
  switch(ts){
    case 1:
      break;
    case 2:
      switch(blueActiveUnit){
          case 0:
            if (blueUnits[1].alive){
              blueUnits[1].activate();
              blueUnits[0].deactivate();
              controlPanel.oranges[0].hide();
              controlPanel.oranges[1].show();
              blueActiveUnit = 1;
            }
            break;
          case 1:
            if (blueUnits[0].alive){
              blueUnits[0].activate();
              blueUnits[1].deactivate();
              controlPanel.oranges[1].hide();
              controlPanel.oranges[0].show();
              blueActiveUnit = 0;
            }
            break;
          default:
            "unexpected switch condition";
            break;
        }
      break;
    case 3:
      switch(blueActiveUnit){
        case 0:
          if (blueUnits[1].alive){
            blueUnits[0].deactivate();
            blueUnits[1].activate();
            controlPanel.oranges[0].hide();
            controlPanel.oranges[1].show();
            blueActiveUnit = 1;
          } else if (blueUnits[2].alive){
            blueUnits[0].deactivate();
            blueUnits[2].activate();
            controlPanel.oranges[0].hide();
            controlPanel.oranges[2].show();
            blueActiveUnit = 2 ;
          }
          break;
        case 1:
          if (blueUnits[2].alive){
            blueUnits[1].deactivate();
            blueUnits[2].activate();
            controlPanel.oranges[1].hide();
            controlPanel.oranges[2].show();
            blueActiveUnit = 2;
          } else if (blueUnits[0].alive){
            blueUnits[1].deactivate();
            blueUnits[0].activate();
            controlPanel.oranges[1].hide();
            controlPanel.oranges[0].show();
            blueActiveUnit = 0 ;
          }
          break;
        case 2:
          if (blueUnits[0].alive){
            blueUnits[2].deactivate();
            blueUnits[0].activate();
            controlPanel.oranges[2].hide();
            controlPanel.oranges[0].show();
            blueActiveUnit = 0;
          } else if (blueUnits[1].alive){
            blueUnits[2].deactivate();
            blueUnits[1].activate();
            controlPanel.oranges[2].hide();
            controlPanel.oranges[1].show();
            blueActiveUnit = 1 ;
          }
          break;
      }
      break;
    default:
      console.log("unexpected switch condition");
      break;
  }
}
function updateRedAU(ts){
  /*
  highlight the new active unit,
  highlight the new part of the control panel,
  update the "redActiveUnit" var

  if 1v1, just keep current unit active.
  if 2v2, check if other unit is alive, and switch to it if so.
  if 3v3, check if next unit it alive, and switch to it if so.
  */
  switch(ts){
    case 1:
      break;
    case 2:
      switch(redActiveUnit){
          case 0:
            if (redUnits[1].alive){
              redUnits[1].activate();
              redUnits[0].deactivate();
              controlPanel.oranges[0].hide();
              controlPanel.oranges[1].show();
              redActiveUnit = 1;
            }
            break;
          case 1:
            if (redUnits[0].alive){
              redUnits[0].activate();
              redUnits[1].deactivate();
              controlPanel.oranges[1].hide();
              controlPanel.oranges[0].show();
              redActiveUnit = 0;
            }
            break;
          default:
            "unexpected switch condition";
            break;
        }
      break;
    case 3:
      switch(redActiveUnit){
        case 0:
          if (redUnits[1].alive){
            redUnits[0].deactivate();
            redUnits[1].activate();
            controlPanel.oranges[0].hide();
            controlPanel.oranges[1].show();
            redActiveUnit = 1;
          } else if (redUnits[2].alive){
            redUnits[0].deactivate();
            redUnits[2].activate();
            controlPanel.oranges[0].hide();
            controlPanel.oranges[2].show();
            redActiveUnit = 2 ;
          }
          break;
        case 1:
          if (redUnits[2].alive){
            redUnits[1].deactivate();
            redUnits[2].activate();
            controlPanel.oranges[1].hide();
            controlPanel.oranges[2].show();
            redActiveUnit = 2;
          } else if (redUnits[0].alive){
            redUnits[1].deactivate();
            redUnits[0].activate();
            controlPanel.oranges[1].hide();
            controlPanel.oranges[0].show();
            redActiveUnit = 0 ;
          }
          break;
        case 2:
          if (redUnits[0].alive){
            redUnits[2].deactivate();
            redUnits[0].activate();
            controlPanel.oranges[2].hide();
            controlPanel.oranges[0].show();
            redActiveUnit = 0;
          } else if (redUnits[1].alive){
            redUnits[2].deactivate();
            redUnits[1].activate();
            controlPanel.oranges[2].hide();
            controlPanel.oranges[1].show();
            redActiveUnit = 1 ;
          }
          break;
      }
      break;
    default:
      console.log("unexpected switch condition");
      break;
  }
}

function tick(){ //update game clock. Called once per second.
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
  for (var i=0; i<teamSize; i++){

    //in single player, generate red's moves automatically
    if (!qpoGame.multiplayer){
      //redMovesQueue[i] = moves[Math.round(Math.random()*6)]
      redMovesQueue[i] = findMove(redUnits[i]);
    }

    // execute red's moves:
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
          break;
        case "stay" :
          redUnits[i].stay();
          break;
      }
    }

    //execute blue's moves:
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
      controlPanel.actives[i].hide()
    }

    //clear the move queues:
    redMovesQueue[i]="stay";
    blueMovesQueue[i]="stay";

  }

  controlPanel.resetIcons();
  timer.attr({segment: [450, 250, 50, -90, 269]});
  timer.animate({segment: [450, 250, 50, -90, -90]}, 3000*timeScale);
}

function detectCollisions(ts){
  /* COLLISION DETECTION, a function
  to be called every 17 ms */
  var splicers = []; //used for destroying references to shots once they're gone
  /* OUTLINE
  iterate over shots --> units and bombs
  iterate over bombs --> bombs and units
  iterate over units --> units
  TODO (MAYBE): shots --> shots
  */
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

  //ITERATE OVER UNITS HERE. We have the blueUnits and redUnits arrays as well
  //  as the "units" array. All we want to do is check for collisions between
  //  units of opposite colors, so we only need to iterate over one color of
  // unit.
  for (var i=0; i<ts; i++){ //iterate over blue team of units

    //Get the unit's borders
    var nBOU = blueUnits[i].rect.getBBox().y;
    var wBOU = blueUnits[i].rect.getBBox().x;
    var sBOU = nBOU + 50;
    var eBOU = wBOU + 50;

    if (blueUnits[i].active) { //adjust for highlighting on active unit
      nBOU = nBOU + 2;
      sBOU = sBOU - 2;
      wBOU = wBOU + 2;
      eBOU = eBOU - 2;
    }

    //if the unit has hit a wall, stop the unit and move it outside the wall.
    if( nBOU < guiCoords.gameBoard.topWall ||
        wBOU < guiCoords.gameBoard.leftWall ||
        sBOU > guiCoords.gameBoard.bottomWall ||
        eBOU > guiCoords.gameBoard.rightWall
      ){
      blueUnits[i].rect.stop();
      if (nBOU < guiCoords.gameBoard.topWall){ blueUnits[i].rect.attr({"y":guiCoords.gameBoard.topWall}) }
      if (wBOU < guiCoords.gameBoard.leftWall){ blueUnits[i].rect.attr({"x":guiCoords.gameBoard.leftWall}) }
      if (sBOU > guiCoords.gameBoard.bottomWall){ blueUnits[i].rect.attr({"y": guiCoords.gameBoard.bottomWall-guiCoords.gameBoard.squareSize }) }
      if (eBOU > guiCoords.gameBoard.rightWall){ blueUnits[i].rect.attr({"x": guiCoords.gameBoard.rightWall-guiCoords.gameBoard.squareSize }) }
    }

    //WALL DETECTION RED
    //get the unit's borders:
    var nBOUr = redUnits[i].rect.getBBox().y;
    var wBOUr = redUnits[i].rect.getBBox().x;
    var sBOUr = nBOUr + 50;
    var eBOUr = wBOUr + 50;

    if (redUnits[i].active) { //adjust for highlighting on active unit
      nBOUr = nBOUr + 2;
      sBOUr = sBOUr - 2;
      wBOUr = wBOUr + 2;
      eBOUr = eBOUr - 2;
    }

    //if the unit has hit a wall, stop the unit.
    if( nBOUr < guiCoords.gameBoard.topWall ||
        wBOUr < guiCoords.gameBoard.leftWall ||
        sBOUr > guiCoords.gameBoard.bottomWall ||
        eBOUr > guiCoords.gameBoard.rightWall
      ){
      redUnits[i].rect.stop();
      if (nBOUr < guiCoords.gameBoard.topWall){ redUnits[i].rect.attr({"y":guiCoords.gameBoard.topWall}) }
      if (wBOUr < guiCoords.gameBoard.leftWall){ redUnits[i].rect.attr({"x":guiCoords.gameBoard.leftWall}) }
      if (sBOUr > guiCoords.gameBoard.bottomWall){ redUnits[i].rect.attr({"y": guiCoords.gameBoard.bottomWall-guiCoords.gameBoard.squareSize }) }
      if (eBOUr > guiCoords.gameBoard.rightWall){ redUnits[i].rect.attr({"x": guiCoords.gameBoard.rightWall-guiCoords.gameBoard.squareSize }) }

    }

    for (var j=0; j<ts; j++) { //iterate over red team of units within units
      //When units of opposite color collide, kill both units.

      var nBOU2 = redUnits[j].rect.getBBox().y;
      var wBOU2 = redUnits[j].rect.getBBox().x;
      var sBOU2 = nBOU2 + 50;
      var eBOU2 = wBOU2 + 50;

      if (redUnits[j].active) { //adjust for highlighting on active unit
        nBOU = nBOU + 2;
        sBOU = sBOU - 2;
        wBOU = wBOU + 2;
        eBOU = eBOU - 2;
      }

      if( (( nBOU < nBOU2 && nBOU2 < sBOU ) || //vertical overlap
          ( nBOU < sBOU2 && sBOU2 < sBOU ) ||
          ( nBOU2 < nBOU && nBOU < sBOU2 ) || //vertical overlap
          ( nBOU2 < sBOU && sBOU < sBOU2 )) &&
          (( wBOU < wBOU2 && wBOU2 < eBOU ) || //horizontal overlap
          ( wBOU < eBOU2 && eBOU2 < eBOU ) ||
          ( wBOU2 < wBOU && wBOU < eBOU2 ) ||
          ( wBOU2 < eBOU && eBOU < eBOU2 )) &&
          (redUnits[j].alive) && (blueUnits[i].alive)) {
        redUnits[j].kill();
        blueUnits[i].kill();
      }
    }//end iterating over red units
  } //end iterating over blue units

  // Splice shots out of the shots array, one by one.
  while (splicers.length > 0) {
    shots.splice(splicers[0],1);
    splicers.splice(0,1);
    for (var i=0;i<splicers.length;i++){
      splicers[i] -= 1;
    }
  }

  //End the game if necessary.
  if ((redDead==ts || blueDead==ts) && gameEnding == false){
    var gameResult;
    setTimeout(function(){ //grab game result (after 20 ms to account for performance issues)
      if(redDead==blueDead){
        gameResult = "tie";
      } else if (redDead == ts) {
        gameResult = "blue";
      } else {
        gameResult = "red";
      }
    }, 20);

    blueActiveUnit = -1;
    redActiveUnit = -1;
    gameEnding = true;
    mainMenu.blackness.animate({"opacity": .9},2000*timeScale);
    gui.toBack();
    setTimeout(function(){
      endGame(gameResult);
    },2000*timeScale);
  }
}

//NOT IMPLEMENTED
function updateCP(team){
  switch (team){
    case "blue":
      controlPanel.actives[blueActiveUnit].hide();

      break;
    case "red":
      break;
    default:
      console.log("this was unexpected");
  }
}

//LISTEN FOR INPUT
$(window).keydown(function(event){
  switch (activeScreen){
    case "menu":
      switch(event.keyCode){
        case 8: //backspace/delete
          event.preventDefault();
          if ( !(activeMenu=="main") ) {menus[activeMenu].up();}
          console.log("backspace pressed");
          break;
        case 13: //enter
          event.preventDefault();
          activeButton.onclick();
          break;
        case 87: //w
          event.preventDefault();
          menus[activeMenu].previous();
          break;
        case 83: //s
          event.preventDefault();
          menus[activeMenu].next();
          break;
        case 38: //up arrow
          event.preventDefault();
          menus[activeMenu].previous();
          break;
        case 40: //down arrow
          event.preventDefault();
          menus[activeMenu].next();
          break;
        default:
          break;
      }
      break;
    case "game":
      switch (event.keyCode){
        case 81: //q -- blue pressed bomb
          event.preventDefault();
          blueMovesQueue[blueActiveUnit] = "bomb";
          controlPanel.actives[blueActiveUnit].hide();
          controlPanel.actives[blueActiveUnit] =
            controlPanel.icons.bombs[blueActiveUnit];
          gui.push(controlPanel.actives[blueActiveUnit]);
          controlPanel.actives[blueActiveUnit].show();
          updateBlueAU(teamSize);
          break;
        case 69: //e -- blue pressed shoot
          event.preventDefault();
          blueMovesQueue[blueActiveUnit] = "shoot";
          controlPanel.actives[blueActiveUnit].hide();
          controlPanel.actives[blueActiveUnit] =
            controlPanel.icons.rects[blueActiveUnit];
          gui.push(controlPanel.actives[blueActiveUnit]);
          controlPanel.actives[blueActiveUnit].show();
          updateBlueAU(teamSize);
          break;
        case 65: //a (move left)
          event.preventDefault();
          blueMovesQueue[blueActiveUnit] = "moveLeft";
          controlPanel.actives[blueActiveUnit].hide();
          controlPanel.actives[blueActiveUnit] =
            controlPanel.icons.leftArrows[blueActiveUnit];
          gui.push(controlPanel.actives[blueActiveUnit]);
          controlPanel.actives[blueActiveUnit].show();
          updateBlueAU(teamSize);
          break;
        case 87: //w (move up)
          event.preventDefault();
          blueMovesQueue[blueActiveUnit] = "moveUp";
          controlPanel.actives[blueActiveUnit].hide();
          controlPanel.actives[blueActiveUnit] =
            controlPanel.icons.upArrows[blueActiveUnit];
          gui.push(controlPanel.actives[blueActiveUnit]);
          controlPanel.actives[blueActiveUnit].show();
          updateBlueAU(teamSize);
          break;
        case 68: //d (move right)
          event.preventDefault();
          blueMovesQueue[blueActiveUnit] = "moveRight";
          controlPanel.actives[blueActiveUnit].hide();
          controlPanel.actives[blueActiveUnit] =
            controlPanel.icons.rightArrows[blueActiveUnit];
          gui.push(controlPanel.actives[blueActiveUnit]);
          controlPanel.actives[blueActiveUnit].show();
          updateBlueAU(teamSize);
          break;
        case 83: //s (move down)
          event.preventDefault();
          blueMovesQueue[blueActiveUnit] = "moveDown";
          controlPanel.actives[blueActiveUnit].hide();
          controlPanel.actives[blueActiveUnit] =
            controlPanel.icons.downArrows[blueActiveUnit];
          gui.push(controlPanel.actives[blueActiveUnit]);
          controlPanel.actives[blueActiveUnit].show();
          updateBlueAU(teamSize);
          break;
        case 88: //"x" key
          blueMovesQueue[blueActiveUnit] = "stay";
          controlPanel.actives[blueActiveUnit].hide();
          controlPanel.actives[blueActiveUnit] =
            controlPanel.icons.circles[blueActiveUnit];
          gui.push(controlPanel.actives[blueActiveUnit]);
          controlPanel.actives[blueActiveUnit].show();
          updateBlueAU(teamSize);
          break;

        //PLAYER 2:
        case 18: //right alt
          event.preventDefault();
          if (qpoGame.multiplayer){
            redMovesQueue[redActiveUnit] = "bomb";
            updateRedAU(teamSize);
          }
          break;
        case 16: //right shift
          event.preventDefault();
          if (qpoGame.multiplayer){
            redMovesQueue[redActiveUnit] = "shoot";
            updateRedAU(teamSize);
          }
          break;
        case 37: //left arrow (move left)
          event.preventDefault();
          if (qpoGame.multiplayer){
            redMovesQueue[redActiveUnit] = "moveLeft";
            updateRedAU(teamSize);
          }
          break;
        case 38: //up arrow (move up)
          event.preventDefault();
          if (qpoGame.multiplayer){
            redMovesQueue[redActiveUnit] = "moveUp";
            updateRedAU(teamSize);
          }
          break;
        case 39: //right arrow (move right)
          event.preventDefault();
          if (qpoGame.multiplayer){
            redMovesQueue[redActiveUnit] = "moveRight";
            updateRedAU(teamSize);
          }
          break;
        case 40: //down arrow (move down)
          event.preventDefault();
          if (qpoGame.multiplayer){
            redMovesQueue[redActiveUnit] = "moveDown";
            updateRedAU(teamSize);
          }
          break;
        case 191: // "?" key
          event.preventDefault();
          if (qpoGame.multiplayer){
            redMovesQueue[redActiveUnit] = "stay";
            updateRedAU(teamSize);
          }
          break;
        /*
        case 27: //escape key
          if (game.paused){
            gui.resume();
          } else {
            gui.pause();
          }
        */


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
    1000*timeScale);
  setTimeout(
    function(){numbers.attr({"text":"1"})},
    2000*timeScale);
  setTimeout(function(){
             mainMenu.blackness.animate({"opacity":0},200,"<")},
             2800*timeScale);
  setTimeout(function(){numbers.remove()},3000*timeScale);
  setTimeout(function(){startGame(difficulty);},3000*timeScale);
  activeScreen="other";
}
function startGame(difficulty){
  /*
  if (newGames > 0){
    moveTimer.redo();
  } */
  teamSize = parseInt(difficulty, 10);
  /*
  (function(diff){
    switch(diff){
      case "3":
        return 3;
        break;
      case "2":
        return 2;
        break;
      case "1":
        return 1;
        break;
      default:
        break;
    }
  })(difficulty); */

  turnNumber = 0;
  redDead = 0;
  blueDead = 0;

  drawGUI();
  placeUnits(difficulty); // puts the units on the board
  blueActiveUnit = 0;
  redActiveUnit = 0;
  setTimeout(function(){clockUpdater = setInterval(tick,1000*timeScale);},2000*timeScale);
  gameEnding = false;
  collisionDetector = setInterval(function(){detectCollisions(teamSize)},17);
  timer.animate({segment: [450, 250, 50, -90, -90]}, 3000*timeScale);
  activeScreen = "game";
  console.log('NEW GAME');
}
function startHowTo(){
  /*

  redDead = 0;
  blueDead = 0;
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
  activeSession.update(result); //add to the proper tally
  endGameMenu = makeEndGameMenu(result); //generate the endGameMenu GUI
}
function newRound(){
  endGameMenu.all.remove();
  newGames++;
  return countdownScreen(diffic);
}
function goMainMenu(){
  endGameMenu.all.remove();
  mainMenu.showAll();
  activeScreen = "menu";
  activeMenu = "main";
  mainMenu.blackness.attr({"opacity":.9});
}
