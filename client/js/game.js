qpo.Game = function(q, po, multi){ //"Game" class. Instantiated every time a new round is called.
  this.po = po; //# of units per team. Min 1, max 7.
  this.q = (q || qpo.difficPairings[po-1]); //size of board. (q x q)
  this.multiplayer = multi; //false for single player (local vs. AI) mode
  // console.log("this.q is " + this.q);
  qpo.guiDimens.squareSize = 350/this.q;   //aim to keep width of board at 7*50 (350). So, qpo.guiDimens.squareSize = 350/q.
  qpo.bombSize = 2 * qpo.guiDimens.squareSize;
  // console.log("qpo.guiDimens.squareSize is " + qpo.guiDimens.squareSize);
  this.gui = c.set();
  this.record = {
    "unitSpawns": (new Array()), //initial spawns of units
    "redMoves": (new Array()),
    "blueMoves": (new Array())
  };
  // this.song = new Audio("music/stars.mp3");
  this.song.play();
  return this;
}
