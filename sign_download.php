<?php
// sign_download.php

$codigo = $_GET['codigo'] ?? null;
$userId = $_GET['user_id'] ?? null;

if (!$codigo || !$userId) {
    http_response_code(400);
    echo "⚠️ Faltan parámetros requeridos: 'codigo' y 'user_id'";
    exit;
}

// Ruta al JSON
$jsonPath = __DIR__ . "/signed_docs.json";
if (!file_exists($jsonPath)) {
    http_response_code(500);
    echo "❌ No se encontró el archivo de firmas";
    exit;
}

$jsonData = json_decode(file_get_contents($jsonPath), true);
$userDocs = $jsonData[$userId] ?? [];

if (empty($userDocs)) {
    http_response_code(404);
    echo "❌ No hay documentos firmados por este usuario";
    exit;
}

// Filtrar por código de documento
$matchingDocs = array_filter($userDocs, function ($doc) use ($codigo) {
    return $doc['code'] === $codigo;
});

// Obtener el más reciente (por `signedAt`)
usort($matchingDocs, function ($a, $b) {
    return strtotime($b['signedAt']) - strtotime($a['signedAt']);
});

$latest = $matchingDocs[0] ?? null;

if (!$latest || !file_exists($latest['filePath'])) {
    http_response_code(404);
    echo "❌ Documento no encontrado o la ruta no es válida";
    exit;
}

// Mostrar el PDF
header("Content-Type: application/pdf");
header("Content-Disposition: inline; filename=\"" . basename($latest['filePath']) . "\"");
readfile($latest['filePath']);
exit;
