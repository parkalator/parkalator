function y2lat(a) { return 180/Math.PI * (2 * Math.atan(Math.exp(a*Math.PI/180)) - Math.PI/2); }
function lat2y(a) { return 180/Math.PI * Math.log(Math.tan(Math.PI/4+a*(Math.PI/180)/2)); }
var regions = null;
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
    
    /*regions = new OpenLayers.Layer.Vector("Regions", {
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
    });*/

    var colors = [
	"#fd911c",
	"#fb901a",
	"#f98d18",
	"#f78b16",
	"#f58914"];

    var randColor = function() {
	console.log("randColor");
	return colors[Math.floor ( Math.random() * colors.length )];
    }	

    regions = new OpenLayers.Layer.Vector("Parking Meters", {
        strategies: [new OpenLayers.Strategy.BBOX()],
        protocol: new OpenLayers.Protocol.WFS({
            version: "1.1.0",
            url: "http://parkalator.com/geoserver/wfs",
            featureType: "planning_neighborhoods",
            featureNS: "http://parkalator.com/parkws",
            srsName: "EPSG:900913"
        }),
    
    });
    
    for(r in regions.features) {
	f = regions.features[r];
	f.style = OpenLayers.Style({
		'fillColor': randColor()
	});
	console.log('foo');			
    }	
 
    avail_pkg = new OpenLayers.Layer.Markers("Available Parking");
    
    map.addLayers([osm, regions, avail_pkg]);
    

    osm.events.on({
        moveend: function(e) {
	    // fetch data for this region
            if(map.zoom >= 15) {
		/*
		var center = map.center;
		
		center.transform(
		    new OpenLayers.Projection("EPSG:900913"), 
		    new OpenLayers.Projection("EPSG:4326")
		);
		
		$.get("/api/parking_meters?lat=" + center.lat + "&lng=" + center.lon + "&radius=2000",
		      function(r) {
			  for (i in r['meters']) {
			      var bbox = new OpenLayers.Marker.Box(
				  new OpenLayers.Bounds(
				      r['meters'][i]['LOCBEG']['lon'],
				      r['meters'][i]['LOCBEG']['lat'],
				      r['meters'][i]['LOCEND']['lon'],
				      r['meters'][i]['LOCEND']['lat'])
				      .transform(
					  new OpenLayers.Projection("EPSG:4326"),
					  new OpenLayers.Projection("EPSG:900913")));
			      avail_pkg.addMarker(bbox);
			  } 
		      })
		*/
		// time to show the meters
		meters = new OpenLayers.Layer.WMS(
                    "SFMTA_meters_0210", "http://parkalator.com/geoserver/parkalator/wms",
                    {layers: 'SFMTA_meters_0210', transparent: 'true'}
                );
                /*
                meters = new OpenLayers.Layer.Vector("Parking Meters", {
		    strategies: [new OpenLayers.Strategy.BBOX()],
		    protocol: new OpenLayers.Protocol.WFS({
			version: "1.1.0",
			url: "http://parkalator.com/geoserver/wfs",
			featureType: "SFMTA_meters_0210",
			featureNS: "http://parkalator.com/parkws",
			srsName: "EPSG:900913"
		    })
		});*/
		
		map.addLayers([meters]);
		
		console.log('add meters');
	    }
	    else { 
		// check if meters are visible, if so, hide them
		    
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
		var m = num.toFixed(2);
		$(field).text("$" + m);
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
    
    smoothie.addTimeSeries(dataSetMean, { strokeStyle: 'rgba(120, 185, 193, 1)', fillStyle: 'rgba(255, 185, 193, 0.2)', lineWidth: 1 });
    smoothie.addTimeSeries(dataSetPaidMean, { strokeStyle: 'rgba(120, 185, 84, 1)', fillStyle: 'rgba(120, 185, 84, 0.2)', lineWidth: 1 });
    //smoothie.addTimeSeries(dataSetMaxRate, { strokeStyle: 'rgba(0, 0, 255, 1)', fillStyle: 'rgba(0, 0, 255, 0.2)', lineWidth: 1 });
    
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
	    if (obj['maxRate'] != counts['maxRate']) {
		counts['maxRate'] = obj['maxRate'];
		$("#meter-activity").prepend(
		    $("<li />").append(
			$("<span />").html("$" + parseFloat(counts['maxRate']).toFixed(2)).addClass("field")
		    ).append(
			$("<span />").html(" is now the most expensive rate in the city.").addClass("data")
		    ));
	    }	
	}
	if ("freeMeters" in obj) {
		$("#info-paidmeters").html("<span style='display:block;float:left;width:30px' class='m10r'>" + obj.freeMeters + "</span>" + obj.paidMeters);
	}
	if ("priceAverage" in obj) {
	    dataSetMean.append(now, updateStat(obj['priceAverage'], "#chart-mean"));
	}
	if ("pricePaidAverage" in obj) {
	    dataSetPaidMean.append(now, updateStat(obj['pricePaidAverage'], "#chart-paidMean"));
	}
	if ("maxRate" in obj) {
	    //dataSetMaxRate.append(now, updateStat(obj['maxRate'], "#chart-paidMaxRate"));
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
