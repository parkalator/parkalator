$(function(){
	var socket = new io.Socket(); 
	window.socket = socket;
	socket.connect();
	socket.on('connect', function(){ 
	//$("#log").append("<div><strong>connected to server. listening for calls.</strong></div>");
	});
	socket.on('message', function(obj){
		if ("campaign" in obj) {
			window.campaign = obj.campaign;
			
		}
		if ("callerLog" in obj) {
			
		}
		if ("msg" in obj) {
			//$("#log").append("<div>" + obj.msg + "</div>");
		}
		if ("calls" in obj) {
			$("#phonecallsCountdown").text(200-obj.calls);
			$("#phonecalls").text(obj.calls);
		}
		if ("clients" in obj) {
			$(".client_count").text(obj.clients);
		}
	});
	socket.on('disconnect', function(){
	//$("#log").append("<p><strong>disconnected from the server</strong></p>");
	});
	
	var obj = {};
	obj.campaign = "2011";
	socket.send(obj);
	
	window.connectMe = function (campaign,phonenumber,legi) {
		var obj = {};
		obj.campaign = campaign;
		obj.phonenumber = phonenumber;
		obj.legislator = legi;
		obj.action = "connectMe";
		socket.send(obj);
	}	
	
	$("#callform").submit(function() {
		window.connectMe("2011",$("#phonenumber").val(),$("input[@name=legislator]:checked").val());
		
	    return false;
	 });
	 
});