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
    const isSigned = doc.status === "signed";
    const rowClass = index % 2 === 0 ? "bg-white" : "bg-slate-25";

    tbody.innerHTML += `
      <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${rowClass}">
        <td class="p-4">
          <div class="file-cell">
            <i class="file-icon" data-lucide="file-text"></i>
            <span class="file-name">${doc.fileName}</span>
          </div>
        </td>
        <td class="text-center">
          <button class="btn btn-primary btn-sm btn-shadow" ${
            isSigned ? "disabled" : ""
          }onclick='BtnFirmarDocumentById(${doc.id})'>
            <i class="icon-sm" data-lucide="pen-tool"></i>
            Firmar
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
          }>
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
    const isSigned = doc.status === "signed";
    const badgeClass = isSigned ? "badge-signed" : "badge-pending";
    const badgeText = isSigned ? "Firmado" : "Pendiente";

    mobileContainer.innerHTML += `
      <div class="card-mobile">
        <div class="card-mobile-content">
          <div class="mobile-file">
            <i class="file-icon" data-lucide="file-text"></i>
            <div class="mobile-file-info">
              <h3 class="mobile-file-name">${doc.fileName}</h3>
              <span class="status-badge ${badgeClass}">${badgeText}</span>
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
            }>
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
  const cfg = doc.signatureConfig || {};
  const params = new URLSearchParams();
  const codigo = encodeURIComponent(doc.codePdf);

  params.set("from", `${BASE_URL}?op=sign_download&codigo=${codigo}`);
  params.set("to", `${BASE_URL}?op=sign_upload&codigo=${codigo}`);

  params.set("vis_sig_x", cfg.positionx);
  params.set("vis_sig_y", cfg.positiony);
  params.set("vis_sig_width", cfg.width);
  params.set("vis_sig_height", cfg.height);
  params.set("vis_sig_page", cfg.pageNumber || -1);
  params.set("vis_sig_text_size", cfg.textSize || 6);
  params.set("vis_sig_text", encodeURIComponent(DEFAULT_SIGNATURE_TEXT));

  if (cfg.useGraphic && cfg.graphic) {
    params.set("vis_sig_graphic", cfg.graphic);
  }

  if (cfg.useTsp && cfg.tsp && cfg.tsp.url) {
    params.set("tsp", `${base}?op=csv&csv=tsp`);
    if (cfg.tsp.name) params.set("tsp_user", cfg.tsp.name);
    if (cfg.tsp.password) params.set("tsp_pass", cfg.tsp.password);
    params.set("tlv", 1);
  } else {
    params.set("tlv", 0);
  }

  const uri = "girasoldesktop://?" + params.toString();

  window.location.href = uri;
}

// Inicializar app al cargar DOM
document.addEventListener("DOMContentLoaded", () => {
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
