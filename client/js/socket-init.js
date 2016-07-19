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