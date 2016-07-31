/** Q-PO : A lean action-strategy game designed for competitive and collaborative online multiplayer.

Q-Po is a competitive game that combines elements of real-time strategy games, top-down shooters,
  and turn-based strategy games, resulting in fast-paced, competitive gameplay that's easy to learn,
  but hard to master.

How to get familiar with the code:
  0. Open index.html in your browser window.
  1. Understand raphael.js basics.
  2. Look at qpo.setup() first.
  3. See menus.js.
  3. Pay attention to the startGame() and newTurn() functions. They reference
    the other functions in a logical order.
  To understand the first thing you see when you load the page,
    look at menus.js. When a new game is started, countdownScreen()
    is called. This leads to startGame() being called, which leads to newTurn()
    being called every three seconds.

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

LONG-TERM TODO:
  See Issues/Feature Requests on Github:
    https://github.com/djminkus/QPO/issues
  [   ] Improve neural networks AI
  [   ] User login/profile system
  [   ] Implement Ranking System
  [   ] Open beta and advertise
  [   ] Improve game based on beta feedback
  [   ] Release 1.0
  [   ] Throw $$ tourney
  --- MAYBES
  [   ] Implement Subscription System

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

c.customAttributes.segment = function (x, y, r, a1, a2) { //for pie timer
  var flag = (a2 - a1) > 180,
  color = (a2 - a1 + 120) / (360*5)  ;
  a1 = (a1 % 360) * Math.PI / 180;
  a2 = (a2 % 360) * Math.PI / 180;
  return {
    path: [["M", x, y], ["l", r * Math.cos(a1), r * Math.sin(a1)], ["A", r, r, 0, +flag, 1, x + r * Math.cos(a2), y + r * Math.sin(a2)], ["z"]],
    stroke: "hsb(" + color + ", .75, .8)",
    'stroke-width': 2 //,
    // fill: "hsb(" + color + ", .75, .8)"
  };
};

var songURL = "./music/timekeeper.mp3"
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
  qpo.timeScale = 0.5; // Bigger means longer turns; 1 is original 3-seconds-per-turn
  qpo.playMusic = false;
  qpo.trainingMode = false;
  qpo.waitTime = 100; //ms between moves
  qpo.unitStroke = 3.5;
  qpo.bombStroke = 3;
  qpo.iconStroke = 2;
  qpo.pinchAmount = 20; //pixels for pinch animaton
  qpo.SHOT_LENGTH = 0.5; //ratio of shot length to unit length
  qpo.SHOT_WIDTH = 0.1; //ratio of shot width to unit length

  // (DNA): STATIC DICTS N ARRAYS
  qpo.spawnTimers = [null, 1,2,2,2,3,3,3,4]; //index is po
  qpo.keyCodes = { //pair keycodes with move strings
    81:"bomb",
    69:"shoot",
    65:"moveLeft",
    87:"moveUp",
    68:"moveRight",
    83:"moveDown",
    88:"stay",
    32:'shoot',
    66:'bomb'
  }
  qpo.COLOR_DICT = { //define colors using hex
    "blue": "#0055ff",
    "red": "#e00000",
    "orange": "#ffbb66",
    "green": "#00bb55",
    "purple":"#bb00bb",

    "background": "#000000", //black is 0
    "grey": "#bbbbbb",
    "foreground": "#ffffff" //white is f
  };
  qpo.moves = ["moveUp","moveDown","moveLeft","moveRight","shoot","bomb","stay"];
  qpo.dirMap = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };
  qpo.userExpLevels = new Array();
  for(var i=0; i<100; i++){qpo.userExpLevels[i] = 100*i + Math.pow(2, i/5)}
  qpo.missions = new Array();
  // qpo.missions[0] = new qpo.Mission([false, 0, false]);

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
  qpo.shots = [];
  qpo.bombs = [];
  qpo.blueActiveUnit = 0;
  qpo.redActiveUnit = 0;
  qpo.board = {};
  playerColor = "blue"; // for now
  opponentColor = "red";
  qpo.glows = c.set(); //separate from GUI for opacity reasons

  (function(){ //SET UP DIMENSIONS AND COORDINATES:
    qpo.guiCoords = { // cp height, gameBoard wall locations, gamePanel vs debugPanel
      "cp" : {
        "height" : 100,
      },
      "gameBoard" : {
        "lw" : 25,
        "topWall" : 75,
        "bottomWall" : 75+350
        // 'rightWall' : 25+350
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
    raph.show();
    var anim1 = Raphael.animation({'opacity':0}, (time || 1000), '<', function(){raph.animate(anim2)});
    var anim2 = Raphael.animation({'opacity':1}, (time || 1000), '>', function(){raph.animate(anim1)});
    raph.animate(anim1);
  }
  qpo.fadeOut = function(set, extra, time){ //fade out a Raph set and do an extra function after it fades
    var TIME = time || 300; //ms
    var set = set;
    set.attr({'opacity':1}); //
    var anim = Raphael.animation({'opacity':0}, TIME);
    set.animate(anim);
    setTimeout(function(){ //after delay, remove set and do extra()
      set.remove();
      extra();
    }.bind(set), TIME);
  };
  qpo.fadeIn = function(set, time, extra){ //fade in a Raph set and do something after it's been faded in
    var TIME = time || 500; //ms
    var func = extra || function(){};
    set.attr({'opacity':0});
    set.show();
    var anim = Raphael.animation({'opacity':1}, TIME);
    set.animate(anim);
    setTimeout(func, TIME);
  };
  qpo.fadeOutGlow = function(glow, extra, time){
    var TIME = time || 300; //ms
    var func = extra || function(){;};
    var set = glow;
    var anim = Raphael.animation({'opacity':0}, TIME);
    set.animate(anim);
    setTimeout(function(){ //after delay, remove set and do extra()
      set.remove();
      func();
    }.bind(set), TIME);
  }
  qpo.fadeInGlow = function(glow, extra, time){
    var TIME = time || 500; //ms
    var func = extra || function(){};
    var opacity = glow.items[0][0].attr('opacity');
    glow.attr({'opacity':0});
    glow.animate({'opacity':opacity}, TIME);
    setTimeout(func, TIME);
  }
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
    var atts = {'stroke':color,'stroke-width': 3, 'stroke-linecap':'round'};
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
  qpo.pinch = function(el, stroke){ //takes in raph el, returns a set of orange lines pinching in on it
    var strk = stroke || qpo.unitStroke;
    var time = 50;
    var box = el.getBBox();
    var set = c.set();
    var top = c.path('M'+box.x+','+box.y+' L'+box.x2+','+box.y).data('which','top');
    var right = c.path('M'+box.x2+','+box.y+' L'+box.x2+','+box.y2).data('which','right');
    var bottom = c.path('M'+box.x+','+box.y2+' L'+box.x2+','+box.y2).data('which','bottom');
    var left = c.path('M'+box.x+','+box.y+' L'+box.x+','+box.y2).data('which','left');
    set.push(top, right, bottom, left);
    set.attr({'stroke':qpo.COLOR_DICT["orange"], 'stroke-width':strk});
    set.forEach(function(each){ // each is Raph element
      var box = each.getBBox();
      switch(each.data('which')){
        case 'top': {
          each.animate({
            "0%": {'transform':'t'+'0,-'+qpo.pinchAmount},
            "100%": {'transform':'', 'opacity':0.3}
          }, time)
          break;
        }
        case 'right': {
          each.animate({
            "0%": {'transform':'t'+qpo.pinchAmount+',0'},
            "100%": {'transform':'', 'opacity':0.3}
          }, time)
          break;
        }
        case 'bottom': {
          each.animate({
            "0%": {'transform':'t'+'0,'+qpo.pinchAmount},
            "100%": {'transform':'', 'opacity':0.3}
          }, time)
          break;
        }
        case 'left': {
          each.animate({
            "0%": {'transform':'t-'+qpo.pinchAmount+',0'},
            "100%": {'transform':'', 'opacity':0.3}
          }, time)
          break;
        }
      }
    })
    return set;
  }
}();

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

//FUNCTIONS THAT CREATE RAPH ELEMENTS
qpo.Board = function(cols, rows, x, y, m){ //Board class constructor
  this.all = c.set();

  this.mtr = m || qpo.guiDimens.squareSize; //mtr for meter, or unit size (in pixels)--the length quantum of q-po.
  qpo.guiDimens.squareSize = this.mtr; //make sure they agree

  this.rows = rows;
  this.cols = cols;

  this.width = cols * this.mtr;
  this.height = rows * this.mtr;

  this.lw = x || qpo.guiCoords.gameBoard.leftWall;
  this.tw = y || qpo.guiCoords.gameBoard.topWall;
  this.rw = this.lw + this.width;
  this.bw = this.tw + this.height;

  // var bulge = 25; //for curved sides experiment
  // this.lw1 = this.lw - bulge;
  // this.rw1 = this.rw + bulge;
  // this.vm = (this.tw + this.bw)/2 //vertical middle

  qpo.guiDimens.columns = cols;
  qpo.guiDimens.rows = rows;
  qpo.guiCoords.gameBoard.width = this.mtr * qpo.guiDimens.columns;
  qpo.guiCoords.gameBoard.height = this.mtr * qpo.guiDimens.rows;

  // var leftWall = c.path('M'+this.lw+','+(this.tw-1) + 'Q'+this.lw1+','+this.vm+','+this.lw+','+(this.bw+1));
  // var rightWall = c.path('M'+this.rw+','+(this.tw-1) + 'Q'+this.rw1+','+this.vm+','+this.rw+','+(this.bw+1));
  var leftWall = c.path('M'+this.lw+','+(this.tw-1) + 'V'+(this.bw+1));
  var rightWall = c.path('M'+this.rw+','+(this.tw-1) + 'V'+(this.bw+1));
  var sideWalls = c.set(leftWall, rightWall)
      .attr({'stroke-width':3, 'stroke':qpo.COLOR_DICT['foreground'], 'opacity':1})
      // .transform('t0,-1000');
  this.all.push(sideWalls);

  var blueGoal = c.path('M'+this.lw+','+this.tw + 'L'+this.rw+','+this.tw).attr({'stroke':qpo.COLOR_DICT['blue']});
  var redGoal = c.path('M'+this.lw +','+this.bw + 'L'+this.rw+','+this.bw).attr({'stroke':qpo.COLOR_DICT['red']});
  var goalLines = c.set().push(blueGoal, redGoal).attr({'stroke-width':3, 'opacity':1})
  this.all.push(goalLines);
  sideWalls.toFront();

  var blueGlow = blueGoal.glow({'color':qpo.COLOR_DICT['blue']})
  var redGlow = redGoal.glow({'color':qpo.COLOR_DICT['red']})
  qpo.glows = c.set(blueGlow, redGlow).hide(); //the raphael glow sets

  this.outline = c.set(sideWalls, goalLines);

  var dotSize = 2;
  this.dots = c.set();
  for (var i=1; i<cols; i++) { //create the grid dots
    for (var j=1; j<rows; j++){
      var xCoord = this.lw + (i*this.mtr);
      var yCoord = this.tw + (j*this.mtr);
      var newDot = c.circle(xCoord, yCoord, dotSize);
      this.dots.push(newDot);
    }
  }
  this.dots.attr({'fill':qpo.COLOR_DICT['foreground'], 'stroke-width':0, 'opacity':0});
  this.all.push(this.dots);

  if(qpo.mode=='game'){ //slide the walls in from off-screen
    sideWalls.transform('t0,-700');
    goalLines.transform('t-700,0');
    this.outline.animate({'transform':''}, 1000, '');
    setTimeout(function(){ //fade in dots and show glows
      qpo.fadeIn(this.dots, 1000);
      setTimeout(function(){qpo.glows.show()}, 2000);
    }.bind(this), 500);
  }
  else{ qpo.glows.show() } //show glows immediately if not animating board
  qpo.gui.push(this.all);
  return this; //return the constructed Board object
}

qpo.placeUnits = function(){ //called at the start of each game (from startGame)
  //  Place U units randomly but symmetrically on an NxM board (N columns, M rows)
  //  Remember that rows and columns are zero-indexed.
  //  Also, blue is on top, red on bottom.
  //    0. Board must be at least 3x3.
  //    1. If board has a center panel (M and N are odd), don't place units there. (Column N/2, Row M/2.)
  //    2. NxM/2 spaces are available per team. (NXM/2-1 if both are odd.) Choose U random, mutually-exclusive
  //         spaces from these possiblities, and place units there.
  //    3. Don't place units in such a way that two opposing units spawn touching each other.

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
    qpo.blue.units[i] = new qpo.Unit("blue",gridXs[i],gridY[i],i);
    qpo.red.units[i] = new qpo.Unit("red", qpo.guiDimens.columns-1-gridXs[i], qpo.guiDimens.rows-1-gridY[i],i);
    qpo.units.push(qpo.blue.units[i]);
    qpo.units.push(qpo.red.units[i]);
    qpo.blue.units[i].phys.attr({'opacity':0});
    qpo.red.units[i].phys.attr({'opacity':0});

    (function(ind){ //fade in all units
      qpo.fadeIn(qpo.blue.units[ind].phys, 1000);
      qpo.fadeIn(qpo.red.units[ind].phys, 1000);
    })(i); //closure for loop scope

    (function(ind){ //highlight player's units in sequence
      setTimeout(function(){
        if(ind>0){qpo.blue.units[ind-1].deactivate();}
        qpo.fadeIn(qpo.blue.units[ind].phys, 1000);
        qpo.blue.units[ind].activate();
      }, 3000 + i*(1500/qpo.activeGame.po));
    })(i); //closure for loop scope
  }

  setTimeout(function(){ //activate first unit in prep for game
    qpo.blue.units[qpo.activeGame.po-1].deactivate();
    qpo.blue.units[0].activate();
    setTimeout(function(){qpo.blue.units[0].deactivate()},100);
    setTimeout(function(){qpo.blue.units[0].activate()},200);
    setTimeout(function(){qpo.blue.units[0].deactivate()},300);
    setTimeout(function(){qpo.blue.units[0].activate()},400);
  }, 4500);
}

qpo.Scoreboard = function(yAdj){ //draw the scoreboard and push to gui
  this.redScore = 0;
  this.blueScore = 0;

  this.redScoreText = c.text(430,100+yAdj, "0").attr({qpoText: [25, qpo.COLOR_DICT["red"]]});
  this.redSection = c.set().push(this.redScoreText);

  this.blueScoreText = c.text(470,100+yAdj, "0").attr({qpoText: [25, qpo.COLOR_DICT["blue"]]});
  this.blueSection = c.set().push(this.blueScoreText);

  this.update = function(color){
    this.redScoreText.attr({"text":qpo.red.points});
    this.blueScoreText.attr({"text":qpo.blue.points});
  }

  this.all = c.set().push(this.redSection, this.blueSection).attr({'opacity':0});

  setTimeout(function(){qpo.fadeIn(this.all, 1500);}.bind(this), 3000);
  qpo.gui.push(this.all);
  return this;
};
qpo.Timer = function(yAdj){ //draw the turn timer and push to gui
  var t = qpo.guiCoords.turnTimer; //t.x, t.y, t.r are x center, y center, and radius of timer
  t.y += yAdj
  var STUPID = 30;
  this.value = STUPID || qpo.activeGame.turns;
  this.pie = c.path().attr({segment: [t.x, t.y, t.r, -90, 269],"stroke":"none",'opacity':0});
  this.text = c.text(t.x, t.y, STUPID || qpo.activeGame.turns).attr({qpoText:[30,qpo.COLOR_DICT['foreground']]});
  this.all = c.set(this.pie,this.text).attr({'opacity':0})
  if (qpo.mode == 'game') {setTimeout(function(){ qpo.fadeIn(this.all, 1500)}.bind(this), 3000) }
  else { this.all.attr({'opacity':1}) }
  // this.all.attr({'opacity':0});
  this.update = function(){ //Count down the digits (called @ end of every turn)
    if(this.value>0){
      this.value--;
      this.text.attr({"text":this.value});
    }
  }.bind(this);
  qpo.gui.push(this.all);
  return this;
}

//INCREMENT FUNCTIONS (no new Raph elements created)
qpo.newTurn = function(){ // called every time game clock is divisible by 3
  qpo.activeGame.turnNumber++;
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

  //// MOVE EXECUTION SECTION
  qpo.snap(); //snap all units into their correct positions prior to executing new moves
  var po = qpo.activeGame.po; //for convenience
  var ru = null; //red unit, for convenience
  var bu = null; //blue unit, for convenience
  for (var i=0; i<po; i++){ //Generate AI moves & execute all moves
    ru = qpo.activeGame.teams.red.units[i];
    bu = qpo.activeGame.teams.blue.units[i];

    if (!qpo.multiplayer){ // Generate AI moves
      if(ru.alive){ //Generate a move from random, rigid, or neural AI
        switch(qpo.aiType){
          case "random": {
            ru.nextAction = qpo.moves[Math.round(Math.random()*6)];
            break;
          }
          case "rigid": {
            ru.nextAction = findMove(qpo.red.units[i]);
            break;
          }
          case "neural": {
            input[217] = i-0.5-(po/2); //generate a zero-mean input representing chosen unit
            var action = qpo.ali.nn.forward(input); // Have the AI net generate a move (integer)
            ru.nextAction = qpo.actions[action]; //get the proper string
            break;
          }
          default: {
            console.log("this was unexpected");
            break;
          }
        }
      }
      if(qpo.trainingMode && bu.alive){ // In training mode, generate a move for the blue unit, too.
        switch(qpo.trainerOpponent){
          case "random": {
            bu.nextAction = qpo.moves[Math.round(Math.random()*6)];
            break;
          }
          case "rigid": {
            bu.nextAction = findMove(qpo.blue.units[i]);
            break;
          }
          case "neural": {
            input[217] = i-0.5-(po/2); //generate a zero-mean input representing chosen unit
            var action = qpo.ali.nn.forward(input); // Have the AI net generate a move
            bu.nextAction = qpo.actions[action]; //get the proper string
            break;
          }
          default: {
            console.log("this was unexpected");
            break;
          }
        }
      }
    }
    ru.executeMove();
    bu.executeMove();
    bu.resetIcon(); //reset the icons for the player's team
    ru.updateLevel();
    bu.updateLevel();
  }

  if(qpo.activeGame.turnNumber == qpo.activeGame.turns-1){ //stop allowing units to shoot and bomb
    // TODO: Stop allowing units to shoot and bomb.
    //Stop counting down numbers on the timer.
    //Start checking whether all shots and bombs are off the board. If so, end the game.
    for(var i=0; i<qpo.blue.units.length; i++){qpo.blue.units[i].deactivate()}
  }
  if (!qpo.trainingMode){ //animate the pie, but not in training mode
    qpo.timer.pie.attr({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, 269]});
    qpo.timer.pie.animate({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, -90]}, 3000*qpo.timeScale);
  }
  if (qpo.activeGame.turnNumber == qpo.activeGame.turns){ //End the game, if it's time.
    if (qpo.activeGame.isEnding == false){ //find the winner and store to gameResult
      for(var i=0; i<qpo.blue.units.length; i++){qpo.blue.units[i].deactivate()}
      var gameResult;
      qpo.blueActiveUnit = 50;
      qpo.redActiveUnit = 50;
      if (qpo.scoreboard.redScore == qpo.scoreboard.blueScore) { gameResult = "tie"; }
      else if (qpo.scoreboard.redScore > qpo.scoreboard.blueScore) { gameResult = "red"; }
      else { gameResult = "blue"; }
      qpo.activeGame.isEnding = true;
      setTimeout(function(){qpo.endGame(gameResult);}, 3000*qpo.timeScale);
    }
  }
}
qpo.snap = function(){ //correct unit positions just before the start of each turn
  for (var i=0; i<qpo.activeGame.po; i++){
    if(qpo.blue.units[i].alive){ qpo.blue.units[i].snap(); }
    if(qpo.red.units[i].alive){ qpo.red.units[i].snap(); }
  }
};

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
    if (sBOS>qpo.board.bw || nBOS<qpo.board.tw){
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
        // console.log('shot ' + i + ' hit a unit');
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
            // console.log("bomb " + i + " hit unit " + j);
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

  //ITERATE OVER UNITS HERE. We have the qpo.blue.units and qpo.red.units arrays as well
  //  as the "units" array. Check for collisions with walls and for collisions between
  //  units of opposite colors.
  for (var i=0; i<ts; i++){ //iterate over blue team of units
    //Get the blue unit's borders
    if(qpo.blue.units[i].alive){ //detect some collisions
      var nBOU = qpo.blue.units[i].rect.getBBox().y + 1; //make it 1 pixel smaller than it really is, to fix collisions glitch
      var wBOU = qpo.blue.units[i].rect.getBBox().x + 1;
      var sBOU = nBOU + qpo.guiDimens.squareSize - 2;
      var eBOU = wBOU + qpo.guiDimens.squareSize - 2;

      //if the blue unit has hit a wall, stop the unit and place it snugly on the wall.
      if( nBOU < qpo.board.tw ||
          wBOU < qpo.board.lw ||
          sBOU > qpo.board.bw ||
          eBOU > qpo.board.rw
        ){
        if (sBOU > qpo.board.bw){ //South wall. Score.
          // var testC = c.circle(300, qpo.board.bw ,20).attr({'stroke':'white'});
          // var testC2 = c.circle(200, sBOU, 20).attr({'stroke':'purple'});
          // var testC3 = c.circle(100, qpo.blue.units[i].rect.getBBox().y + qpo.guiDimens.squareSize -1, 20).attr({'stroke':'pink'}) ;
          // setTimeout(function(){
          //   testC.remove()
          // }, 500);
          qpo.blue.units[i].score('collision');
        }
        else{ //Other wall. Stop and snap
          qpo.blue.units[i].phys.stop();
          qpo.blue.units[i].snap();
        }
      }

      if(qpo.red.units[i].alive){ //wall detection red
        //get the red unit's borders:
        var nBOUr = qpo.red.units[i].rect.getBBox().y + 1 ;
        var wBOUr = qpo.red.units[i].rect.getBBox().x + 1 ;
        var sBOUr = nBOUr + qpo.guiDimens.squareSize - 2;
        var eBOUr = wBOUr + qpo.guiDimens.squareSize - 2;

        //if the red unit has hit a wall, stop the unit and place it snugly on the wall.
        if (nBOUr < qpo.board.tw || wBOUr < qpo.board.lw ||
            sBOUr > qpo.board.bw || eBOUr > qpo.board.rw) {
          qpo.red.units[i].phys.stop();
          qpo.red.units[i].snap();
          if (nBOUr < qpo.board.tw){ qpo.red.units[i].score(); }
        }
      }

      for (var j=0; j<ts; j++) { //iterate over red team of units
        if (qpo.red.units[j].alive){
          var nBOU2 = qpo.red.units[j].rect.getBBox().y + 1;
          var wBOU2 = qpo.red.units[j].rect.getBBox().x + 1;
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
            qpo.red.units[j].kill();
            qpo.blue.units[i].kill();
          }
        }
      }//end iterating over red units
    }
  } //end iterating over blue units

  while (splicers.length > 0) { // Splice collided shots out of the 'shots' array.
    //The 'splicers' array contains the indices of shots to be removed from the 'shots' array.
    qpo.shots.splice(splicers[0], 1); //remove desired shot from 'shots' array.
    splicers.shift(); //remove first element of 'splicers' array.
    for (var i=0; i<splicers.length; i++){ splicers[i] -= 1; } //decrement all other indices.
  }
}

qpo.updateBlueAU = function(po, cond){ //Called when a command is sent and when a unit dies.
  // Cond is condition (either "move" or "death"), the reason this function's being called.
  // Deactivate the old active unit. Find the next living unit and activate it.
  // Update the "blueActiveUnit" var.
  var findingUnit = true;
  var ind = qpo.blueActiveUnit + 1;
  var tries = 0;
  var oldBlueAU, newBlueAU;
  while (findingUnit) { // keep looking until you find the new active unit.
    if (ind == po) { ind = 0; }
    newBlueAU = qpo.blue.units[ind]; //potential new active unit
    oldBlueAU = qpo.blue.units[qpo.blueActiveUnit];
    //When you find the new one, deactivate the old unit, activate the new one, and update qpo.blueActiveUnit.
    if ((newBlueAU.alive) && (qpo.activeGame.isEnding == false)){ // This is our new active unit. Do stuff.
      findingUnit = false; //unit has now been found. Exit the While loop after this iteration.
      qpo.blueActiveUnit = ind;
      qpo.blue.units[ind].activate();
    }
    ind++;
    tries++;
    if (tries == po) { findingUnit = false; } // No other units are eligibile for activation. Stop looking. Make sure the loop exits.
  }
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
  if(qpo.ignoreInput){return;}
  switch(qpo.mode){ //do the right thing based on what type of screen the user is in (menu, game, tutorial, etc)
    case "menu":
      switch(event.keyCode){
        case 8: //backspace/delete: return to the previous menu
          if (qpo.activeMenu != "title") {qpo.menus[qpo.activeMenu].up();}
          break;
        case 13: //enter
          try {qpo.menus[qpo.activeMenu].cl.selectedItem.action();}
          catch(err){;} //do nothing if there is no activeButton
          if(qpo.activeMenu == "title"){qpo.titleScreen.close()}
          break;
        case 87: //w
          event.preventDefault();
          qpo.menus[qpo.activeMenu].previous();
          break;
        case 83: //s
          event.preventDefault();
          qpo.menus[qpo.activeMenu].next();
          break;
        case 65: {  //a
          if (qpo.activeMenu=="customG"){
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
          if (qpo.activeMenu=="customG"){
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
          if (qpo.activeMenu=="customG"){
            try { qpo.menus["customG"].active.minus(); }
            catch(err) { ; }
          }
          break;
        }
        case 38: {  //up arrow
          event.preventDefault();
          qpo.menus[qpo.activeMenu].previous();
          break;
        }
        case 39: { //right arrow
          if (qpo.activeMenu=="customG"){
            try { qpo.menus["customG"].active.plus(); }
            catch(err) { ; }
          }
          break;
        }
        case 40: { //down arrow
          event.preventDefault();
          qpo.menus[qpo.activeMenu].next();
          break;
        }
        default:
          break;
      }
      break;
    case "game":
      try { //try to respond to the keypress appropriately
        if (qpo.blue.units[qpo.blueActiveUnit].spawnTimer>0){ //If active unit is dead and not spawning next turn, try moving to another unit (as a fallback:)
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
            case 32:
            case 66:
            case 88: //qweasdx detected (order)
              var moveStr = qpo.keyCodes[event.keyCode];
              // console.log('keypress detected: ' + event.keyCode + ', leading to moveStr' + qpo.keyCodes[event.keyCode]);
              qpo.blue.units[qpo.blueActiveUnit].order(moveStr);
              qpo.updateBlueAU(qpo.activeGame.po, "move"); //activate the new AU and board
              // controlPanel.accept(event);
              break;
            case 37:
            case 38:
            case 39:
            case 40: //up/left/right/down arrows (move highlight)
              if(!qpo.gameEnding){ qpo.blue.units[qpo.blueActiveUnit].search(qpo.dirMap[event.keyCode]); }
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
      catch(err){ //probably because qpo.blue.units[-1] doesn't exist. do nothing.
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

qpo.endGame = function(winner, h){
  var h = h || 0;
  clearInterval(qpo.clockUpdater);
  clearInterval(qpo.collisionDetector);
  clearInterval(qpo.turnStarter);
  qpo.gui.stop();
  qpo.gui.animate({'opacity':0}, 2000, 'linear');
  qpo.fadeOutGlow(qpo.glows, function(){ //clear GUI, reset arrays, and bring up the next screen
    qpo.gui.clear();
    c.clear();
    qpo.shots = [];
    qpo.bombs = [];
    qpo.units = [];
    (winner == "red") ? (qpo.ali.nn.backward(2)) : (qpo.ali.nn.backward(0)); //reward AI for winning, not losing
    (winner == "tie") ? (qpo.ali.nn.backward(1)) : (qpo.ali.nn.backward(0)); //reward it a little for tying
    try{qpo.activeSession.update(winner);} //add to the proper tally. Will throw error in tut mode.
    catch(e){;} //don't bother adding to the proper tally in tut mode.
    if(qpo.trainingMode){qpo.activeGame.type='training'}
    switch(qpo.activeGame.type){ //do the right thing depending on context (type) of game
      case 'tut': { //set mode back to 'tut' and show the next tutorial scene
        qpo.mode = 'tut';
        qpo.tut.tutFuncs.enter();
        break;
      }
      case 'training': { //If in training mode, decide whether to train another game.
        qpo.trainingCounter++;
        if (qpo.trainingCounter >= qpo.gamesToTrain){ // If game counter satisfied, check batch
          qpo.batchCounter++;
          // var newBatch = new qpo.Batch(qpo.activeSession);
          // qpo.trainingData.push(newBatch);
          qpo.trainingData.push(new qpo.Batch(qpo.activeSession));
          console.log("we got here...");
          if (qpo.batchCounter >= qpo.batchesToTrain){ // If batch counter satisfied, exit trainingMode
            qpo.trainingMode = false;
            qpo.menus["Match Complete"].open();
            for (var i=0; i<qpo.batchesToTrain; i++){ // log each batch's data to console
              console.log(qpo.trainingData[i]);
            }
          }
          else { qpo.retrain(); }// If batch counter not exceeded, train another batch
        }
        else { qpo.startGame([8,4]); }// If game counter not satisfied, train another game
        break;
      }
      case 'campaign': { //If in campaign mode, reopen the campaign menu, with the next mission highlighted.
        qpo.menus["Campaign"].open(h);
        break;
      }
      default: { //We're not in tutorial training, or campaign. Open the match complete menu
        qpo.menus["Match Complete"].open();
      }
    }
  }, 2000);

  // qpo.activeGame.song.pause();
  // qpo.activeGame.song.currentTime=0;
  // qpo.menuMusic();
}
