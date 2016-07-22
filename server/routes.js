"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

let db = require("./database.json");

fs.watch("./database.json", (eventType, filename) => {
	console.log("Change to db! routes.js is updating file \n db is now: ", db);
	delete require.cache['./database.json'];
	db = require("./database.json");
});

const router = express.Router();
const publicPath = path.resolve(__dirname + "/../client");

//Need to inspect response body
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

router.get('/', function(req, res){
  res.sendFile(publicPath + '/index.html');
});

router.get('/api/activegames', function(req, res) {
	res.send(db);
});

module.exports = router;