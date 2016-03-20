//CREATE UNIT TYPE/CLASS
function startUnit(color, gx, gy, num){
  //for now, only blue units are numbered (6-20-15)
  this.team = color;
  this.rect = c.rect(qpo.guiCoords.gameBoard.leftWall + qpo.guiDimens.squareSize*gx,
    qpo.guiCoords.gameBoard.topWall+qpo.guiDimens.squareSize*gy,
    qpo.guiDimens.squareSize,qpo.guiDimens.squareSize).attr({"fill":qpo.COLOR_DICT[color],"opacity":0.7});
  this.phys = c.set();
  this.x = gx; //absolute grid position
  this.y = gy;
  this.relx = 0; //relative grid position
  this.rely = 0;
  this.num = num; //which unit is it?
  this.alive = true;
  this.active = false;
  this.shotReady = true;
  this.bombReady = true;
  this.movingForward = false;
  return this;
}
function improveUnit(unit){
  unit.phys.push(unit.rect);
  qpo.gui.push(unit.phys);
}
function finishUnit(unit){
  unit.activate = function(){
    unit.rect.attr({"stroke":qpo.COLOR_DICT["orange"],
                              "stroke-width":4});
    unit.active = true;
  }
  unit.deactivate = function(){
    unit.rect.attr({"stroke":"black",
                     "stroke-width":1});
    unit.active = false;
  }
  unit.reload = function(){
    unit.bombReady = true;
    unit.shotReady = true;
  }
  unit.reloadBomb = function(){
    unit.bombReady = true;
  }
  unit.reloadShot = function(){
    unit.shotReady =true;
  }
  unit.kill = function(){
    unit.alive = false;
    unit.rect.stop();
    unit.rect.animate({"opacity":0},2000*qpo.timeScale,function(){unit.rect.hide()});
    if(qpo.mode == "game"){ //update game GUI
      switch(unit.team){
        case "red":
          redDead++;
          break;
        case "blue":
          blueDead++;
          var number = unit.num;
          controlPanel.actives[number].hide();
          controlPanel.actives[number] = controlPanel.icons.xs[number];
          qpo.gui.push(controlPanel.actives[number]);
          controlPanel.actives[number].show();
          updateBlueAU(qpo.activeGame.po);
          break;
      }
    }
  }
  unit.instakill = function(){ //for in-menu units
    unit.alive = false;
    unit.rect.remove();
  }
  unit.moveLeft = function(){
    unit.movingForward = false;
    if (unit.rect.attr('x') > qpo.guiCoords.gameBoard.leftWall || qpo.mode == "menu") {
      unit.rect.stop();
      /* use for slidey-style of play (units don't stop unless told to)
      unit.rect.stop();
      var anim = Raphael.animation( {"x":unit.rect.attr('x') - qpo.guiDimens.columns*qpo.guiDimens.squareSize },
        qpo.guiDimens.columns*1500*qpo.timeScale); //over the course of n turns, send the unit 2n squares to the left
      */

      //use for stoppy-style of play (units stop after each turn)
      var anim = Raphael.animation( {"x":unit.rect.attr('x') - 2*qpo.guiDimens.squareSize },
        3000*qpo.timeScale); //over the course of a turn, send the unit 2n squares to the left
      unit.rect.animate(anim);
      unit.movingForward = false;
    }
  }
  unit.moveUp = function(){
    unit.movingForward = false;
    if (unit.rect.attr('y') > qpo.guiCoords.gameBoard.topWall) {
      unit.rect.stop();

      /*
      var anim = Raphael.animation( {"y":unit.rect.attr('y') - qpo.guiDimens.rows*qpo.guiDimens.squareSize},
        qpo.guiDimens.rows*1500*qpo.timeScale);
      */
      var anim = Raphael.animation( {"y":unit.rect.attr('y') - 2*qpo.guiDimens.squareSize },
        3000*qpo.timeScale); //over the course of a turn, send the unit 2n squares to the left

      unit.rect.animate(anim);
      if (unit.team == "red"){
        unit.movingForward = true;
      } else {
        unit.movingForward = false;
      }
    }
  }
  unit.moveRight = function(){
    if (unit.rect.attr('x') + unit.rect.attr('width') < qpo.guiCoords.gameBoard.rightWall || qpo.mode == "menu") {
      /*
      unit.rect.stop();
      var anim = Raphael.animation( {"x":unit.rect.attr('x') + qpo.guiDimens.columns*qpo.guiDimens.squareSize},
        qpo.guiDimens.columns*1500*qpo.timeScale);
      */
      var anim = Raphael.animation( {"x":unit.rect.attr('x') + 2*qpo.guiDimens.squareSize },
        3000*qpo.timeScale); //over the course of a turn, send the unit 2n squares to the left

      unit.rect.animate(anim);
      unit.movingForward = false;
    }
  }
  unit.moveDown = function(){
    if (unit.rect.attr('y') + unit.rect.attr('height') < qpo.guiCoords.gameBoard.bottomWall) {
      unit.movingForward = false;
      unit.rect.stop();
      /*
      var anim = Raphael.animation( {"y":unit.rect.attr('y') + qpo.guiDimens.rows*qpo.guiDimens.squareSize},
        qpo.guiDimens.rows*1500*qpo.timeScale);
      */

      var anim = Raphael.animation( {"y":unit.rect.attr('y') + 2*qpo.guiDimens.squareSize },
        3000*qpo.timeScale); //over the course of a turn, send the unit 2n squares to the left

      unit.rect.animate(anim);
      if (unit.team == "blue"){
        unit.movingForward = true;
      } else {
        unit.movingForward = false;
      }
    }
  }
  unit.bomb = function(){
    unit.movingForward = false;
    var bomb;
    bomb = new startBomb(unit);
    improveBomb(bomb);
    finishBomb(bomb);
    bomb.next();
    unit.bombReady = false;
    setTimeout(unit.reloadBomb,3000*qpo.timeScale);
    if(activeMenu=="main"){
      bomb.phys.toBack();
      qpo.menus.main.blackness.toBack();
    }
  }
  unit.shoot = function(){
    unit.movingForward = false;
    var shot, anim;
    switch(unit.team){
      case "blue":
        shot = c.rect(unit.rect.attr('x') + 22*qpo.guiDimens.squareSize/50,
                      unit.rect.attr('y') + unit.rect.attr('height') + 2*qpo.guiDimens.squareSize/50,
                      6*qpo.guiDimens.squareSize/50, 2*qpo.guiDimens.squareSize/50);
        anim = Raphael.animation({"height":25*qpo.guiDimens.squareSize/50}, 500*qpo.timeScale,
          function(){ shot.animate({"y": shot.attr('y') + 2.5*qpo.guiDimens.squareSize*qpo.activeGame.q},
            3000*qpo.activeGame.q*qpo.timeScale);
        });
        if (unit.movingForward){
          anim = Raphael.animation({"height":25*qpo.guiDimens.squareSize/50, "y": shot.attr('y') + qpo.guiDimens.squareSize/6 + 10*qpo.guiDimens.squareSize/50}, 500*qpo.timeScale,
            function(){ shot.animate({"y": shot.attr('y') + 2.5*qpo.guiDimens.squareSize*qpo.activeGame.q},
              3000*qpo.activeGame.q*qpo.timeScale); //make the shot move at 2.5 units per turn
          });
        }
        break;
      case "red":
        shot = c.rect(unit.rect.attr('x') + 22*qpo.guiDimens.squareSize/50,
                      unit.rect.attr('y') - 4*qpo.guiDimens.squareSize/50,
                      6*qpo.guiDimens.squareSize/50, 2*qpo.guiDimens.squareSize/50);
        anim = Raphael.animation({"height":0.5*qpo.guiDimens.squareSize, "y": shot.attr('y') - 0.5*qpo.guiDimens.squareSize}, 500*qpo.timeScale,
          function(){
            shot.animate({"y": shot.attr('y') - 2.5*qpo.guiDimens.squareSize*qpo.activeGame.q}, 3000*qpo.activeGame.q*qpo.timeScale);
          }
        );
        if (unit.movingForward){
          anim = Raphael.animation({"height":0.5*qpo.guiDimens.squareSize, "y": shot.attr('y') - 0.5*qpo.guiDimens.squareSize - qpo.guiDimens.squareSize/6 - 10*qpo.guiDimens.squareSize/50}, 500*qpo.timeScale,
            function(){
              shot.animate({"y": shot.attr('y') - 2.5*qpo.guiDimens.squareSize*qpo.activeGame.q}, 3000*qpo.activeGame.q*qpo.timeScale);
            }
          );
        }
        break;
    }
    shot.attr({"fill":qpo.COLOR_DICT["shot color"],
               "opacity":0.5,
               "stroke":qpo.COLOR_DICT["shot color"]});
    shot.data("team",unit.team);
    shot.animate(anim);
    qpo.gui.push(shot);
    qpo.shots.push(shot);
    unit.shotReady = false;
    setTimeout(unit.reloadShot,3000*qpo.timeScale);
  }
  unit.stay = function(){
    unit.rect.stop();
  }
}

function makeUnit(color,gx,gy,num){
  var unit = new startUnit(color,gx,gy,num);
  improveUnit(unit);
  finishUnit(unit);

  return unit;
}
