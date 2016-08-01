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
    qpo.activeGame.end('blue');
  }

  return this;
}

qpo.missions[1] = new qpo.Mission([['Use w/a/s/d to move the blue unit', 'across the enemy goal line.'],
    1, function(){ //specifics for mission 1:

    qpo.activeGame = new qpo.Game({'type': 'campaign', 'q':5, 'po':1, 'customScript': function(){
      qpo.aiType = 'null';
      qpo.activeGame.yAdj = 20;
    } } );

    var q = qpo.activeGame.q
    qpo.scoreboard.all.remove();
  }]
);
qpo.missions[2] = new qpo.Mission([false, 2, function(){}])
qpo.missions[3] = new qpo.Mission([false, 3, function(){}])
