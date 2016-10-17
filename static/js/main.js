// 1. idle event will be fired every time user drags ,zooms or change center 
// 4. remove bus stops

//idle & center changed, refetch, setmap
var map;
var markerCluster;

// define parameters
var radius = 1000; //fetch data within the radius(meter) 
var record_limit = 5000;
var detroit_latlng = { lat: 42.3314300, lng: -83.0457500 };
var app_token = "hc30ojpKNSQsUC9n7ciE2hoNZ";


function initMap() {
  var styles = [
    {
      "featureType": "transit.station.bus",
      "stylers": [{ "visibility": "off" }]
    }
  ];
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: detroit_latlng,
    styles: styles
  });

  // Load bus stop from geojson
  map.data.loadGeoJson('static/DDOT_Bus_Stops.geojson');
  map.data.setStyle({
    icon: {
      url: 'static/bus-station.svg',
      scaledSize: new google.maps.Size(12, 12), // scaled size
      origin: new google.maps.Point(0, 0), // origin
      anchor: new google.maps.Point(0, 0) // anchor}
    }
  });


  // Create the DIV to hold the control and call the CenterControl()
  // constructor passing in this DIV.
  var ControlDiv_Detroit = document.createElement('div');
  var centerControl_Detroit = new CenterControl(ControlDiv_Detroit, map, "Back to Detroit", function () {
    map.setCenter(detroit_latlng);
    map.setZoom(16);
  });
  ControlDiv_Detroit.index = 1;
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(ControlDiv_Detroit);

  var ControlDiv_YourLocation = document.createElement('div');
  var centerControl_YourLocation = new CenterControl(ControlDiv_YourLocation, map, "Your Location", centerToYourLocation);
  ControlDiv_YourLocation.index = 1;
  map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(ControlDiv_YourLocation);

  // refresh map when center of map may change
  map.addListener('idle', refreshMap);
}

/**
 * The CenterControl adds a control to the map that recenters the map on
 * Chicago.
 * This constructor takes the control DIV as an argument.
 * @constructor
 */
function CenterControl(controlDiv, map, text, func) {

  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#fff';
  controlUI.style.border = '2px solid #fff';
  controlUI.style.borderRadius = '3px';
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlUI.style.cursor = 'pointer';
  controlUI.style.marginBottom = '22px';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Click to recenter the map';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlText = document.createElement('div');
  controlText.style.color = 'rgb(25,25,25)';
  controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
  controlText.style.fontSize = '16px';
  controlText.style.lineHeight = '38px';
  controlText.style.paddingLeft = '5px';
  controlText.style.paddingRight = '5px';
  controlText.innerHTML = text;
  controlUI.appendChild(controlText);

  // Setup the click event listeners:
  controlUI.addEventListener('click', func);

}

function centerToYourLocation() {
  var infoWindow = new google.maps.InfoWindow({ map: map });
  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      infoWindow.setPosition(pos);
      infoWindow.setContent('Location found.');
      map.setCenter(pos);
    }, function () {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

// Define Location error handler
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
    'Error: The Geolocation service failed.' :
    'Error: Your browser doesn\'t support geolocation.');
}

function refreshMap() {
  var center = map.getCenter()
  $.ajax({
    url: "https://data.detroitmi.gov/resource/8p3f-52zg.json",
    type: "GET",
    data: {
      "$limit": record_limit,
      "$$app_token": app_token,
      "$where": "within_circle(location, " + center.lat() + ", " + center.lng() + ", " + radius + ")"
    }
  }).done(function (data) {
    locations = data.map(function (item) {
      return { lat: item.location.coordinates[1], lng: item.location.coordinates[0] };
    });
    showMarkers(locations);
  });
}

function showMarkers(locations) {
  // Create an array of alphabetical characters used to label the markers.
  var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // If markerClaster not null, them remove markerCluster
  if (markerCluster) {
    markerCluster.clearMarkers();
  }

  // Add some markers to the map.
  // Note: The code uses the JavaScript Array.prototype.map() method to
  // create an array of markers based on a given "locations" array.
  // The map() method here has nothing to do with the Google Maps API.
  markers = locations.map(function (location, i) {
    return new google.maps.Marker({
      position: location,
      label: labels[i % labels.length]
    });
  });

  // Add a marker clusterer to manage the markers.
  markerCluster = new MarkerClusterer(map, markers,
    { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' });
} 