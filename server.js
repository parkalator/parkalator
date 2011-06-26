var opts = {};

var sfp = require("./tools/sfp2parkalator")
opts.port = 20200;

var rest = require('restler');
var express = require('express');
var app = require('express').createServer();
var io = require('socket.io');
var sys = require('sys');
var socket;
var Db = require('mongodb').Db,
  Connection = require('mongodb').Connection,
  Server = require('mongodb').Server,
  // BSON = require('../lib/mongodb').BSONPure;
  BSON = require('mongodb').BSONNative;

var dbhost = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var dbport = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

var db = new Db('parkalator', new Server(dbhost, dbport, {}), {native_parser:true});

app.use(express.bodyParser());
app.use(app.router);

app.get('/', function(req, res){
	res.sendfile("index.html");
	//res.send('Phone calls ' + callcount);
});

app.use(express.static(__dirname + '/'));


app.get('/api/parking_meters', function(req, res){
	var lat = req.query.lat,
		lng = req.query.lng,
		radius = req.query.radius;
	
	var ret = {};
	
	parkcollection.find({ "LOCBEG":{"$within" : {"$center" : [{lat:parseFloat(lat),lng:parseFloat(lng)}, parseFloat(radius)]}}}).toArray(function(err, docs) {
	    ret.meters=docs; 
		res.send(ret);
	});
});

var priceHistoryData = [];
var currentStats;

app.get('/api/current_stats', function(req, res){
	res.send(currentStats);
});

app.get('/api/history_stats', function(req, res){
	var d;
	if (priceHistoryData.length > 10){
		d = priceHistoryData.slice(priceHistoryData.length-10);
	}
	else
	{
		d = priceHistoryData;
	}
	res.send(d);
});



var parkcollection;
db.open(function(err, db) {
	db.collection('sfpark', function(err, collection) {
		parkcollection = collection;
		
		parkcollection.ensureIndex({"LOCBEG" : "2d"},null,function(){});
		parkcollection.ensureIndex({"LOCEND" : "2d"},null,function(){});
		setInterval(function() {
			var path = "http://api.sfpark.org/sfpark/rest/availabilityservice?lat=37.792275&long=-122.397089&radius=100&uom=mile&pricing=yes&response=json";
			console.log("downloading data");
			rest.get(path).on('complete', function(data,response) { 
					collection.remove({}, function(err, result) {
						//console.log("inserting data");
						//console.log(data);
						data = sfp.sfp2parkalator(data,(new Date()).toLocaleString());
						collection.insert(data);
						var rateCount = 0;
						var rateZeroCount = 0;
						var rateTotal = 0.0;
						var rateZeroTotal = 0.0;
						var maxRate = 0.0;
						for (var i=0;i<data.length;i++){
							var rate = parseFloat(data[i].RATE);
							if (rate > 0)
							{
								rateCount++;
								rateTotal+=rate;
							}
							rateZeroCount++;
							rateZeroTotal+=rate;
							if (rate>maxRate)
								maxRate = rate;
						}
						//console.log(rateCount);
						//console.log(rateZeroCount);
						//console.log(maxRate);
						var statData = {};
						statData.date = (new Date()).toLocaleString();
						statData.maxRate = maxRate;
						statData.freeMeters = rateZeroCount-rateCount;
						statData.paidMeters = rateCount;
						statData.priceaverage = rateZeroTotal/rateZeroCount;
						statData.pricepaidaverage = rateTotal/rateCount;
						currentStats = statData;
						priceHistoryData.push(statData);
						sendData("new data", true);
				});
			});
		},3000);

	});
});

function sendData(message,newData){
	var obj = {};
	if (newData) {
		obj.newData = newData;
	}
	if (message)
	{
		obj.msg = message;
	}
	if (currentStats){
		obj.dataDate = currentStats.date;
		obj.priceAverage = currentStats.priceaverage;
		obj.pricePaidAverage = currentStats.pricepaidaverage;
		obj.maxRate = currentStats.maxRate;
		obj.freeMeters = currentStats.freeMeters;
		obj.paidMeters = currentStats.paidMeters; 
	}
	console.log("message");
	console.log(obj)
	socket.sockets.emit("newData",obj);
}

app.listen(8000);

socket = io.listen(app); 
socket.configure('production', function(){
  socket.enable('browser client etag');
  socket.set('log level', 1);

  socket.set('transports', [
   'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
  ]);
});

socket.configure('development', function(){
  socket.enable('browser client etag');
  socket.set('log level', 1);
  socket.set('transports', [
   'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
  ]);
});

socket.sockets.on('connection', function(client){ 
	sendData("");
	client.on('message', function(msg){ 
		//sendData(); 
		console.log(msg);
	});
  	client.on('disconnect', function(){
		
	});
});


