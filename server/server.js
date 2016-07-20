"use strict";
var express = require('express'); //Require express for middleware use
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http); //IO is the server

app.use(express.static(__dirname + "/../client")); //Serve static files

app.get('/', function(req, res){
  res.sendFile('./index.html');
});

io.on('connection', function(socket){
  // socket.on('chat message', function(msg){
    // io.emit('chat message', msg);
  // });
  console.log("A user connected: ", socket.id);

  const upcomingMoves = [];
  let placedUnits;

  socket.on("blue move", function(data) {
  	console.log("Server detected a move event! ", data);
  	upcomingMoves.push(data);
  });

  socket.on("new game", function(data) {
  	console.log("Server detected a new game!");
  	io.emit("new game", data);
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

});

/*// Emit socket.io events for each keypress
              // Events are matched to key codes in socket-init.js
              socket.emit(playerSocketEvents[event.keyCode]);
              console.log("Trying to emit an event!");*/

// console.log(http);
// console.log(http.listen);

http.listen(1024, function(){
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
