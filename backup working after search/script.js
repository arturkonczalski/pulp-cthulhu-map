const imageWidth = 2560;
const imageHeight = 1656;
const markers = {};

const SHEET_ID = "1J8ZHhp49L5Z6AGQr1egbe9qYD3n6d_PUWvtsChv2aXY";

let lokalizacje = [];
let druzyny = [];
let tagi = [];
let sesje = [];

const SHEETS = {
    lokalizacje: "0",
    druzyny: "358228522",
    tagi: "1613408979",
    sesje: "1580573064"
};


const search =
document.getElementById("search");
const results =
document.getElementById("search-results");


let currentLocationSessions = [];
let currentSessionIndex = 0;

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

const sessionPanel =
document.getElementById("session-panel");

const sessionHeader =
document.getElementById("session-header");

const sessionContent =
document.getElementById("session-content");

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

async function loadSheet(sheetName) {

    const csvUrl =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEETS[sheetName]}`;

    return new Promise((resolve) => {

        Papa.parse(csvUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,

            complete: function(results) {
                resolve(results.data);
            }
        });

    });
}

function getTeam(teamId) {

    return druzyny.find(
        team => team.id === teamId
    );

}


function getDriveImage(id) {

    return `https://drive.google.com/thumbnail?id=${id}&sz=w256`;

}

function getSessionsForLocation(locationId) {

    return sesje
    .filter(session => {

        if (!session.lokalizacje) {
            return false;
        }

        const locations = session.lokalizacje
        .split(";")
        .map(x => x.trim());

        return locations.includes(locationId);

    })
    .sort((a, b) => {

        const idA =
        Number(a.id.match(/\d+/)?.[0] || 0);

        const idB =
        Number(b.id.match(/\d+/)?.[0] || 0);

        return idA - idB;
    });
}

function renderCurrentSession() {

    if (currentLocationSessions.length === 0) {

        sessionContent.innerHTML =
        "<p>Brak sesji.</p>";

        return;
    }

    const session =
    currentLocationSessions[currentSessionIndex];

    const team =
    getTeam(session.druzyny);

    const logo =
    team?.logo_id
    ? getDriveImage(team.logo_id)
    : "";

    sessionContent.innerHTML = `
    <div style="margin-bottom:20px;">

    <div style="
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:15px;
    ">

    <button id="prev-session">
    ◀
    </button>

    <div>
    ${currentSessionIndex + 1}
    / ${currentLocationSessions.length}
    </div>

    <button id="next-session">
    ▶
    </button>

    </div>


    ${logo ?

        `
        <div style="
        text-align:center;
        margin-bottom:15px;
        ">

        <img
        src="${logo}"

        style="
        max-width:120px;
        max-height:120px;
        object-fit:contain;
        ">

        </div>
        `

        : ""}


        <h2 style="text-align:center;">
        ${session.numer_sesji || ""}
        </h2>

        <h3 style="text-align:center;">
        ${session.tytul || ""}
        </h3>

        <p style="text-align:center;">
        ${session.data || ""}
        </p>

        ${
            session.link
            ?
            `
            <p style="text-align:center;">
            <a href="${session.link}"
            target="_blank">
            Obejrzyj
            </a>
            </p>
            `
            :
            ""
        }

        <div>
        ${session.opis || ""}
        </div>

        </div>
        `;

    const prevButton =
    document.getElementById("prev-session");

    const nextButton =
    document.getElementById("next-session");

    prevButton.disabled =
    currentSessionIndex === 0;

    nextButton.disabled =
    currentSessionIndex ===
    currentLocationSessions.length - 1;

    prevButton.addEventListener("click", () => {

        if (currentSessionIndex > 0) {

            currentSessionIndex--;

            renderCurrentSession();
        }
    });

    nextButton.addEventListener("click", () => {

        if (
            currentSessionIndex <
            currentLocationSessions.length - 1
        ) {

            currentSessionIndex++;

            renderCurrentSession();
        }
    });
}

function openLocationPanel(
    location,
    locationSessions
) {

    sessionPanel.classList.remove("hidden");

    sessionHeader.textContent =
    location.nazwa;

    currentLocationSessions =
    locationSessions;

    currentSessionIndex = 0;

    renderCurrentSession();
}

function drawLocations() {

    lokalizacje.forEach(location => {

        if (!location.x || !location.y) {
            return;
        }

        const lat =
        (1 - parseFloat(location.y)) * imageHeight;

        const lng =
        parseFloat(location.x) * imageWidth;

        const locationSessions =
        getSessionsForLocation(location.id);

        const marker =
        L.marker([lat, lng])
        .addTo(map);
        markers[location.id]=marker;

        marker.on("click", () => {

            openLocationPanel(
                location,
                locationSessions
            );

        });
    });
}

search.addEventListener("input", ()=>{


    const text =
    search.value.toLowerCase();



    results.innerHTML="";



    if (text === "") {

        results.innerHTML = "";

        return;
    }



    lokalizacje.forEach(location=>{


        if (

            (
                location.nazwa &&
                location.nazwa
                .toLowerCase()
                .includes(text)
            )

            ||

            (
                location.id &&
                location.id
                .toLowerCase()
                .includes(text)
            )

        ){


            const div =
            document.createElement("div");


            div.className =
            "search-result";


    div.textContent=
    location.nazwa;



    div.onclick=()=>{


        const marker =
        markers[location.id];



        map.flyTo(
            marker.getLatLng(),
                  1
        );



        marker.fire("click");



        results.innerHTML="";


        search.value="";

    };


    results.appendChild(div);


        }


    });


});

async function loadData() {

    lokalizacje =
    await loadSheet("lokalizacje");

    druzyny =
    await loadSheet("druzyny");

    tagi =
    await loadSheet("tagi");

    sesje =
    await loadSheet("sesje");

    drawLocations();
}

loadData();
