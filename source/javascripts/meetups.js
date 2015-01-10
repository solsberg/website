(function() {
  var handler = Gmaps.build('Google'),
      mapOptions = $('meta[name=mapOptions]').attr('content');

  var infowindow_template = _.template("<div class='map-marker'><h2><%=location%></h2>" + 
    "<div class='view'><a href='<%=url%>' target='_blank'>Go to meetup page</a></div></div>");

  mapOptions = JSON.parse(mapOptions);
  mapOptions.provider.zoomControlOptions = google.maps.ZoomControlStyle.SMALL;

  $.getJSON("/data/meetup_locations.json", function( meetups ) {
    handler.buildMap(mapOptions, function(){
      var marker_data = _.map(meetups, function(meetup){
        return {
          "lat": meetup["lat"],
          "lng": meetup["lon"],
          "infowindow": infowindow_template(meetup)
        };
      });
      var markers = handler.addMarkers(marker_data);
      handler.bounds.extendWith(markers);
      
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function(position){
          var pos = new google.maps.LatLng(position.coords.latitude,
                                         position.coords.longitude);
          handler.map.centerOn(pos);
          handler.map.serviceObject.setZoom(8);
        }, handler.fitMapToBounds.bind(handler));
      }
      else {
        handler.fitMapToBounds();
      }
    });
  });
})();
