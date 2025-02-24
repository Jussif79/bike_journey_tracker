// Initialize the map and set its view to Switzerland
const map = L.map("map", {
  crs: L.CRS.EPSG3857,
  continuousWorld: true,
  worldCopyJump: false,
  maxBounds: L.latLngBounds(
    L.latLng(45.817995, 5.955911),
    L.latLng(47.808455, 10.492294)
  ), // Switzerland bounds
  maxZoom: 18,
  minZoom: 7,
}).setView([46.8182, 8.2275], 8); // Center of Switzerland

// Add the tile layer
const url =
  "https://wmts20.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg";
const tilelayer = L.tileLayer(url);
map.addLayer(tilelayer);

// Disable zooming outside the bounds
map.setMaxBounds(map.getBounds());

// Variables to store the marker, circle, and watch ID
let userMarker = null;
let userAccuracyCircle = null;
let watchId = null;

// Function to track the user's location
function trackLocation() {
  const trackButton = document.getElementById("trackLocation");
  const coordinatesDiv = document.getElementById("coordinates");

  if (watchId === null) {
    // Start tracking
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const userCoords = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          const accuracy = position.coords.accuracy / 2; // Reduce the circle size by half

          // Update the coordinates display
          coordinatesDiv.textContent = `Coordinates: ${userCoords[0].toFixed(
            6
          )}, ${userCoords[1].toFixed(6)}`;

          // If the marker doesn't exist, create it
          if (!userMarker) {
            userMarker = L.marker(userCoords).addTo(map);
            userAccuracyCircle = L.circle(userCoords, {
              radius: accuracy,
              color: "blue",
              fillColor: "#30f",
              fillOpacity: 0.2,
            }).addTo(map);
          } else {
            // Update the marker and circle position
            userMarker.setLatLng(userCoords);
            userAccuracyCircle.setLatLng(userCoords).setRadius(accuracy);
          }

          // Center the map on the user's location
          map.setView(userCoords, 13);
        },
        (error) => {
          alert(`Error tracking location: ${error.message}`);
          // Reset tracking state if there's an error
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
          trackButton.textContent = "Track Location";
          coordinatesDiv.textContent = "Coordinates: Not available";
        },
        {
          enableHighAccuracy: true, // Use high accuracy mode
          timeout: 10000, // Increase timeout to 10 seconds
          maximumAge: 0, // Force fresh location data
        }
      );

      // Change button text to "Cancel Tracking"
      trackButton.textContent = "Cancel Tracking";
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  } else {
    // Stop tracking
    navigator.geolocation.clearWatch(watchId);
    watchId = null;

    // Remove the marker and circle from the map
    if (userMarker) {
      map.removeLayer(userMarker);
      map.removeLayer(userAccuracyCircle);
      userMarker = null;
      userAccuracyCircle = null;
    }

    // Change button text back to "Track Location"
    trackButton.textContent = "Track Location";
    coordinatesDiv.textContent = "Coordinates: Not available";
  }
}

// Add event listener to the "Track Location" button
document
  .getElementById("trackLocation")
  .addEventListener("click", trackLocation);

// Add event listeners to other buttons (placeholders for now)
document.getElementById("showRoute").addEventListener("click", function () {
  alert("Showing route...");
  // Implement route display logic here
});

document.getElementById("showVelocity").addEventListener("click", function () {
  alert("Showing velocity...");
  // Implement velocity display logic here
});

// Ensure the map resizes correctly on mobile devices
window.addEventListener("resize", () => {
  map.invalidateSize();
});
