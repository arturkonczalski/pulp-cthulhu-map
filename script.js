const mapa = document.getElementById("mapa");
const coords = document.getElementById("coords");

mapa.addEventListener("mousemove", (event) => {
    const rect = mapa.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    coords.innerHTML =
    `X: ${x.toFixed(4)}<br>` +
    `Y: ${y.toFixed(4)}`;
});
