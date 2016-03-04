//CREATE BOMB TYPE/CLASS -- not implemented (see "explode()")
function startBomb(su){ //su = source unit
  this.team = su.team;
  this.timer = 3;
  this.exploded = false;
  switch(this.team){
    case "blue":
      this.phys = c.rect(su.rect.attr("x") + 18,
                    su.rect.attr("y") + qpo.guiDimens.squareSize + 20 , 14, 14);
      break;
    case "red":
      this.phys = c.rect(su.rect.attr("x") + 18,
                  su.rect.attr("y") - 20, 14, 14);
      break;
  }
  qpo.gui.push(this.phys);

  //put this in the "bombs" array:
  var ind = findSlot(qpo.bombs);
  this.index = ind;
  qpo.bombs[this.index] = this;

  return this;
}
function improveBomb(bomb){
  bomb.phys.attr({"fill":qpo.COLOR_DICT["bomb color"],
             "opacity":0.5,
             "stroke":qpo.COLOR_DICT["bomb color"]});
  bomb.explode = function(){
    bomb.exploded = true;
    bomb.timer = -1;
    var cx = bomb.phys.getBBox().x;
    var cy = bomb.phys.getBBox().y;
    bomb.phys.stop();

    var anim = Raphael.animation({
      "16.6%": {
        "y": cy - (qpo.bombSize/2 - 7),
        "x": cx - (qpo.bombSize/2 - 7),
        "width": qpo.bombSize,
        "height": qpo.bombSize
      },
      "100%":{
        "y":cy+7,
        "x":cx+7,
        "width":0,
        "height":0
      }
    }, 3000*qpo.timeScale, function(){
      qpo.bombs[bomb.index] = false;
    });
    bomb.phys.animate(anim);
  }
}
function finishBomb(bomb){
  bomb.next = function(){
    if (bomb.timer == 0){
      bomb.explode();
    } else if (bomb.timer > 0 ){
      var bombAnim;
      switch(bomb.team){
        case "blue":
          bombAnim = Raphael.animation({"y":bomb.phys.attr('y') + 50}, 3000*qpo.timeScale, function(){bomb.next()} );
          bomb.phys.animate(bombAnim);
          break;
        case "red":
          bombAnim = Raphael.animation({"y":bomb.phys.attr('y') - 50}, 3000*qpo.timeScale, function(){bomb.next()} );
          bomb.phys.animate(bombAnim);
          break;
      }
    }
    bomb.timer = bomb.timer - 1;
  }
}
