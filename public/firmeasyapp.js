let globalDocuments = [];

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

// Generar filas de la tabla para escritorio
async function generateTableRows() {
  const tbody = document.getElementById("documents-body");
  tbody.innerHTML = "";
  globalDocuments = await loadDocuments();

  globalDocuments.forEach((doc, index) => {
    const userSignature = SignatureTracker.getUserSignatures()[doc.id];
    const isSigned = userSignature?.status === "completed";
    const rowClass = index % 2 === 0 ? "bg-white" : "bg-slate-25";
    const userName = userSignature?.userName || UserManager.getUserName();

    tbody.innerHTML += `
      <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${rowClass}">
        <td class="p-4">
          <div class="file-cell">
            <i class="file-icon" data-lucide="file-text"></i>
            <div>
              <span class="file-name">${doc.fileName}</span>
              ${
                userSignature
                  ? `<div class="text-xs text-gray-500 mt-1">Firmado por: ${userName}</div>`
                  : ""
              }
            </div>
          </div>
        </td>
        <td class="text-center">
          <button class="btn btn-primary btn-sm btn-shadow" ${
            isSigned ? "disabled" : ""
          } onclick='BtnFirmarDocumentById(${doc.id})'>
            <i class="icon-sm" data-lucide="pen-tool"></i>
            ${isSigned ? "Ya firmado" : "Firmar"}
          </button>
        </td>
        <td class="text-center">
          <button class="btn btn-cyan btn-sm btn-shadow" ${
            isSigned ? "disabled" : ""
          } onclick='openConfigTsaModal(${doc.id})'>
            <i class="icon-sm" data-lucide="stamp"></i>
            Sellar
          </button>
        </td>
        <td class="text-center">
          <button class="btn btn-amber btn-sm btn-shadow" onclick='openConfigFirmaModal(${
            doc.id
          })'>
            <i class="icon-sm" data-lucide="settings"></i>
            Config
          </button>
        </td>
        <td class="text-center">
          <button class="btn btn-secondary btn-sm" ${
            !isSigned ? "disabled" : ""
          } onclick='viewUserSignature("${doc.id}")'>
            <i class="icon-sm" data-lucide="${isSigned ? "eye" : "clock"}"></i>
            ${isSigned ? "Ver" : "Pendiente"}
          </button>
        </td>
      </tr>
    `;
  });

  lucide.createIcons();
}

// Generar tarjetas móviles
async function generateMobileCards() {
  const mobileContainer = document.getElementById("mobile-documents");
  mobileContainer.innerHTML = "";
  globalDocuments = await loadDocuments();

  globalDocuments.forEach((doc) => {
    const userSignature = SignatureTracker.getUserSignatures()[doc.id];
    const isSigned = userSignature?.status === "completed";
    const badgeClass = isSigned ? "badge-signed" : "badge-pending";
    const badgeText = isSigned ? "Firmado" : "Pendiente";
    const userName = userSignature?.userName || UserManager.getUserName();

    mobileContainer.innerHTML += `
      <div class="card-mobile">
        <div class="card-mobile-content">
          <div class="mobile-file">
            <i class="file-icon" data-lucide="file-text"></i>
            <div class="mobile-file-info">
              <h3 class="mobile-file-name">${doc.fileName}</h3>
              <span class="status-badge ${badgeClass}">${badgeText}</span>
              ${
                isSigned
                  ? `<div class="text-xs text-gray-500">Firmado por: ${userName}</div>`
                  : ""
              }
            </div>
          </div>
          <div class="button-grid">
            <button class="btn btn-primary btn-sm" ${
              isSigned ? "disabled" : ""
            } onclick='BtnFirmarDocument(${JSON.stringify(doc)})'>
              <i class="icon-sm" data-lucide="pen-tool"></i>
              Firma PDF
            </button>
            <button class="btn btn-cyan btn-sm" ${isSigned ? "disabled" : ""}>
              <i class="icon-sm" data-lucide="stamp"></i>
              Con Sello
            </button>
            <button class="btn btn-amber btn-sm config-btn" data-id="${doc.id}">
              <i class="icon-sm" data-lucide="settings"></i>
              Configurar
            </button>
            <button class="btn btn-secondary btn-sm" ${
              !isSigned ? "disabled" : ""
            } onclick='viewUserSignature("${doc.id}")'>
              <i class="icon-sm" data-lucide="${
                isSigned ? "eye" : "clock"
              }"></i>
              ${isSigned ? "Ver" : "Pendiente"}
            </button>
          </div>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".config-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const docId = btn.dataset.id;
      openConfigModal(docId);
    });
  });

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
    // 1. Obtener información del usuario
    const userId = UserManager.getUserId();
    const userName = UserManager.getUserName();

    // 2. Validar documento y configuración
    if (!doc?.codePdf) {
      throw new Error("Documento no tiene código PDF válido");
    }

    const cfg = doc.signatureConfig || {};
    const params = new URLSearchParams();
    const codigo = encodeURIComponent(doc.codePdf);

    // 3. Registrar inicio de proceso de firma
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

    params.set(
      "from",
      `${BASE_URL}?op=sign_download&codigo=${codigo}&user_id=${userId}`
    );
    params.set(
      "to",
      `${BASE_URL}?op=sign_upload&codigo=${codigo}&user_id=${userId}`
    );

    // Configuración visual de la firma
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

    // Imagen de firma gráfica (si está configurada)
    if (cfg.useGraphic && cfg.graphic) {
      if (!isValidUrl(cfg.graphic)) {
        throw new Error("URL de imagen de firma no válida");
      }
      params.set("vis_sig_graphic", cfg.graphic);
    }

    // Configuración TSP (si está habilitado)
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

    // 5. Redirigir a la aplicación de escritorio
    const uri = "girasoldesktop://?" + params.toString();
    console.log("Iniciando proceso de firma:", {
      document: doc.id,
      user: userId,
      params: Object.fromEntries(params),
    });

    console.log("Redirigiendo a:", uri);
    window.location.href = uri;
  } catch (error) {
    console.error("Error en BtnFirmarDocument:", error);
    alert(`Error al preparar firma: ${error.message}`);
  }
}

// Función auxiliar para validar URLs
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Inicializar app al cargar DOM
document.addEventListener("DOMContentLoaded", async () => {
  // Cargar documentos primero
  globalDocuments = await loadDocuments();

  // Luego verificar firmas y renderizar
  const urlParams = new URLSearchParams(window.location.search);
  const signedDocId = urlParams.get("signed_doc_id");
  const signingUser = urlParams.get("signing_user");

  if (signedDocId && signingUser) {
    const signatures = SignatureTracker.getUserSignatures();
    if (signatures[signedDocId]?.userId === signingUser) {
      SignatureTracker.recordSignature(signedDocId, {
        ...signatures[signedDocId],
        status: "completed",
        signedAt: new Date().toISOString(),
      });
    }
  }

  // Renderizar
  generateTableRows();
  generateMobileCards();
});

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

function viewUserSignature(documentId) {
  const signature = SignatureTracker.getUserSignatures()[documentId];
  if (signature?.status === "completed") {
    // Aquí implementa la lógica para ver el documento firmado
    alert(`Mostrando documento firmado por ${signature.userName}`);
    // window.open(signature.documentUrl, '_blank'); // Si tienes una URL
  } else {
    alert("No has firmado este documento aún");
  }
}
