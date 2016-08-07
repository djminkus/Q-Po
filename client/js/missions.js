qpo.Mission = function(args){
  //args: {snippets, number, specifics}
  this.snippets = args.snippets || ['','']; //The mission text
  this.number = args.number || -1; //mission number
  this.specifics = args.specifics || function(){}; //a function to be executed when mission is begun

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
    qpo.activeGame.end('blue');
  }

  return this;
}

qpo.missions[1] = new qpo.Mission({
  'snippets': ['Use w/a/s/d to move the blue unit', 'across the enemy goal line.'],
  'number': 1,
  'specifics': function(){
    qpo.activeGame = new qpo.Game({'type': 'campaign', 'q':5, 'po':1,
      'customScript': function(){
        qpo.aiType = 'null';
        this.yAdj = 20;
        this.turns = 200;
        // Adjust unit's .score() method to make it end the mission:
        // setTimeout(function(){qpo.blue.units[0].score = qpo.activeMission.end}, 10000)
        // ^^ doesn't work due to a scope issue.
      }
    })
    qpo.scoreboard.all.remove();
  }
})
qpo.missions[2] = new qpo.Mission({
  'snippets': ['Eliminate both enemy units.','(Use e/spacebar to shoot.)'],
  'number': 2,
  'specifics': function(){
    qpo.activeGame = new qpo.Game({'type': 'campaign', 'q':5, 'po':1,
      'customScript': function(){
        qpo.aiType = 'null';
        this.yAdj = 20;
        //spawn another red unit, make it so red units don't spawn, and end the game when the blue unit gets 2 kills.
      }
    })
    qpo.scoreboard.all.remove();
  }
})
qpo.missions[3] = new qpo.Mission([false, 3, function(){}])
