"use strict";
var socket = io();

const playerSocketEvents = {
	81:"bomb",
    69:"shoot",
    65:"moveLeft",
    87:"moveUp",
    68:"moveRight",
    83:"moveDown",
    88:"stay"
}

socket.on("new game", function(data) {
	console.log("A game started by user ", data.owner, " is already in progress");
	// alert("A game started by user ", data.owner, " is already in progress");
});