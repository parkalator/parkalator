$(function(){
	 var socket = new io.Socket(); 
	 socket.connect();
	 socket.on('connect', function(){ 
		//$("#log").append("<div><strong>connected to server. listening for calls.</strong></div>");
	 });
	 socket.on('message', function(obj){
		if ("msg" in obj) {
			$("#log").append("<div>" + obj.msg + "</div>");
		}
		if ("calls" in obj) {
			$("#phonecalls").text(obj.calls);
		}
		if ("clients" in obj) {
			$(".client_count").text(obj.clients);
		}
	 });
	 socket.on('disconnect', function(){
		//$("#log").append("<p><strong>disconnected from the server</strong></p>");
	 });
});
