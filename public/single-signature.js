// single-signature.js
function generarEnlace() {
    const urlDescarga = document.getElementById("urlDescarga").value.trim();
    const urlSubida = document.getElementById("urlSubida").value.trim();

    if (!urlDescarga || !urlSubida) {
        alert("Las URLs de descarga y subida son obligatorias.");
        return;
    }

    const from = encodeURIComponent(urlDescarga);
    const to = encodeURIComponent(urlSubida);
    const x = document.getElementById("x").value;
    const y = document.getElementById("y").value;
    const width = document.getElementById("width").value;
    const height = document.getElementById("height").value;
    const textSize = document.getElementById("textSize").value;
    const sigText = encodeURIComponent(document.getElementById("sigText").value);
    const page = document.getElementById("page").value;
    const graphic = document.getElementById("graphic").value.trim();
    const tsp = document.getElementById("tsp").value.trim();

    let url = `girasoldesktop://?from=${from}&to=${to}`;
    url += `&vis_sig_x=${x}`;
    url += `&vis_sig_y=${y}`;
    url += `&vis_sig_width=${width}`;
    url += `&vis_sig_height=${height}`;
    url += `&vis_sig_text=${sigText}`;
    url += `&vis_sig_page=${page}`;
    url += `&vis_sig_text_size=${textSize}`;
    url += `&tlv=1`;

    if (graphic !== "") {
        url += `&vis_sig_graphic=${encodeURIComponent(graphic)}`;
    }

    if (tsp !== "") {
        url += `&tsp=${encodeURIComponent(tsp)}`;
    }

    const output = document.getElementById("output");
    output.innerHTML = `<strong>🔗 Enlace generado:</strong><br><a id="linkOut" href="${url}">${url}</a>`;

    window.location.href = url;
}

// Asignar evento al botón
document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.querySelector('#singleTab button');
    if (generateBtn) {
        generateBtn.addEventListener('click', generarEnlace);
    }
});