$(function(){
    
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
			{layers: 'openstreetmap', format: 'image/png', isBaseLayer: true, rendererOptions: {yOrdering: true}} 
    );
    
    var regions = new OpenLayers.Layer.Vector("Regions", {
        strategies: [new OpenLayers.Strategy.BBOX()],
        projection:  new OpenLayers.Projection("EPSG:2227"),
        protocol: new OpenLayers.Protocol.WFS({
            version: "1.1.0",
            url: "http://parkalator.com/geoserver/wfs",
            featureType: "planning_neighborhoods",
            featureNS: "http://parkalator.com/parkws",
            srsName: "EPSG:2227",
            schema: "http://parkalator.com:8080/geoserver/wfs/DescribeFeatureType?version=1.1.0&typename=parkalator:planning_neighborhoods",
            featurePrefix: "parkalator"
        })
    });

    /*var meters = new OpenLayers.Layer.Vector("Parking Meters", {
        strategies: [new OpenLayers.Strategy.BBOX()],
        protocol: new OpenLayers.Protocol.WFS({
            version: "1.1.0",
            url: "http://parkalator.com/geoserver/wfs",
            featureType: "SFMTA_meters_0210",
            featureNS: "http://parkalator.com/parkws",
            srsName: "EPSG:2227",
	    featurePrefix: 'parkalator',
        })
    });*/

    map.addLayers([osm, regions]);//, meters]);

    osm.events.on({
        moveend: function(e) {
	    // fetch data for this region
	    
            if (e.zoomChanged) {
		if(map.zoom == 15) {
		    // time to show the meters
		    //map.addLayers([meters]);
		    console.log('add meters');
		}
		else { 
		    // check if meters are visible, if so, hide them
		    
		}
            }
        },
    });
    
    var sf = new OpenLayers.LonLat(-122.4394155, 37.7579295);

    map.setCenter(
	sf.transform(
	    new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
	    new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
	), 13);
    
    /* smoothie ingredients */
    
    var dataSetMean = new TimeSeries(), dataSetPaidMean = new TimeSeries();
    
    function mean(num) {
	var m = ((parseFloat(num) * 1000) / 100) + "";
	if(m.length < 4) 
	    m = m + '0';
	$("#chart-mean").html("$" + m);
	return m;
    }

    function paidMean(num) {
	var m = ((parseFloat(num) * 1000) / 100) + "";
	if(m.length < 4)
	    m = m + '0';
	$("#chart-paidMean").html("$" + m);
	return m;
    }

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
    
    smoothie.addTimeSeries(dataSetMean, { strokeStyle: 'rgba(255, 0, 0, 1)', fillStyle: 'rgba(255, 0, 0, 0.2)', lineWidth: 1 });
    smoothie.addTimeSeries(dataSetPaidMean, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 1 });
    
    smoothie.streamTo(document.getElementById('chart'), 1000);
    
    var socket = new io.Socket(); 
    socket.connect();
    socket.on('connect', function(){ 
	
    });
    
    counts = {
	'free': 0,
	'paid': 0,
    };
    
    socket.on('message', function(obj){
        var now = new Date().getTime();
	if ("freeMeters" in obj) {
	    if (parseInt(obj['freeMeters']) > counts['free']) {
		counts['free'] = parseInt(obj['freeMeters']);
		$("#meter-activity").prepend(
		    $("<li />").append(
			$("<span />").html(counts['free']).addClass("field")
		    ).append(
			$("<span />").html(" available free meters.").addClass("data")
		    ));
	    }	
	}
	if ("paidMeters" in obj) {
	    if (parseInt(obj['paidMeters']) > counts['paid']) {
		counts['paid'] = parseInt(obj['paidMeters']);
		$("#meter-activity").prepend(
		    $("<li />").append(
			$("<span />").html(counts['paid']).addClass("field")
		    ).append(
			$("<span />").html(" available paid meters.").addClass("data")
		    ));
	    }	
	}
	if ("priceAverage" in obj) {
	    dataSetMean.append(now, mean(obj['priceAverage']));
	}
	if ("pricePaidAverage" in obj) {
	    dataSetPaidMean.append(now, paidMean(obj['pricePaidAverage']));
	}
    });
    
    socket.on('disconnect', function(){
	
    });
    

    $("#hide-legend").click(function() {
	if($(this).html() == '(hide)') {
	    $("#legend div").hide();
	    $(this).html('(show)');
	} else { 
	    $("#legend div").show();
	    $(this).html('(hide)');
	}
    });
    
    $("#chart").attr('width', ($("#bottom").width() / 3)-60);
    $(window).resize(function() {
	$("#chart").attr('width', ($("#bottom").width() / 3)-60);
    });
    
});
