let globalDocuments = [];
let globalSignedDocs = {};

window.onload = () => {
    localStorage.clear();
};

document.addEventListener("DOMContentLoaded", async () => {
    globalDocuments = await loadDocuments();
    globalSignedDocs = await loadSignedDocuments();

    await generateTableRows();
});

async function loadDocuments() {
    try {
        const response = await fetch("documentos.json");
        if (!response.ok) throw new Error("Error al cargar los documentos");
        return await response.json();
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}

function createActionButton(color, iconName, disabled, label, onClickFn) {
    const td = document.createElement("td");
    td.className = "text-center";

    const btn = document.createElement("button");
    btn.className = `btn btn-${color} btn-sm btn-shadow`;
    if (disabled) btn.disabled = true;

    const icon = document.createElement("i");
    icon.className = "icon-sm";
    icon.setAttribute("data-lucide", iconName);

    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(" " + label));
    btn.addEventListener("click", onClickFn);

    td.appendChild(btn);
    return td;
}

async function generateTableRows() {
    const tbody = document.getElementById("documents-body");
    tbody.innerHTML = "";

    // Cargar documentos y firmas
    globalDocuments = await loadDocuments();
    globalSignedDocs = await loadSignedDocuments();

    // Obtener firmas del usuario actual
    const userId = UserManager.getUserId();
    const userSignedDocs = globalSignedDocs[userId] || [];
    const userName = UserManager.getUserName();

    globalDocuments.forEach((doc, index) => {
        // Verificar si el documento está firmado
        const signatureEntry = userSignedDocs.find(
            (entry) => entry.code === doc.codePdf
        );
        const isSigned = !!signatureEntry;
        const rowClass = index % 2 === 0 ? "bg-white" : "bg-slate-25";

        // Crear elementos de la fila
        const tr = document.createElement("tr");
        tr.className = `border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${rowClass}`;

        // Celda del documento
        const tdFile = document.createElement("td");
        tdFile.className = "p-4";

        const fileCell = document.createElement("div");
        fileCell.className = "file-cell";

        const icon = document.createElement("i");
        icon.className = "file-icon";
        icon.setAttribute("data-lucide", "file-text");

        const fileInfo = document.createElement("div");
        const fileName = document.createElement("span");
        fileName.className = "file-name";
        fileName.textContent = doc.fileName;

        fileInfo.appendChild(fileName);

        if (isSigned) {
            const signedBy = document.createElement("div");
            signedBy.className = "text-xs text-gray-500 mt-1";
            signedBy.textContent = `Firmado por: ${userName}`;
            fileInfo.appendChild(signedBy);
        }

        fileCell.appendChild(icon);
        fileCell.appendChild(fileInfo);
        tdFile.appendChild(fileCell);
        tr.appendChild(tdFile);

        // ==== Botón Firmar ====
        tr.appendChild(
            createActionButton(
                "primary",
                "pen-tool",
                isSigned,
                isSigned ? "Firmado" : "Firmar",
                () => {
                    if (!isSigned) {
                        BtnFirmarDocumentById(doc.id);
                    }
                }
            )
        );

        // ==== Botón Sellar ====
        tr.appendChild(
            createActionButton("cyan", "stamp", isSigned, "Sellar", () =>
                openConfigTsaModal(doc.id)
            )
        );

        // ==== Botón Config ====
        tr.appendChild(
            createActionButton("amber", "settings", false, "Config", () =>
                openConfigFirmaModal(doc.id)
            )
        );

        // ==== Botón Ver ====
        tr.appendChild(
            createActionButton(
                "secondary",
                isSigned ? "eye" : "clock",
                !isSigned,
                isSigned ? "Ver" : "Pendiente",
                () => {
                    if (isSigned) {
                        viewSignedDocument(doc.id);
                    } else {
                        showToast(
                            "El documento aún no ha sido firmado",
                            "info"
                        );
                    }
                }
            )
        );

        tbody.appendChild(tr);
    });

    // Actualizar íconos de Lucide
    lucide.createIcons();
}

// Modal de configuración
function openSignatureModal(docId) {
    const doc = globalDocuments.find((d) => d.id == docId);
    const cfg = doc.signatureConfig || {};

    const html = `
    <label class="optional">URL del gráfico:</label>
    <input type="text" id="sig-graphic" class="input" placeholder="https://... (opcional)" value="${
        cfg.graphic || ""
    }">

    <div class="flex gap-2">
      <div class="flex-1">
        <label>Anchura (px):</label>
        <input type="number" id="sig-width" class="input" value="${
            cfg.width || 150
        }">
      </div>
      <div class="flex-1">
        <label>Altura (px):</label>
        <input type="number" id="sig-height" class="input" value="${
            cfg.height || 55
        }">
      </div>
    </div>

    <div class="flex gap-2">
      <div class="flex-1">
        <label>Posición X (px):</label>
        <input type="number" id="sig-x" class="input" value="${
            cfg.positionx || 100
        }">
      </div>
      <div class="flex-1">
        <label>Posición Y (px):</label>
        <input type="number" id="sig-y" class="input" value="${
            cfg.positiony || 150
        }">
      </div>
      <div class="flex-1">
        <label>Número de página:</label>
        <input type="number" id="sig-page" class="input" value="${
            cfg.pageNumber || 1
        }" disabled>
      </div>
    </div>
  `;

    document.getElementById("signature-fields").innerHTML = html;
    document.getElementById("modal-signature").classList.remove("hidden");

    document.getElementById("save-signature").onclick = () => {
        cfg.graphic = document.getElementById("sig-graphic").value.trim();
        cfg.width = parseInt(document.getElementById("sig-width").value);
        cfg.height = parseInt(document.getElementById("sig-height").value);
        cfg.positionx = parseInt(document.getElementById("sig-x").value);
        cfg.positiony = parseInt(document.getElementById("sig-y").value);
        document.getElementById("modal-signature").classList.add("hidden");
    };

    document.getElementById("close-signature").onclick = () => {
        document.getElementById("modal-signature").classList.add("hidden");
    };
}

function openTsaModal(docId) {
    const doc = globalDocuments.find((d) => d.id == docId);
    const cfg = doc.signatureConfig || {};
    cfg.tsp = cfg.tsp || {};

    const html = `
    <label>URL del TSA:</label>
    <input type="text" id="tsa-url" class="input" value="${
        cfg.tsp.url || ""
    }" placeholder="https://...">

    <label>Usuario:</label>
    <input type="text" id="tsa-user" class="input" value="${
        cfg.tsp.name || ""
    }" placeholder="usuario">

    <label>Contraseña:</label>
    <input type="password" id="tsa-pass" class="input" value="${
        cfg.tsp.password || ""
    }" placeholder="********">
  `;

    document.getElementById("tsa-fields").innerHTML = html;
    document.getElementById("modal-tsa").classList.remove("hidden");

    document.getElementById("save-tsa").onclick = () => {
        const url = document.getElementById("tsa-url");
        const user = document.getElementById("tsa-user");
        const pass = document.getElementById("tsa-pass");

        [url, user, pass].forEach((el) => el.classList.remove("input-error"));

        if (url.value.trim() && (!user.value.trim() || !pass.value.trim())) {
            if (!user.value.trim()) user.classList.add("input-error");
            if (!pass.value.trim()) pass.classList.add("input-error");
            alert(
                "Si se proporciona una URL TSA, debe ingresar usuario y contraseña."
            );
            return;
        }

        cfg.tsp = {
            url: url.value.trim(),
            name: user.value.trim(),
            password: pass.value.trim(),
        };
        document.getElementById("modal-tsa").classList.add("hidden");
    };

    document.getElementById("close-tsa").onclick = () => {
        document.getElementById("modal-tsa").classList.add("hidden");
    };
}

function BtnFirmarDocument(doc) {
    try {
        const userId = UserManager.getUserId();
        const userName = UserManager.getUserName();

        if (!doc?.codePdf) {
            throw new Error("Documento no tiene código PDF válido");
        }

        const cfg = doc.signatureConfig || {};
        const params = new URLSearchParams();
        const codigo = encodeURIComponent(doc.codePdf);

        SignatureTracker.recordSignature(doc.id, {
            status: "in_progress",
            documentName: doc.fileName,
            userId: userId,
            userName: userName,
            timestamp: new Date().toISOString(),
            config: {
                position: { x: cfg.positionx, y: cfg.positiony },
                size: { width: cfg.width, height: cfg.height },
            },
        });

        params.set("from", `${BASE_URL}?op=sign_download&codigo=${codigo}`);
        params.set(
            "to",
            `${BASE_URL}?op=sign_upload&codigo=${codigo}&user_id=${userId}`
        );

        params.set("vis_sig_x", cfg.positionx || 100);
        params.set("vis_sig_y", cfg.positiony || 150);
        params.set("vis_sig_width", cfg.width || 150);
        params.set("vis_sig_height", cfg.height || 55);
        params.set("vis_sig_page", cfg.pageNumber || -1);
        params.set("vis_sig_text_size", cfg.textSize || 6);
        params.set(
            "vis_sig_text",
            encodeURIComponent(cfg.signatureText || DEFAULT_SIGNATURE_TEXT)
        );

        if (cfg.useGraphic && cfg.graphic) {
            if (!isValidUrl(cfg.graphic)) {
                throw new Error("URL de imagen de firma no válida");
            }
            params.set("vis_sig_graphic", cfg.graphic);
        }

        if (cfg.useTsp) {
            if (!cfg.tsp?.url) {
                throw new Error("URL TSP no configurada");
            }
            params.set("tsp", `${BASE_URL}?op=csv&csv=tsp&user_id=${userId}`);
            if (cfg.tsp.name) params.set("tsp_user", cfg.tsp.name);
            if (cfg.tsp.password) params.set("tsp_pass", cfg.tsp.password);
            params.set("tlv", 1);
        } else {
            params.set("tlv", 0);
        }

        const uri = "girasoldesktop://?" + params.toString();
        console.log("Iniciando proceso de firma:", {
            document: doc.id,
            user: userId,
            params: Object.fromEntries(params),
        });

        console.log("Redirigiendo a:", uri);
        window.location.href = uri;
        startSignaturePolling(doc.codePdf, userId);
    } catch (error) {
        console.error("Error en BtnFirmarDocument:", error);
        alert(`Error al preparar firma: ${error.message}`);
    }
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function openConfigFirmaModal(docId) {
    openSignatureModal(docId);
}

function openConfigTsaModal(docId) {
    openTsaModal(docId);
}

function BtnFirmarDocumentById(docId) {
    const doc = globalDocuments.find((d) => d.id == docId);
    BtnFirmarDocument(doc);
}

async function loadSignedDocuments() {
    try {
        const response = await fetch("/girasol/api_signed_docs.php");

        if (!response.ok) throw new Error("No se pudo cargar signed_docs.json");
        return await response.json();
    } catch (error) {
        console.error("Error al cargar signed_docs.json:", error);
        return {};
    }
}
function showToast(message, type = "info") {
    console.log(`${type.toUpperCase()}: ${message}`);
}

async function viewSignedDocument(docId) {
    try {
        const doc = globalDocuments.find((d) => d.id == docId);
        if (!doc) throw new Error("Documento no encontrado");
        const userId = UserManager.getUserId();
        const signedDocUrl = `/girasol/sign_download.php?codigo=${encodeURIComponent(doc.codePdf)}&user_id=${userId}`;
        window.open(signedDocUrl, "_blank");
    } catch (error) {
        console.error("Error al ver documento:", error);
        showToast("Error al mostrar documento firmado", "error");
    }
}

function startSignaturePolling(docId, userId) {
    const interval = setInterval(async () => {
        try {
            globalSignedDocs = await loadSignedDocuments();
            const userSignedDocs = globalSignedDocs[userId] || [];
            const isSigned = userSignedDocs.some(
                (entry) => entry.code.trim() === String(docId).trim()
            );

            if (isSigned) {
                clearInterval(interval);
                await generateTableRows();
                showToast("Documento firmado exitosamente", "success");
            }
        } catch (error) {
            clearInterval(interval);
        }
    }, 3000);
}
