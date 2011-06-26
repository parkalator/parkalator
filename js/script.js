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
            url: "/geoserver/parkalator/wfs",
            featureType: "planning_neighborhoods",
            srsName: "EPSG:2227"
        })
    });

    var meters = new OpenLayers.Layer.Vector("Regions", {
        strategies: [new OpenLayers.Strategy.BBOX()],
        protocol: new OpenLayers.Protocol.WFS({
            version: "1.1.0",
            url: "/geoserver/parkalator/wfs",
            featureType: "SFMTA_meters_0210",
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
});
