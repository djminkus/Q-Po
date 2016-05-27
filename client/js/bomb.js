//CREATE BOMB TYPE/CLASS -- not implemented (see "explode()")
function startBomb(su){ //su = source unit
  var UNIT = qpo.guiDimens.squareSize;
  var INITIAL_BOMB_SIZE = 14*qpo.guiDimens.squareSize/50;
  var BOMB_MARGIN_Y = 19*qpo.guiDimens.squareSize/50;
  var BOMB_MARGIN_X = 18*qpo.guiDimens.squareSize/50;
  var INITIAL_RADIUS = 14/50; //multiply by unit to get actual
  var MAX_RADIUS = 2; //unused. # of square lengths the explosion takes up
  var SIDE_RADIUS = 2; //pixels of rounding at the corners

  this.team = su.team;
  this.timer = 3;
  this.exploded = false;
  var lw = qpo.guiCoords.gameBoard.leftWall;
  var tw = qpo.guiCoords.gameBoard.topWall;
  switch(this.team){ //make the "this.phys" and put it in the right place
    case "blue":
      this.phys = c.rect(lw +su.tx() + BOMB_MARGIN_X,
                    tw + su.ty() + qpo.guiDimens.squareSize + BOMB_MARGIN_Y,
                    INITIAL_BOMB_SIZE, INITIAL_BOMB_SIZE, SIDE_RADIUS);
      break;
    case "red":
      this.phys = c.rect(lw+ su.tx() + BOMB_MARGIN_X,
                  tw + su.ty() - BOMB_MARGIN_Y - INITIAL_BOMB_SIZE,
                  INITIAL_BOMB_SIZE, INITIAL_BOMB_SIZE, SIDE_RADIUS);
      break;
  }
  qpo.gui.push(this.phys);

  //put this in the "bombs" array:
  var ind = qpo.findSlot(qpo.bombs);
  this.index = ind;
  qpo.bombs[this.index] = this;

  return this;
}
function improveBomb(bomb){ //color it and make it explodable
  bomb.phys.attr({
    // "fill":qpo.COLOR_DICT["purple"],
    "opacity": 0.8,
    "stroke":qpo.COLOR_DICT["purple"],
    'stroke-width':qpo.bombStroke
  });
  bomb.explode = function(){ //animate the bomb's explosion
    bomb.exploded = true;
    bomb.timer = -1;
    var cx = bomb.phys.getBBox().x;
    var cy = bomb.phys.getBBox().y;
    bomb.phys.stop();

    var anim = Raphael.animation({
      "16.6%": {
        "y": cy - (qpo.bombSize/2 - 7*qpo.guiDimens.squareSize/50),
        "x": cx - (qpo.bombSize/2 - 7*qpo.guiDimens.squareSize/50),
        "width": qpo.bombSize,
        "height": qpo.bombSize
      },
      "100%": {
        "y":cy+7*qpo.guiDimens.squareSize/50,
        "x":cx+7*qpo.guiDimens.squareSize/50,
        "width":0,
        "height":0
      }
    }, 3000*qpo.timeScale, function(){ qpo.bombs[bomb.index] = false; });
    bomb.phys.animate(anim);
  }
}
function finishBomb(bomb){ //send it on its way
  bomb.next = function(){ //make the bomb count down or explode
    if (bomb.timer == 0){
      bomb.explode();
    } else if (bomb.timer > 0 ){
      var bombAnim;
      switch(bomb.team){
        case "blue":
          bombAnim = Raphael.animation({"y":bomb.phys.attr('y') + 0.98 * qpo.guiDimens.squareSize}, 3000*qpo.timeScale, function(){bomb.next()} );
          bomb.phys.animate(bombAnim);
          break;
        case "red":
          bombAnim = Raphael.animation({"y":bomb.phys.attr('y') - 0.98*qpo.guiDimens.squareSize}, 3000*qpo.timeScale, function(){bomb.next()} );
          bomb.phys.animate(bombAnim);
          break;
      }
    }
    bomb.timer = bomb.timer - 1;
  }
}
