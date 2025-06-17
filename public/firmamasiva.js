document.addEventListener("DOMContentLoaded", () => {
  const btnMasiva = document.querySelector(".action-button button");

  if (btnMasiva) {
    btnMasiva.addEventListener("click", async () => {
      const firmas = prepararFirmasDesdeJSON();

      if (firmas.length === 0) {
        alert("No hay documentos válidos para firmar.");
        return;
      }

      const csvContent = generarCSV(firmas);

      try {
        const { urlDescarga } = await guardarCSVEnServidor(csvContent);
        const primerTsp = globalDocuments.find((d) => d.signatureConfig?.useTsp)
          ?.signatureConfig?.tsp?.url;

        let uri = `girasoldesktop://?batch_csv=${encodeURIComponent(
          urlDescarga
        )}`;
        if (primerTsp && primerTsp.trim() !== "") {
          uri += `&tsp=${encodeURIComponent(primerTsp)}`;
        }
        window.location.href = uri;
      } catch (err) {
        console.error("Error al subir CSV:", err);
        alert("Ocurrió un error al guardar el CSV en el servidor.");
      }
    });
  }
});

function prepararFirmasDesdeJSON() {
  const firmas = [];

  (globalDocuments || []).forEach((doc) => {
    const cfg = doc.signatureConfig || {};
    if (!cfg.positionx || !cfg.positiony || !cfg.width || !cfg.height) return;
    if (doc.status === "signed") return;

    const code = encodeURIComponent(doc.codePdf);
    const tspUrl = cfg.useTsp ? cfg.tsp?.url || "" : "";

    firmas.push({
      fileName: doc.fileName,
      urlDescarga: `${BASE_URL}?op=sign_download&codigo=${code}`,
      urlSubida: `${BASE_URL}?op=sign_upload&codigo=${code}`,
      x: cfg.positionx,
      y: cfg.positiony,
      width: cfg.width,
      height: cfg.height,
      sigText: DEFAULT_SIGNATURE_TEXT,
      graphic: cfg.useGraphic ? cfg.graphic : "",
      page: cfg.pageNumber || DEFAULT_PAGE_NUMBER,
      textSize: DEFAULT_TEXT_SIZE,
      tsp: tspUrl,
    });
  });

  return firmas;
}

function generarCSV(firmas) {
  return firmas
    .map((sig) => {
      return [
        sig.urlDescarga,
        sig.urlSubida,
        sig.fileName,
        sig.x,
        sig.y,
        sig.width,
        sig.height,
        `"${sig.sigText.replace(/"/g, '""')}"`,
        sig.graphic || "",
        sig.page,
        sig.textSize,
      ].join(",");
    })
    .join("\n");
}

async function guardarCSVEnServidor(csvContent) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const codigo = `firmas-${timestamp}`;
  const uploadUrl = `${BASE_URL}?op=csv_upload&csv=${codigo}`;
  const downloadUrl = `${BASE_URL}?op=csv_download&codigo=${codigo}`;

  const formData = new FormData();
  formData.append(
    "csv_file",
    new Blob([csvContent], { type: "text/csv" }),
    "firmas.csv"
  );

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("No se pudo subir el CSV al servidor");
  }

  console.log(`CSV guardado como ${codigo}.csv`);

  return {
    nombreArchivo: `${codigo}.csv`,
    urlDescarga: downloadUrl,
    rutaLocal: `/samplescsv/${codigo}.csv`,
  };
}
