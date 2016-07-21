"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const db = require("./database.json");

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