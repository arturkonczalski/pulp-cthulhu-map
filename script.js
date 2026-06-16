const imageWidth = 2560;
const imageHeight = 1656;
const SHEET_ID = "1J8ZHhp49L5Z6AGQr1egbe9qYD3n6d_PUWvtsChv2aXY";
const SHEET_NAME = "lokalizacje";

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

map.fitBounds(bounds);
map.setMaxBounds(bounds);

const coords = document.getElementById("coords");

function getNormalizedCoords(latlng) {
    const x = latlng.lng / imageWidth;
    const y = 1 - (latlng.lat / imageHeight);

    return {
        x,
        y
    };
}

map.on("mousemove", function (e) {

    const pos = getNormalizedCoords(e.latlng);

    coords.innerHTML =
    `X: ${pos.x.toFixed(4)}<br>` +
    `Y: ${pos.y.toFixed(4)}`;
});

map.on("contextmenu", function (e) {

    const pos = getNormalizedCoords(e.latlng);

    const x = pos.x.toFixed(4);
    const y = pos.y.toFixed(4);

    navigator.clipboard.writeText(`${x},${y}`);

    L.popup()
    .setLatLng(e.latlng)
    .setContent(`
    <b>Skopiowano współrzędne</b><br>
    X: ${x}<br>
    Y: ${y}
    `)
    .openOn(map);
});

const csvUrl =
`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

Papa.parse(csvUrl, {
    download: true,
    header: true,
    complete: function(results) {

        console.log(results.data);

        results.data.forEach(location => {

            if (!location.x || !location.y) {
                return;
            }

            const lat = (1 - parseFloat(location.y)) * imageHeight;
            const lng = parseFloat(location.x) * imageWidth;

            L.marker([lat, lng])
            .addTo(map)
            .bindPopup(location.nazwa);
        });
    }
});
