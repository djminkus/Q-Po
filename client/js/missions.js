qpo.missions = [
  function(){ //MISSION 1:
    var mt = [
      'Use w/a/s/d to move the blue unit',
      'across the enemy goal line.',
    ]//mission texts
    qpo.mode = 'game';
    qpo.code = 1;

    qpo.activeGame = new qpo.Game(7,1,'single',false,false);
    qpo.shots=[];
    qpo.bombs=[];

    var q = qpo.activeGame.q
    qpo.drawGUI(7,1,0,50)
    qpo.timer.text.remove()
    qpo.scoreboard.all.remove()

    mts = [
      c.text(300, 40, mt[0]).attr({qpoText:25}).hide(),
      c.text(300, 75, mt[1]).attr({qpoText:25}).hide()
    ];
    var mte = c.set( //mission text elements
      mts[0], mts[1]
    );

    setTimeout(function(){ // Spawn a red and blue unit
      qpo.blue.units[0] = new qpo.Unit("blue",3,1,0);
      qpo.units.push(qpo.blue.units[0]);
      qpo.blue.units[0].phys.attr({'opacity':0});
      qpo.fadeIn(qpo.blue.units[0].phys, 1000, function(){});
      qpo.red.units[0] = new qpo.Unit("red",3,5,0);
      qpo.units.push(qpo.red.units[0]);
      qpo.red.units[0].phys.attr({'opacity':0});
      qpo.fadeIn(qpo.red.units[0].phys, 1000, function(){
        qpo.fadeIn(mte, 1000)
      }.bind(this), function(){
        qpo.blink(mts[0]); qpo.blink(mts[1])
      }.bind(this));
    }, 1500);

    var newTurn = function(){ // called every time game clock is divisible by 3
      // qpo.activeGame.turnNumber++;
      qpo.activeGame.incrementTurn();
      qpo.timer.update();
      qpo.moment = new Date();

      //// MOVE EXECUTION SECTION
      qpo.snap(); //snap all units into their correct positions prior to executing new moves
      var po = qpo.activeGame.po; //for convenience
      var ru = null; //red unit, for convenience
      var bu = null; //blue unit, for convenience
      for (var i=0; i<po; i++){ //Execute the user's move
        bu = qpo.activeGame.teams.blue.units[i];

        bu.executeMove();
        bu.resetIcon(); //reset the icons for the player's team
      }

      if (!qpo.trainingMode){ //animate the pie, but not in AI-training mode
        qpo.timer.pie.attr({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, 269]});
        qpo.timer.pie.animate({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, -90]}, 3000*qpo.timeScale);
      }
    }

    setTimeout(function(){ //Set up the newTurn interval, the pie animation, and the collision detection
      qpo.turnStarter = setInterval(newTurn, 3000*qpo.timeScale);
      qpo.blue.units[0].activate();
      qpo.timer.pie.animate({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, -90]}, 3000*qpo.timeScale);
      qpo.collisionDetector = setInterval(function(){qpo.detectCollisions(qpo.activeGame.po)}, 50);
    }, 4500);

    console.log('Mission 1 begun.');
  },
  function(){ //MISSION 2:

  },
  function(){ //MISSION 3:

  },
  function(){ //MISSION 4:

  }
]
