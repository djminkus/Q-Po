qpo.Game = function(args){ //"Game" class.
  //{q, po, type, turns, ppt, customScript}

  this.q = args.q || 7;
  this.po = args.po || 3;
  this.type = args.type || 'single'; //What kind of game is this? (tutorial, single, multi, campaign)
  this.turns = (args.turns || 30); //How many turns does this game consist of?
  this.ppt = args.ppt || 1; //players per team
  this.customScript = args.customScript || function(){};

  qpo.currentSettings = {'q':this.q, 'po': this.po, 'type':this.type, 'turns':this.turns, 'ppt': this.ppt};

  qpo.guiDimens.squareSize = 350/this.q;   //aim to keep width of board at 7*50 (350). So, qpo.guiDimens.squareSize = 350/q.
  qpo.bombSize = 2 * qpo.guiDimens.squareSize;
  this.scaling = qpo.guiDimens.squareSize/50; // Visual scaling

  qpo.units = new Array();

  this.teams = { //instantiate red and blue teams
    'red': new qpo.Team('red'),
    'blue': new qpo.Team('blue')
  }
  qpo.red = this.teams.red; //add a convenient pointer
  qpo.blue = this.teams.blue;
  this.players = (new Array()).push(qpo.user);

  this.turnNumber = 0; //How far through this game are we?

  this.isEnding = false;
  this.upcomingSpawns = new Array();

  this.scoreToWin = 10*this.po;

  this.gui = c.set();

  this.record = { //All data needed to recreate this game. (not complete)
    "q": this.q,
    "po" : this.po,
    "unitSpawns": (new Array()), //initial spawns of units
    "redMoves": (new Array()), //
    "blueMoves": (new Array()), //
  };

  this.prevState = [];
  this.state = [];

  this.getState = function(){ // Returns an array to be stored and passed to the neural network.
    var arr = new Array(); // Will contain 216 entries for 4-po game.
    //  We'll format the array properly later. Let's start with the raw values.
    for (var i=0; i<this.po; i++){
      // 16 qpo-grid coords of units (4 per po--red/blue x/y):
      if(qpo.blue.units[i].alive){ //0-7: blue x,y
        arr[2*i] = qpo.blue.units[i].x; //values from 0 to (q-1)
        arr[2*i + 1] = qpo.blue.units[i].y; //principle: keep coords of same obj together
      }
      else { // -1 if dead
        arr[2*i] = -1;
        arr[2*i + 1] = -1;
      }
      if(qpo.red.units[i].alive){ //8-15: red x,y
        arr[2*qpo.activeGame.po + 2*i] = qpo.red.units[i].x;
        arr[2*qpo.activeGame.po + 2*i + 1] = qpo.red.units[i].y;
      }
      else { // -1 if dead
        arr[2*qpo.activeGame.po + 2*i] = -1;
        arr[2*qpo.activeGame.po + 2*i + 1] = -1;
      }

      var zero23; //  var that will range from 0-23.
      var one70; // var that will range from 0-70, in threes.
      for (var j=0; j<6; j++){ //16-87: shots x,y
        //Get x/y coords and directionality of shot for all 24 (3*2*po) possible
        // shots, resulting in 72 (3*3*2*po) new additions
        //2 teams per po, 3 shots per team
        zero23 = (i+1) * (j+1) - 1;
        one70 = (zero23*3 + 1);
        if(qpo.shots[zero23]) { //if shot exists, load real values
          //2 things per shot.
          arr[15 + one70] = qpo.shots[zero23].x;
          arr[15 + one70 + 1] = qpo.shots[zero23].y;
          if (qpo.shots[zero23].data("team")=="blue"){ arr[15 + one70 + 2] = 0.5; }
          else { arr[15 + one70 + 2] = -0.5; }
        }
        else { // load -1,-1,0 if shot doesn't exist
          arr[15 + one70] = -1;
          arr[15 + one70 + 1] = -1;
          arr[15 + one70 + 2] = 0;
        }
      }

      var zero31; //  var that will range from 0-31.
      var one125; // var that will range from 1-125, in fours.
      for (var j=0; j<8; j++){ //88-215: bombs x,y,dir,timer
        //Get x/y coords, direction, and timer of bomb for all 32 (4*2*po) possible
        // bombs, resulting in 128 (4*4*2*po) new additions
        // (2 teams per po, 4 bombs per team, 4 values per bomb)
        zero31 = (i+1) * (j+1) - 1;
        one125 = (zero31*4+1);
        if(qpo.bombs[zero31]) { //if shot exists, load real values
          //2 things per shot.
          arr[15 + 72 + one125] = qpo.bombs[zero31].phys.attr('x');
          arr[15 + 72 + one125 + 1] = qpo.bombs[zero31].phys.attr('y');
          if (qpo.bombs[zero31].team == "blue"){ arr[15 + 72 + one125 + 2] = 0.5; }
          else { arr[15 + 72 + one125 + 2] = -0.5; }
          arr[15 + 72 + one125 + 3] = qpo.bombs[zero31].timer;
        }
        else { // load -1,-1,0,-1 if shot doesn't exist
          arr[15 + 72 + one125] = -1;
          arr[15 + 72 + one125 + 1] = -1;
          arr[15 + 72 + one125 + 2] = 0;
          arr[15 + 72 + one125 + 3] = -1;
        }
      }
    }
    arr[216] = Date.now();
    return arr;
  };

  this.drawGUI = function(xAdj, yAdj){ //create the turn timer and board
    var xAdj = xAdj || 0;
    var yAdj = yAdj || 0;
    qpo.board = this.board = new qpo.Board(this.q, this.q, 25+xAdj, 75+yAdj); // make the board (with animation if game starting)
    qpo.timer = new qpo.Timer(yAdj);
    qpo.scoreboard = new qpo.Scoreboard(yAdj);
  }

  this.start = function(){
    if(qpo.playMusic == true){ // stop menu song and play game song. (implement when game song acquired)
      try { qpo.activeGame.song.remove(); } //try removing the previously existing song
      catch(err) { ; } //if error is thrown, probably doesn't exist, do nothing
      //MAKE MUSIC:
      // qpo.menuSong.pause();
      // qpo.menuSong.currentTime = 0;
      // this.song = song;
      // this.song.play();
      // console.log("playing game music...");
    }
    qpo.mode = 'game';
    qpo.shots=[];
    qpo.bombs=[];

    this.drawGUI(this.xAdj, this.yAdj)
    setTimeout(function(){ // wait 1500 ms, then placeUnits() and set initial state
      qpo.placeUnits(); // puts the units on the board
      this.state = this.getState();
    }.bind(this), 1500);

    setTimeout(function(){ //Set up the newTurn interval, the pie animation, and the collision detection
      qpo.turnStarter = setInterval(qpo.newTurn, 3000*qpo.timeScale);
      qpo.timer.pie.animate({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, -90]}, 3000*qpo.timeScale);
      qpo.collisionDetector = setInterval(function(){qpo.detectCollisions(qpo.activeGame.po)}, 50);
    }, 7500);

    console.log('NEW GAME');
  }

  this.end = function(){}

  qpo.activeGame = this;
  this.customScript();
  this.start();

  return this;
}
