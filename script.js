const map = L.map('map', {
    crs: L.CRS.EPSG3857,
    continuousWorld: true,
    worldCopyJump: false,
    maxBounds: L.latLngBounds(L.latLng(45.817995, 5.955911), L.latLng(47.808455, 10.492294)),
    maxZoom: 18,
    minZoom: 7
}).setView([46.8182, 8.2275], 8);

const url = "https://wmts20.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg";
const tilelayer = L.tileLayer(url);
map.addLayer(tilelayer);

map.setMaxBounds(map.getBounds());

document.getElementById('trackLocation').addEventListener('click', function() {
    alert('Tracking location...');
    // Implement location tracking logic here
});

document.getElementById('showRoute').addEventListener('click', function() {
    alert('Showing route...');
    // Implement route display logic here
});

document.getElementById('showVelocity').addEventListener('click', function() {
    alert('Showing velocity...');
    // Implement velocity display logic here
});