const imageWidth = 2560;
const imageHeight = 1656;

const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -4,
    maxZoom: 3
});

const bounds = [
    [0, 0],
[imageHeight, imageWidth]
];

L.imageOverlay("assets/mapa.jpg", bounds).addTo(map);

map.setView(
    [imageHeight / 2, imageWidth / 2],
    -1
);

const coords = document.getElementById("coords");

map.on("mousemove", function (e) {

    const x = e.latlng.lng / imageWidth;
    const y = e.latlng.lat / imageHeight;

    coords.innerHTML =
    `X: ${x.toFixed(4)}<br>` +
    `Y: ${y.toFixed(4)}`;
});

map.on("contextmenu", function (e) {

    const x = (e.latlng.lng / imageWidth).toFixed(4);
    const y = (e.latlng.lat / imageHeight).toFixed(4);

    navigator.clipboard.writeText(`${x},${y}`);

    L.marker(e.latlng)
    .addTo(map)
    .bindPopup(`Skopiowano:<br>${x},${y}`)
    .openPopup();
});
