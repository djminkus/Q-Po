var num_inputs = 218;
var num_actions = 7; // 7 possible choices for a move
var temporal_window = 1; // amount of temporal memory. 0 = agent lives in-the-moment
var network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

// the value function network computes a value of taking any of the possible actions
// given an input state. Here we specify one explicitly the hard way
// but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
// to just insert simple relu hidden layers.
var layer_defs = [];
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
layer_defs.push({type:'fc', num_neurons: 75, activation:'relu'});
layer_defs.push({type:'fc', num_neurons: 75, activation:'relu'});
layer_defs.push({type:'regression', num_neurons:num_actions});

// options for the Temporal Difference learner that trains the above net
// by backpropping the temporal difference learning rule.
var tdtrainer_options = {learning_rate:0.001, momentum:0.0, batch_size:64, l2_decay:0.01};

var opt = {};
opt.temporal_window = temporal_window;
opt.experience_size = 30000;
opt.start_learn_threshold = 1000;
opt.gamma = 0.7;
opt.learning_steps_total = 200000;
opt.learning_steps_burnin = 3000;
opt.epsilon_min = 0.05;
opt.epsilon_test_time = 0.05;
opt.layer_defs = layer_defs;
opt.tdtrainer_options = tdtrainer_options;

qpo.convertStateToInputs = function(state){
  var arr = new Array(); //final array to be fed to network as input
  var q = qpo.activeGame.q;
  var gridAdj = (q+1)/2 //grid adjustment
  var gameBoard = qpo.guiCoords.gameBoard;
  var xMid = (gameBoard.rightWall + gameBoard.leftWall) / 2;
  var yMid = (gameBoard.topWall + gameBoard.bottomWall) / 2;
  var xInd;
  var yInd;
  for(var i=0; i<16; i++){ //0-15 (unit qpo-grid coords go here)
    // All of these (x and y) range from 0 to qpo.activeGame.q when unit is
    //   alive, and -1 when unit is dead. So, -1 to 8.
    arr[i] = state[i] - gridAdj;
  }
  for(var i=0; i<24; i++){ //16-63 (shot Raphael coords go here)
    //x-coords range from qpo.guiCoords.gameBoard.leftWall to qpo.guiCoords.gameBoard.rightWall
    //  and have indices 2i
    //y-coords range from qpo.guiCoords.gameBoard.topWall to qpo.guiCoords.gameBoard.bottomWall
    //  and have indices 2i+1
    xInd = 16 + (2*i);
    yInd = 16 + (2*i) + 1;
    arr[xInd] = xMid - state[xInd];
    arr[yInd] = yMid - state[yInd];
  }
  for(var i=0; i<24; i++){ //64-87 (shot directionalities go here)
    xInd = 16+48 + i;
    arr[xInd] = state[xInd];
  }
  for(var i=0; i<32; i++){ //88-151 (bomb Raphael coords go here)
    xInd = 16+48+24 + (2*i);
    yInd = 16+48+24 + (2*i) + 1;
    arr[xInd] = xMid - state[xInd];
    arr[yInd] = yMid - state[yInd];
  }
  for(var i=0; i<32; i++){ //152-183 (bomb directionalities go here)
    xInd = 16+48+24+64 + i;
    arr[xInd] = state[xInd];
  }
  for(var i=0; i<32; i++){ //184-215 (bomb timers go here)
    //range from -1 to 3. Middle value is +1.
    xInd = 16+48+24+64+32 + i;
    arr[xInd] = 1 - state[xInd];
  }
  var timeLag = (Date.now()) - state[216]; //time since state was acquired
  arr[216] = timeLag/(3000*qpo.timeScale);  //take into account the fraction of
                                      //a turn that's elapsed since state was acquired.
  return arr;
};
qpo.actions = ["moveLeft","moveUp","moveRight","moveDown","shoot","bomb","stay"];

qpo.redRewardQueue = new Array();
qpo.sixty = {
  "list" : new Array(),
  "cursor" : 0
};

var freshStart = false;

qpo.openingCode = function(){
  if(freshStart){
    // console.log(localStorage['aliNN'])
    localStorage['aliNN']=null;
    console.log(localStorage['aliNN'] + ", ali was deleted");
  }; //delete ali from local storage.
  try {
    qpo.ali = { //The OG qpo AI
      "nn" : null,
      "team" : "red"
    };
    // qpo.ali.nn = new convnetjs.Net();
    qpo.ali.nn = new deepqlearn.Brain(num_inputs, num_actions, opt);
    if(localStorage['aliNN'] !== "null"){ //retrieves saved network from local storage
      // console.log("generating Ali's net from localStorage");
      qpo.ali.nn.value_net.fromJSON(JSON.parse(localStorage['aliNN']));
      // (JSON.stringify(qpo.ali.nn) == localStorage['aliCopy']) ? (console.log("ali successfully reconstructed.")) : console.log("ali reconstruction failed.");
      // (JSON.stringify(qpo.ali.nn.value_net.toJSON()) == localStorage['aliCopy2']) ? (console.log("ali value net successfully reconstructed.")) : console.log("ali value net reconstruction failed.");
    }
    else {
      console.log("no net found in localStorage. making new one."); //no net found in localStorage
      var brain = new deepqlearn.Brain(num_inputs, num_actions, opt); // start fresh
      // console.log(brain);
      qpo.ali = { //The OG qpo AI
        "nn" : brain,
        "team" : "red"
      };
    }
  }
  catch(err){
    console.log(err);
  }
  return null;
};
window.onload = qpo.openingCode;

qpo.closingCode = function(){
  try{
    localStorage['aliNN'] = JSON.stringify(qpo.ali.nn.value_net.toJSON()); //stores network to local storage for persistence
    localStorage['aliCopy'] = JSON.stringify(qpo.ali.nn);
    localStorage['aliCopy2'] = JSON.stringify(qpo.ali.nn.value_net.toJSON());

  }
  catch(err){
    console.log("UH-OH. looks like there's no network to store.")
  }
  return null;
};
window.onbeforeunload = qpo.closingCode;
