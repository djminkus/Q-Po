function startHowTo(){
  // redDead = 0;
  // blueDead = 0;
  // drawGUI();
  // placeUnitsTut();

  turnNumber = 0;

  howToPage = {};
  howToPage.chapter = 0;

  //CHAPTER 0 STUFF:
  howToPage.unit = c.rect(300, 125,
      50,50).attr({"fill":qpo.COLOR_DICT["blue"],"opacity":0.7});

  var demoShot = function(){
    howToPage.shot = c.rect(300 + 22, 125 + 50, 6, 2)
      .attr({"fill":qpo.COLOR_DICT["shot color"], "opacity":0.5,
        "stroke":qpo.COLOR_DICT["shot color"]});
    anim = Raphael.animation({
      "0%" : {"height":2, "y": 175},
      "33.3%" : {"height": 25},
      "66.6%" : {"y": 200},
      "100%" : {"y": 225, "height":0}
      }, 1500*qpo.timeScale
    ); //end anim
    howToPage.shot.animate(anim);
  };
  demoShot();
  howToPage.shooter = setInterval(demoShot, 10000); //end setInterval

  var demoBomb = function(){
    howToPage.bomb = c.rect(300 + 18, 125 + 50 + 18, 14, 14)
      .attr({"fill":qpo.COLOR_DICT["bomb color"], "opacity":.5,
        "stroke":qpo.COLOR_DICT["bomb color"]});
    anim = Raphael.animation({
      "0%" : {"y": 193},
      "66.6%" : {"y": 210},
      "100%" : {"y": 218, "height":0}
      }, 1500*qpo.timeScale
    ); //end anim
    howToPage.bomb.animate(anim);
  };
  howToPage.bomberT = setTimeout(function(){
    demoBomb();
    howToPage.bomber = setInterval(demoBomb, 10000);
  }, 2000);

  setTimeout(function(){
    howToPage.unit.animate({"x":250},3000);
    howToPage.lefter = setInterval(function(){howToPage.unit.animate({"x":250},3000);},10000);
  }, 4000);

  setTimeout(function(){
    howToPage.unit.animate({"x":300},3000);
    howToPage.righter = setInterval(function(){howToPage.unit.animate({"x":300},3000);},10000);
  }, 7000);

  howToPage.unitText = c.set().push(
      c.text(300,320-25,"This is a unit. Units move once per turn. ").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(300,350-25,"Win the round by destroying enemy units.").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(300,380-25,"").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
  );

  howToPage.chapter0 = c.set().push( howToPage.unitText, howToPage.unit, howToPage.shot, howToPage.bomb);

  //CHAPTER 1 STUFF (keyboard/qweasdx):
  howToPage.keys = c.set().push(
    c.rect(40, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(100, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(160, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(50, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(110, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(170, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(80, 160, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),

    c.text(65, 65, "Q").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(125, 65, "W").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(185, 65, "E").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(75, 125, "A").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(135, 125, "S").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(195, 125, "D").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(95, 185, "X").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
  );
  howToPage.labels = c.set().push(
    c.path("M50,30 L-20,-20").attr({"stroke":"white","stroke-width":2}),
    c.path("M125,30 L125,-10").attr({"stroke":"white","stroke-width":2}),
    c.path("M190,30 L240,-10").attr({"stroke":"white","stroke-width":2}),
    c.path("M40,150 L-20,200").attr({"stroke":"white","stroke-width":2}),
    c.path("M130,160 L130,200").attr({"stroke":"white","stroke-width":2}),
    c.path("M200,160 L240,200").attr({"stroke":"white","stroke-width":2}),

    c.text(55 - 3*30, 35 - 3*30 + 20, "Bomb").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(125, 65 - 3*30, "Move Up").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(185 + 3*30, 65 - 3*30, "Shoot").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(65 - 3*30, 155 + 3*30 - 20, "Move Left").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(135, 125 + 3*30, "Move Down").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(195 + 3*30, 125 + 3*30, "Move Right").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
  );

  howToPage.keys.transform("t170,170");
  howToPage.labels.transform("t170,170");

  howToPage.chapter1 = c.set().push(howToPage.keys, howToPage.labels).hide();

  //CHAPTER 2 STUFF: (explanation)
  howToPage.turnText = c.set().push(
    c.text(300,320-25,"This is the turn timer. It counts down").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(300,350-25,"once every three seconds or so. Every time it").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(300,380-25,"reaches 0, your units execute your moves.").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
  );
  howToPage.chapter2 = c.set().push( howToPage.turnText ).hide();

  howToPage.tryText = c.set().push(
    c.text(300,320-75,"Now it's time to play your first game.").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(300,350-75,"It's you against the computer.").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(300,380-75,"Good luck!").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
  );
  howToPage.chapter3 = c.set().push(howToPage.tryText).hide();

  howToPage.next = c.set().push(
    c.rect(530,260,50,80).attr({"fill":"black"}),
    c.path("M550,290 L560,300 550,310")
  ).attr({"stroke-width":2,"stroke":"white"}).click(function(e){

    switch(howToPage.chapter){
      case 0:
        howToPage.circles[0].attr({"stroke":"white","fill":"none"});
        howToPage.circles[1].attr({"stroke":"white","fill":qpo.COLOR_DICT["shot color"]});

        clearInterval(howToPage.shooter);
        clearTimeout(howToPage.bomberT);
        clearInterval(howToPage.bomber);
        clearInterval(howToPage.lefter);
        clearInterval(howToPage.righter);
        howToPage.title.attr({"text":"Controls"});
        howToPage.chapter0.hide();
        howToPage.chapter1.show();
        break;
      case 1:
        howToPage.circles[1].attr({"stroke":"white","fill":"none"});
        howToPage.circles[2].attr({"stroke":"white","fill":qpo.COLOR_DICT["shot color"]});

        howToPage.title.attr({"text":"Turns"});
        howToPage.keys.hide();
        howToPage.labels.hide();
        turnTimer();
        timer.attr({"transform":"t-150,-75"});
        timer.animate({segment: [450, 250, 50, -90, -90]}, 3000);
        timerInterval = setInterval(function(){
          timer.attr({segment: [450, 250, 50, -90, 269]});
          timer.animate({segment: [450, 250, 50, -90, -90]}, 3000);
          qpo.blueMovesQueue = [];
        },3000);
        howToPage.chapter2.show();

        break;
      case 2:
        howToPage.circles[2].attr({"stroke":"white","fill":"none"});
        howToPage.circles[3].attr({"stroke":"white","fill":qpo.COLOR_DICT["shot color"]});

        //howToPage.title.attr({"text":"Try it out"});
        howToPage.title.hide();
        howToPage.chapter2.hide();
        timer.hide();
        clearInterval(timerInterval);
        howToPage.chapter3.show();

        break;
      case 3:
        howToPage.all.remove();
        diffic = "beginner";
        countdownScreen(diffic);
        break;
      default:
        ;
    }
    howToPage.chapter++;

  });

  howToPage.title = c.text(300,50,"Units").attr({"fill":"white","font-size":40,"font-family":"'Open Sans',sans-serif"});
  //q = bomb, e = shoot

  howToPage.circles = c.set().push(
    c.circle(285,450,5).attr({"stroke":"white","fill":qpo.COLOR_DICT["shot color"]}),
    c.circle(300,450,5).attr({"stroke":"white"}),
    c.circle(315,450,5).attr({"stroke":"white"}),
    c.circle(330,450,5).attr({"stroke":"white"})
  );

  howToPage.backToMainButton = new button("Main Menu",300,520,function(e){
    qpo.mode="menu";
    // howToPage.keys.hide();
    // howToPage.title.hide();
    // howToPage.circles.hide();
    // howToPage.next.hide();
    // howToPage.backToMainButton.set.hide();

    howToPage.all.remove();
    mainMenu.showAll();
    timer.remove();
    clearInterval(timerInterval);
  });

  howToPage.all=c.set().push(howToPage.circles, howToPage.title, howToPage.next,
    howToPage.keys, howToPage.labels, howToPage.backToMainButton.set,
    howToPage.chapter0, howToPage.chapter1, howToPage.chapter2, howToPage.chapter3);
} //end startHowTo()
