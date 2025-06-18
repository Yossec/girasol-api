<?php
header('Content-Type: application/json');

// Ruta absoluta o relativa al archivo JSON
$path = __DIR__ . '/signed_docs.json';

if (!file_exists($path)) {
    http_response_code(404);
    echo json_encode(['error' => 'Archivo no encontrado']);
    exit;
}

$data = file_get_contents($path);
echo $data;
