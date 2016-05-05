// var song = new Audio("./music/qpo.mp3")            //  neil's first iteration
// var song = new Audio("./music/gameMode.mp3")        //uncomment for gameMode (second version)
// var song = new Audio("./music/underwaterStars.mp3")  //uncomment for underwaterStars

qpo.Game = function(q, po, multi, playMusic, respawn){ //"Game" class. Instantiated every time a new round is called.
  this.po = po; //# of units per team. Min 1, max 7.
  qpo.timeScale = (function(){
    var adj = 0.25; //adjustment
    var factor = 1/5;
    return (adj + po*factor) ; //adjust timeScale. Bigger means slower; 1 is 3 s/turn; 0.5 is 1.5 s/turn.
  })(); //0.45, 0.65, 0.85, 1.05, 1.25, etc

  this.q = (q || qpo.difficPairings[po-1]); //size of board. (q x q)
  this.multiplayer = multi; //false for single player (local vs. AI) mode
  this.turnNumber = 0;
  this.isEnding = false;
  this.upcomingSpawns = new Array();
  var exponent = 0.8;
  var factor = 12;
  var correction = 2;
  var thinger = function(e,f,c,also){return Math.floor(Math.pow(also,e) * f - c)}
  this.scoreToWin = thinger(exponent,factor,correction,po); // 10,18,26,34,41,48,54,61
  this.respawnEnabled = respawn;
  if (respawn == false){this.scoreToWin = this.po;}

  qpo.guiDimens.squareSize = 350/this.q;   //aim to keep width of board at 7*50 (350). So, qpo.guiDimens.squareSize = 350/q.
  qpo.bombSize = 2 * qpo.guiDimens.squareSize;
  qpo.currentSettings = [q,po,multi,playMusic,respawn];

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
      if(qpo.blueUnits[i].alive){ //0-7: blue x,y
        arr[2*i] = qpo.blueUnits[i].x; //values from 0 to (q-1)
        arr[2*i + 1] = qpo.blueUnits[i].y; //principle: keep coords of same obj together
      }
      else { // -1 if dead
        arr[2*i] = -1;
        arr[2*i + 1] = -1;
      }
      if(qpo.redUnits[i].alive){ //8-15: red x,y
        arr[2*qpo.activeGame.po + 2*i] = qpo.redUnits[i].x;
        arr[2*qpo.activeGame.po + 2*i + 1] = qpo.redUnits[i].y;
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
  // Acquire initial state, but not if we're in menu:
  if(qpo.mode == "game"){this.state = this.getState();}

  if(playMusic == true){ // stop menu song and play game song. (not used)
    try { //remove old song
      qpo.activeGame.song.remove();
    }
    catch(err) { //or don't, if it doesn't exist
      ;
    }
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
