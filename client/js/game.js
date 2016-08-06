qpo.Game = function(args){ //"Game" class.
  //{q, po, type, turns, ppt, customScript}
  qpo.mode = 'game';

  this.q = args.q || 7;
  this.po = args.po || 3;
  this.type = args.type || 'single'; //What kind of game is this? (tutorial, single, multi, campaign)
  this.turns = (args.turns || 30); //How many turns does this game consist of?
  this.ppt = args.ppt || 1; //players per team
  this.customScript = args.customScript || function(){};

  qpo.aiType = 'neural';

  qpo.currentSettings = {'q':this.q, 'po': this.po, 'type':this.type,
    'turns':this.turns, 'ppt': this.ppt, 'customScript':this.customScript};

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
  if(this.type=='single'){
    //
  }

  this.players = (new Array()).push(qpo.user.toPlayer());

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
      for (var j=0; j<6; j++){ //16-87: shots x,y, directionality
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

  this.drawGUI = function(xAdj, yAdj){ //create the board and scoreboard
    var xAdj = xAdj || 0;
    var yAdj = yAdj || 0;
    qpo.board = this.board = new qpo.Board(this.q, this.q, 125+xAdj, 90+yAdj); // make the board (with animation if game starting)
    qpo.scoreboard = new qpo.Scoreboard(yAdj);
  }

  this.newTurn = function(){ //Generate and execute moves. End the game, if the turn limit has been reached.
    this.turnNumber++;
    switch(this.turns-this.turnNumber){ //on special turns, notify.
      case 10:{this.board.notify('10'); break;}
      case 5:{this.board.notify('5', qpo.COLOR_DICT['orange']); break;}
      case 3:{this.board.notify('3', qpo.COLOR_DICT['red']); break;}
      case 2:{this.board.notify('2', qpo.COLOR_DICT['red']); break;}
      case 1:{this.board.notify('1', qpo.COLOR_DICT['red']); break;}
    }

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
    this.prevState = this.state;
    this.state = this.getState();
    var input = qpo.convertStateToInputs(this.state);

    //// MOVE EXECUTION SECTION
    for (var i=0; i<this.po; i++){ //snap all units into their correct positions prior to executing new moves
      if(qpo.blue.units[i].alive){ qpo.blue.units[i].snap(); }
      if(qpo.red.units[i].alive){ qpo.red.units[i].snap(); }
    }
    var po = this.po; //for convenience
    var ru = null; //red unit, for convenience
    var bu = null; //blue unit, for convenience
    for (var i=0; i<po; i++){ //Generate AI moves & execute all moves
      ru = this.teams.red.units[i];
      bu = this.teams.blue.units[i];

      if (this.type != 'multiplayer'){ // Generate AI moves
        if(ru.alive){ //Generate a move from random, rigid, null, or neural AI
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
            case 'null' : { //just stay.
              ru.nextAction = 'stay';
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

    if(this.turnNumber == this.turns-1){ //stop allowing units to shoot and bomb
      // TODO: Stop allowing units to shoot and bomb.
      //Start checking whether all shots and bombs are off the board. If so, end the game.
      for(var i=0; i<qpo.blue.units.length; i++){qpo.blue.units[i].deactivate()}
    }
    // this.board.moveWalls()
    this.board.deflash(false);
    // setTimeout(function(){this.board.flash()}.bind(this), 3000*qpo.timeScale-qpo.flashLengths.flash);
    if (this.turnNumber == this.turns){ //End the game, if it's time.
      if (this.isEnding == false){ //find the winner and store to winner
        for(var i=0; i<qpo.blue.units.length; i++){qpo.blue.units[i].deactivate()}
        var winner;
        qpo.blueActiveUnit = 50;
        qpo.redActiveUnit = 50;
        if (qpo.scoreboard.redScore == qpo.scoreboard.blueScore) { winner = "tie"; }
        else if (qpo.scoreboard.redScore > qpo.scoreboard.blueScore) { winner = "red"; }
        else { winner = "blue"; }
        this.isEnding = true;
        setTimeout(function(){qpo.activeGame.end(winner);}, 3000*qpo.timeScale);
      }
    }
  }

  this.start = function(){
    if(qpo.playMusic == true){ // stop menu song and play game song. (implement when game song acquired)
      try { this.song.remove(); } //try removing the previously existing song
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

    setTimeout(function(){ //Set up the newTurn interval, wall motion, and the collision detection
      qpo.turnStarter = setInterval(this.newTurn.bind(this), 3000*qpo.timeScale);
      this.board.deflash(true)
      // setTimeout(function(){this.board.flash()}.bind(this), 3000*qpo.timeScale-qpo.flashLengths.flash);
      qpo.collisionDetector = setInterval(function(){qpo.detectCollisions(qpo.activeGame.po)}, 50);
    }.bind(this), 7500);

    console.log('NEW GAME');
  }

  this.end = function(winner, h){
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
      if(qpo.trainingMode){this.type='training'}
      switch(this.type){ //do the right thing depending on context (type) of game
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
    }.bind(this), 2000);

    // qpo.activeGame.song.pause();
    // qpo.activeGame.song.currentTime=0;
    // qpo.menuMusic();
  }

  qpo.activeGame = this;
  this.customScript();
  this.start();

  return this;
}
