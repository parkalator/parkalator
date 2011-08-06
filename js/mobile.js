Ext.setup({
    tabletStartupScreen: '/img/tablet_startup.png',
    phoneStartupScreen: '/img/phone_startup.png',
    icon: '/img/icon.png',
    glossOnIcon: false,
    onReady: function() {
		
		var overlays = [];
		
		var clearOverlays = function () {
		  if (overlays) {
		    for (i in overlays) {
		      i.setMap(null);
		    }
		  }
		  overlays = [];
		}
		
		var addLine = function(lat1,lon1,lat2,lon2,meter,map) {
			var lineCords = [
			        new google.maps.LatLng(lat1, lon1),
			        new google.maps.LatLng(lat2, lon2)
			];
			var line = new google.maps.Polyline({
			      path: lineCords,
			      strokeColor: "#FF0000",
			      strokeOpacity: 1.0,
			      strokeWeight: 2,
				  map:map
			});
			
			google.maps.event.addListener(line, 'click', function() {
				var infowin = new google.maps.InfoWindow({
	                content: meter.name
	            })
                infowin.open(map, line);
            });
			overlays.push(line);
		}
		
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
					clearOverlays();
					var marker = new google.maps.Marker({
                                     position: center,
                                     title : 'TEST',
                                     map: map
                                });
					overlays.push(marker);
				},
				
                maprender : function(comp, map){
                    var marker = new google.maps.Marker({
                                     position: position,
                                     title : 'Sencha HQ',
                                     map: map
                                });

                                google.maps.event.addListener(marker, 'click', function() {
                                     infowindow.open(map, marker);
                                });
					overlays.push(marker);
                    setTimeout( function(){ map.panTo (position); } , 1000);
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