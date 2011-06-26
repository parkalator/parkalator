var opts = {};
var io = require('socket.io'); 
opts.port = 20200;

var rest = require('restler');
var express = require('express');
var app = require('express').createServer();
var sys = require('sys');

var Db = require('mongodb').Db,
  Connection = require('mongodb').Connection,
  Server = require('mongodb').Server,
  // BSON = require('../lib/mongodb').BSONPure;
  BSON = require('mongodb').BSONNative;


var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

var db = new Db('parkalator', new Server(host, port, {}), {native_parser:true});


var callcount = 0;

var socket = io.listen(app); 



app.use(express.bodyParser());
app.use(app.router);

app.get('/', function(req, res){
	res.sendfile("index.html");
	//res.send('Phone calls ' + callcount);
});

app.use(express.static(__dirname + '/'));

db.open(function(err, db) {
	db.collection('sfpark', function(err, collection) {
		setTimeout(function() {
			var path = "http://api.sfpark.org/sfpark/rest/availabilityservice?lat=37.792275&long=-122.397089&radius=10&uom=mile&pricing=yes&response=json";
			console.log("downloading data");
			rest.get(path).on('complete', function(data,response) { 
				console.log("inserting data");
				collection.insert(data);
			});
		},3000);
	});
});




function sendData(message){
	var obj = {};
	if (message)
	{
		obj.msg = message;
	}
	console.log("message");
	console.log(obj)
	socket.broadcast(obj);
}

app.listen(8000);



