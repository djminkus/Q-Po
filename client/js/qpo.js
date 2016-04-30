console.log("RESET " + Date());
var c = new Raphael("raphContainer", 600, 600); //create the Raphael canvas

// CHOOSE A SONG:
var songURL = "./music/qpo.mp3"          //  neil's first iteration
// var songURL =  "./music/loadingScreen.mp3"      // neil's menu song
// var songURL =  "./music/underwaterStars.mp3"  //uncomment for underwaterStars
// var song = new Audio("./music/qpo.mp3")            //  neil's first iteration
// var song = new Audio("./music/loadingScreen.mp3")        // neil's menu song
// var song = new Audio("./music/underwaterStars.mp3")  //uncomment for underwaterStars

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

Q-Po is a competitive browser game that combines elements of real-time strategy games, top-down shooters,
  and turn-based strategy games, resulting in fast-paced, competitive gameplay that's easy to learn,
  but hard to master.

How to get familiar with the code:
  Start with the startGame() and newTurn() functions. They will reference
    the other functions in a logical order.
  To understand the first thing you see when you load the page,
    look at menus.js. When a new game is started, countdownScreen()
    is called. This leads to startGame() being called, which leads to newTurn()
    being called every three seconds.

SHORT-TERM TODO:
  [   ] Separate server-side code and client code
  [   ] Realign menu options (left) and game results page (show player rating)
  [   ] Fix glitch where blue loses if both teams' last units die simultaneously
  [ x ] Enable "go back" in menus via backspace (keycode 8)
  [ x ] Make game keep track of win/loss ratio in each session
  [ x ] In single-player sessions, give player a rating based on
          record at various levels vs. computer.
  [ x ] Fix glitch where when you return to the main screen,
      enter doesn't work until up/down are pressed
  [ x ] Make units stop in place after each turn? (Don't bother until you decide:
          Is it a good idea to allow units one "motion" and one "attack/technique" each turn?)
  [ x ] make turn length tweakable (DONE -- via qpo.timeScale [in "setup()"])
  [ x ] Make menus keyboard-controlled
  [ x ] Make walls stop units' motion in wall's direction
  [ x ] Fix unit movement animations (currently depend on unit's grid position)
  [ x ] Balance shot animations (red v. blue)

alpha must contain:
  [  ]  Improved gameplay (blocks, AI, goal lines, scalable team size/board, spawn system)
  [  ]  Functional servers {test for reliability, have someone try to crack or flood them}
  [  ]  PVP ranking system {test for rewardingness and exploitability}
beta must feature:
  [  ] Handsome, e-sportsy website
  [  ] Cool music
  [  ] Sound effects
  [  ] Even better gameplay (using feedback from alpha)
  [  ] More reliable servers (via code reviews/consults)
  [  ] A more rewarding ranking system (using feedback from alpha)
v1 should

LONG-TERM TODO:
  See Issues/Feature Requests on Github:
    https://github.com/djminkus/QPO/issues
  [   ] Use Neural Networks to implement good AI
  [   ] Make a server
  [   ] Enable PVP (Implement user login system)
  [   ] Implement Ranking System
  [   ] Open beta and advertise
  [   ] Improve game based on beta feedback
  [   ] Release 1.0
  [   ] Throw $$ tourney
  --- MAYBES
  [   ] Implement Subscription System
  [   ] adjust tutorial
  [   ] Implement pause function
  --- DONE
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

qpo = {
  /* WEBSOCKET THINGS (NOT SOCKET.IO)
  "socket" : new WebSocket('ws://echo.websocket.org'), //this url will change
  "socketCodes" : {"bomb":0,"shoot":1,"moveLeft":2,"moveUp":3,"moveRight":4,"moveDown":5,"stay":6},
  */
  // "socket" : io(),
  "lastMsgTime" : new Date().getTime(),
  "moveName" : null,
  "timeSinceLastMsg" : null,
  "cpIconsGens" : [85, 475, 20, 10, 40] //centers and radius -- for (leftmost) controlPanel icons
}

qpo.menuMusic = function(){
  if (!(qpo.menuSong)){ //load song if it hasn't been loaded yet
    qpo.menuSong = new Audio(songURL);
  }
  if (qpo.activeGame){ //stop game song and reset it
    qpo.activeGame.song.pause();
    qpo.activeGame.song.currentTime=0;
  }
  qpo.menuSong.currentTime = 0;
  qpo.menuSong.play();
  if (qpo.playMusic) { // loop the menuSong every 1 minute and 48 seconds
    qpo.menuSongInterval = setInterval(function(){
      qpo.menuSong.currentTime = 0;
      qpo.menuSong.play();
      // console.log("playing menu song again.");
    },113000);
  }
}

qpo.setup = function(){ // set up global vars and stuff
  // SOCKET STUFF:
  // this.socket.onerror = function(error) {
  //    console.log('WebSocket Error: ' + error);
  // };
  // this.socket.onmessage = function(event) {
  //   var message = event.data;
  //   // console.log("ws says:" + message);
  // };

  // MISCELLANEOUS STUFF:
  qpo.timeScale = 0.5; // Bigger means slower; 1 is original 3-seconds-per-turn
  qpo.aiTypes = ["neural","rigid","random"];

  // NEURAL STUFF:
  qpo.trainingMode = false;
  (qpo.trainingMode) ? (qpo.timeScale=0.05) : (qpo.timeScale=0.5) ;
  qpo.trainingCounter = 0;
  qpo.batchCounter = 0;
  qpo.gamesToTrain = 30; // games per batch
  qpo.batchesToTrain = 3; // batches to train
  qpo.trainingData = new Array(); // store sessions (win/loss data)
  qpo.retrain = function(){ // get ready to train another batch.
    qpo.trainingCounter = 0;
    qpo.trainingMode = true;
  }
  qpo.aiType = qpo.aiTypes[0]; // controls source of red's moves in singlePlayer
  qpo.trainerOpponent = qpo.aiTypes[2]; // controls source of blue's moves in training mode

  qpo.COLOR_DICT = {
    "blue": "#0055bb",
    "red": "#bb0000",
    "orange": "#ffbb66",
    "shot color": "#00bb55",
    "green": "#00bb55", //same as shot color
    "bomb color": "#bb00bb",
    "grey": "#bbbbbb",
    "purple":"#cc66ff"
  };
  qpo.blueMovesQueue = [];
  qpo.redMovesQueue = [];
  qpo.shots = [];
  qpo.bombs = [];
  qpo.moves = ["moveUp","moveDown","moveLeft","moveRight","shoot","bomb","stay"];
  qpo.gui = c.set(); // Should contain only elements relevant to the current screen.
  qpo.blueActiveUnit = 0;
  qpo.redActiveUnit = 0;
  playerColor = "blue"; // for now
  opponentColor = "red";

  //SET UP DIMENSIONS AND COORDINATES:
  qpo.guiCoords = { // cp height, gameBoard wall locations, gamePanel vs debugPanel
    "cp" : {
      "height" : 100,
    },
    "gameBoard" : {
      "leftWall" : 25,
      "topWall" : 75
    },
    "gamePanel" : {
      "width" : 600,
      "height" : 600
    }
  };
  qpo.guiDimens = { //width of panels, square size, #columns, #rows
    "gpWidth" : 600, //game panel width
    "gpHeight" : 600, //game panel height
    "squareSize" : 50,
    "columns" : 7,
    "rows" : 7
  }
  qpo.guiCoords.gameBoard.width = qpo.guiDimens.columns * qpo.guiDimens.squareSize,
  qpo.guiCoords.gameBoard.height = qpo.guiDimens.rows * qpo.guiDimens.squareSize;
  qpo.guiCoords.gameBoard.rightWall = qpo.guiCoords.gameBoard.leftWall + qpo.guiCoords.gameBoard.width;
  qpo.guiCoords.gameBoard.bottomWall = qpo.guiCoords.gameBoard.topWall + qpo.guiCoords.gameBoard.height;

  qpo.bombSize = 2*qpo.guiDimens.squareSize;
  qpo.difficPairings = [4, 6, 8, 10, 13, 16, 20]; //array index is po-1. Value at index is recommended q for said po.

  //MAKE MUSIC
  qpo.playMusic = false;
  (qpo.playMusic) ? (qpo.menuMusic()) : (console.log("no music mode!"));

  qpo.add = function(a,b){
    return (a+b);
  }
}
qpo.setup();

function findSlot(array){ //find the first empty slot in an array
  var slot = 0;
  while(slot < array.length){
    if(!array[slot]){
      break;
    }
    slot += 1;
  }
  return slot;
}

qpo.findSpawn = function(color){
  //CHOOSE A ROW.
  var foundSpawn;
  var demerits = [new Array(),new Array()];
  var po = qpo.activeGame.po;
  var q = qpo.activeGame.q
  for(var i=0; i<q; i++){ //populate demerits with zeros
    demerits[0].push(0);
    demerits[1].push(0);
  }
  //TODO: APPLY BLOCKS : enemy side, enemy proximity, danger (incoming shot/bomb)
  if (color == "blue"){ //block red side (rows po/2 through po-1)
    for (var i=0; i<Math.floor(q/2); i++){
      demerits[0][i+Math.floor(q/2)]++;
    }
  }
  else { //block blue side
    for (var i=0; i<Math.floor(q/2); i++){
      demerits[0][i]++;
    }
  }
  //TODO: APPLY BOOSTS : friendly side, friendly proximity

  //TODO: SELECT row and column based on demerits. (base this on rigid ai.)
  // console.log("demerits: " + demerits);
  // console.log("demerits[0]: " + demerits[0]);

  var fewestDemerits = [100,100]; //a comparer
  for (var i=0; i<demerits[0].length;i++){ //find the lowest number of demerits
    if(demerits[0][i]<fewestDemerits[0]){
      fewestDemerits[0] = demerits[0][i];
    }
    if(demerits[1][i]<fewestDemerits[1]){
      fewestDemerits[1] = demerits[1][i];
    }
  }
  //find rows with least demerits and columns with least demerits:
  var indices = [[],[]]; //rows, columns
  var utilIndex = [0,0];
  var increment = [false,false];
  for (var i=0; i<demerits[0].length;i++){ //
    if(demerits[0][i]==fewestDemerits[0]){
      indices[0][utilIndex[0]] = i;
      increment[0] = true;
    }
    if(demerits[1][i]==fewestDemerits[1]){
      indices[1][utilIndex[1]] = i;
      increment[1] = true;
    }
    (increment[0] == true) ? (utilIndex[0]+=1) : (null);
    (increment[1] == true) ? (utilIndex[1]+=1) : (null);

  }
  //choose random index from "indices" array:
  var chosenRow = indices[0][Math.floor(Math.random()*indices[0].length)];
  var chosenColumn = indices[1][Math.floor(Math.random()*indices[1].length)];

  // console.log("indices[0]: " + indices[0]);
  // console.log("indices[1]: " + indices[1]);

  foundSpawn = [chosenRow,chosenColumn];
  // console.log(foundSpawn);

  return foundSpawn;
}

//GUI ELEMENTS
qpo.makeScoreboard = function(){ //draw the scoreBoard and push to gui
  this.redScore = 0;
  this.blueScore = 0;

  this.redScoreText = c.text(430,100, "0").attr({qpoText: [25, qpo.COLOR_DICT["red"]]});
  this.redSection = c.set().push(this.redScoreText);

  this.blueScoreText = c.text(470,100, "0").attr({qpoText: [25, qpo.COLOR_DICT["blue"]]});
  this.blueSection = c.set().push(this.blueScoreText);

  this.addPoint = function(color){
    if (color == "red"){
      this.redScore++;
      this.redScoreText.attr({"text":this.redScore});
    } else {
      this.blueScore++;
      this.blueScoreText.attr({"text":this.blueScore});
    }
  }

  this.all = c.set().push(this.redSection, this.blueSection);
  qpo.gui.push(this.all);
  return this;
};
function drawBoard(cols, rows){ //draw the walls and grid and push to gui
  qpo.guiDimens.columns = cols;
  qpo.guiDimens.rows = rows;
  qpo.guiCoords.gameBoard.width = qpo.guiDimens.squareSize * qpo.guiDimens.columns;
  qpo.guiCoords.gameBoard.height = qpo.guiDimens.squareSize * qpo.guiDimens.rows;
  qpo.guiCoords.gameBoard.rightWall = qpo.guiCoords.gameBoard.leftWall + qpo.guiCoords.gameBoard.width;
  qpo.guiCoords.gameBoard.bottomWall = qpo.guiCoords.gameBoard.topWall + qpo.guiCoords.gameBoard.height;
  var outline = c.rect(qpo.guiCoords.gameBoard.leftWall, qpo.guiCoords.gameBoard.topWall,
                       qpo.guiCoords.gameBoard.width, qpo.guiCoords.gameBoard.height).attr({
                       "stroke-width": 3
  });
  qpo.gui.push(outline);

  var vertLineStrings = [];
  for (var i=1; i<cols; i++) {
    var newString = ("M" + (qpo.guiCoords.gameBoard.leftWall + (i*qpo.guiDimens.squareSize)) + "," + qpo.guiCoords.gameBoard.topWall +
      "L" + (qpo.guiCoords.gameBoard.leftWall + i*qpo.guiDimens.squareSize) + "," + qpo.guiCoords.gameBoard.bottomWall);
    // console.log("drawing path " + newString);
    // console.log((qpo.guiCoords.gameBoard.leftWall + (i*qpo.guiDimens.squareSize)));
    // console.log(qpo.gui)
    qpo.gui.push(c.path(newString));
  }

  var horizLineStrings = [];
  for (var i=1; i<rows; i++) { //create and add one string to the array for each horizontal line
    var newString = ("M" + qpo.guiCoords.gameBoard.leftWall + "," + (qpo.guiCoords.gameBoard.topWall + (i*qpo.guiDimens.squareSize)) +
      "L" + qpo.guiCoords.gameBoard.rightWall + "," + (qpo.guiCoords.gameBoard.topWall + (i*qpo.guiDimens.squareSize)));
    qpo.gui.push(c.path(newString));
  }
}

function placeUnits(){
  //TODO: Implement these rules for placing U units, on an NxM board (N columns, M rows)
  //  Remember that rows and columns are zero-indexed.
  //  Also, blue is on top, red on bottom.
  //    1. Board must be at least 3x3.
  //    2. If board has a center panel (M and N are odd), don't place units there. (Column N/2, Row M/2.)
  //    3. NxM/2 spaces are available per team. (NXM/2-1 if both are odd.) Choose U random, mutually-exclusive
  //         spaces from these possiblities, and place units there.
  //    4. Don't place units in such a way that two opposing units spawn "touching" each other.

  var gridXs = []; // the column numbers of each blue unit to be placed
  var gridY = [] // the row numbers of each blue unit to be placed
  blueUnits = [];
  redUnits = [];
  units = []; //all Units (red and blue);
  var chooseSpots = function(unitsChosen){
    //CHOOSE A ROW.
    var row, column, badSpawn;
    badSpawn = true;
    while(badSpawn){ //find a suitable row and column for the spawn.
      if (qpo.guiDimens.rows % 2 == 0){ //If even # of rows, choose row from 0 to (M/2 - 1).
        row = Math.floor((Math.random() * (qpo.guiDimens.rows/2 - 1) ));
      }
      else { //  If odd # of rows, choose row from 0 to (M-1)/2.
        row = Math.floor((Math.random() * (qpo.guiDimens.rows-1)/2));
      }
      //CHOOSE A COLUMN. //THEN, FIND OUT IF CHOSEN ROW WAS MIDDLE OR NOT.
      if (row == qpo.guiDimens.rows/2){ //If so, choose from the first half of columns, excluding the middle if odd num of columns.
        if (qpo.guiDimens.columns%2 == 0){ //if even num of columns, choose column from 0 to N/2-1.
          column = Math.floor((Math.random() * (qpo.guiDimens.columns/2 - 1) ));
        } else { //if odd num of cols, choose column from 0 to N/2 - .5
          row = Math.floor((Math.random() * (Math.floor(qpo.guiDimens.rows/2))));
        }
      } else { //If not, choose from all columns.
        column = Math.floor((Math.random()*qpo.guiDimens.columns));
      }
      for (var j=0; j<unitsChosen; j++){ //set badSpawn to false if the spawn is fine.
        if(!([row,column] == [gridY[j],gridXs[j]])){
          badSpawn = false;
        } else { // set badSpawn and break out of this if the spawn overlaps.
          badSpawn = true;
          break;
        }
      }
      badSpawn = false;
    }

    gridY.push(row);
    gridXs.push(column);
  };
  // Find a spawn point for each unit:
  for (var i=0; i<qpo.activeGame.po; i++) {
    chooseSpots(i);
    blueUnits[i] = makeUnit("blue",gridXs[i],gridY[i],i);
    redUnits[i] = makeUnit("red", qpo.guiDimens.columns-1-gridXs[i], qpo.guiDimens.rows-1-gridY[i],i);
    units.push(blueUnits[i]);
    units.push(redUnits[i]);
    // console.log("blue unit created in column " + gridXs[i] + ", row " + gridY[i]);
    // console.log("red unit created in column " + (qpo.guiDimens.columns-1-gridXs[i])
    //   + ", row " + (qpo.guiDimens.rows-1-gridY[i]));
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

function startControlPanel(po){
  var leftWall = qpo.guiCoords.gameBoard.leftWall;
  var bottomWall = qpo.guiCoords.gameBoard.bottomWall;
  var rightWall = qpo.guiCoords.gameBoard.rightWall;
  var width = qpo.guiCoords.gameBoard.width;
  var height = qpo.guiCoords.cp.height;
  var widthEach = width/po;
  this.po = po;
  this.outline = c.rect(leftWall, bottomWall, width, height).attr({
    "stroke-width": 3
  });
  this.widthEach = widthEach;

  this.orange = c.rect(leftWall+3, bottomWall+3, widthEach-6, height-6).attr(
      {"stroke":qpo.COLOR_DICT["orange"],"stroke-width":4});
  this.secLines = c.set();
  //DRAW SECTION LINES, AND ORANGE ONES
  (function(cp){
    var secLines = c.set();
    var oranges = c.set();
    for(var i = 1; i<cp.po; i++){
      secLines.push(c.path("M"+ (leftWall + i*widthEach + "," + bottomWall +
                           "L" + (leftWall + i*widthEach) + "," + (bottomWall + height)) ));
      }
    cp.secLines.push(secLines);
    qpo.cpIconsGens = [
      leftWall + widthEach/2, //x coord of center of first icon
      bottomWall + height/2, //y coord
      10, 5, 20 //size of arrows, circle, and rects, respectively (?)
    ]
    // "cpIconsGens" : [85, 475, 20, 10, 40] //centers and radius -- for (leftmost) controlPanel icons
    qpo.cpIconCoords = [qpo.cpIconsGens[0]+qpo.cpIconsGens[2], qpo.cpIconsGens[0]-qpo.cpIconsGens[2], //x ends -- for controlPanel icons
            qpo.cpIconsGens[1]+qpo.cpIconsGens[2], qpo.cpIconsGens[1]-qpo.cpIconsGens[2]]; //y ends --for controlPanel icons
  })(this);

  this.icons = { //one of each icon, to be put in leftmost section, then cloned in finishControlPanel()
    "circles" : [c.circle(qpo.cpIconsGens[0], qpo.cpIconsGens[1], qpo.cpIconsGens[2]*1/2)],
    "leftArrows" : [c.path("M" + qpo.cpIconCoords[0] + "," + qpo.cpIconsGens[1] +
                            "L" + qpo.cpIconCoords[1] + "," + qpo.cpIconsGens[1] +
                            "L" + qpo.cpIconsGens[0] + "," + qpo.cpIconCoords[2] +
                            "L" + qpo.cpIconCoords[1] + "," + qpo.cpIconsGens[1] +
                            "L" + qpo.cpIconsGens[0] + "," + qpo.cpIconCoords[3])],
    "rightArrows": [c.path("M" + qpo.cpIconCoords[1] + "," + qpo.cpIconsGens[1] +
                            "L" + qpo.cpIconCoords[0] + "," + qpo.cpIconsGens[1] +
                            "L" + qpo.cpIconsGens[0] + "," + qpo.cpIconCoords[3] +
                            "L" + qpo.cpIconCoords[0] + "," + qpo.cpIconsGens[1] +
                            "L" + qpo.cpIconsGens[0] + "," + qpo.cpIconCoords[2])],
    "upArrows": [c.path("M" + qpo.cpIconsGens[0] + "," + qpo.cpIconCoords[2] +
                            "L" + qpo.cpIconsGens[0] + "," + qpo.cpIconCoords[3] +
                            "L" + qpo.cpIconCoords[1] + "," + qpo.cpIconsGens[1] +
                            "L" + qpo.cpIconsGens[0] + "," + qpo.cpIconCoords[3] +
                            "L" + qpo.cpIconCoords[0] + "," + qpo.cpIconsGens[1])] ,
    "downArrows": [c.path("M" + qpo.cpIconsGens[0] + "," + qpo.cpIconCoords[3] +
                            "L" + qpo.cpIconsGens[0] + "," + qpo.cpIconCoords[2] +
                            "L" + qpo.cpIconCoords[0] + "," + qpo.cpIconsGens[1] +
                            "L" + qpo.cpIconsGens[0] + "," + qpo.cpIconCoords[2] +
                            "L" + qpo.cpIconCoords[1] + "," + qpo.cpIconsGens[1])] ,
    "rects": [c.rect(qpo.cpIconsGens[0]-qpo.cpIconsGens[3]/2*2/3, qpo.cpIconsGens[1]-qpo.cpIconsGens[4]/2*2/3,
                     qpo.cpIconsGens[3]*2/3,qpo.cpIconsGens[4]*2/3).attr({"fill":qpo.COLOR_DICT["shot color"],
                                            "stroke":qpo.COLOR_DICT["shot color"],
                                            "opacity":0.6})] ,
    "xs" : [c.path("M" + (qpo.cpIconsGens[0] - qpo.cpIconsGens[2]) + "," + (qpo.cpIconsGens[1] - qpo.cpIconsGens[2]) +
                    "L" + qpo.cpIconsGens[0] + "," + qpo.cpIconsGens[1] +
                    "L" + (qpo.cpIconsGens[0] + qpo.cpIconsGens[2]) + "," + (qpo.cpIconsGens[1] - qpo.cpIconsGens[2]) +
                    "L" + qpo.cpIconsGens[0] + "," + qpo.cpIconsGens[1] +
                    "L" + (qpo.cpIconsGens[0] - qpo.cpIconsGens[2]) + "," + (qpo.cpIconsGens[1] + qpo.cpIconsGens[2]) +
                    "L" + qpo.cpIconsGens[0] + "," + qpo.cpIconsGens[1] +
                    "L" + (qpo.cpIconsGens[0] + qpo.cpIconsGens[2]) + "," + (qpo.cpIconsGens[1] + qpo.cpIconsGens[2]))
              .attr({"stroke":"red","stroke-width":2})] ,
    "bombs": [c.rect(qpo.cpIconsGens[0]-qpo.cpIconsGens[3], qpo.cpIconsGens[1]-qpo.cpIconsGens[3],
                     2*qpo.cpIconsGens[3],2*qpo.cpIconsGens[3]).attr({"fill":qpo.COLOR_DICT["bomb color"],
                                            "stroke":qpo.COLOR_DICT["bomb color"],
                                            "opacity":0.6})] ,
  };
  this.actives = [];
  this.all = c.set();
}
function finishControlPanel(cp){
  for (var i=1; i<cp.po; i++){
    cp.icons.circles[i] = cp.icons.circles[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
    cp.icons.rightArrows[i] = cp.icons.rightArrows[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
    cp.icons.leftArrows[i] = cp.icons.leftArrows[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
    cp.icons.upArrows[i] = cp.icons.upArrows[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
    cp.icons.downArrows[i] = cp.icons.downArrows[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
    cp.icons.rects[i] = cp.icons.rects[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
    cp.icons.xs[i] = cp.icons.xs[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
    cp.icons.bombs[i] = cp.icons.bombs[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
  }

  cp.resetIcons = function(){
    for (var i=0; i<cp.po; i++ ){
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
          qpo.gui.push(controlPanel.actives[i]);
        } else {
          cp.actives[i]=cp.icons.xs[i];
          qpo.gui.push(controlPanel.actives[i]);
        }
      }
      catch(e){ //if blueUnits doesn't exist... show xs.
        cp.actives[i] = cp.icons.xs[i];
        qpo.gui.push(controlPanel.actives[i]);
      }
      cp.actives[i].show();
    }
  }
  cp.resetIcons();
  cp.all.push(cp.outline, cp.secLines, cp.orange,
    cp.icons.circles, cp.icons.rightArrows, cp.icons.leftArrows,
    cp.icons.upArrows, cp.icons.downArrows, cp.icons.xs,
    cp.icons.rects, cp.icons.bombs, cp.actives);
  qpo.gui.push(cp.all);
}

function drawGUI(q,po){ //create the turn timer, game clock, board, and control panel.
  (function(){ //draw the turn timer (pie) and push it to the gui
    //  the pie/clock-like thingy that will start full
    //    every turn, and changes color as it shrinks
    qpo.timer = c.path().attr({segment: [450, 250, 50, -90, 269],"stroke":"none"});
    qpo.gui.push(qpo.timer);
  })();
  (function(){ //make the game clock (digits) and push it to the gui
    var initialSeconds = 180;
    qpo.gameClock = c.text(450, 345, "" + initialSeconds)
      .data("value",180)
      .attr({qpoText: [30, "black"]});
    qpo.gameClock.hide();
    qpo.gui.push(qpo.gameClock);
  })();
  drawBoard(q, q); // create the board
  controlPanel = new startControlPanel(po);
  finishControlPanel(controlPanel);
  qpo.scoreBoard = qpo.makeScoreboard();
}

//INCREMENT FUNCTIONS (no new Raph elements created)
function updateBlueAU(po){ //Called when a command is sent and when a unit dies.
  /*
  deactivate the old active unit. Find the next living unit and activate it.
  Move the highlighting on the control panel to reflect this.
  Update the "blueActiveUnit" var.
  */
  var findingUnit = true;
  var ind = qpo.blueActiveUnit + 1;
  var tries = 0;
  while (findingUnit) {
    if (ind == po) { //no more units in array to check; start at 0
      ind = 0;
    }
    if (blueUnits[ind].alive && qpo.activeGame.isEnding == false){ //this is our new active unit. Do stuff.
      blueUnits[qpo.blueActiveUnit].deactivate();
      blueUnits[ind].activate();
      controlPanel.orange.attr({'x': (controlPanel.orange.attr('x')+(ind-qpo.blueActiveUnit)*controlPanel.widthEach)});
      qpo.blueActiveUnit = ind;
      findingUnit = false; //unit has now been found.
    }
    ind++;
    tries++;
    if (tries == po) {//only unit left
      findingUnit = false; //don't change anything, just stop looking.
    }
  }

  /*
  if 1v1, just keep current unit active.
  if 2v2, check if other unit is alive, and switch to it if so.
  if 3v3, check if next unit it alive, and switch to it if so.
  */
}

function newTurn(){ // called every time game clock is divisible by 3
  qpo.activeGame.turnNumber++;

  //// AI SECTION
  // Record reward events that happened this turn:
  qpo.sixty.list[qpo.sixty.cursor] = qpo.redRewardQueue.reduce(qpo.add,0);
  qpo.sixty.cursor = (qpo.sixty.cursor == 59) ? 0 : (qpo.sixty.cursor + 1); //cycle the cursor
  qpo.redRewardQueue = [];
  // Each turn, reward AI for favorable events, and get an action for each ai-controlled unit:
  try{ // try to reward...
    qpo.ali.nn.backward(qpo.sixty.list.reduce(qpo.add,0)); // <-- learning magic happens here
  }
  catch(err){ // ...but it won't work if no actions have been taken.
    console.log("can't train without having acted.");
  }
  // Manage the game state variables and get input array for nn:
  qpo.activeGame.prevState = qpo.activeGame.state;
  qpo.activeGame.state = qpo.activeGame.getState();
  var input = qpo.convertStateToInputs(qpo.activeGame.state);

  //// SPAWN SECTION
  var completedSpawnIndices = new Array();
  for (var i = 0; i<qpo.activeGame.upcomingSpawns.length; i++) { //if it's the right turn, spawn the unit.
    spawn = qpo.activeGame.upcomingSpawns[i];
    if(spawn[0] == qpo.activeGame.turnNumber){ //if it's time, spawn the unit.
      if(spawn[2] == "red"){ //spawn[2] is unit's team, "red" or "blue"
        redUnits[spawn[1]].spawn();         //spawn red unit
      } else { //spawn blue unit
        blueUnits[spawn[1]].spawn();
      }
      completedSpawnIndices.push(i);
    }
  }
  for(index in completedSpawnIndices){qpo.activeGame.upcomingSpawns.splice(index,index+1);}

  //// MOVE EXECUTION SECTION
  qpo.snap(); //snap all units into their correct positions prior to executing new moves
  var po = qpo.activeGame.po;
  for (var i=0; i<po; i++){ //Generate AI moves & execute all moves
    if (!qpo.multiplayer){ // In single player, generate red's moves automatically:
      switch(qpo.aiType){ // Generate a move from random, rigid, or neural AI
        case "random": {
          qpo.redMovesQueue[i] = qpo.moves[Math.round(Math.random()*6)];
          break;
        }
        case "rigid": {
          qpo.redMovesQueue[i] = findMove(redUnits[i]);
          break;
        }
        case "neural": {
          input[217] = i-0.5-(po/2); //generate a zero-mean input representing chosen unit
          var action = qpo.ali.nn.forward(input); // Have the AI net generate a move
          qpo.redMovesQueue[i] = qpo.actions[action]; //get the proper string
          break;
        }
        default: {
          console.log("this was unexpected");
          break;
        }
      }
      if(qpo.trainingMode){ // In training mode, generate blue's moves, too.
        switch(qpo.trainerOpponent){
          case "random": {
            qpo.blueMovesQueue[i] = qpo.moves[Math.round(Math.random()*6)];
            break;
          }
          case "rigid": {
            qpo.blueMovesQueue[i] = findMove(blueUnits[i]);
            break;
          }
          case "neural": {
            input[217] = i-0.5-(po/2); //generate a zero-mean input representing chosen unit
            var action = qpo.ali.nn.forward(input); // Have the AI net generate a move
            qpo.blueMovesQueue[i] = qpo.actions[action]; //get the proper string
            break;
          }
          default: {
            console.log("this was unexpected");
            break;
          }
        }
      }
    }

    // execute red's moves:
    if (redUnits[i].alive){
      switch(qpo.redMovesQueue[i]) {
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

    // !!! This scripting is unfair to blue -- red's moves get executed first.
    // But not THAT unfair -- red's moves are only as far ahead as the time
    //  it takes to execute one move, because they are woven, red-blue-red-blue-...

    //execute blue's moves:
    if (blueUnits[i].alive){
      switch(qpo.blueMovesQueue[i]) {
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

    //clear/reset the move queues:
    qpo.redMovesQueue[i]="stay";
    qpo.blueMovesQueue[i]="stay";
  }

  controlPanel.resetIcons();
  if (!qpo.trainingMode){ //animate the pie, but not in training mode
    qpo.timer.attr({segment: [450, 250, 50, -90, 269]});
    qpo.timer.animate({segment: [450, 250, 50, -90, -90]}, 3000*qpo.timeScale);
  }
  if (qpo.activeGame.turnNumber == 60){
    if (qpo.activeGame.isEnding == false){ //find the winner and store to gameResult
      var gameResult;
      if(qpo.scoreBoard.redScore==qpo.scoreBoard.blueScore){
        gameResult = "tie";
      } else if (qpo.scoreBoard.redScore > qpo.scoreBoard.blueScore) {
        gameResult = "blue";
      } else {
        gameResult = "red";
      }
    }
    qpo.blueActiveUnit = -1;
    qpo.redActiveUnit = -1;
    qpo.activeGame.isEnding = true;
    qpo.gui.toBack();
    setTimeout(function(){
      endGame(gameResult);
    },3000*qpo.timeScale);
  }
}

//IFFY TO IMPLEMENT DUE TO USAGE OF LOGIC SPECIFIC TO
//  EACH TYPE OF OBJECT WITHIN detectCollisions()
qpo.objectsAreColliding = function(object1,object2){
  //object1 and 2 are Raphael objects -- specifically rects in this case
  var box1 = object1.getBBox();
  var sb1 = box1.y2;
  var nb1 = box1.y;
  var wb1 = box1.x;
  var eb1 = box1.x2;

  var box2 = object2.getBBox();
  var sb2 = box2.y2;
  var nb2 = box2.y;
  var wb2 = box2.x;
  var eb2 = box2.x2;
  if (box1.x > box2.x && box1.x2){
    ;
  }
}

function detectCollisions(ts){
  // called every 10 ms once game has begun
  var splicers = []; //used for destroying references to shots once they're gone
  /* OUTLINE
  for each shot, check for collisions with units and bombs
  for each bomb, check for collisions with bombs and units
  for each unit, check for collisions with units on the other team
  TODO (MAYBE): shots --> shots
  */
  for (var i=0; i<qpo.shots.length; i++) { //iterate over shots
    var shotBox = qpo.shots[i].getBBox();
    var sBOS = shotBox.y2;
    var nBOS = shotBox.y;
    var eBOS = shotBox.x2;
    var wBOS = shotBox.x;
    //CHECK FOR COLLISION WITH WALL:
    if (sBOS>qpo.guiCoords.gameBoard.bottomWall || nBOS<qpo.guiCoords.gameBoard.topWall){
      qpo.shots[i].hide(); //make the shot disappear
      qpo.shots[i].data("hidden",true);
      splicers.push(i);
    }
    //CHECK FOR COLLISION WITH ANOTHER OBJECT:
    for (var j=0; j<units.length; j++) { //iterate over units within shots
      /*
      When a shot and a unit collide, hide both
      the shot and the unit from the board,
      tell them they're hidden (Element.data("hidden",true))
      and remove them from their respective arrays
      */
      var unitBox = units[j].rect.getBBox();

      var nBOU = unitBox.y;
      var wBOU = unitBox.x;
      var sBOU = nBOU + qpo.guiDimens.squareSize;
      var eBOU = wBOU + qpo.guiDimens.squareSize;

      if( (( nBOU < nBOS && nBOS < sBOU ) || //vertical overlap
          ( nBOU < sBOS && sBOS < sBOU )) &&
          (( wBOU < wBOS && wBOS < eBOU ) || //horizontal overlap
          ( wBOU < eBOS && eBOS < eBOU )) &&
          !(qpo.shots[i].data("hidden")) &&
          (units[j].alive)) {
        qpo.shots[i].hide(); //make the shot disappear
        units[j].kill();
        qpo.shots[i].data("hidden",true);
        splicers.push(i);
      }
    }//end iterating over units within shots
    if (qpo.bombs.length > 0){ //iterate over bombs within shots (if bombs exist)
      for (var j=0; j<qpo.bombs.length; j++) {
        if(qpo.bombs[j]){
          //   When a shot hits an unexploded bomb,
          // explode the bomb and get rid of the shot
          var bBox = qpo.bombs[j].phys.getBBox();
          var nBOB = bBox.y;
          var wBOB = bBox.x;
          var sBOB = bBox.y2;
          var eBOB = bBox.x2;

          if( (( nBOB < nBOS && nBOS < sBOB ) || //vertical overlap
                ( nBOB < sBOS && sBOS < sBOB )) &&
                (( wBOB < wBOS && wBOS < eBOB ) || //horizontal overlap
                ( wBOB < eBOS && eBOS < eBOB )) &&
                !(qpo.shots[i].data("hidden")) &&
                !(qpo.bombs[j].exploded)) {
            //console.log("bomb " + j + " hit shot " +i);
            qpo.shots[i].hide(); //make the shot disappear
            qpo.bombs[j].explode();
            qpo.shots[i].data("hidden",true);
            splicers.push(i);
          }
        }
      } //end iterating over bombs within shots
    }
  } //end iterating over shots

  if (qpo.bombs.length > 0){ //iterate over bombs (after checking if "bombs" exists)
    for (var i=0; i<qpo.bombs.length; i++) { //iterate over bombs
      if (qpo.bombs[i]){ //check if a bomb exists at index i
        var bombBox = qpo.bombs[i].phys.getBBox();
        var sBOB = bombBox.y2;
        var nBOB = bombBox.y;
        var eBOB = bombBox.x2;
        var wBOB = bombBox.x;
        //if an unexploded bomb hits a wall, explode it:
        if ( !(qpo.bombs[i].exploded) && (sBOB>425 || nBOB<75)){
          qpo.bombs[i].explode();
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
          var sBOU = nBOU + qpo.guiDimens.squareSize;
          var eBOU = wBOU + qpo.guiDimens.squareSize;

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
            if ( !(qpo.bombs[i].exploded)){
              qpo.bombs[i].explode();
            }
          }
        }//end iterating over units within bombs
        for (var j=0; j<qpo.bombs.length; j++) { //iterate over bombs within bombs
          if(qpo.bombs[j]){
            // When a bomb hits an unexploded bomb,
            // explode the bomb and get rid of the shot
            var bombBox2 = qpo.bombs[j].phys.getBBox();
            var nBOB2 = bombBox2.y;
            var wBOB2 = bombBox2.x;
            var sBOB2 = bombBox2.y + bombBox2.height;
            var eBOB2 = bombBox2.x + bombBox2.width;

            if( !(i==j) && //make sure we're really looking at 2 bombs.
                  (( nBOB2 <= nBOB && nBOB <= sBOB2 ) || //vertical overlap
                  ( nBOB2 <= sBOB && sBOB <= sBOB2 )) &&
                  (( wBOB2 <= wBOB && wBOB <= eBOB2 ) || //horizontal overlap
                  ( wBOB2 <= eBOB && eBOB <= eBOB2 )) &&
                  (!(qpo.bombs[i].exploded) || // make sure at least one is not-exploded
                  !(qpo.bombs[j].exploded))) {
              //explode any un-exploded ones:
              //console.log("bomb " + i + "hit bomb " + j);
              if (!(qpo.bombs[i].exploded)) {qpo.bombs[i].explode()}
              if (!(qpo.bombs[j].exploded)) {qpo.bombs[j].explode()}
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
    var sBOU = nBOU + qpo.guiDimens.squareSize;
    var eBOU = wBOU + qpo.guiDimens.squareSize;

    if (blueUnits[i].active) { //adjust for highlighting on active unit
      nBOU = nBOU + 2;
      sBOU = sBOU - 2;
      wBOU = wBOU + 2;
      eBOU = eBOU - 2;
    }

    //if the unit has hit a wall, stop the unit and place it snugly on the wall.
    if( nBOU < qpo.guiCoords.gameBoard.topWall ||
        wBOU < qpo.guiCoords.gameBoard.leftWall ||
        sBOU > qpo.guiCoords.gameBoard.bottomWall ||
        eBOU > qpo.guiCoords.gameBoard.rightWall
      ){
      blueUnits[i].rect.stop();
      if (nBOU < qpo.guiCoords.gameBoard.topWall){ blueUnits[i].rect.attr({"y":qpo.guiCoords.gameBoard.topWall}) }
      if (wBOU < qpo.guiCoords.gameBoard.leftWall){ blueUnits[i].rect.attr({"x":qpo.guiCoords.gameBoard.leftWall}) }
      if (sBOU > qpo.guiCoords.gameBoard.bottomWall){ blueUnits[i].rect.attr({"y": qpo.guiCoords.gameBoard.bottomWall-qpo.guiDimens.squareSize }) }
      if (eBOU > qpo.guiCoords.gameBoard.rightWall){ blueUnits[i].rect.attr({"x": qpo.guiCoords.gameBoard.rightWall-qpo.guiDimens.squareSize }) }
    }

    //WALL DETECTION RED
    //get the unit's borders:
    var nBOUr = redUnits[i].rect.getBBox().y;
    var wBOUr = redUnits[i].rect.getBBox().x;
    var sBOUr = nBOUr + qpo.guiDimens.squareSize;
    var eBOUr = wBOUr + qpo.guiDimens.squareSize;

    if (redUnits[i].active) { //adjust for highlighting on active unit
      nBOUr = nBOUr + 2;
      sBOUr = sBOUr - 2;
      wBOUr = wBOUr + 2;
      eBOUr = eBOUr - 2;
    }

    //if the unit has hit a wall, stop the unit and place it snugly on the wall.
    if (nBOUr < qpo.guiCoords.gameBoard.topWall || wBOUr < qpo.guiCoords.gameBoard.leftWall ||
        sBOUr > qpo.guiCoords.gameBoard.bottomWall || eBOUr > qpo.guiCoords.gameBoard.rightWall) {
      redUnits[i].rect.stop();
      if (nBOUr < qpo.guiCoords.gameBoard.topWall){ redUnits[i].rect.attr({"y":qpo.guiCoords.gameBoard.topWall}) }
      if (wBOUr < qpo.guiCoords.gameBoard.leftWall){ redUnits[i].rect.attr({"x":qpo.guiCoords.gameBoard.leftWall}) }
      if (sBOUr > qpo.guiCoords.gameBoard.bottomWall){ redUnits[i].rect.attr({"y": qpo.guiCoords.gameBoard.bottomWall-qpo.guiDimens.squareSize }) }
      if (eBOUr > qpo.guiCoords.gameBoard.rightWall){ redUnits[i].rect.attr({"x": qpo.guiCoords.gameBoard.rightWall-qpo.guiDimens.squareSize }) }
    }

    for (var j=0; j<ts; j++) { //iterate over red team of units within units
      //When units of opposite color collide, kill both units.

      var nBOU2 = redUnits[j].rect.getBBox().y;
      var wBOU2 = redUnits[j].rect.getBBox().x;
      var sBOU2 = nBOU2 + qpo.guiDimens.squareSize;
      var eBOU2 = wBOU2 + qpo.guiDimens.squareSize;

      if (redUnits[j].active) { //adjust for highlighting on active unit
        nBOU = nBOU + 2;
        sBOU = sBOU - 2;
        wBOU = wBOU + 2;
        eBOU = eBOU - 2;
      }

      if( (( nBOU <= nBOU2 && nBOU2 <= sBOU ) || //vertical overlap
          ( nBOU <= sBOU2 && sBOU2 <= sBOU ) ||
          ( nBOU2 <= nBOU && nBOU <= sBOU2 ) || //vertical overlap
          ( nBOU2 <= sBOU && sBOU <= sBOU2 )) &&
          (( wBOU <= wBOU2 && wBOU2 <= eBOU ) || //horizontal overlap
          ( wBOU <= eBOU2 && eBOU2 <= eBOU ) ||
          ( wBOU2 <= wBOU && wBOU <= eBOU2 ) ||
          ( wBOU2 <= eBOU && eBOU <= eBOU2 )) &&
          (redUnits[j].alive) && (blueUnits[i].alive)) {
        redUnits[j].kill();
        blueUnits[i].kill();
      }
    }//end iterating over red units
  } //end iterating over blue units

  // Splice shots out of the shots array, one by one.
  while (splicers.length > 0) {
    qpo.shots.splice(splicers[0],1);
    splicers.splice(0,1);
    for (var i=0;i<splicers.length;i++){
      splicers[i] -= 1;
    }
  }
}

function updateCPIcon(team, move){
  if (!qpo.activeGame.isEnding) { //As long as the game isn't ending, update the icon.
    var targetIcons = { //map the moveStr to the set of icons from which the active icon will be selected using blueActiveUnit / redActiveUnit
      "moveLeft" : controlPanel.icons.leftArrows,
      "moveUp" : controlPanel.icons.upArrows,
      "moveRight" : controlPanel.icons.rightArrows,
      "moveDown" : controlPanel.icons.downArrows,
      "shoot" : controlPanel.icons.rects,
      "bomb" : controlPanel.icons.bombs,
      "stay" : controlPanel.icons.circles
    }
    switch (team){ //hide icon for active unit, update the icon, and show  updated icon
      case "blue":
        controlPanel.actives[qpo.blueActiveUnit].hide();
        controlPanel.actives[qpo.blueActiveUnit] = targetIcons[move][qpo.blueActiveUnit];
        qpo.gui.push(controlPanel.actives[qpo.blueActiveUnit]);
        controlPanel.actives[qpo.blueActiveUnit].show();
        break;
      case "red":
        controlPanel.actives[qpo.redActiveUnit].hide();
        controlPanel.actives[qpo.redActiveUnit] = targetIcons[move][qpo.redActiveUnit];
        qpo.gui.push(controlPanel.actives[qpo.redActiveUnit]);
        controlPanel.actives[qpo.redActiveUnit].show();
        break;
      default: //"this was unexpected"
        console.log("this was unexpected");
    }
  }
}
function queueMove(move){
  //Takes in a string that should match one of the seven in the "moves" array (in the setup() function),
  //  sends the move to the server, updates the qpo.blueMovesQueue for the active unit

  // NOTES: the qpo.blueMovesQueue should be on the server eventually (as should the red).
  //   Also, create qpo.blue and qpo.red objects that will contain all the team-specific objects/vars
  sendMoveToServer(move);
  qpo.blueMovesQueue[qpo.blueActiveUnit] = move;
}
function sendMoveToServer(moveStr){
  // console.log(eval("new Date().getTime()"));
  qpo.timeSinceLastMsg = ( eval("new Date().getTime()") - qpo.lastMsgTime );
  // mlog("qpo.timeSinceLastMsg");
  if (qpo.timeSinceLastMsg > 100){ //if they've waited at least 100 ms:
    // qpo.socket.send(qpo.socketCodes[moveStr]);
    qpo.lastMsgTime = eval("new Date().getTime()");
  } else { //otherwise, tell them they're sending msgs too fast
    console.log("slow your roll, Mr. Jones");
  }
}

//LISTEN FOR INPUT
$(window).keydown(function(event){
  switch(event.keyCode){ //prevent defaults for backspace/delete and enter
    case 8: //backspace/delete
      event.preventDefault();
      break;
    case 13: //enter
      event.preventDefault();
      break;
    default:
      break;
  }
  switch(qpo.mode){ //do the right thing based on what type of screen the user is in (menu, game, tutorial, etc)
    case "menu":
      switch(event.keyCode){
        case 8: //backspace/delete
          if ( !(activeMenu=="main") ) {qpo.menus[activeMenu].up();}
          // console.log("backspace pressed");
          break;
        case 13: //enter
          try { activeButton.onclick(); }
          catch(err){ return false; } //do nothing if there is no activeButton
          break;
        case 87: //w
          event.preventDefault();
          qpo.menus[activeMenu].previous();
          break;
        case 83: //s
          event.preventDefault();
          qpo.menus[activeMenu].next();
          break;
        case 65: {  //a
          if (activeMenu=="customG"){
            try {
              qpo.menus["customG"].active.minus();
            }
            catch(err) {
              ;
            }
          }
          break;
        }
        case 68: {  //d
          if (activeMenu=="customG"){
            try {
              qpo.menus["customG"].active.plus();
            }
            catch(err) {
              ;
            }
          }
          break;
        }
        case 37: {  //left arrow
          if (activeMenu=="customG"){
            try {
              qpo.menus["customG"].active.minus();
            }
            catch(err) {
              ;
            }
          }
          break;
        }
        case 38: {  //up arrow
          event.preventDefault();
          qpo.menus[activeMenu].previous();
          break;
        }
        case 39: { //right arrow
          if (activeMenu=="customG"){
            try {
              qpo.menus["customG"].active.plus();
            }
            catch(err) {
              ;
            }
          }
          break;
        }
        case 40: { //down arrow
          event.preventDefault();
          qpo.menus[activeMenu].next();
          break;
        }
        default:
          break;
      }
      break;
    case "game":
      switch (event.keyCode){
        case 81: //q -- blue pressed bomb
          event.preventDefault();
          queueMove("bomb");
          updateCPIcon("blue","bomb");
          updateBlueAU(qpo.activeGame.po);
          break;
        case 69: //e -- blue pressed shoot
          event.preventDefault();
          queueMove("shoot");
          updateCPIcon("blue","shoot");
          updateBlueAU(qpo.activeGame.po);
          break;
        case 65: //a (move left)
          event.preventDefault();
          queueMove("moveLeft");
          updateCPIcon("blue","moveLeft");
          updateBlueAU(qpo.activeGame.po);
          break;
        case 87: //w (move up)
          event.preventDefault();
          queueMove("moveUp");
          updateCPIcon("blue","moveUp");
          updateBlueAU(qpo.activeGame.po);
          break;
        case 68: //d (move right)
          event.preventDefault();
          queueMove("moveRight");
          updateCPIcon("blue","moveRight");
          updateBlueAU(qpo.activeGame.po);
          break;
        case 83: //s (move down)
          event.preventDefault();
          queueMove("moveDown");
          updateCPIcon("blue","moveDown");
          updateBlueAU(qpo.activeGame.po);
          break;
        case 88: //x (stay)
          event.preventDefault();
          queueMove("stay");
          updateCPIcon("blue","stay");
          updateBlueAU(qpo.activeGame.po);
          break;

        default: //anything else
          break;
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
function startGame(settings){ //called when countdown reaches 0
  //settings are [q,po,multi,music,respawn]
  //GET RID OF MENU MUSIC
  // qpo.menuSong.pause();
  // qpo.menuSong.currentTime = 0 ;
  // clearInterval(qpo.menuSongInterval);

  qpo.activeGame = new qpo.Game(settings[0], settings[1], false, true, true); //10 for base-10
  qpo.redDead = 0;
  qpo.blueDead = 0;
  qpo.shots=[];
  qpo.bombs=[];

  try{qpo.menus["main"].blackness.hide();}
  catch(e){ console.log("no blackness to hide"); }

  drawGUI(qpo.activeGame.q,qpo.activeGame.po);
  placeUnits(settings[0]); // puts the units on the board
  qpo.blueActiveUnit = 0;
  qpo.redActiveUnit = 0;

  qpo.turnStarter = setInterval(newTurn,3000*qpo.timeScale);
  qpo.timer.animate({segment: [450, 250, 50, -90, -90]}, 3000*qpo.timeScale);

  qpo.collisionDetector = setInterval(function(){detectCollisions(qpo.activeGame.po)},10);
  qpo.mode = "game";
  console.log('NEW GAME');
}
qpo.snap = function(){ //correct unit positions just before the start of each turn
  // for each unit, check its grid position, stop the unit's animation,
  //   and put it in its proper place.
  var po = qpo.activeGame.po;
  var raphX;
  var raphY;
  for (var i = 0; i<po; i++){
    //Raphael x coord = leftWall + (qpoGridCoordX * qpoSquareSize)
    //Raphael y coord = topWall + (qpoGridCoordY * qpoSquareSize)
    if(blueUnits[i].alive){
      raphX = qpo.guiCoords.gameBoard.leftWall + (qpo.guiDimens.squareSize*blueUnits[i].x);
      raphY = qpo.guiCoords.gameBoard.topWall + (qpo.guiDimens.squareSize*blueUnits[i].y);
      blueUnits[i].phys.attr({"x":raphX, "y":raphY});
    }
    if(redUnits[i].alive){
      raphX = qpo.guiCoords.gameBoard.leftWall + (qpo.guiDimens.squareSize*redUnits[i].x);
      raphY = qpo.guiCoords.gameBoard.topWall + (qpo.guiDimens.squareSize*redUnits[i].y);
      redUnits[i].phys.attr({"x":raphX, "y":raphY});
    }
  }
};

qpo.countdownScreen = function(settings){ //settings are [q,po,multi,music,music]
  var numbers = c.text(c.width/2,c.height/2,"3")
    .attr({"font-size":72,"fill":"white"});
  setTimeout( //2
    function(){numbers.attr({"text":"2"})},
    1000);
  setTimeout( //1
    function(){numbers.attr({"text":"1"})},
    2000);
  setTimeout(function(){ //set blackness opacity to 0 when countdown is finished
             qpo.menus["main"].blackness.animate({"opacity":0},200,"<")},
             2800);
  setTimeout(function(){numbers.remove()},3000);
  setTimeout(function(){startGame(settings);},3000);
  qpo.mode="other";
}

function endGame(result){
  clearInterval(qpo.clockUpdater);
  clearInterval(qpo.collisionDetector);
  clearInterval(qpo.turnStarter);
  // clearInterval(qpo.snapper);

  qpo.gui.stop();
  qpo.gui.remove();
  qpo.menus["main"].blackness.animate({"opacity": 0.9},2000*qpo.timeScale);
  qpo.shots = [];
  qpo.bombs = [];
  units = [];
  (result == "red") ? (qpo.ali.nn.backward(2)) : (qpo.ali.nn.backward(0)); //reward AI for winning, not losing
  (result == "tie") ? (qpo.ali.nn.backward(1)) : (qpo.ali.nn.backward(0)); //reward it a little for tying
  qpo.activeSession.update(result); //add to the proper tally

  if(qpo.trainingMode){ //Stop and display results if counter is satisfied. Otherwise, start game.
    qpo.trainingCounter++;
    if (qpo.trainingCounter >= qpo.gamesToTrain){ // If game counter satisfied, check batch
      qpo.batchCounter++;
      // var newBatch = new qpo.Batch(qpo.activeSession);
      // qpo.trainingData.push(newBatch);
      qpo.trainingData.push(new qpo.Batch(qpo.activeSession));
      console.log("we got here...");
      if (qpo.batchCounter >= qpo.batchesToTrain){ // If batch counter satisfied, exit trainingMode
        qpo.trainingMode = false;
        qpo.menus["endG"] = new makeEndGameMenu(result); //generate the menus["endG"] GUI
        for (var i=0; i<qpo.batchesToTrain; i++){ // log each batch's data to console
          console.log(qpo.trainingData[i]);
        }
      }
      else { // If batch counter not exceeded, train another batch
        qpo.retrain();
      }
    }
    else { // If game counter not exceeded, train another game
      startGame([8,4]);
    }
  }
  else { // If we never were in training mode, display results
    qpo.menus["endG"] = new makeEndGameMenu(result); //generate the menus["endG"] GUI
  }


  // qpo.activeGame.song.pause();
  // qpo.activeGame.song.currentTime=0;
  // qpo.menuMusic();
}
function newRound(){
  qpo.menus["main"].blackness.attr({"opacity":1}).show();
  qpo.menus["endG"].all.remove();
  return qpo.countdownScreen(qpo.currentSettings);
}
