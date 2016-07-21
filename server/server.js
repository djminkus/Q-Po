"use strict";
var express = require('express'); //Require express for middleware use
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http); //IO is the server

//For writing to temporary 'database' (JSON file)
const fs = require("fs");

//Temporary 'database'
const db = require("./database.json");

//Import router and force all requests through it
const routes = require("./routes.js");
app.use("/", routes);

app.use(express.static(__dirname + "/../client")); //Serve static files


//	//	//	//	// //
//	SOCKET.IO CODE //
//	//	//	//	// //


io.on('connection', function(socket){
  // socket.on('chat message', function(msg){
    // io.emit('chat message', msg);
  // });
  console.log("A user connected: ", socket.id);

  const activeGames = [];
  const upcomingMoves = [];
  let placedUnits;

  socket.on("blue move", function(data) {
  	console.log("Server detected a move event! ", data);
  	upcomingMoves.push(data);
  });

  socket.on("new game", function(data) {
  	console.log("Server detected a new game!");
  	//Tell all users there's a new game
  	io.emit("new game", data);
  	//Add the new game to activeGames
  	activeGames.push(data);
  	//Update the 'database' with active games
  	fs.writeFile("database.json", JSON.stringify(activeGames), "utf8");
  });

  socket.on("unit placed", function(data) {
  	console.log("Server detected new unit placed!", data);
  	placedUnits = data;
  	console.log("placedUnits is now: ", placedUnits);
  });

  socket.on("red executed", function(data) {
  	console.log("Red executed a move: ", data);
  });

  socket.on("blue executed", function(data) {
  	console.log("Blue executed a move: ", data);
  });

  socket.on("disconnect", function(data) {
  	//Slicec off leading /# from id
  	const name = socket.id.slice(2);
  	//See if the disconnected user owned any active games
	console.log("Looking for game owned by user ", name);
  	for (let i=0; i<activeGames.length; i++) {
  		if (activeGames[i].owner === name) {
  			//Remove this index from the array
  			activeGames.splice(i, 1);
  			console.log("Tried to remove game. activeGames is now: ", activeGames);
  		}else console.log("No games found for user ", name, ". Giving up");
  	} 

  	fs.writeFile("database.json", JSON.stringify(activeGames), "utf8");
  });

});

/*// Emit socket.io events for each keypress
              // Events are matched to key codes in socket-init.js
              socket.emit(playerSocketEvents[event.keyCode]);
              console.log("Trying to emit an event!");*/

// console.log(http);
// console.log(http.listen);

//To make sure there's a port when app is hosted
const port = (process.env.PORT || 1024);

http.listen(port, function(){
  console.log('listening on *:1024');
});

// /* PRE-SOCKET.IO CODE
// app.get('/', function(req, res){
//   //res.send('<h1>Hello world</h1>');
// });
//
// io.on('connection', function(socket){
//   console.log('a user connected');
// });
//
// http.listen(573, function(){
//   console.log('listening on *:573');
// });
//
// window.onload = function() {
//   // Create a new WebSocket.
//   var socket = new WebSocket('ws://echo.websocket.org');
//
//   // Handle any errors that occur.
//   socket.onerror = function(error) {
//     console.log('WebSocket Error: ' + error);
//   };
//
//   // Show a connected message when the WebSocket is opened.
//   socket.onopen = function(event) {
//     socketStatus.innerHTML = 'Connected to: ' + event.currentTarget.URL;
//     socketStatus.className = 'open';
//   };
//
//   // Handle messages sent by the server.
//   socket.onmessage = function(event) {
//     var message = event.data;
//     messagesList.innerHTML += '<li class="received"><span>Received:</span>' +
//                                message + '</li>';
//   };
//
//   // Show a disconnected message when the WebSocket is closed.
//   socket.onclose = function(event) {
//     socketStatus.innerHTML = 'Disconnected from WebSocket.';
//     socketStatus.className = 'closed';
//   };
//
//   // Send a message when the form is submitted.
//   form.onsubmit = function(e) {
//     e.preventDefault();
//
//     // Retrieve the message from the textarea.
//     var message = messageField.value;
//
//     // Send the message through the WebSocket.
//     socket.send(message);
//
//     // Add the message to the messages list.
//     messagesList.innerHTML += '<li class="sent"><span>Sent:</span>' + message +
//                               '</li>';
//
//     // Clear out the message field.
//     messageField.value = '';
//
//     return false;
//   };
//
//   // Close the WebSocket connection when the close button is clicked.
//   closeBtn.onclick = function(e) {
//     e.preventDefault();
//
//     // Close the WebSocket.
//     socket.close();
//
//     return false;
//   };
//
// };
// */
