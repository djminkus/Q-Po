//CREATE BOMB TYPE/CLASS -- not implemented (see "explode()")
function startBomb(su){ //su = source unit
  var INITIAL_BOMB_SIZE = 14*qpo.guiDimens.squareSize/50;
  var BOMB_MARGIN_Y = 19*qpo.guiDimens.squareSize/50;
  var BOMB_MARGIN_X = 18*qpo.guiDimens.squareSize/50;

  this.team = su.team;
  this.timer = 3;
  this.exploded = false;
  switch(this.team){ //make the "this.phys" and put it in the right place
    case "blue":
      this.phys = c.rect(su.rect.attr("x") + BOMB_MARGIN_X,
                    su.rect.attr("y") + qpo.guiDimens.squareSize + BOMB_MARGIN_Y,
                    INITIAL_BOMB_SIZE, INITIAL_BOMB_SIZE);
      break;
    case "red":
      this.phys = c.rect(su.rect.attr("x") + BOMB_MARGIN_X,
                  su.rect.attr("y") - BOMB_MARGIN_Y - INITIAL_BOMB_SIZE,
                  INITIAL_BOMB_SIZE, INITIAL_BOMB_SIZE);
      break;
  }
  qpo.gui.push(this.phys);

  //put this in the "bombs" array:
  var ind = findSlot(qpo.bombs);
  this.index = ind;
  qpo.bombs[this.index] = this;

  return this;
}
function improveBomb(bomb){ //color it and make it explodable
  bomb.phys.attr({"fill":qpo.COLOR_DICT["bomb color"],
             "opacity":0.5,
             "stroke":qpo.COLOR_DICT["bomb color"]});
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
      "100%":{
        "y":cy+7*qpo.guiDimens.squareSize/50,
        "x":cx+7*qpo.guiDimens.squareSize/50,
        "width":0,
        "height":0
      }
    }, 3000*qpo.timeScale, function(){
      qpo.bombs[bomb.index] = false;
    });
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
