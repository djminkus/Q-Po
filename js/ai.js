function findMove(unit){
  var chosenMove = null;
  var demerits = [0,0,0,0, 0,0, 0];
  var movesList = ["moveLeft","moveUp","moveRight","moveDown","bomb","shoot","stay"];
    //# of reasons not to moveLeft, Up, Right, Down, bomb, shoot, and stay, respectively
  var lsu = unit.rect.getBBox().x; //x coordinate of left side of unit
  var rsu = unit.rect.getBBox().x2; //x coordinate of right side of unit

  //MOVE OUT OF THE WAY OF SHOTS, AND DON'T MOVE TOWARDS EXISTING SHOTS:
  for(var i=0; i<shots.length; i++){
    var lss = shots[i].getBBox().x;     //x coord of left side of shot
    var rss = shots[i].getBBox().x2; //x coord of right side of shot
    if(lss > rsu){            //If the shot is to the right of the unit,
      demerits[2] += 1;       //  unit has a new reason not to move right.
    } else if (rss < lsu){     //If the shot is to the left of the unit,
      demerits[0] += 1;       //  unit has a new reason not to move left.
    } else {                  //Otherwise, the shot is in the same column,
      demerits[1] += 1;       //  so unit has a new reason not to do anything
      demerits[3] += 1;       //  other than move left or right.
      demerits[4] += 1;
      demerits[5] += 1;
      demerits[6] += 1;
    }
  }

  //MOVE OUT OF THE WAY OF BOMBS, AND DON'T MOVE TOWARDS EXISTING BOMBS:
  //console.log("bombs is " + bombs, "bombs.length is " + bombs.length);
  for(var i=0; i<bombs.length; i++){
    if (bombs[i]){
      var lsb = bombs[i].phys.getBBox().x;     //x coord of left side of bomb
      var rsb = bombs[i].phys.getBBox().x2; //x coord of right side of bomb
      // console.log(lsb,rsb,lsu,rsu);
      if(lsb > rsu){            //If the bomb is to the right of the unit,
        demerits[2] += 1;       //  unit has a new reason not to move right.
        // console.log("bomb to right");
      } else if (rsb < lsu){     //If the bomb is to the left of the unit,
        // console.log("bomb to left");
        demerits[0] += 1;       //  unit has a new reason not to move left.
      } else {                  //Otherwise, the bomb is in the same column,
        demerits[1] += 1;       //  so unit has a new reason not to do anything
        demerits[3] += 1;       //  other than move left or right.
        demerits[4] += 1;
        demerits[5] += 1;
        demerits[6] += 1;
        // console.log("bomb in same column");
      }
    }
  }

  //RANDOMLY FORGET ALL BUT 7 DEMERITS:
    //TODO

  //CHOOSE THE MOVE WITH THE FEWEST DEMERITS:
  var fewestDemerits = 100;
  for (var i=0; i<demerits.length;i++){ //find the lowest number of demerits
    if(demerits[i]<fewestDemerits){
      fewestDemerits = demerits[i];
    }
  }
  //collect indices of moves tied for least demerits:
  var indices = new Array();
  var utilIndex = 0;//this is getting ugly
  for (var i=0; i<demerits.length;i++){ //find the lowest number of demerits
    if(demerits[i]==fewestDemerits){
      indices[utilIndex] = i;
      utilIndex += 1;
    }
  }
  //choose random index from "indices" array:
  var moveIndex = indices[Math.floor(Math.random()*indices.length)];
  chosenMove = movesList[moveIndex];
  // console.log("demerits: " + demerits);
  // console.log("fewestDemerits: " + fewestDemerits);
  // console.log("m")
  //console.log("indices: " + indices);
  // console.log("moveIndex: " + moveIndex);
  // console.log("chosenMove: " + chosenMove);

  return chosenMove;
}
