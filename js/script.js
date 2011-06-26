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
            featurePrefix: "parkalator"
        })
    });

    regions = new OpenLayers.Layer.Vector("Parking Meters", {
        strategies: [new OpenLayers.Strategy.BBOX()],
        protocol: new OpenLayers.Protocol.WFS({
            version: "1.1.0",
            url: "http://parkalator.com/geoserver/wfs",
            featureType: "planning_neighborhoods",
            featureNS: "http://parkalator.com/parkws",
            srsName: "EPSG:900913"
        })
    });
    
    meters = new OpenLayers.Layer.Vector("Parking Meters", {
        strategies: [new OpenLayers.Strategy.BBOX()],
        protocol: new OpenLayers.Protocol.WFS({
            version: "1.1.0",
            url: "http://parkalator.com/geoserver/wfs",
            featureType: "SFMTA_meters_0210",
            featureNS: "http://parkalator.com/parkws",
            srsName: "EPSG:900913"
        })
    });
    
    map.addLayers([osm, meters]);
    
    osm.events.on({
        moveend: function(e) {
	    // fetch data for this region
	    
            if (e.zoomChanged) {
		if(map.zoom == 15) {
		    // time to show the meters
		    //
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
    
    var dataSetMean = new TimeSeries(), dataSetPaidMean = new TimeSeries(), dataSetMaxRate = new TimeSeries();
    
    function updateStat(num, field) {
	var m = parseFloat(num).toFixed(2);
	$(field).html("$" + m);
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
    smoothie.addTimeSeries(dataSetMaxRate, { strokeStyle: 'rgba(0, 0, 255, 1)', fillStyle: 'rgba(0, 0, 255, 0.2)', lineWidth: 1 });
    
    smoothie.streamTo(document.getElementById('chart'), 1000);
    
    var socket = io.connect("http://parkalator.com/",{ 'port': 8000 });

    
    counts = {
	'free': 0,
	'paid': 0,
	'maxRate': 0,
    };
    
    socket.on('newData', function(obj){
        var now = new Date().getTime();
	if ("occupied" in obj) {
	    if (parseInt(obj['occupied']) != counts['free']) {
		if(counts['free'] < parseInt(obj['occupied'])) { 
		    var c = parseInt(obj['occupied']) - counts['free'];
		    var s = " newly available spots.";
		} else {
		    var c = counts['free'] - parseInt(obj['occupied']);
		    var s = " less available spots.";
		}
		counts['free'] = parseInt(obj['occupied']);
		$("#meter-activity").prepend(
		    $("<li />").append(
			$("<span />").html(c).addClass("field")
		    ).append(
			$("<span />").html(s).addClass("data")
		    ));
		$("#info-open").html(counts['free'] + " of " + (counts['free']+counts['paid']));
	    }	
	}
	if ("totalMeters" in obj) {
		var total = parseInt(obj['totalMeters'])-parseInt(obj['occupied']);
	    if (total != counts['paid']) {
		if(counts['paid'] < total) { 
		    var c = total - counts['paid'];
		    var s = " people have just parked.";
		} else {
		    var c = counts['paid'] - total;
		    var s = " people have just left their spots.";
		}
		counts['paid'] = total;
		$("#meter-activity").prepend(
		    $("<li />").append(
			$("<span />").html(c).addClass("field")
		    ).append(
			$("<span />").html(s).addClass("data")
		    ));
		$("#info-open").html(counts['free'] + " of " + (counts['free']+counts['paid']));
	    }	
	}
	if ("maxRate" in obj) {
	    if (parseFloat(obj['maxRate']) != counts['maxRate']) {
		counts['maxRate'] = parseFloat(obj['maxRate']);
		$("#meter-activity").prepend(
		    $("<li />").append(
			$("<span />").html("$" + parseFloat(counts['maxRate']).toFixed(2)).addClass("field")
		    ).append(
			$("<span />").html(" is now the most expensive rate in the city.").addClass("data")
		    ));
	    }	
	}
	if ("priceAverage" in obj) {
	    dataSetMean.append(now, updateStat(obj['priceAverage'], "#chart-mean"));
	}
	if ("pricePaidAverage" in obj) {
	    dataSetPaidMean.append(now, updateStat(obj['pricePaidAverage'], "#chart-paidMean"));
	}
	if ("maxRate" in obj) {
	    dataSetMaxRate.append(now, updateStat(obj['maxRate'], "#chart-paidMaxRate"));
	}
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
    
    $("#chart").attr('width', ($("#bottom").width() / 2)-50);
    $(window).resize(function() {
	$("#chart").attr('width', ($("#bottom").width() / 2)-50);
    });
    
});
