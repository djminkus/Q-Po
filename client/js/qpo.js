/** Q-PO : a JS game by @akaDavidGarrett

Q-Po is a competitive browser game that combines elements of real-time strategy games, top-down shooters,
  and turn-based strategy games, resulting in fast-paced, competitive gameplay that's easy to learn,
  but hard to master.

How to get familiar with the code:
  0. Open index.html in your browser window.
  1. Understand raphael.js basics.
  2. Look at qpo.setup() first.
  3. See menus.js.
  3. Pay attention with the startGame() and newTurn() functions. They will reference
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
    updateBlueAU() -- updates orange highlights on board and control panel
      (keyboard presses queue moves for the Active Unit)
    tick() -- makes the seconds clock tick down
    newTurn() -- starts a new turn, called every 3 seconds
    detectCollisions() -- detects collisions between game objects, called every 17 ms
  KEYDOWN HANDLER : detects and responds to keyboard input (arrows, spacebar, enter)
  SCREEN FUNCTIONS
    countdownScreen() -- Shows 3,2,1, then calls startGame()
    startGame() -- draws GUI, spawns units, and starts the game clock and collisionDetector
    endGame() -- removes the game gui elements and shows a menu
    newRound() -- called when player presses "new round" --
      hides the end-of-game menu and calls countdownScreen() again
    goMainMenu() --
*/

qpo = new Object();

console.log("RESET " + Date());
var c = new Raphael("raphContainer", 600, 600); //create the Raphael canvas

// CHOOSE A SONG:
var songURL = "./music/timekeeper.mp3"
// var songURL = "./music/qpo.mp3"                 // neil's first iteration
// var songURL =  "./music/loadingScreen.mp3"      // neil's menu song
// var songURL =  "./music/underwaterStars.mp3"  //uncomment for underwaterStars
// var song = new Audio("./music/qpo.mp3")            //  neil's first iteration
// var song = new Audio("./music/loadingScreen.mp3")        // neil's menu song
// var song = new Audio("./music/underwaterStars.mp3")  //uncomment for underwaterStars

c.customAttributes.segment = function (x, y, r, a1, a2) { //for pie timer
  var flag = (a2 - a1) > 180,
  color = (a2 - a1 + 120) / (360*5)  ;
  a1 = (a1 % 360) * Math.PI / 180;
  a2 = (a2 % 360) * Math.PI / 180;
  return {
    path: [["M", x, y], ["l", r * Math.cos(a1), r * Math.sin(a1)], ["A", r, r, 0, +flag, 1, x + r * Math.cos(a2), y + r * Math.sin(a2)], ["z"]],
    fill: "hsb(" + color + ", .75, .8)"
  };
};

qpo = {
  /* WEBSOCKET THINGS (NOT SOCKET.IO)
  "socket" : new WebSocket('ws://echo.websocket.org'), //this url will change
  "socketCodes" : {"bomb":0,"shoot":1,"moveLeft":2,"moveUp":3,"moveRight":4,"moveDown":5,"stay":6},
  */
  // "socket" : io(),
  "lastMoveTime" : new Date().getTime(),
  "moveName" : null,
  "timeSinceLastMove" : null, //time since keyboard stroke was most recently processed as a move
  "cpIconsGens" : [85, 475, 20, 10, 40] //centers and radius -- for (leftmost) controlPanel icons
}

qpo.menuMusic = function(){
  if (!(qpo.menuSong)){ qpo.menuSong = new Audio(songURL); } //load song if it hasn't been loaded yet
  if (qpo.activeGame){ //stop game song and reset it
    qpo.activeGame.song.pause();
    qpo.activeGame.song.currentTime=0;
  }
  qpo.menuSong.currentTime = 0;
  qpo.menuSong.play();
  // if (qpo.playMusic) { // loop the menuSong every 1 minute and 48 seconds
  //   qpo.en
  //   qpo.menuSongInterval = setInterval(function(){
  //     qpo.menuSong.currentTime = 0;
  //     qpo.menuSong.play();
      // console.log("playing menu song again.");
    // },113000);
  // }
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

  // TOP-LEVEL SETTINGS:
  qpo.timeScale = 0.5; // Bigger means slower; 1 is original 3-seconds-per-turn
  qpo.playMusic = false;
  qpo.trainingMode = false;
  qpo.waitTime = 100; //ms between moves
  qpo.gameLength = 40;
  qpo.unitStroke = 10;
  qpo.bombStroke = 3;
  qpo.SHOT_LENGTH = 0.5; //ratio of shot length to unit length
  qpo.SHOT_WIDTH = 0.1; //ratio of shot width to unit length

  // (DNA): STATIC DICTS N ARRAYS
  qpo.spawnTimers = [null, 1,2,3,3,4,4,5,5]; //index is po
  qpo.keyCodes = { //pair keycodes with move strings
    81:"bomb",
    69:"shoot",
    65:"moveLeft",
    87:"moveUp",
    68:"moveRight",
    83:"moveDown",
    88:"stay"
  }
  qpo.COLOR_DICT = { //define colors using hex
    "blue": "#0055bb",
    "red": "#bb0000",
    "orange": "#ffbb66",
    "green": "#00bb55",
    "purple":"#bb00bb",
    "grey": "#bbbbbb",

    "background": "#000000", //black is 0
    "foreground": "#ffffff", //white is f
  };
  qpo.moves = ["moveUp","moveDown","moveLeft","moveRight","shoot","bomb","stay"];
  qpo.difficPairings = [4, 6, 8, 10, 13, 16, 20]; //array index is po-1. Value at index is recommended q for said po.
  qpo.dirMap = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  // NEURAL STUFF:
  (qpo.trainingMode) ? (qpo.timeScale=0.05) : (qpo.timeScale=0.5) ;
  qpo.trainingCounter = 0;
  qpo.batchCounter = 0;
  qpo.gamesToTrain = 30; // games per batch
  qpo.batchesToTrain = 3; // batches to train
  qpo.trainingData = new Array(); // store sessions (win/loss data)
  qpo.aiTypes = ["neural","rigid","random"];
  qpo.aiType = qpo.aiTypes[0]; // controls source of red's moves in singlePlayer
  qpo.trainerOpponent = qpo.aiTypes[2]; // controls source of blue's moves in training mode
  qpo.retrain = function(){ // get ready to train another batch.
    qpo.trainingCounter = 0;
    qpo.trainingMode = true;
  }

  //MISC (ETC + DYNAMIC/UTILITY ARRAYS)
  qpo.gui = c.set(); // Should contain only elements relevant to the current screen.
  qpo.blueUnits = [];
  qpo.redUnits = [];
  qpo.unitLists = {
    "red" : qpo.redUnits,
    "blue" : qpo.blueUnits
  }
  qpo.blueMovesQueue = [];
  qpo.redMovesQueue = [];
  qpo.shots = [];
  qpo.bombs = [];
  qpo.blueActiveUnit = 0;
  qpo.redActiveUnit = 0;
  qpo.board = {};
  playerColor = "blue"; // for now
  opponentColor = "red";

  (function(){ //SET UP DIMENSIONS AND COORDINATES:
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
      },
      "turnTimer" : {
        "x" : 450,
        "y" : 250,
        "r" : 50
      }
    };
    qpo.guiDimens = { //width of panels, square size, # columns, # rows
      "gpWidth" : 600, //game panel width
      "gpHeight" : 600, //game panel height
      "tpWidth" : 300, //tut panel width
      "tpHeight": 200, //tut panel height
      "squareSize" : 50,
      "columns" : 7,
      "rows" : 7,
      "CROSS_SIZE": 7
    }
    qpo.guiCoords.gameBoard.width = qpo.guiDimens.columns * qpo.guiDimens.squareSize,
    qpo.guiCoords.gameBoard.height = qpo.guiDimens.rows * qpo.guiDimens.squareSize;
  })();

  qpo.bombSize = 2*qpo.guiDimens.squareSize;

  //MAKE MUSIC (or don't)
  (qpo.playMusic) ? (qpo.menuMusic()) : (console.log("no music mode!"));

  //DEFINE SOME NICE FUNCTIONS...
  qpo.add = function(a,b){ return (a+b); }
  qpo.findSlot = function(array){ //find the first empty slot in an array
    var slot = 0;
    while(slot < array.length){
      if(!array[slot]){ break; }
      slot += 1;
    }
    return slot;
  }
  qpo.rotatePath = function(path, dir){ //pass in a Raphael "path" object and return a rotated version of it
    //Used for arrows that are drawn pointing up.
    var pathStr = path.attr('path');
    var matrix = Raphael.matrix();
    switch(dir){ //make the right matrix
      case 'left':
        matrix.rotate(90); //90 deg cw, 3 times.
      case 'down':
        matrix.rotate(90); //again (no break from switch)
      case 'right':
        matrix.rotate(90); //again
      case 'up':
        break;
      default:
        console.log('this was unexpected');
    }
    var transString = matrix.toTransformString();
    var old = pathStr;
    pathStr = Raphael.transformPath(pathStr, transString);
    path.attr({'path':pathStr});
  }
  qpo.blink = function(raph, time){ //make something's opacity go to 0, then come back to 1
    var anim1 = Raphael.animation({'opacity':0}, (time || 1000), '<', function(){raph.animate(anim2)});
    var anim2 = Raphael.animation({'opacity':1}, (time || 1000), '>', function(){raph.animate(anim1)});
    raph.animate(anim1);
  }
  qpo.fadeOut = function(set, extra, time){ //fade out a Raph set and do an extra function after it fades
    var TIME = time || 300; //ms
    var anim = Raphael.animation({'opacity':0}, TIME);
    set.animate(anim);
    setTimeout(function(){ //after delay, remove set and do extra()
      set.remove();
      extra();
    }, TIME);
  };
  qpo.fadeIn = function(set, time){ //fade in a Raph set
    var TIME = time || 500; //ms
    set.attr({'opacity':0});
    set.show();
    var anim = Raphael.animation({'opacity':1}, TIME);
    set.animate(anim);
  };
  qpo.cross = function(x,y){ //draw a little crosshair/plus-symbol thing centered on x,y
    var set = c.set();
    var hcs = qpo.guiDimens.CROSS_SIZE/2 ; //half cross size
    set.push(c.path('M' + (x-hcs) + ',' + y + 'L' + (x+hcs) + "," + y)); //vert section
    set.push(c.path('M' + x + ',' + (y-hcs) + 'L' + x + "," + (y+hcs))); //vert section
    set.attr({"stroke-width":2, 'stroke':qpo.COLOR_DICT['foreground']});
    return set;
  }
  qpo.arrow = function(x,y,color,dir){ //draw an arrow (centered at x,y) pointing in direction dir
    //x,y are centers, not corners
    //dir is direction
    var d = { //dimensions
      'l': 10, //length (half of arrow's body)
      't': 8, //tips
      's': qpo.activeGame.scaling, //scaling
      'q' : .8 //ratio between tip's x and y dimens
    }
    //Make the arrow
    var pathStr = 'm-' + d.t*d.q + ',0' //+ d.t/Math.sqrt(2)
      + 'l'+d.t*d.q+',-'+d.t
      + 'l'+d.t*d.q+','+d.t;
    var atts = {'stroke':color,'stroke-width': 4, 'stroke-linecap':'round'};
    var arrow = c.path(pathStr).attr(atts); //make the Raph el
    // console.log('initial path: ' + pathStr)

    //Scale it up:
    pathStr = Raphael.transformPath(pathStr, 's'+d.s); //scale the arrow's path string
    // console.log('path after scaling: ' + pathStr)

    arrow.attr({'path':pathStr}); //remake the arrow with the new scaled path

    //rotate it:
    qpo.rotatePath(arrow, dir);
    pathStr = arrow.attr('path'); //remake the arrow with the new translated path

    // console.log('path after rotating: ' + pathStr);

    pathStr = Raphael.transformPath(pathStr, 't'+x+','+y);
    arrow.attr({'path':pathStr}); //remake the arrow with the new translated path
    // console.log('path after translating: ' + pathStr);

    return arrow;
  }
}
qpo.setup();

qpo.findSpawn = function(color){
  //CHOOSE A ROW.
  var foundSpawn;
  var demerits = [new Array(), new Array()];
  var po = qpo.activeGame.po;
  var q = qpo.activeGame.q
  for(var i=0; i<q; i++){ //populate demerits with zeros
    demerits[0].push(0);
    demerits[1].push(0);
  }
  //APPLY BLOCKS : enemy side (TODO: enemy proximity, shots/bombs)
  if (color == "blue"){ //block red side (rows po/2 through po-1)
    for (var i=0; i<Math.floor(q/2); i++){ demerits[0][i+Math.floor(q/2)]++; }
    if (q%2 == 1){ demerits[0][q-1]++; } //fix blue spawn glitch (happens for odd q)
  }
  else { //block blue side
    for (var i=0; i<Math.floor(q/2); i++){ demerits[0][i]++; }
    if (q%2 == 1){ demerits[0][Math.floor(q/2)]++; } //block middle row
  }
  //TODO: APPLY BOOSTS : friendly side, friendly proximity

  //TODO: SELECT row and column based on demerits. (base this on rigid ai.)
  // console.log("demerits: " + demerits);
  // console.log("demerits[0]: " + demerits[0]);

  var fewestDemerits = [100,100]; //a comparer
  for (var i=0; i<demerits[0].length;i++){ //find the lowest number of demerits
    if(demerits[0][i]<fewestDemerits[0]){ fewestDemerits[0] = demerits[0][i]; }
    if(demerits[1][i]<fewestDemerits[1]){ fewestDemerits[1] = demerits[1][i]; }
  }
  //find rows with least demerits and columns with least demerits:
  var choices = [[],[]]; //rows, columns
  var utilIndex = [0,0];
  var increment = [false,false];
  for (var i=0; i<demerits[0].length; i++){ //0 and 1 have same lengths
    if(demerits[0][i]==fewestDemerits[0]){ //this row is a candidate.
      choices[0][utilIndex[0]] = i;
      increment[0] = true;
    }
    if(demerits[1][i]==fewestDemerits[1]){ //this col is a candidate.
      choices[1][utilIndex[1]] = i;
      increment[1] = true;
    }
    (increment[0] == true) ? (utilIndex[0]+=1) : (null);
    (increment[1] == true) ? (utilIndex[1]+=1) : (null);
    increment = [false,false];
  }
  //choose random choices from "choices" arrays:
  var chosenRow = choices[0][Math.floor(Math.random()*choices[0].length)];
  var chosenColumn = choices[1][Math.floor(Math.random()*choices[1].length)];

  // console.log("choices[0]: " + choices[0]);
  // console.log("choices[1]: " + choices[1]);

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
qpo.Board = function(cols, rows, x, y, m){ //return the Raph set of all the static game board els
  this.all = c.set();

  this.mtr = m || qpo.guiDimens.squareSize; //mtr for meter, or unit size, the quantum of q-po.

  this.rows = rows;
  this.cols = cols;

  this.width = cols * qpo.guiDimens.squareSize;
  this.height = rows * qpo.guiDimens.squareSize;

  this.lw = x || qpo.guiCoords.gameBoard.leftWall;
  this.tw = y || qpo.guiCoords.gameBoard.topWall;
  this.rw = this.lw + this.width;
  this.bw = this.tw + this.height;

  qpo.guiDimens.columns = cols;
  qpo.guiDimens.rows = rows;
  qpo.guiCoords.gameBoard.width = qpo.guiDimens.squareSize * qpo.guiDimens.columns;
  qpo.guiCoords.gameBoard.height = qpo.guiDimens.squareSize * qpo.guiDimens.rows;

  qpo.guiCoords.gameBoard.rightWall = qpo.guiCoords.gameBoard.leftWall + qpo.guiCoords.gameBoard.width;
  qpo.guiCoords.gameBoard.bottomWall = qpo.guiCoords.gameBoard.topWall + qpo.guiCoords.gameBoard.height;
  var sideWalls = c.set(
    c.path('M'+qpo.guiCoords.gameBoard.leftWall+','+qpo.guiCoords.gameBoard.topWall +
      'L'+qpo.guiCoords.gameBoard.leftWall+','+qpo.guiCoords.gameBoard.bottomWall)
      .attr({'stroke-width':3, 'stroke':qpo.COLOR_DICT['foreground'], 'opacity':1}),
    c.path('M'+qpo.guiCoords.gameBoard.rightWall+','+qpo.guiCoords.gameBoard.topWall +
      'L'+qpo.guiCoords.gameBoard.rightWall+','+qpo.guiCoords.gameBoard.bottomWall)
      .attr({'stroke-width':3, 'stroke':qpo.COLOR_DICT['foreground'], 'opacity':1})
  );
  this.all.push(sideWalls);

  qpo.board.goalLines = c.set().push(
    c.path('M'+qpo.guiCoords.gameBoard.leftWall+','+qpo.guiCoords.gameBoard.topWall +
      'L'+qpo.guiCoords.gameBoard.rightWall+','+qpo.guiCoords.gameBoard.topWall)
      .attr({'stroke-width':3, 'stroke':qpo.COLOR_DICT['red'], 'opacity':1}),
    c.path('M'+qpo.guiCoords.gameBoard.leftWall+','+qpo.guiCoords.gameBoard.bottomWall +
      'L'+qpo.guiCoords.gameBoard.rightWall+','+qpo.guiCoords.gameBoard.bottomWall)
      .attr({'stroke-width':3, 'stroke':qpo.COLOR_DICT['blue'], 'opacity':1})
  );
  this.all.push(qpo.board.goalLines);

  var crossSize = qpo.guiDimens.CROSS_SIZE;
  var hcs = crossSize/2 //Half Cross Size

  qpo.board.verts = c.set();
  for (var i=1; i<cols; i++) { //create the vertical marks
    for (var j=1; j<rows; j++){
      var xCoord = qpo.guiCoords.gameBoard.leftWall + (i*qpo.guiDimens.squareSize);
      var yCoord1 = qpo.guiCoords.gameBoard.topWall + (j*qpo.guiDimens.squareSize-hcs);
      var yCoord2 = yCoord1 + crossSize;
      var newString = ("M" + xCoord + "," + yCoord1 + "L" + xCoord + "," + yCoord2);
      var newMark = c.path(newString);
      qpo.board.verts.push(newMark);
    }
  }

  qpo.board.hors = c.set();
  for (var i=1; i<rows; i++) { //create the horizontal marks
    for (var j=1; j<cols; j++){
      var yCoord = qpo.guiCoords.gameBoard.topWall + (i*qpo.guiDimens.squareSize);
      var xCoord1 = qpo.guiCoords.gameBoard.leftWall + (j*qpo.guiDimens.squareSize-hcs);
      var xCoord2 = xCoord1 + crossSize;
      var newString = ("M" + xCoord1 + "," + yCoord + "L" + xCoord2 + "," + yCoord);
      var newMark = c.path(newString);
      qpo.board.verts.push(newMark);
    }
  }

  qpo.board.crosses = c.set().push(qpo.board.hors, qpo.board.verts).attr({'stroke':qpo.COLOR_DICT['foreground']});
  this.all.push(qpo.board.crosses);

  qpo.gui.push(this.all);
  return this.all; //return the Raph set
}

qpo.placeUnits = function(){ //called from startGame()
  //  Place U units on an NxM board (N columns, M rows)
  //  Remember that rows and columns are zero-indexed.
  //  Also, blue is on top, red on bottom.
  //    1. Board must be at least 3x3.
  //    2. If board has a center panel (M and N are odd), don't place units there. (Column N/2, Row M/2.)
  //    3. NxM/2 spaces are available per team. (NXM/2-1 if both are odd.) Choose U random, mutually-exclusive
  //         spaces from these possiblities, and place units there.
  //    4. Don't place units in such a way that two opposing units spawn "touching" each other.

  var gridXs = []; // the column numbers of each blue unit to be placed
  var gridY = [] // the row numbers of each blue unit to be placed

  qpo.units = []; //all Units (red and blue);
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
  for (var i=0; i<qpo.activeGame.po; i++) { // Make a new unit at the spot
    chooseSpots(i);
    qpo.blueUnits[i] = makeUnit("blue",gridXs[i],gridY[i],i);
    qpo.redUnits[i] = makeUnit("red", qpo.guiDimens.columns-1-gridXs[i], qpo.guiDimens.rows-1-gridY[i],i);
    qpo.units.push(qpo.blueUnits[i]);
    qpo.units.push(qpo.redUnits[i]);
    // console.log("blue unit created in column " + gridXs[i] + ", row " + gridY[i]);
    // console.log("red unit created in column " + (qpo.guiDimens.columns-1-gridXs[i])
    //   + ", row " + (qpo.guiDimens.rows-1-gridY[i]));
    //evens are blue, odds are red, low numbers to the left
  }
  qpo.blueUnits[0].activate();
}

qpo.startControlPanel = function(po){
  var leftWall = qpo.guiCoords.gameBoard.leftWall;
  var bottomWall = qpo.guiCoords.gameBoard.bottomWall;
  var rightWall = qpo.guiCoords.gameBoard.rightWall;
  var width = qpo.guiCoords.gameBoard.width;
  var height = qpo.guiCoords.cp.height;
  var widthEach = width/po;
  this.po = po;
  // this.outline = c.rect(leftWall, bottomWall, width, height).attr({
  //   "stroke-width": 3, 'stroke': qpo.COLOR_DICT['foreground']
  // });
  this.outline = c.set(
    c.path('M'+ leftWall +','+ bottomWall +'L'+ leftWall +','+ (bottomWall+height) ), //left wall
    c.path('M'+ rightWall +','+ bottomWall +'L'+ rightWall +','+ (bottomWall+height) ), //left wall
    c.path('M'+ leftWall +','+ (bottomWall+height) +'L'+ rightWall +','+ (bottomWall+height) ) //bottom wall
  ).attr({'stroke-width':3, 'stroke':qpo.COLOR_DICT['foreground']});
  this.widthEach = widthEach;
  this.disabled = false;

  this.orange = c.rect(leftWall+3, bottomWall+3, widthEach-6, height-6).attr(
      {"stroke":qpo.COLOR_DICT["orange"],"stroke-width":4});
  this.secLines = c.set();
  //DRAW SECTION LINES
  (function(cp){
    // var secLines = c.set();
    // for(var i = 1; i<cp.po; i++){ //push each to the set
    //   secLines.push(c.path("M"+ (leftWall + i*widthEach + "," + bottomWall +
    //                        "L" + (leftWall + i*widthEach) + "," + (bottomWall + height)) ));
    // }
    // cp.secLines.push(secLines);
    qpo.cpIconsGens = [ //make some coordinates
      leftWall + widthEach/2, //x coord of center of first icon
      bottomWall + height/2, //y coord
      10, 5, 20 //size of arrows, circle, and rects, respectively (?)
    ]
    // "cpIconsGens" : [85, 475, 20, 10, 40] //centers and radius -- for (leftmost) controlPanel icons
    qpo.cpIconCoords = [qpo.cpIconsGens[0]+qpo.cpIconsGens[2], qpo.cpIconsGens[0]-qpo.cpIconsGens[2], //x ends -- for controlPanel icons
            qpo.cpIconsGens[1]+qpo.cpIconsGens[2], qpo.cpIconsGens[1]-qpo.cpIconsGens[2]]; //y ends --for controlPanel icons
  })(this);
  this.secLines.attr({'stroke':qpo.COLOR_DICT['foreground']});

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
                     qpo.cpIconsGens[3]*2/3,qpo.cpIconsGens[4]*2/3).attr({"fill":qpo.COLOR_DICT["green"],
                                            "stroke":qpo.COLOR_DICT["green"],
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
                     2*qpo.cpIconsGens[3],2*qpo.cpIconsGens[3]).attr({"fill":qpo.COLOR_DICT["purple"],
                                            "stroke":qpo.COLOR_DICT["purple"],
                                            "opacity":0.6})],
    "ones" : [c.text(qpo.cpIconsGens[0], qpo.cpIconsGens[1], "1").attr({qpoText:[30,"black"]})],
    "twos" : [c.text(qpo.cpIconsGens[0], qpo.cpIconsGens[1], "2").attr({qpoText:[30,"gray"]})],
    "threes" : [c.text(qpo.cpIconsGens[0], qpo.cpIconsGens[1], "3").attr({qpoText:[30,"gray"]})],
    "fours" : [c.text(qpo.cpIconsGens[0], qpo.cpIconsGens[1], "4").attr({qpoText:[30,"gray"]})],
    "fives" : [c.text(qpo.cpIconsGens[0], qpo.cpIconsGens[1], "5").attr({qpoText:[30,"gray"]})],
  };
  (function(cp){ //color the greyscale icons
    var these = c.set();
    var icons = cp.icons;
    these.push(icons.circles[0], icons.leftArrows[0], icons.rightArrows[0], icons.upArrows[0],
      icons.downArrows[0], icons.ones[0], icons.twos[0], icons.threes[0], icons.fours[0], icons.fives[0]);
    these.attr({'stroke':qpo.COLOR_DICT['foreground'], 'stroke-width':2});
  })(this);
  this.actives = new Array(); //would be better named "displayed". An array of the po icons shown in the control panel.

  qpo.cpMap = [null, this.icons.ones, this.icons.twos,
    this.icons.threes, this.icons.fours, this.icons.fives];

  this.all = c.set();
}
qpo.finishControlPanel = function(cp){
  for (var i=1; i<cp.po; i++){ //make one set of icons per po
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
    cp.icons.ones[i] = cp.icons.ones[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
    cp.icons.twos[i] = cp.icons.twos[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
    cp.icons.threes[i] = cp.icons.threes[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
    cp.icons.fours[i] = cp.icons.fours[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
    cp.icons.fives[i] = cp.icons.fives[0].clone().attr(
      {"transform":("t" + cp.widthEach*i + "," + 0)});
  }
  cp.targetIcons = { //map the moveStr to one set of [po identical] icons
    "moveLeft" : controlPanel.icons.leftArrows,
    "moveUp" : controlPanel.icons.upArrows,
    "moveRight" : controlPanel.icons.rightArrows,
    "moveDown" : controlPanel.icons.downArrows,
    "shoot" : controlPanel.icons.rects,
    "bomb" : controlPanel.icons.bombs,
    "stay" : controlPanel.icons.circles,
    "death" : controlPanel.icons.xs
  }
  cp.resetIcons = function(){ //at start of every turn, reset icons to circles and numbers
    for (var i=0; i<cp.po; i++){ //act on each po's icons separately
      controlPanel.actives[i] = controlPanel.icons.circles[i];
      (function(){ // hide all icons
        cp.icons.rightArrows[i].hide();
        cp.icons.leftArrows[i].hide();
        cp.icons.upArrows[i].hide();
        cp.icons.downArrows[i].hide();
        cp.icons.rects[i].hide();
        cp.icons.bombs[i].hide();
        cp.icons.circles[i].hide();
        cp.icons.ones[i].hide();
        cp.icons.twos[i].hide();
        cp.icons.threes[i].hide();
        cp.icons.fours[i].hide();
        cp.icons.fives[i].hide();
        cp.icons.xs[i].hide();
      })();
      try { // show circle, spawn timer, or x
        if (qpo.blueUnits[i].alive){ // reset to circle
          controlPanel.actives[i].hide();
          controlPanel.actives[i] = controlPanel.icons.circles[i];
          qpo.gui.push(controlPanel.actives[i]);
        }
        else { //show spawn timer or x
          if (qpo.activeGame.respawnEnabled){ //show spawn timer and turn orange on, or don't.
            var st = qpo.unitLists[qpo.playerTeam][i].spawnTimer // this is after it's been decremented in newTurn
            controlPanel.actives[i]= qpo.cpMap[st + 1][i]; //so compensate here.
            if(st == 0 && qpo.blueActiveUnit == i){controlPanel.enable();} //
          }
          else { //show x
            controlPanel.actives[i] = controlPanel.icons.xs[i];
          }
          qpo.gui.push(controlPanel.actives[i]);
        }
      }       //end try
      catch(e){ // if an error is thrown, show x
        // qpo.err = e;
        cp.actives[i] = cp.icons.xs[i];
        qpo.gui.push(controlPanel.actives[i]);
      }       //end catch
      controlPanel.actives[i].show();
    }
  } ;
  cp.enable = function(){ //turn the orange on (if active unit is eligible)
    try{
      if(qpo.unitLists["blue"][qpo.blueActiveUnit].spawnTimer < 1){
        cp.orange.attr({"stroke":qpo.COLOR_DICT["orange"]});
        cp.disabled = false;
      }
    }
    catch(err){;}//if err, that unit doesn't exist so the game's ended so do nothing
  } ;
  cp.disable = function(){ //turn the orange off and queue it to be turned on, or don't
    cp.orange.attr({"stroke":"grey"});
    cp.disabled = true;
    setTimeout(function(){cp.enable()}, qpo.waitTime);
  } ;
  cp.accept = function(event, nau){ //allow keyboard input to affect the controlPanel
    // (change the icon, move the highlight, and update the blue active unit)
    // NAU is Number of Active Unit (i.e. qpo.blueUnits.activeUnit.num)
    event.preventDefault();
    var code = event.keyCode; //get the keyCode
    var move = qpo.keyCodes[code]; //translate it into a string like "moveLeft","shoot",or "bomb"
    // console.log("controlPanel.accept() called, move is " + move);
    // call the proper functions on that string:
    qpo.sendMoveToServer(move);
    qpo.blueMovesQueue[qpo.blueActiveUnit] = move;
    controlPanel.changeIcon(move);
    qpo.updateBlueAU(qpo.activeGame.po, "move"); //move highlight on CP and board
  } ;
  cp.changeIcon = function(move){
    if (!qpo.activeGame.isEnding) { //As long as the game isn't ending, update the icon.
      //hide icon for active unit, update the icon, and show updated icon
      try{ //do things
        controlPanel.actives[qpo.blueActiveUnit].hide();
        controlPanel.actives[qpo.blueActiveUnit] = controlPanel.targetIcons[move][qpo.blueActiveUnit];
        qpo.gui.push(controlPanel.actives[qpo.blueActiveUnit]);
        controlPanel.actives[qpo.blueActiveUnit].show();
      }
      catch(err){
        console.log(err.message);
      } //game already ended, do nothing
    }
  }
  cp.moveHighlight = function(howMuch){
    // INSTANT SNAP
    controlPanel.orange.attr({'x': (controlPanel.orange.attr('x') + howMuch)});
    // SMOOTH BOUNCE (glitchy)
    //   (When interrupted, the box ends up in wonky places.)
    // var prevX = controlPanel.orange.attr('x');
    // var newX = prevX + howMuch;
    // controlPanel.orange.animate({'x': newX}, qpo.waitTime, "bounce", function(){
    //   controlPanel.orange.attr({'x': newX}); }
    // );
  }
  cp.all.push(cp.outline, cp.secLines, cp.orange,
    cp.icons.circles, cp.icons.rightArrows, cp.icons.leftArrows,
    cp.icons.upArrows, cp.icons.downArrows, cp.icons.xs,
    cp.icons.rects, cp.icons.bombs, cp.icons.ones,
    cp.icons.twos, cp.icons.threes, cp.icons.fours, cp.icons.fives,
    cp.actives);
  qpo.gui.push(cp.all);
}

qpo.drawGUI = function(q,po){ //create the turn timer (pie), board, and control panel.
  qpo.gui.push(c.rect(0, 0, qpo.guiDimens.gpWidth, qpo.guiDimens.gpHeight) //background
    .attr({"fill":qpo.COLOR_DICT['background']}));
  (function(){ //Turn timer (pie)
    var t = qpo.guiCoords.turnTimer; //t.x, t.y, t.r are x center, y center, and radius of timer
    qpo.timer = {"value": qpo.activeGame.lastTurn};
    qpo.timer.pie = c.path().attr({segment: [t.x, t.y, t.r, -90, 269],"stroke":"none"});
    qpo.timer.text = c.text(t.x, t.y, qpo.activeGame.lastTurn).attr({qpoText:[30,qpo.COLOR_DICT['foreground']]});
    qpo.timer.all = c.set(qpo.timer.pie,qpo.timer.text)
    qpo.timer.update = function(){ //Count down the digits (called @ end of every turn)
      if(qpo.timer.value>0){
        qpo.timer.value--;
        qpo.timer.text.attr({"text":qpo.timer.value});
      }
    }
    qpo.gui.push(qpo.timer.all);
  })();
  qpo.activeGame.board = new qpo.Board(q, q); // draw the board (but not the units)
  // controlPanel = new qpo.startControlPanel(po);
  // qpo.finishControlPanel(controlPanel);
  qpo.activeGame.board.goalLines.toFront();
  qpo.scoreBoard = qpo.makeScoreboard();
}

//INCREMENT FUNCTIONS (no new Raph elements created)

qpo.newTurn = function(){ // called every time game clock is divisible by 3
  // qpo.activeGame.turnNumber++;
  qpo.activeGame.incrementTurn();
  qpo.timer.update();
  qpo.moment = new Date();

  //// AI SECTION
  // Record reward events that happened this turn:
  qpo.sixty.list[qpo.sixty.cursor] = qpo.redRewardQueue.reduce(qpo.add,0);
  qpo.sixty.cursor = (qpo.sixty.cursor == 59) ? 0 : (qpo.sixty.cursor + 1); //cycle the cursor
  qpo.redRewardQueue = [];
  // Each turn, reward AI for favorable events, and get an action for each ai-controlled unit:
  try{qpo.ali.nn.backward(qpo.sixty.list.reduce(qpo.add,0));} // try to reward
  catch(err){console.log("can't train without having acted.");} // but will fail if no actions have been taken
  // Manage the game state variables and get input array for nn:
  qpo.activeGame.prevState = qpo.activeGame.state;
  qpo.activeGame.state = qpo.activeGame.getState();
  var input = qpo.convertStateToInputs(qpo.activeGame.state);

  //// SPAWN SECTION
  var completedSpawnIndices = new Array();
  var spawn, spawnTurn, spawnerTeam;
  for(var i=0; i<qpo.activeGame.upcomingSpawns.length; i++){ //if it's the right turn, spawn the unit.
    spawn = qpo.activeGame.upcomingSpawns[i];
    spawnTurn = spawn[0];
    spawnerTeam = spawn[2];
    spawnerNum = spawn[1];
    if(spawnTurn == qpo.activeGame.turnNumber){ //if it's time, spawn the unit.
      qpo.unitLists[spawnerTeam][spawnerNum].spawn();
      completedSpawnIndices.push(i);
    }
    else{qpo.unitLists[spawnerTeam][spawnerNum].spawnTimer--;} //otherwise, reduce its timer
  }
  for(var i=0; i<completedSpawnIndices.length; i++){
     //remove the spawn with that index from the array,
     //  and decrement all higher indices in the list.
    var index = completedSpawnIndices[i];
    qpo.activeGame.upcomingSpawns.splice(index,index+1);
    for (var j=i; j<completedSpawnIndices.length; j++){ //decrement all higher indices in the list.
      if(completedSpawnIndices[j]>index){completedSpawnIndices[j]--;}
    }
  }

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
          qpo.redMovesQueue[i] = findMove(qpo.redUnits[i]);
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
            qpo.blueMovesQueue[i] = findMove(qpo.blueUnits[i]);
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
    if (qpo.redUnits[i].alive){
      switch(qpo.redMovesQueue[i]) {
        case "moveLeft" :
          qpo.redUnits[i].move('left');
          break;
        case "moveUp" :
          qpo.redUnits[i].move('up');
          break;
        case "moveRight" :
          qpo.redUnits[i].move('right');
          break;
        case "moveDown" :
          qpo.redUnits[i].move('down');
          break;
        case "shoot" :
          qpo.redUnits[i].shoot();
          break;
        case "bomb" :
          qpo.redUnits[i].bomb();
          break;
        case "stay" :
          qpo.redUnits[i].stay();
          break;
      }
    }

    //execute blue's moves:
    if (qpo.blueUnits[i].alive){
      switch(qpo.blueMovesQueue[i]) {
        case "moveLeft" :
          qpo.blueUnits[i].move('left');
          break;
        case "moveUp" :
          qpo.blueUnits[i].move('up');
          break;
        case "moveRight" :
          qpo.blueUnits[i].move('right');
          break;
        case "moveDown" :
          qpo.blueUnits[i].move('down');
          break;
        case "shoot" :
          qpo.blueUnits[i].shoot();
          break;
        case "bomb" :
          qpo.blueUnits[i].bomb();
          break;
        case "stay" :
          qpo.blueUnits[i].stay();
          break;
      }
    }

    //clear/reset the move queues:
    qpo.redMovesQueue[i]="stay";
    qpo.blueMovesQueue[i]="stay";

    qpo.blueUnits[i].resetIcon();
  }
  if(qpo.activeGame.turnNumber == qpo.activeGame.lastTurn-1){
    //Stop allowing units to shoot and bomb.
    //Stop counting down numbers on the timer.
    //Start checking whether all shots and bombs are off the board. If so, end the game.
    for(var i=0; i<qpo.blueUnits.length; i++){qpo.blueUnits[i].deactivate()}
  }

  if (!qpo.trainingMode){ //animate the pie, but not in training mode
    qpo.timer.pie.attr({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, 269]});
    qpo.timer.pie.animate({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, -90]}, 3000*qpo.timeScale);
  }
  if (qpo.activeGame.turnNumber == qpo.activeGame.lastTurn){ //End the game, if it's time.
    if (qpo.activeGame.isEnding == false){ //find the winner and store to gameResult
      var gameResult;
      qpo.blueActiveUnit = 50;
      qpo.redActiveUnit = 50;
      if (qpo.scoreBoard.redScore==qpo.scoreBoard.blueScore) { gameResult = "tie"; }
      else if (qpo.scoreBoard.redScore > qpo.scoreBoard.blueScore) { gameResult = "red"; }
      else { gameResult = "blue"; }
      qpo.activeGame.isEnding = true;
      setTimeout(function(){endGame(gameResult);}, 3000*qpo.timeScale);
    }
  }
}
qpo.snap = function(){ //correct unit positions just before the start of each turn
  for (var i=0; i<qpo.activeGame.po; i++){
    if(qpo.blueUnits[i].alive){ qpo.blueUnits[i].snap(); }
    if(qpo.redUnits[i].alive){ qpo.redUnits[i].snap(); }
  }
};

//IFFY TO IMPLEMENT DUE TO USAGE OF LOGIC SPECIFIC TO
//  EACH TYPE OF OBJECT WITHIN detectCollisions()
// qpo.objectsAreColliding = function(object1,object2){
//   //object1 and 2 are Raphael objects -- specifically rects in this case
//   var box1 = object1.getBBox();
//   var sb1 = box1.y2;
//   var nb1 = box1.y;
//   var wb1 = box1.x;
//   var eb1 = box1.x2;
//
//   var box2 = object2.getBBox();
//   var sb2 = box2.y2;
//   var nb2 = box2.y;
//   var wb2 = box2.x;
//   var eb2 = box2.x2;
//
//   (box1.x > box2.x && box1.x2) ? (return true;) : (return false;){
// }

qpo.detectCollisions = function(ts){ //ts is teamSize, aka po
  // called every 10 ms once game has begun
  var splicers = []; //used for destroying references to shots once they're gone
  // OUTLINE
  // for each shot, check for collisions with units and bombs
  // for each bomb, check for collisions with bombs and units
  // for each unit, check for collisions with units on the other team
  // TODO (MAYBE): shots --> shots
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
    for (var j=0; j<qpo.units.length; j++) { //iterate over units within shots
      /*
      When a shot and a unit collide, hide both
      the shot and the unit from the board,
      tell them they're hidden (Element.data("hidden",true))
      and remove them from their respective arrays
      */
      var unitBox = qpo.units[j].rect.getBBox();

      var nBOU = unitBox.y;
      var wBOU = unitBox.x;
      var sBOU = nBOU + qpo.guiDimens.squareSize;
      var eBOU = wBOU + qpo.guiDimens.squareSize;

      if( (( nBOU < nBOS && nBOS < sBOU ) || //vertical overlap
          ( nBOU < sBOS && sBOS < sBOU )) &&
          (( wBOU < wBOS && wBOS < eBOU ) || //horizontal overlap
          ( wBOU < eBOS && eBOS < eBOU )) &&
          !(qpo.shots[i].data("hidden")) &&
          (qpo.units[j].alive)) {
        qpo.shots[i].hide(); //make the shot disappear
        qpo.units[j].kill();
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
        for (var j=0; j<qpo.units.length; j++) { //iterate over units within bombs

          // When a bomb and a unit collide, kill the unit
          //   and check if the bomb is exploded. If the bomb
          //   is not exploded, explode it.


          var nBOU = qpo.units[j].rect.getBBox().y;
          var wBOU = qpo.units[j].rect.getBBox().x;
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
              (qpo.units[j].alive)) {
            qpo.units[j].kill();
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

  //ITERATE OVER UNITS HERE. We have the qpo.blueUnits and qpo.redUnits arrays as well
  //  as the "units" array. Check for collisions with walls and for collisions between
  //  units of opposite colors.
  for (var i=0; i<ts; i++){ //iterate over blue team of units
    //Get the blue unit's borders
    if(qpo.blueUnits[i].alive){ //detect some collisions
      var nBOU = qpo.blueUnits[i].rect.getBBox().y + 1; //make it 1 pixel smaller than it really is, to fix collisions glitch
      var wBOU = qpo.blueUnits[i].rect.getBBox().x + 1;
      var sBOU = nBOU + qpo.guiDimens.squareSize - 2;
      var eBOU = wBOU + qpo.guiDimens.squareSize - 2;

      //if the blue unit has hit a wall, stop the unit and place it snugly on the wall.
      if( nBOU < qpo.guiCoords.gameBoard.topWall ||
          wBOU < qpo.guiCoords.gameBoard.leftWall ||
          sBOU > qpo.guiCoords.gameBoard.bottomWall ||
          eBOU > qpo.guiCoords.gameBoard.rightWall
        ){
        if (sBOU > qpo.guiCoords.gameBoard.bottomWall){ //South wall. Score.
          // var testC = c.circle(300, qpo.guiCoords.gameBoard.bottomWall ,20).attr({'stroke':'white'});
          // var testC2 = c.circle(200, sBOU, 20).attr({'stroke':'purple'});
          // var testC3 = c.circle(100, qpo.blueUnits[i].rect.getBBox().y + qpo.guiDimens.squareSize -1, 20).attr({'stroke':'pink'}) ;
          // setTimeout(function(){
          //   testC.remove()
          // }, 500);
          qpo.blueUnits[i].score('collision');
        }
        else{ //Other wall. Stop and snap
          qpo.blueUnits[i].phys.stop();
          qpo.blueUnits[i].snap();
        }
      }

      if(qpo.redUnits[i].alive){ //wall detection red
        //get the red unit's borders:
        var nBOUr = qpo.redUnits[i].rect.getBBox().y + 1 ;
        var wBOUr = qpo.redUnits[i].rect.getBBox().x + 1 ;
        var sBOUr = nBOUr + qpo.guiDimens.squareSize - 2;
        var eBOUr = wBOUr + qpo.guiDimens.squareSize - 2;

        //if the red unit has hit a wall, stop the unit and place it snugly on the wall.
        if (nBOUr < qpo.guiCoords.gameBoard.topWall || wBOUr < qpo.guiCoords.gameBoard.leftWall ||
            sBOUr > qpo.guiCoords.gameBoard.bottomWall || eBOUr > qpo.guiCoords.gameBoard.rightWall) {
          qpo.redUnits[i].phys.stop();
          qpo.redUnits[i].snap();
          if (nBOUr < qpo.guiCoords.gameBoard.topWall){ qpo.redUnits[i].score(); }
        }
      }

      for (var j=0; j<ts; j++) { //iterate over red team of units
        if (qpo.redUnits[j].alive){
          var nBOU2 = qpo.redUnits[j].rect.getBBox().y + 1;
          var wBOU2 = qpo.redUnits[j].rect.getBBox().x + 1;
          var sBOU2 = nBOU2 + qpo.guiDimens.squareSize - 2;
          var eBOU2 = wBOU2 + qpo.guiDimens.squareSize - 2;

          if( (( nBOU <= nBOU2 && nBOU2 <= sBOU ) || //vertical overlap
              ( nBOU <= sBOU2 && sBOU2 <= sBOU ) ||
              ( nBOU2 <= nBOU && nBOU <= sBOU2 ) || //vertical overlap
              ( nBOU2 <= sBOU && sBOU <= sBOU2 )) &&
              (( wBOU <= wBOU2 && wBOU2 <= eBOU ) || //horizontal overlap
              ( wBOU <= eBOU2 && eBOU2 <= eBOU ) ||
              ( wBOU2 <= wBOU && wBOU <= eBOU2 ) ||
              ( wBOU2 <= eBOU && eBOU <= eBOU2 )) ) {
            qpo.redUnits[j].kill();
            qpo.blueUnits[i].kill();
          }
        }
      }//end iterating over red units
    }
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

qpo.updateBlueAU = function(po, cond){ //Called when a command is sent and when a unit dies.
  // Cond is condition (either "move" or "death"), the reason this function's being called.
  // Deactivate the old active unit. Find the next 'eligible' unit and activate it,
  // ("eligible" means "alive or about to be alive"),
  // Update the "blueActiveUnit" var
  var findingUnit = true;
  var ind = qpo.blueActiveUnit + 1;
  var tries = 0;
  var oldBlueAU, newBlueAU;
  while (findingUnit) { // keep looking until you find the new active unit.
    if (ind == po) { ind = 0; }
    newBlueAU = qpo.blueUnits[ind];
    oldBlueAU = qpo.blueUnits[qpo.blueActiveUnit];
    //When you find the new one, deactivate the old unit, activate the new one, and update qpo.blueActiveUnit.
    if ((newBlueAU.spawnTimer < 1) && (qpo.activeGame.isEnding == false)){
      //  This is our new active unit. It's either alive or about to be. Do stuff. Also...
      //  The game isn't ending, and it's been long enough since the last move.
      findingUnit = false; //unit has now been found. Exit the While loop after this iteration.
      // qpo.moveHighlights(oldBlueAU, newBlueAU, ind);
      qpo.blueActiveUnit = ind;
      qpo.blueUnits[ind].activate();
    }
    ind++;
    tries++;
    if (tries == po) { // No units are eligibile for activation. Stop looking and make sure the loop exits.
      findingUnit = false;
    }
  }
}
qpo.moveHighlights = function(old, neww, index){ //not in use. revive when orange is "slid" from unit to unit
  old.deactivate(); //turn off old highlight on gameboard
  neww.activate(); // turn on new hightight on gameboard
}
qpo.sendMoveToServer = function(moveStr){
  // console.log(eval("new Date().getTime()"));
  qpo.timeSinceLastMove = ( eval("new Date().getTime()") - qpo.lastMoveTime );
  // mlog("qpo.timeSinceLastMove");
  if (qpo.timeSinceLastMove > qpo.waitTime){ //if they've waited at least 100 ms:
    // qpo.socket.send(qpo.socketCodes[moveStr]);
    qpo.lastMoveTime = eval("new Date().getTime()");
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
        case 8: //backspace/delete: return to the previous menu
          if (activeMenu != "main") {qpo.menus[activeMenu].up();}
          break;
        case 13: //enter
          try {activeButton.onclick();}
          catch(err){;} //do nothing if there is no activeButton
          if(activeMenu == "title"){qpo.menus.title.close()}
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
            try { qpo.menus["customG"].active.minus(); }
            catch(err) { ; }
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
            try { qpo.menus["customG"].active.plus(); }
            catch(err) { ; }
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
      try { //try to respond to the keypress appropriately
        if (qpo.blueUnits[qpo.blueActiveUnit].spawnTimer>0){ //If active unit is dead and not spawning next turn, try moving to another unit (as a fallback:)
          event.preventDefault();
          qpo.updateBlueAU(qpo.activeGame.po, "dead");
        }
        else { //Otherwise, respond to the keypress
          switch(event.keyCode){
            case 81:
            case 69:
            case 65:
            case 87:
            case 68:
            case 83:
            case 88: //qweasdx detected (order)
              var moveStr = qpo.keyCodes[event.keyCode];
              // console.log('keypress detected: ' + event.keyCode + ', leading to moveStr' + qpo.keyCodes[event.keyCode]);
              qpo.blueUnits[qpo.blueActiveUnit].order(moveStr);
              qpo.updateBlueAU(qpo.activeGame.po, "move"); //activate the new AU and board
              // controlPanel.accept(event);
              break;
            case 37:
            case 38:
            case 39:
            case 40: //up/left/right/down arrows (move highlight)
              // console.log('arrow key detected: ' + qpo.dirMap[event.keyCode]);
              if(!qpo.gameEnding){ qpo.blueUnits[qpo.blueActiveUnit].search(qpo.dirMap[event.keyCode]); }
              break;
            default: //some other key detected (invalid)
              //left = 37
              // up = 38
              // right = 39
              // down = 40
              "some other key";
              // tab = 9
              break;
          }
        }
      }
      catch(err){ //probably because qpo.blueUnits[-1] doesn't exist. do nothing.
        ;
      }
      break;
    case "tut":
      switch(event.keyCode){
        case 13: //enter
          qpo.tut.tutFuncs.enter();
          break;
        case 69: //"e"
          qpo.tut.tutFuncs.ekey();
          break;
        case 8: // backspace
          c.clear();
          qpo.menus.main = new qpo.makeMainMenu();
          break;
        default:
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
qpo.countdownScreen = function(settings){ //settings are [q, po, multi, music, respawn, turns]
  qpo.cdblackness = c.rect(0, 0, qpo.guiCoords.gamePanel.width, qpo.guiCoords.gamePanel.height);
  qpo.cdblackness.attr({"fill":"black"});
  var numbers = c.text(c.width/2,c.height/2,"3").attr({qpoText:[72]});
  setTimeout( //2
    function(){numbers.attr({"text":"2"})},
    1000);
  setTimeout( //1
    function(){numbers.attr({"text":"1"})},
    2000);
  setTimeout(function(){ //set blackness opacity to 0 when countdown is finished
             qpo.menus["main"].blackness.animate({"opacity":0},200,"<");
             qpo.cdblackness.animate({"opacity":0},200,"<");
             }, 2800);
  setTimeout(function(){numbers.remove()},3000);
  setTimeout(function(){startGame(settings);},3000);
  qpo.mode="other";
}

function startGame(settings){ //called when countdown reaches 0
  //settings are [q, po, multi, music, respawn, turns]

  // KILL MENU MUSIC:
  // qpo.menuSong.pause();
  // qpo.menuSong.currentTime = 0 ;
  // clearInterval(qpo.menuSongInterval);

  qpo.activeGame = new qpo.Game(settings[0], settings[1], settings[2], true, true, qpo.gameLength);
  qpo.redDead = 0;
  qpo.blueDead = 0;
  qpo.shots=[];
  qpo.bombs=[];

  try{qpo.menus["main"].blackness.hide();}
  catch(e){ console.log("no blackness to hide"); }

  qpo.drawGUI(qpo.activeGame.q, qpo.activeGame.po);
  qpo.placeUnits(settings[0]); // puts the units on the board
  qpo.blueActiveUnit = 0;
  qpo.redActiveUnit = 0;

  qpo.turnStarter = setInterval(qpo.newTurn,3000*qpo.timeScale);
  qpo.timer.pie.animate({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, -90]}, 3000*qpo.timeScale);

  qpo.collisionDetector = setInterval(function(){qpo.detectCollisions(qpo.activeGame.po)},100);

  qpo.mode = "game";
  console.log('NEW GAME');
}
function endGame(result){
  clearInterval(qpo.clockUpdater);
  clearInterval(qpo.collisionDetector);
  clearInterval(qpo.turnStarter);
  // var date1, date2
  // date1 = new Date().getMilliseconds();
  qpo.gui.stop();
  // date2 = new Date().getMilliseconds();
  // console.log('Stopping the gui took' + date2 - date1 + ' ms.')
  // console.log(date1);
  qpo.gui.animate({'opacity':0}, 2000, 'linear');
  setTimeout(function(){ //clear things and profit
    qpo.gui.clear();
    c.clear();
    qpo.shots = [];
    qpo.bombs = [];
    qpo.units = [];
    (result == "red") ? (qpo.ali.nn.backward(2)) : (qpo.ali.nn.backward(0)); //reward AI for winning, not losing
    (result == "tie") ? (qpo.ali.nn.backward(1)) : (qpo.ali.nn.backward(0)); //reward it a little for tying
    try{qpo.activeSession.update(result);} //add to the proper tally. Will throw error in tut mode.
    catch(e){;} //don't bother adding to the proper tally in tut mode.
    if(qpo.trainingMode){ //If in training mode, decide whether to train another game.
      qpo.trainingCounter++;
      if (qpo.trainingCounter >= qpo.gamesToTrain){ // If game counter satisfied, check batch
        qpo.batchCounter++;
        // var newBatch = new qpo.Batch(qpo.activeSession);
        // qpo.trainingData.push(newBatch);
        qpo.trainingData.push(new qpo.Batch(qpo.activeSession));
        console.log("we got here...");
        if (qpo.batchCounter >= qpo.batchesToTrain){ // If batch counter satisfied, exit trainingMode
          qpo.trainingMode = false;
          qpo.menus["endG"] = new qpo.makeEndGameMenu(result); //generate the menus["endG"] GUI
          for (var i=0; i<qpo.batchesToTrain; i++){ // log each batch's data to console
            console.log(qpo.trainingData[i]);
          }
        }
        else { qpo.retrain(); }// If batch counter not exceeded, train another batch
      }
      else { startGame([8,4]); }// If game counter not satisfied, train another game
    }
    else if (qpo.activeGame.type == 'tut'){ //set mode back to 'tut' and show the next tutorial scene
      qpo.mode = 'tut';
      qpo.tut.tutFuncs.enter();
    }
    else{ qpo.menus["endG"] = new qpo.makeEndGameMenu(result); } //we're not in tutorial or training. Generate the menus["endG"] GUI
  }, 2000);

  // qpo.activeGame.song.pause();
  // qpo.activeGame.song.currentTime=0;
  // qpo.menuMusic();
}
function newRound(){
  // qpo.menus["main"].blackness.attr({"opacity":1}).show();
  qpo.menus["endG"].all.remove();
  return qpo.countdownScreen(qpo.currentSettings);
}

// module.exports = qpo;
