Ext.gesture.Manager.onMouseEvent = function(e) {
if (!e.isSimulated)
	e.stopPropagation();
}

var map_overlays = [];
var ajaxRequest = null;
function clearOverlays() {
  if (map_overlays.length > 0) {
	var i = 0;
    for (i=0;i<map_overlays.length;i++) {
      map_overlays[i].setMap(null);
    }
  }
  map_overlays.length=0;
}



var infowin = new google.maps.InfoWindow({
});


var clickedWin = function(event) {
	var meter = this.meter;
	var text = meter.NAME;
	text += "<br/> Open meters: " + (parseInt(meter.OPER,10) - parseInt(meter.OCC,10));
	text += "<br/> Rate: $" + meter.RATE;
	
	infowin.setContent(text);
	infowin.setPosition(event.latLng);
    infowin.open(this.getMap());
}


function loadLines (map,toolbar)
{

	if (ajaxRequest)
	{
		ajaxRequest.abort();
		ajaxRequest = null;
	}
	ajaxRequest = $.ajax({
	  url: '/api/parking_meters?lat=37.778734661&lng=-122.4318517401&radius=10',
	  success: function(data) {
		ajaxRequest = null;
		clearOverlays();
		var totalCount, emptyCount, occCount, freeCount, paidCount;
		var meters = data.meters;
		if (meters){
			var i = 0;
			for (i=0;i<meters.length;i++)
			{
				var meter = meters[i];
				var lineCords = [
				        new google.maps.LatLng(meter.LOCBEG.lat, meter.LOCBEG.lng),
				        new google.maps.LatLng(meter.LOCEND.lat, meter.LOCEND.lng)
				];
				
				var center = new google.maps.LatLng(
					((meter.LOCBEG.lat+meter.LOCEND.lat)/2.0),
					((meter.LOCBEG.lng+meter.LOCEND.lng)/2.0));
				
				var rate = parseFloat(meter.RATE);
				var color = "#00FF00";
				
				if (rate >= 3)
				{
					color = "#FF0000";
				}
				else if (rate >= 2) {
					color = "#FFFF00";
				}
				else if (rate >= 1) {
					color = "#BCE954";
				}
				else if (rate > 0) {
					color = "#F87431";
				}
				
				if ((parseInt(meter.OPER,10) - parseInt(meter.OCC,10))==0)
				{
					color = "#0000FF";
				}
				
				totalCount += parseInt(meter.OPER,10);
				occCount += parseInt(meter.OCC,10);
				emptyCount += (parseInt(meter.OPER,10) - parseInt(meter.OCC,10));
				
				if (rate==0)
				{
					freeCount += parseInt(meter.OPER,10);
				}
				else
				{
					paidCount += parseInt(meter.OPER,10);
				}
				
				/*var marker = new google.maps.Marker({
				      position: center, 
				      map: map, 
				      title: meter.NAME
				});*/
				
				var line = new google.maps.Polyline({
					  meter: meter,
				      path: lineCords,
				      strokeColor: color,
				      strokeOpacity: 1.0,
				      strokeWeight: 5.0,
					  map:map
					  //draggable: true
				});
				
				
				google.maps.event.addListener(line, 'click', clickedWin);
				//map_overlays.push(marker);
				map_overlays.push(line);
			}
		}
		toolbar.setTitle("Occupied: " + occCount + " , Free: " + totalCount + " , empty:" + emptyCount);
	
	  }
	});
}


Ext.setup({
    tabletStartupScreen: '/img/tablet_startup.png',
    phoneStartupScreen: '/img/phone_startup.png',
    icon: '/img/icon.png',
    glossOnIcon: false,
    onReady: function() {
		


		
        // The following is accomplished with the Google Map API
        var position = new google.maps.LatLng(37.44885,-122.158592),  //Sencha HQ

            infowindow = new google.maps.InfoWindow({
                content: 'Sencha Touch HQ'
            }),

                //Tracking Marker Image
                image = new google.maps.MarkerImage(
                    '/img/point.png',
                    new google.maps.Size(32, 31),
                    new google.maps.Point(0,0),
                    new google.maps.Point(16, 31)
                  ),

                shadow = new google.maps.MarkerImage(
                    '/img/shadow.png',
                    new google.maps.Size(64, 52),
                    new google.maps.Point(0,0),
                    new google.maps.Point(-5, 42)
                  ),

            trackingButton = Ext.create({
               xtype   : 'button',
               iconMask: true,
               iconCls : 'locate'
            } ),

            toolbar = new Ext.Toolbar({
                    dock: 'top',
                    xtype: 'toolbar',
                    ui : 'light',
                    defaults: {
                        iconMask: true
                    },
                    items : [
                    {
                      position : position,
                      iconCls  : 'home',
                      handler : function(){
                      //disable tracking
                          trackingButton.ownerCt.setActive(trackingButton, false);
                          mapdemo.map.panTo(this.position);
                      }
                    },{
                   xtype : 'segmentedbutton',
                   allowMultiple : true,
                   listeners : {
                       toggle : function(buttons, button, active){
                          if(button.iconCls == 'maps' ){
                              mapdemo.traffic[active ? 'show' : 'hide']();
                          }else if(button.iconCls == 'locate'){
                              mapdemo.geo[active ? 'resumeUpdates' : 'suspendUpdates']();
                          }
                       }
                   },
                   items : [
                        trackingButton,
                            {
                                   iconMask: true,
                                   iconCls: 'maps'
                                }
                    ]
                }]
                });
		
	
		
        mapdemo = new Ext.Map({
			
            mapOptions : {
                center : new google.maps.LatLng(37.778734661, -122.4318517401),  //nearby San Fran
                zoom : 12,
                mapTypeId : google.maps.MapTypeId.ROADMAP,
                navigationControl: true,
				//draggable: true,
                navigationControlOptions: {
                        style: google.maps.NavigationControlStyle.DEFAULT
                    }
            },
			
            plugins : [
                new Ext.plugin.GMap.Tracker({
                        trackSuspended : true,   //suspend tracking initially
                        highAccuracy   : false,
                        marker : new google.maps.Marker({
                            position: position,
                            title : 'My Current Location',
                            shadow: shadow,
                            icon  : image
                          })
                }),
                new Ext.plugin.GMap.Traffic({ hidden : true })
            ],
			
            listeners : {
				zoomchange : function (comp, map, zoom) {
					
				},
				centerchange : function(comp, map, center) {
					/*clearOverlays();
					var marker = new google.maps.Marker({
                                     position: center,
                                     title : 'TEST',
                                     map: map
                                });
					map_overlays.push(marker);*/
				},
				
                maprender : function(comp, map){
					//loadLines(map);
					loadLines(map,toolbar);
					setInterval(function(){loadLines(map,toolbar);},10000);
					
                    /*var marker = new google.maps.Marker({
                                     position: position,
                                     title : 'Sencha HQ',
                                     map: map
                                });

                                google.maps.event.addListener(marker, 'click', function() {
                                     infowindow.open(map, marker);
                                });
					overlays.push(marker);
                    setTimeout( function(){ map.panTo (position); } , 1000);*/
                }

            }
        });
		
		
		
        new Ext.Panel({
            fullscreen: true,
            dockedItems: [toolbar],
            items: [mapdemo]
        });

    }
});