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

const pinIcon = L.icon({

    iconUrl: "assets/pin.png",

    iconSize: [40, 40],

    iconAnchor: [20, 40],

    popupAnchor: [0, -40]

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

function searchMatches(text, value) {

    if (!value) {
        return false;
    }

    return value
    .toLowerCase()
    .includes(text);

}

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

    const teams = session.druzyny
    ? session.druzyny
    .split(";")
    .map(x => x.trim())
    .map(getTeam)
    .filter(Boolean)
    : [];

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


    ${teams.length ? `

        <div class="session-logos">

        ${teams.map(team => `

            <img
            src="${getDriveImage(team.logo_id)}">

            `).join("")}

            </div>

            ` : ""}


        <h2 style="text-align:center;">
        ${session.numer_sesji || ""}
        </h2>

        <h3 style="text-align:center;">
        ${session.tytul || ""}
        </h3>

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

        <p style="text-align:center;">
        ${session.data || ""}
        </p>

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
        L.marker([lat, lng], {

            icon: pinIcon

        })
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

search.addEventListener("input", () => {

    const text =
    search.value
    .toLowerCase()
    .trim();

    results.innerHTML = "";

    if (!text) {
        return;
    }


    // Lokalizacje

    lokalizacje.forEach(location => {

        if (
            searchMatches(text, location.nazwa)
            ||
            searchMatches(text, location.id)
        ) {

            addLocationResult(location);

        }

    });



    // Drużyny

    druzyny.forEach(team => {

        if (

            searchMatches(text, team.nazwa)
            ||
            searchMatches(text, team.id)

        ){

            addTeamResult(team);

        }

    });



    // Tagi

    tagi.forEach(tag => {

        if (

            searchMatches(text, tag.nazwa)
            ||
            searchMatches(text, tag.id)

        ){

            addTagResult(tag);

        }

    });



    // Sesje


    sesje.forEach(session => {


        if (

            searchMatches(
                text,
                session.tytul
            )

            ||

            searchMatches(
                text,
                session.numer_sesji
            )

            ||

            searchMatches(
                text,
                session.data
            )

        ){

            addSessionResult(
                session
            );

        }

    });

});

function addLocationResult(location){

    const div =
    document.createElement("div");

    div.className =
    "search-result";

            div.textContent =
            `📍 ${location.nazwa}`;


            div.onclick = ()=>{


                const marker =
                markers[location.id];


                map.flyTo(

                    marker.getLatLng(),
                          2

                );


                marker.fire("click");


                results.innerHTML="";

                search.value="";

            };


            results.appendChild(div);

}

function addTeamResult(team){


    const div =
    document.createElement("div");


    div.className =
    "search-result";


            div.textContent =
            `👥 ${team.nazwa}`;


            results.appendChild(div);

}

function addTagResult(tag){


    const div =
    document.createElement("div");


    div.className =
    "search-result";


            div.textContent =
            `🏷️ ${tag.nazwa}`;


            results.appendChild(div);

}

function addSessionResult(session){


    const div =
    document.createElement("div");


    div.className =
    "search-result";


            div.textContent =

            `🎲 ${
                session.numer_sesji
            } - ${
                session.tytul
            }`;



            div.onclick = ()=>{


                const locationId =

                session.lokalizacje
                .split(";")[0]
                .trim();



                const location =

                lokalizacje.find(

                    l=>l.id===locationId

                );


                if(!location)
                    return;



                const marker =

                markers[
                    location.id
                ];



                marker.fire("click");



                map.flyTo(

                    marker.getLatLng(),
                          2

                );



                search.value="";

                results.innerHTML="";

            };


            results.appendChild(div);

}

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
