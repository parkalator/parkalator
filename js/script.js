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

    var mapOptions = { 
	maxResolution: 156543.03390625,
	numZoomLevels: 31,
	projection: new OpenLayers.Projection('EPSG:900913'),
	maxExtent: new OpenLayers.Bounds(-2.003750834E7,-2.003750834E7,2.003750834E7,2.003750834E7),
	
        controls: [
	    new OpenLayers.Control.ZoomPanel(),
	    new OpenLayers.Control.Navigation({zoomWheelEnabled: false}),
	],
	theme: null,
    };
    
    map = new OpenLayers.Map('map', mapOptions );
    var osm = new OpenLayers.Layer.WMS(
   	"openstreetmap","http://maps.opengeo.org/geowebcache/service/wms",
			{layers: 'openstreetmap', format: 'image/png'} 
    );
    /*var gs = new OpenLayers.Layer.WMS(
	"GeoServer","http://parkalator.com:8080/geoserver/parkalator/wms",
	{layers: 'SFMTA_meters_0210,bayarea_zipcodes', transparent: 'true'});*/
    var regions = new OpenLayers.Layer.Vector("Regions", {
        strategies: [new OpenLayers.Strategy.BBOX()],
        protocol: new OpenLayers.Protocol.WFS({
            version: "1.1.0",
            url: "/geoserver/wfs",
            featureType: "planning_neighborhoods",
            featureNS: "http://parkalator.com/parkws",
            srsName: "EPSG:2227"
        })
    });

    var meters = new OpenLayers.Layer.Vector("Parking Meters", {
        strategies: [new OpenLayers.Strategy.BBOX()],
        protocol: new OpenLayers.Protocol.WFS({
            version: "1.1.0",
            url: "/geoserver/wfs",
            featureType: "SFMTA_meters_0210",
            featureNS: "http://parkalator.com/parkws",
            srsName: "EPSG:2227"
        })
    });

    map.addLayer(osm);
    map.addLayer(regions);

    map.setCenter(new OpenLayers.LonLat(-122.4394155, 37.7579295) // Center of the map
		  .transform(
		      new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
		      new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
		  ), 13 // Zoom level
		 );


    var dataSet1 = new TimeSeries(), dataSet2 = new TimeSeries(), dataSet3 = new TimeSeries();
 
    function mean() {
	var m = (Math.round(Math.random() * 1000) / 100) + "";
	if(m.length < 4) m = m + '0';
	$("#chart-mean").html("$" + m);
	return m;
    }

    function median() {
	var m = (Math.round(Math.random() * 1000) / 100) + "";
	if(m.length < 4) m = m + '0';
	$("#chart-med").html("$" + m);
	return m;
    }
    
    setInterval(function() {
        var now = new Date().getTime();
        dataSet1.append(now, mean());
        dataSet2.append(now, median());
    }, 1000);
    

    $("#chart").attr('width', ($("#bottom").width() / 3)-60);
    $(window).resize(function() {
	$("#chart").attr('width', ($("#bottom").width() / 3)-60);
    });
    
    // Build the timeline
    var smoothie = new SmoothieChart({ 
	millisPerPixel: 20, 
	grid: { 
	    strokeStyle: '#eeeeee', 
	    fillStyle: '#ffffff', 
	    lineWidth: 1, 
	    millisPerLine: 1000, 
	    verticalSections: 10
	}
    });
    
    smoothie.addTimeSeries(dataSet1, { strokeStyle: 'rgba(255, 0, 0, 1)', fillStyle: 'rgba(255, 0, 0, 0.2)', lineWidth: 1 });
    smoothie.addTimeSeries(dataSet2, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 1 });
    
    smoothie.streamTo(document.getElementById('chart'), 1000);
    

    $("#hide-legend").click(function() {
	if($(this).html() == '(hide)') {
	    $("#legend div").hide();
	    $(this).html('(show)');
	} else { 
	    $("#legend div").show();
	    $(this).html('(hide)');
	}
    });
});
