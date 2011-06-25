var opts = {};
var io = require('socket.io'); 
opts.port = 20200;

var rest = require('restler');
var express = require('express');
var app = require('express').createServer();
var sys = require('sys');

var callcount = 0;

app.use(express.bodyParser());
app.use(app.router);



app.get('/', function(req, res){
	res.sendfile("index.html");
	//res.send('Phone calls ' + callcount);
});

app.use(express.static(__dirname + '/'));

var clientCount = 0;

var socket = io.listen(app); 

function sendData(message){
	var obj = {};
	obj.calls = callcount;
	obj.clients = clientCount; 
	if (message)
	{
		obj.msg = message;
	}
	console.log("message");
	console.log(obj)
	socket.broadcast(obj);
}

app.listen(8000);
