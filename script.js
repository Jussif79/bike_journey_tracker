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

// Variables to store the marker, circle, watch ID, route, and saved journeys
let userMarker = null;
let userAccuracyCircle = null;
let watchId = null;
let route = [];
let routeVelocities = [];
let velocity = 0;
let lastPosition = null;
let journeyStartTime = null;
let savedJourneys = [];
let currentPolyline = null;
let currentJourneyName = null;

// Function to calculate velocity in km/h
function calculateVelocity(newPosition) {
  if (!lastPosition) {
    lastPosition = newPosition;
    return 0;
  }

  const R = 6371; // Radius of the Earth in km
  const dLat = (newPosition.coords.latitude - lastPosition.coords.latitude) * (Math.PI / 180);
  const dLon = (newPosition.coords.longitude - lastPosition.coords.longitude) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lastPosition.coords.latitude * (Math.PI / 180)) *
    Math.cos(newPosition.coords.latitude * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  const timeDiff = (newPosition.timestamp - lastPosition.timestamp) / 1000; // Time difference in seconds
  const velocity = (distance / timeDiff) * 3600; // Velocity in km/h

  lastPosition = newPosition;
  return velocity;
}

// Function to calculate average velocity
function calculateAverageVelocity(velocities) {
  if (velocities.length === 0) return 0;
  const totalVelocity = velocities.reduce((sum, v) => sum + v, 0);
  return totalVelocity / velocities.length;
}

// Function to format duration (in seconds) to a readable string
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

// Function to start tracking the journey
function startJourney() {
  currentJourneyName = prompt("Enter a name for this journey:");
  if (!currentJourneyName) {
    alert("Journey name is required.");
    return;
  }

  const startButton = document.getElementById("startJourney");
  const stopButton = document.getElementById("stopJourney");
  const coordinatesDiv = document.getElementById("coordinates");
  const velocityDiv = document.getElementById("velocity");

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
          coordinatesDiv.textContent = `Coordinates: ${userCoords[0].toFixed(6)}, ${userCoords[1].toFixed(6)}`;

          // Calculate and display velocity
          velocity = calculateVelocity(position);
          velocityDiv.textContent = `Velocity: ${velocity.toFixed(2)} km/h`;
          routeVelocities.push(velocity);

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

          // Add the new coordinates to the route
          route.push(userCoords);

          // Draw the route on the map
          if (currentPolyline) {
            map.removeLayer(currentPolyline);
          }
          currentPolyline = L.polyline(route, { color: "blue" }).addTo(map);

          // Center the map on the user's location
          map.setView(userCoords, 13);
        },
        (error) => {
          alert(`Error tracking location: ${error.message}`);
          // Reset tracking state if there's an error
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
          startButton.textContent = "Start Journey";
          stopButton.disabled = true;
          coordinatesDiv.textContent = "Coordinates: Not available";
          velocityDiv.textContent = "Velocity: 0 km/h";
        },
        {
          enableHighAccuracy: true, // Use high accuracy mode
          timeout: 10000, // Increase timeout to 10 seconds
          maximumAge: 0, // Force fresh location data
        }
      );

      // Change button text and enable stop button
      startButton.textContent = "Tracking...";
      stopButton.disabled = false;
      journeyStartTime = new Date();
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }
}

// Function to stop tracking the journey
function stopJourney() {
  const startButton = document.getElementById("startJourney");
  const stopButton = document.getElementById("stopJourney");
  const coordinatesDiv = document.getElementById("coordinates");
  const velocityDiv = document.getElementById("velocity");

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

  // Save the journey
  const journeyEndTime = new Date();
  const journeyDuration = (journeyEndTime - journeyStartTime) / 1000; // Duration in seconds
  if (currentJourneyName) {
    const avgVelocity = calculateAverageVelocity(routeVelocities);
    const journeyData = {
      name: currentJourneyName,
      route,
      duration: journeyDuration,
      avgVelocity,
    };
    savedJourneys.push(journeyData);
    updateJourneyList();
  }

  // Reset the UI
  startButton.textContent = "Start Journey";
  stopButton.disabled = true;
  coordinatesDiv.textContent = "Coordinates: Not available";
  velocityDiv.textContent = "Velocity: 0 km/h";
  route = [];
  routeVelocities = [];
  velocity = 0;
  lastPosition = null;
  journeyStartTime = null;
  currentJourneyName = null;

  // Clear the current route from the map
  if (currentPolyline) {
    map.removeLayer(currentPolyline);
    currentPolyline = null;
  }
}

// Function to update the journey list dropdown
function updateJourneyList() {
  const journeyList = document.getElementById("journeyList");
  journeyList.innerHTML = ""; // Clear the list
  savedJourneys.forEach((journey, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = journey.name;
    journeyList.appendChild(option);
  });
}

// Function to view a saved journey
function viewJourney() {
  const journeyList = document.getElementById("journeyList");
  const selectedIndex = journeyList.value;
  if (selectedIndex === "") return;

  const selectedJourney = savedJourneys[selectedIndex];

  // Clear the current route from the map
  if (currentPolyline) {
    map.removeLayer(currentPolyline);
  }

  // Draw the selected route
  currentPolyline = L.polyline(selectedJourney.route, { color: "blue" }).addTo(map);

  // Center the map on the route
  map.fitBounds(currentPolyline.getBounds());

  // Display journey details
  document.getElementById("detailsName").textContent = `Name: ${selectedJourney.name}`;
  document.getElementById("detailsDuration").textContent = `Duration: ${formatDuration(selectedJourney.duration)}`;
  document.getElementById("detailsAvgVelocity").textContent = `Average Velocity: ${selectedJourney.avgVelocity.toFixed(2)} km/h`;
}

// Add event listeners to the buttons
document.getElementById("startJourney").addEventListener("click", startJourney);
document.getElementById("stopJourney").addEventListener("click", stopJourney);
document.getElementById("viewJourney").addEventListener("click", viewJourney);

// Ensure the map resizes correctly on mobile devices
window.addEventListener("resize", () => {
  map.invalidateSize();
});