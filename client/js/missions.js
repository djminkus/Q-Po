qpo.Mission = function(args){
  //args: [array of 2 strings, int, function]
  this.snippets = args[0] || ['',''];
  this.number = args[1] || -1; //mission number
  this.specifics = args[2] || function(){}; //a function to be executed when mission is begun

  this.begin = function(){
    this.textEls = c.set();
    for (var i=0; i<this.snippets.length; i++){ //create text els from snippets
      this.textEls.push(c.text(300, 40+i*25, this.snippets[i]).attr({qpoText:25}).hide());
    }
    qpo.gui.push(this.textEls);
    setTimeout(function(){qpo.fadeIn(this.textEls, 2500)}.bind(this), 1000);
    qpo.mode = 'game';
    this.specifics.call(this);
    qpo.activeMission = this;
  }
  this.end = function(){
    this.textEls.remove();
    qpo.gui.push(c.text(300,70, "Well done.").attr({qpoText:35}))
    qpo.endGame('blue');
  }

  return this;
}

qpo.missions[1] = new qpo.Mission([['Use w/a/s/d to move the blue unit', 'across the enemy goal line.'],
    1, function(){ //specifics for mission 1:
    // qpo.timeScale = .45;
    qpo.activeGame = new qpo.Game({'type': 'campaign', 'q':5, 'po':1, 'customScript': function(){
      qpo.activeGame.yAdj = 50;
      qpo.activeGame.newTurn = function(){ //Don't have the AI generate moves for this mission.
        qpo.activeGame.turnNumber++;
        qpo.timer.update();
        qpo.moment = new Date();

        //// MOVE EXECUTION SECTION
        for (var i=0; i<qpo.activeGame.po; i++){ //snap all units into their correct positions prior to executing new moves
          if(qpo.blue.units[i].alive){ qpo.blue.units[i].snap(); }
          if(qpo.red.units[i].alive){ qpo.red.units[i].snap(); }
        }
        var po = qpo.activeGame.po; //for convenience
        var ru = null; //red unit, for convenience
        var bu = null; //blue unit, for convenience
        for (var i=0; i<po; i++){ //Execute the user's move
          bu = qpo.activeGame.teams.blue.units[i];

          bu.executeMove();
          bu.resetIcon(); //reset the icons for the player's team
        }

        if (!qpo.trainingMode){ //animate the pie
          qpo.timer.pie.attr({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, 269]});
          qpo.timer.pie.animate({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, -90]}, 3000*qpo.timeScale);
        }
      }
    } } );

    var q = qpo.activeGame.q
    // qpo.drawGUI(5, 1, 0.0, 50)
    qpo.timer.text.remove();
    qpo.scoreboard.all.remove();
  }]
);
qpo.missions[2] = new qpo.Mission([false, 2, function(){}])
qpo.missions[3] = new qpo.Mission([false, 3, function(){}])
