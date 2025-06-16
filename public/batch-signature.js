// batch-signature.js
let signatures = [];

async function guardarCSVEnServidor(csvContent) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const codigo = `firmas-${timestamp}`;
    const uploadUrl = `http://localhost:8080/girasol/api.php?op=csv_upload&csv=${codigo}`;
    const downloadUrl = `http://localhost:8080/girasol/api.php?op=csv_download&codigo=${codigo}`;

    const formData = new FormData();
    formData.append('csv_file', new Blob([csvContent], { type: 'text/csv' }), 'firmas.csv');

    const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
    });


    if (!response.ok) {
        throw new Error("No se pudo subir el CSV al servidor");
    }

    console.log(`CSV guardado como ${codigo}.csv`);

    return {
        nombreArchivo: `${codigo}.csv`,
        urlDescarga: downloadUrl,
        rutaLocal: `/samplescsv/${codigo}.csv`
    };
}

function agregarFirma() {
    const urlDescarga = document.getElementById("batchUrlDescarga").value.trim();
    const urlSubida = document.getElementById("batchUrlSubida").value.trim();
    const fileName = document.getElementById("batchFileName").value.trim();
    const x = document.getElementById("batchX").value;
    const y = document.getElementById("batchY").value;
    const width = document.getElementById("batchWidth").value;
    const height = document.getElementById("batchHeight").value;
    const textSize = document.getElementById("batchTextSize").value;
    const sigText = document.getElementById("batchSigText").value;
    const page = document.getElementById("batchPage").value;
    const graphic = document.getElementById("batchGraphic").value.trim();

    if (!urlDescarga || !urlSubida || !fileName) {
        alert("Las URLs y el nombre del archivo son obligatorios.");
        return;
    }

    const signature = {
        urlDescarga,
        urlSubida,
        fileName,
        x,
        y,
        width,
        height,
        textSize,
        sigText,
        page,
        graphic
    };

    signatures.push(signature);
    actualizarTablaFirmas();

    // Limpiar campos (opcional)
    document.getElementById("batchUrlDescarga").value = "";
    document.getElementById("batchUrlSubida").value = "";
    document.getElementById("batchFileName").value = "";
}

function actualizarTablaFirmas() {
    const tbody = document.getElementById("signaturesList");
    tbody.innerHTML = "";

    signatures.forEach((sig, index) => {
        const row = document.createElement("tr");

        // Acortar URLs para mostrar
        const shortDownloadUrl = sig.urlDescarga.length > 20 ? 
            sig.urlDescarga.substring(0, 20) + "..." : sig.urlDescarga;
        const shortUploadUrl = sig.urlSubida.length > 20 ? 
            sig.urlSubida.substring(0, 20) + "..." : sig.urlSubida;

        row.innerHTML = `
            <td title="${sig.urlDescarga}">${shortDownloadUrl}</td>
            <td title="${sig.urlSubida}">${shortUploadUrl}</td>
            <td>${sig.fileName}</td>
            <td>${sig.x}</td>
            <td>${sig.y}</td>
            <td>${sig.width}</td>
            <td>${sig.height}</td>
            <td>${sig.page}</td>
            <td class="action-buttons">
                <button class="small-btn edit-btn" data-index="${index}">Editar</button>
                <button class="small-btn remove-btn" data-index="${index}">Eliminar</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Asignar eventos a los botones recién creados
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            eliminarFirma(parseInt(this.getAttribute('data-index')));
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            editarFirma(parseInt(this.getAttribute('data-index')));
        });
    });
}

function eliminarFirma(index) {
    signatures.splice(index, 1);
    actualizarTablaFirmas();
}

function editarFirma(index) {
    const sig = signatures[index];

    document.getElementById("batchUrlDescarga").value = sig.urlDescarga;
    document.getElementById("batchUrlSubida").value = sig.urlSubida;
    document.getElementById("batchFileName").value = sig.fileName;
    document.getElementById("batchX").value = sig.x;
    document.getElementById("batchY").value = sig.y;
    document.getElementById("batchWidth").value = sig.width;
    document.getElementById("batchHeight").value = sig.height;
    document.getElementById("batchTextSize").value = sig.textSize;
    document.getElementById("batchSigText").value = sig.sigText;
    document.getElementById("batchPage").value = sig.page;
    document.getElementById("batchGraphic").value = sig.graphic;

    eliminarFirma(index);
}

function generarCSV() {
    let csvContent = "";
    
    signatures.forEach((sig) => {
        const line = [
            sig.urlDescarga,
            sig.urlSubida,
            sig.fileName,
            sig.x,
            sig.y,
            sig.width,
            sig.height,
            `"${sig.sigText.replace(/"/g, '""')}"`,
            sig.graphic || "", // Campo de imagen de firma gráfica
            sig.page,
            sig.textSize
        ].join(",");
        
        csvContent += line + "\n";
    });
    
    return csvContent;
}

function descargarCSV(csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('download', `firmas-${timestamp}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Retornar la URL del blob para usarla en el enlace
    return url;
}

async function generarEnlaceBatch() {
    if (signatures.length === 0) {
        alert("Debe agregar al menos una firma a la lista.");
        return;
    }

    const tsp = document.getElementById("batchTsp").value.trim();

    // Generar el contenido CSV
    const csvContent = generarCSV();
    
    try {
        // "Guardar" el CSV en el servidor (simulado)
        const { urlDescarga } = await guardarCSVEnServidor(csvContent);
        
        // Generar la URL para la aplicación
        let url = `girasoldesktop://?batch_csv=${encodeURIComponent(urlDescarga)}`;
        
        if (tsp) {
            url += `&tsp=${encodeURIComponent(tsp)}`;
        }

        // Mostrar resultados
        const output = document.getElementById("batchOutput");
        output.innerHTML = `
            <strong>🔗 Enlace generado:</strong><br>
            <a href="${url}">${url}</a>
            <br><br>
            <strong>📄 Contenido del CSV:</strong><br>
            <textarea style="width:100%; height:150px; font-family: monospace;" readonly>${csvContent}</textarea>
            <br><br>
            <strong>📁 Archivo CSV guardado en el servidor</strong><br>
            <small>${urlDescarga}</small>
        `;

        // Abrir el enlace
        window.location.href = url;
    } catch (error) {
        console.error("Error al guardar el CSV:", error);
        alert("Ocurrió un error al guardar el CSV en el servidor.");
    }
}

// Asignar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Botón para agregar firma
    const addBtn = document.getElementById('addSignatureBtn');
    if (addBtn) {
        addBtn.addEventListener('click', agregarFirma);
    }

    // Botón para generar enlace batch
    const generateBatchBtn = document.getElementById('generateBatchBtn');
    if (generateBatchBtn) {
        generateBatchBtn.addEventListener('click', generarEnlaceBatch);
    }
});