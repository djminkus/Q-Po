//CREATE UNIT TYPE/CLASS
function startUnit(color, gx, gy, num){
  //for now, only blue units are numbered (6-20-15)
  this.team = color;
  this.rect = c.rect(25+50*gx, 75+50*gy,
      50,50).attr({"fill":COLOR_DICT[color],"opacity":.7});
  //this.icon = c.circle(25+50*gx+25,75+50*gy+25,7);
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
  gui.push(unit.phys);
}
function finishUnit(unit){
  unit.activate = function(){
    unit.rect.attr({"stroke":COLOR_DICT["orange"],
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
    unit.rect.animate({"opacity":0},2000*timeScale,function(){unit.rect.hide()});

    switch(unit.team){
      case "red":
        redDead++;
        updateRedAU(teamSize);
        break;
      case "blue":
        blueDead++;
        var number = unit.num;
        controlPanel.actives[number].hide();
        controlPanel.actives[number] = controlPanel.icons.xs[number];
        gui.push(controlPanel.actives[number]);
        controlPanel.actives[number].show();
        updateBlueAU(teamSize);
        break;
    }
  }
  unit.moveLeft = function(){
    unit.movingForward = false;
    if (unit.rect.attr('x') > guiCoords.gameBoard.leftWall) {
      unit.rect.stop();

      /* use for slidey-style of play (units don't stop unless told to)
      var anim = Raphael.animation( {"x":unit.rect.attr('x') - guiCoords.gameBoard.columns*guiCoords.gameBoard.squareSize },
        guiCoords.gameBoard.columns*1500*timeScale); //over the course of n turns, send the unit 2n squares to the left
      */

      //use for stoppy-style of play (units stop after each turn)
      var anim = Raphael.animation( {"x":unit.rect.attr('x') - 2*guiCoords.gameBoard.squareSize },
        3000*timeScale); //over the course of a turn, send the unit 2n squares to the left
      unit.rect.animate(anim);
      unit.movingForward = false;
    }
  }
  unit.moveUp = function(){
    unit.movingForward = false;
    if (unit.rect.attr('y') > guiCoords.gameBoard.topWall) {
      unit.rect.stop();

      /*
      var anim = Raphael.animation( {"y":unit.rect.attr('y') - guiCoords.gameBoard.rows*guiCoords.gameBoard.squareSize},
        guiCoords.gameBoard.rows*1500*timeScale);
      */
      var anim = Raphael.animation( {"y":unit.rect.attr('y') - 2*guiCoords.gameBoard.squareSize },
        3000*timeScale); //over the course of a turn, send the unit 2n squares to the left

      unit.rect.animate(anim);
      if (unit.team == "red"){
        unit.movingForward = true;
      } else {
        unit.movingForward = false;
      }
    }
  }
  unit.moveRight = function(){
    if (unit.rect.attr('x') + unit.rect.attr('width') < guiCoords.gameBoard.rightWall) {
      unit.rect.stop();
      /*
      var anim = Raphael.animation( {"x":unit.rect.attr('x') + guiCoords.gameBoard.columns*guiCoords.gameBoard.squareSize},
        guiCoords.gameBoard.columns*1500*timeScale);
      */
      var anim = Raphael.animation( {"x":unit.rect.attr('x') + 2*guiCoords.gameBoard.squareSize },
        3000*timeScale); //over the course of a turn, send the unit 2n squares to the left

      unit.rect.animate(anim);
      unit.movingForward = false;
    }
  }
  unit.moveDown = function(){
    if (unit.rect.attr('y') + unit.rect.attr('height') < guiCoords.gameBoard.bottomWall) {
      unit.movingForward = false;
      unit.rect.stop();
      /*
      var anim = Raphael.animation( {"y":unit.rect.attr('y') + guiCoords.gameBoard.rows*guiCoords.gameBoard.squareSize},
        guiCoords.gameBoard.rows*1500*timeScale);
      */

      var anim = Raphael.animation( {"y":unit.rect.attr('y') + 2*guiCoords.gameBoard.squareSize },
        3000*timeScale); //over the course of a turn, send the unit 2n squares to the left

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
    setTimeout(unit.reloadBomb,3000*timeScale);
  }
  unit.shoot = function(){
    unit.movingForward = false;
    var shot, anim;
    switch(unit.team){
      case "blue":
        shot = c.rect(unit.rect.attr('x') + 22,
                      unit.rect.attr('y') + unit.rect.attr('height') + 2,
                      6, 2);
        anim = Raphael.animation({"height":25, "y": shot.attr('y') + 0}, 500*timeScale, function(){
          shot.animate({"y": shot.attr('y') + 125*7}, 3000*7*timeScale);
        });
        if (unit.movingForward){
          anim = Raphael.animation({"height":25, "y": shot.attr('y') + guiCoords.gameBoard.squareSize/6 + 10}, 500*timeScale, function(){
            shot.animate({"y": shot.attr('y') + 125*7}, 3000*7*timeScale);
          });
        }
        break;
      case "red":
        shot = c.rect(unit.rect.attr('x') + 22,
                      unit.rect.attr('y') - 4,
                      6, 2);
        anim = Raphael.animation({"height":25, "y": shot.attr('y') - 25}, 500*timeScale, function(){
          shot.animate({"y": shot.attr('y') - 125*7}, 3000*7*timeScale);
        });
        if (unit.movingForward){
          anim = Raphael.animation({"height":25, "y": shot.attr('y') - 25 - guiCoords.gameBoard.squareSize/6 - 10}, 500*timeScale, function(){
            shot.animate({"y": shot.attr('y') - 125*7}, 3000*7*timeScale);
          });
        }
        break;
    }
    shot.attr({"fill":COLOR_DICT["shot color"],
               "opacity":.5,
               "stroke":COLOR_DICT["shot color"]});
    shot.data("team",unit.team);
    shot.animate(anim);
    gui.push(shot);
    shots.push(shot);
    unit.shotReady = false;
    setTimeout(unit.reloadShot,3000*timeScale);
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
