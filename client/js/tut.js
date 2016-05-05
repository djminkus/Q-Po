/* TUTORIAL CHAPTERS/SCENES
  ========
 [x]  1. Welcome to QPO!
 [x]  2. Units
 [x]  3. Objective of the game
 [x]  4. Moving
 [ ]  5. Shooting
 [ ] 6. Bombs
*/

qpo.TutObj = function(headline, body, x, y, highx, highy, highSizeModx, highSizeMody, hideHigh, promptt){
  this.pane = c.rect(x,y,250,120).attr({"fill":"black"});
  this.head = c.text(x+125, y+30, headline).attr({qpoText:[30,"white"]});
  this.bod1 = c.text(x+125, y+55, body[0]).attr({qpoText:[15,"white"]}); //bod for body
  this.bod2 = c.text(x+125, y+70, body[1]).attr({qpoText:[15,"white"]});
  this.bod3 = c.text(x+125, y+85, body[2]).attr({qpoText:[15,"white"]});
  this.promptt = c.text(x+125, y+105, promptt).attr({qpoText:[15, qpo.COLOR_DICT['red']]});
  this.high = c.rect(highx, highy, 70+highSizeModx, 70+highSizeMody); //high for highlight
  this.high.attr({"fill":"none", "stroke":qpo.COLOR_DICT["orange"], "stroke-width":4});

  this.all = c.set().push(this.pane, this.head, this.bod1, this.bod2, this.bod3, this.promptt, this.high);
  if (hideHigh) { this.high.hide(); } //hide the highlight, or don't

  return this;
}

qpo.Tut = function(){
  drawGUI(7,1); //q=7, po=1;
  controlPanel.resetIcons();
  activeScreen = "tut";
  this.status = -1;
  // var blue0, red0, turnNumber;
  this.blue0;
  this.red0;
  this.turnNumber;

  // this.scenes = new Array(); //Generate all scenes.
  // this.scenes[0] = new qpo.TutObj("Welcome!",["Hi! You must be new. We'll get", "you up to speed in no time.",""],
  //   50, 50, 0, 0, 0, 0, true, "Press enter to continue.");
  // this.scenes[1] = new qpo.TutObj("Units",["This is a unit. Destroy enemy", "units to score points and",
  //   " win the round"], 150, 50, 65, 115, 0, 0, false, "Press enter to continue.");
  // this.scenes[2] = new qpo.TutObj("Turns",["This is the turn timer.", "One turn takes less than 3 seconds.",
  //   "Each unit gets one move per turn."], 250, 50, 380, 180, 70, 70, false, "Press enter to continue.");
  // this.scenes[3] = new qpo.TutObj("Control Panel",["This is the control panel. It shows", "you your plans. Every command",
  //   "you give shows up here."], 100, 250, 10, 410, 320, 60, false, "Press enter to continue.");
  // this.scenes[4] = new qpo.TutObj("Execution",["When the turn timer hits 0, your", "units follow your commands. Let's",
  //   'try it out.'], 100, 250, 10, 410, 320, 60, false, "Press enter to continue.");
  // this.scenes[5] = new qpo.TutObj("Moving",["", "Units follow your commands. Let's",
  //   'learn some commands!'], 100, 250, 10, 410, 320, 60, false, "Press enter to continue.");

  // (function(){ //Generate all scenes. Doesn't execute because I don't get closures? or .bind()?
  //   console.log(this);
  //   this.scenes = new Array();
  //   this.scenes[0] = new qpo.TutObj("Welcome!",["Hi! You must be new. We'll get", "you up to speed in no time.",""],
  //     50, 50, 0, 0, 0, 0, true, "Press enter to continue.");
  //   this.scenes[1] = new qpo.TutObj("Units",["This is a unit. Destroy enemy", "units to score points and",
  //     " win the round"], 150, 50, 65, 115, 0, 0, false, "Press enter to continue.");
  //   this.scenes[2] = new qpo.TutObj("Turns",["This is the turn timer.", "One turn takes less than 3 seconds.",
  //     "Each unit gets one move per turn."], 250, 50, 380, 180, 70, 70, false, "Press enter to continue.");
  //   this.scenes[3] = new qpo.TutObj("Control Panel",["This is the control panel. It shows", "you your plans. Every command",
  //     "you give shows up here."], 100, 250, 10, 410, 320, 60, false, "Press enter to continue.");
  //   this.scenes[4] = new qpo.TutObj("Execution",["When the turn timer hits 0, your", "units follow your commands. Let's",
  //     'try it out.'], 100, 250, 10, 410, 320, 60, false, "Press enter to continue.");
  //   this.scenes[5] = new qpo.TutObj("Moving",["", "Units follow your commands. Let's",
  //     'learn some commands!'], 100, 250, 10, 410, 320, 60, false, "Press enter to continue.");
  // }.bind(this))();

  // var tutObjs = [ //early try at tut.scenes
  //   new qpo.TutObj("Welcome!",["Hi! You must be new. We'll get", "you up to speed in no time.",""],50,50,0,0,0,0,true,
  //     "Press enter to continue."),
  //   new qpo.TutObj("Units",["This is a unit. Destroy enemy", "units to win the round.",""],150,50,65,115,0,0,false,
  //     "Press enter to continue."),
  //   new qpo.TutObj("Turns",["This is the turn timer.", "One turn takes 3 seconds.",
  //     "Each unit gets one move per turn."],250,50,380,180,70,70,false,
  //     "Press enter to continue."),
  //   new qpo.TutObj("Control Panel",["This is the control panel. It shows", "you your plans. Every command",
  //     "you give shows up here."],100,250,10,410,320,60,false,
  //     "Press enter to continue."),
  //   new qpo.TutObj("Control Panel",["When the turn timer hits 0, your", "units follow your commands. Let's",
  //     'try it out.'],100,250,10,410,320,60,false,
  //     "Press enter to continue."),
  //   new qpo.TutObj("Moving",["", "units follow your commands. Let's",
  //     'learn some commands!'],100,250,10,410,320,60,false,
  //     "Press enter to continue.")
  // ]

  this.scenes = [ //Generate all scenes.
    new qpo.TutObj("Welcome!",["Hi! You must be new. We'll get", "you up to speed in no time.",""],50,50,0,0,0,0,true,
        "Press enter to continue."),
    new qpo.TutObj("Units",["This is a unit. Destroy enemy", "units to win the round.",""],150,50,65,115,0,0,false,
      "Press enter to continue."),
    new qpo.TutObj("Turns",["This is the turn timer.", "One turn takes 3 seconds.",
      "Each unit gets one move per turn."],250,50,380,180,70,70,false,
      "Press enter to continue."),
    new qpo.TutObj("Control Panel",["This is the control panel. It shows", "you your plans. Every command",
      "you give shows up here."],100,250,10,410,320,60,false,
      "Press enter to continue."),
    new qpo.TutObj("Moving",["When the turn timer hits 0, your", "units follow your commands. Let's",
      'learn the commands!'],100,250,10,410,320,60,false,
      "Press enter to continue.")
  ];

  for(i=1; i<this.scenes.length; i++){ this.scenes[i].all.hide(); }//hide all except the first one
  this.status=0;
  controlPanel.orange.hide();

  this.transition = function(){ // Transition between scenes.
    //remove raphs from old scene, show the raphs from the new one, and update this.status
    this.scenes[this.status].all.remove();
    this.status++;
    this.scenes[this.status].all.show();
  }

  this.tutFuncs = { //functions to be called on "enter" keypress and "escape" keypress
    "enter": function(){ // enter/return key (transition to next scene)
      switch(qpo.tut.status){
        case 0: //transition from "welcome" to "units"
          qpo.tut.blue0 = new makeUnit("blue",1,1,0);
          qpo.tut.red0 = new makeUnit("red",1,5,0);
          // startUnit("blue",1,1,0);
          // improveUnit(qpo.tut.blue0);
          // finishUnit(qpo.tut.blue0);
          // startUnit("red",1,5,0);
          // improveUnit(qpo.tut.red0);
          // finishUnit(qpo.tut.red0);
          qpo.tut.red0.rect.toBack();
          controlPanel.icons.xs[0].hide();
          controlPanel.icons.circles[0].show();
          break;
        case 1: //transition from "units" to "turns"
          var timerAnim = Raphael.animation({
            "0%" : {segment: [450, 250, 50, -90, 269]},
            "100%" : {segment: [450, 250, 50, -90, -90]}
          }, 3000).repeat("Infinity");
          qpo.timer.pie.animate(timerAnim);
          break;
        case 2: //transition from "turns" to "control panel 1"
          qpo.timer.pie.stop();
          qpo.timer.pie.attr({segment: [450, 250, 50, -90, 269]});
          break;
        case 3: //transition from "control panel" to "moving"
          break;
        case 4: //transition from "moving" to "shooting"
          break;
        default: //nada
          console.log("You forgot a 'break', David.");
          break;
      }
      qpo.tut.transition();
    },
    "ekey": function(){ // "e" (shoot)
      //qpo.tut.blue0.shoot();
    }
  };
  return this;
};

//old tutorial function:
function startHowTo(){
  /*
  opponentDead = 0;
  playerDead = 0;
  drawGUI();
  placeUnitsTut();
  */
  turnNumber = 0;

  howToPage = {};
  howToPage.chapter = 0;

  //CHAPTER 0 STUFF:
  howToPage.unit = c.rect(300, 125,
      50,50).attr({"fill":COLOR_DICT["blue"],"opacity":.7});

  var demoShot = function(){
    howToPage.shot = c.rect(300 + 22, 125 + 50, 6, 2)
      .attr({"fill":COLOR_DICT["shot color"], "opacity":.5,
        "stroke":COLOR_DICT["shot color"]});
    anim = Raphael.animation({
      "0%" : {"height":2, "y": 175},
      "33.3%" : {"height": 25},
      "66.6%" : {"y": 200},
      "100%" : {"y": 225, "height":0}
      }, 1500*timeScale
    ); //end anim
    howToPage.shot.animate(anim);
  };
  demoShot();
  howToPage.shooter = setInterval(demoShot, 10000); //end setInterval

  var demoBomb = function(){
    howToPage.bomb = c.rect(300 + 18, 125 + 50 + 18, 14, 14)
      .attr({"fill":COLOR_DICT["bomb color"], "opacity":.5,
        "stroke":COLOR_DICT["bomb color"]});
    anim = Raphael.animation({
      "0%" : {"y": 193},
      "66.6%" : {"y": 210},
      "100%" : {"y": 218, "height":0}
      }, 1500*timeScale
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

  howToPage.chapter0 = c.set().push(howToPage.unitText, howToPage.unit, howToPage.shot, howToPage.bomb);

  //CHAPTER 1 STUFF:
  howToPage.keys = c.set().push(
    c.rect(40, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(100, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(160, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(50, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(110, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.rect(170, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
    c.text(65, 65, "Q").attr({qpoText:[20]}),
    c.text(125, 65, "W").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(185, 65, "E").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(75, 125, "A").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(135, 125, "S").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
    c.text(195, 125, "D").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
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

  //CHAPTER 2 STUFF:
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
        howToPage.circles[1].attr({"stroke":"white","fill":COLOR_DICT["shot color"]});

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
        howToPage.circles[2].attr({"stroke":"white","fill":COLOR_DICT["shot color"]});

        howToPage.title.attr({"text":"Turns"});
        howToPage.keys.hide();
        howToPage.labels.hide();
        turnTimer();
        timer.attr({"transform":"t-150,-75"});
        timer.animate({segment: [450, 250, 50, -90, -90]}, 3000);
        timerInterval = setInterval(function(){
          timer.attr({segment: [450, 250, 50, -90, 269]});
          timer.animate({segment: [450, 250, 50, -90, -90]}, 3000);
          blueMovesQueue = [];
        },3000);
        howToPage.chapter2.show();

        break;
      case 2:
        howToPage.circles[2].attr({"stroke":"white","fill":"none"});
        howToPage.circles[3].attr({"stroke":"white","fill":COLOR_DICT["shot color"]});

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
    c.circle(285,450,5).attr({"stroke":"white","fill":COLOR_DICT["shot color"]}),
    c.circle(300,450,5).attr({"stroke":"white"}),
    c.circle(315,450,5).attr({"stroke":"white"}),
    c.circle(330,450,5).attr({"stroke":"white"})
  );

  howToPage.backToMainButton = new button("Main Menu",300,520,function(e){
    activeScreen="menu";
    /*howToPage.keys.hide();
    howToPage.title.hide();
    howToPage.circles.hide();
    howToPage.next.hide();
    howToPage.backToMainButton.set.hide();
    */
    howToPage.all.remove();
    mainMenu.showAll();
    timer.remove();
    clearInterval(timerInterval);
  });

  howToPage.all=c.set().push(howToPage.circles, howToPage.title, howToPage.next,
    howToPage.keys, howToPage.labels, howToPage.backToMainButton.set,
    howToPage.chapter0, howToPage.chapter1, howToPage.chapter2, howToPage.chapter3);
} //end startHowTo()
