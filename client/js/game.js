qpo.Game = function(q, po, type, playMusic, respawn, turns, ppt){ //"Game" class.
  //q is board size, po is units per team, ppt is players per team
  qpo.guiDimens.squareSize = 350/q;   //aim to keep width of board at 7*50 (350). So, qpo.guiDimens.squareSize = 350/q.
  qpo.bombSize = 2 * qpo.guiDimens.squareSize;
  qpo.currentSettings = [q,po,type,playMusic,respawn,turns];
  // qpo.timeScale = (function(){ //adjust timeScale based on po.
  //   var adj = 0.25; //adjustment
  //   var factor = 1/5;
  //   return (adj + po*factor);
  // })(); //0.45, 0.65, 0.85, 1.05, 1.25, etc
  qpo.timeScale = 0.25 + 3 * 1/5; //make timeScale static as if po=3.
  qpo.units = new Array();
  qpo.shots=[];
  qpo.bombs=[];

  this.po = po; //# of units per team. Min 1, max 7.
  this.respawnEnabled = respawn;
  this.q = (q || qpo.difficPairings[po-1]); //size of board. (q x q)
  this.type = type; //What kind of game is this? (tutorial, single, multi, campaign)
  this.ppt = ppt || 1; //players per team
  this.lastTurn = (turns || 40); //How many turns does this game consist of?
  this.teams = { //instantiate red and blue teams
    'red': new qpo.Team('red'),
    'blue': new qpo.Team('blue')
  }
  qpo.red = this.teams.red; //add a convenient pointer
  qpo.blue = this.teams.blue;
  this.players = (new Array()).push(qpo.user);

  this.turnNumber = 0; //How far through this game are we?
  this.incrementTurn = function(){this.turnNumber++;};

  this.scaling = qpo.guiDimens.squareSize/50; // Visual scaling

  this.isEnding = false;
  this.upcomingSpawns = new Array();

  var exponent = 0.8;
  var factor = 12;
  var correction = 2;
  var scoringFormula = function(e,f,c,also){ // find the score limit
    var result = Math.pow(also,e) * f - c // po^e * factor - correction
    result *= this.lastTurn/60; //multiply by num turns divided by 60
    return Math.floor(result);;
  }; //pass po as also when calling
  this.scoreToWin = scoringFormula(exponent,factor,correction,po); // 10, 18, 26, 34, 41, 48, 54, 61 for 60-turn game
  if (respawn == false){this.scoreToWin = this.po;}

  this.gui = c.set();

  this.record = { //All data needed to recreate this game. (not complete)
    "q": q,
    "po" : po,
    "unitSpawns": (new Array()), //initial spawns of units
    "redMoves": (new Array()), //
    "blueMoves": (new Array()), //
  };

  this.prevState = [];
  this.state = [];

  this.getState = function(){ // Returns an array to be stored and passed to the neural network.
    var arr = new Array(); // Will contain 216 entries for 4-po game.
    //  We'll format the array properly later. Let's start with the raw values.
    for (var i=0; i<po; i++){
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

  if(playMusic == true){ // stop menu song and play game song. (not used)
    try { qpo.activeGame.song.remove(); } //try removing the previously existing song
    catch(err) { ; } //if error is thrown, probably doesn't exist, do nothing
    this.end = function(){
    }
    //MAKE MUSIC:
    // qpo.menuSong.pause();
    // qpo.menuSong.currentTime = 0;
    // this.song = song;
    // this.song.play();
    // console.log("playing game music...");
  }

  return this;
}
