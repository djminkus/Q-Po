var adj = 22.5 - 5; //adjustment -- controls vertical placement of bar graph

c.customAttributes.ratingColor = function(rating){
  var color = (rating - 1000) / (2000);
  if(rating>3000){
    return {fill:COLOR_DICT["shot color"]};
  }
  if(rating<1000){
    return{fill:COLOR_DICT["red"]};
  }
  return {fill:"hsb(" + color + ", .75, .8)"};
}

function session(sessionType){
  console.log("NEW " + sessionType + " SESSION");
  this.type = sessionType; //singlePlayer or multiplayer
  this.playerRating = 1500; //start at 1500, adjust each time game ends in this.update(),
                            //  only display after single player games
  this.games = 0; //games played
  this.blueWins = 0; //wins for blue (human player in singlePlayer mode)
  this.ties = 0;
  this.redWins = 0;  // wins for red

  //returns "blue"/"red"/"tie" depending on blueWins,ties, and redWins
  this.leader = function(){
    if (this.blueWins > this.redWins){
      return "blue";
    } else if (this.blueWins == this.redWins) {
      return "grey";
    } else {
      return "red";
    }
  };

  //displayResults() creates the Raphael elements that make up the bar graph,
  //  and returns the Raphael set comprised of these three elements.
  this.displayResults = function(result){
    /* make a horizontal bar.
       Left is blue wins, colored blue. Middle is ties, colored grey.
       Right is red wins, colored red.
       Game window is 600 wide. So 300 is center.
    */
      var winsSoFarText = c.text(300, 130+adj,"WINS").attr({"fill":COLOR_DICT[this.leader()],"font-size":50});

      var blueSize = (function(){
        //console.log(activeSession.games,activeSession.blueWins,activeSession.redWins,activeSession.ties);
        var result = 50 * activeSession.blueWins; //unless totalGames<11:
        if (activeSession.games > 6){result = 400 * (activeSession.blueWins/activeSession.games);}
        return result;
      })();
      var greySize = (function(){
        var result = 50 * activeSession.ties; //unless totalGames<11:
        if (activeSession.games > 6){result = 400 * (activeSession.ties/activeSession.games)}
        return result;
      })();
      var redSize = (function(){
        var result = 50 * activeSession.redWins; //unless totalGames<11:
        if (activeSession.games > 6){result = 400 * (activeSession.redWins/activeSession.games)}
        return result;
      })();
      var wsf=winsSoFarText.getBBox().width-4; //size of 'WINS' text

      var totalSize = blueSize + greySize + redSize + wsf; //130.53 FOR 'WINS' text
      winsSoFarText.attr({"x":300-totalSize/2+wsf/2});

      var blueCenter = 300 - (totalSize/2) + wsf + (blueSize/2);
      var greyCenter = 300 - (totalSize/2) + wsf + blueSize + (greySize/2);
      var redCenter = 300 - (totalSize/2) + wsf + blueSize + greySize + (redSize)/2;
      var blueLeft = 300 - (totalSize/2) + wsf;
      var greyLeft = 300 - (totalSize/2) + wsf + blueSize;
      var redLeft = 300 - (totalSize/2) + wsf + blueSize + greySize;

      this.bluePart = c.rect(blueLeft,107.5+adj,blueSize,45)
                        .attr({"stroke-width":2,"stroke":COLOR_DICT["blue"],"fill":COLOR_DICT["blue"]});
      this.greyPart = c.rect(greyLeft,107.5+adj,greySize,45)
                        .attr({"stroke-width":2,"stroke":COLOR_DICT["grey"],"fill":COLOR_DICT["grey"]});
      this.redPart = c.rect(redLeft,107.5+adj,redSize,45)
                        .attr({"stroke-width":2,"stroke":COLOR_DICT["red"],"fill":COLOR_DICT["red"]});
      var barGraphPrep = c.set(this.bluePart,this.greyPart,this.redPart);

      this.blueText = c.text(blueCenter,130+adj,this.blueWins);
      this.greyText = c.text(greyCenter,130+adj,this.ties);
      this.redText = c.text(redCenter,130+adj,this.redWins);
      //hide the text if the color has 0 wins:
      if(this.blueWins == 0){
        this.blueText.hide();
      }
      if(this.ties == 0){
        this.greyText.hide();
      }
      if(this.redWins == 0){
        this.redText.hide();
      }
      var barGraphText = c.set(this.blueText,this.greyText,this.redText).attr({"fill":"white","font-size":20});

      var ratingString = "Your rating: " + this.playerRating;
      switch(result){
        case "blue":
          ratingString += " (+" + (100*diffic) + ")";
          break;
        case "red":
          ratingString += " (+" + (400 - 100 * diffic) + ")";
          break;
        case "tie":
          ratingString += " (+0)";
          break
        default:
          console.log("this was unexpected"); //debugging
          break;
      }
      var ratingText = c.text(300, 180+adj, ratingString).attr({ratingColor: this.playerRating,"font-size":30});

      var all = c.set(barGraphPrep, barGraphText, winsSoFarText, ratingText);
      return all;
  }

  //call activeSession.update(result) to add 1 to activeSession.redWins/blueWins/ties
  this.update = function(result){
    activeSession.set = c.set(this.bluePart,this.greyPart,this.redPart);
    this.games += 1;
    switch(result){
      case "blue":
        this.blueWins += 1;
        this.playerRating += 100 * diffic;
        break;
      case "red":
        this.redWins += 1;
        this.playerRating -= 400 - 100 * diffic;
        break;
      case "tie":
        this.ties += 1;
        break
      default:
        console.log("this was unexpected"); //debugging
        break;
    }
    //this.playerRating
    return null;
  }

  return this;
}
