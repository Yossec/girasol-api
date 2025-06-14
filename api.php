<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Rutas y base de datos
$baseDir = __DIR__;
$uploadDir = $baseDir . '/uploads';
$samplesDir = $baseDir . '/samples';
$csvDir = $baseDir . '/samplescsv';
$dbFile = $baseDir . '/fake_db.json';

if (!file_exists($uploadDir)) mkdir($uploadDir, 0755, true);
if (!file_exists($samplesDir)) mkdir($samplesDir, 0755, true);
if (!file_exists($csvDir)) mkdir($csvDir, 0755, true);

$fakeDb = file_exists($dbFile) ? json_decode(file_get_contents($dbFile), true) : [];

$method = $_SERVER['REQUEST_METHOD'];
$op = $_GET['op'] ?? '';

// ====================================
// GET /api.php?op=sign_download&codigo=ID
// ====================================
if ($method === 'GET' && $op === 'sign_download' && isset($_GET['codigo'])) {
    $codigo = $_GET['codigo'];

    if (isset($fakeDb[$codigo])) {
        $archivo = $fakeDb[$codigo];

        if (file_exists($archivo) && is_readable($archivo)) {
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . basename($archivo) . '"');
            header('Content-Length: ' . filesize($archivo));
            readfile($archivo);
            exit;
        }
    }

    http_response_code(404);
    echo json_encode(['error' => 'Archivo no encontrado']);
    exit;
}

// ====================================
// GET /api.php?op=sample&codigo=ID
// ====================================
if ($method === 'GET' && $op === 'sample' && isset($_GET['codigo'])) {
    $sampleDb = [
        'abc123' => "$samplesDir/pdfWeb.pdf",
        'd8b5a1f7-24c3-4346-b10c-76033d5c3446' => "$samplesDir/sample2.pdf",
        'abc256' => "$samplesDir/sample3.pdf",
    ];

    $codigo = $_GET['codigo'];
    if (isset($sampleDb[$codigo])) {
        $archivo = $sampleDb[$codigo];
        if (file_exists($archivo) && is_readable($archivo)) {
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . basename($archivo) . '"');
            header('Content-Length: ' . filesize($archivo));
            readfile($archivo);
            exit;
        }
    }

    http_response_code(404);
    echo json_encode(['error' => 'Archivo de muestra no encontrado']);
    exit;
}

// ====================================
// GET /api.php?op=csv&csv=ID
// ====================================
if ($method === 'GET' && $op === 'csv' && isset($_GET['csv'])) {
    $csvDb = [
        '12' => "$csvDir/prueba.csv",
        '456' => "$csvDir/ejemplo.csv",
        'tsp' => "$csvDir/tsp.csv",
    ];

    $csvId = $_GET['csv'];
    if (isset($csvDb[$csvId])) {
        $archivo = $csvDb[$csvId];
        if (file_exists($archivo) && is_readable($archivo)) {
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="' . basename($archivo) . '"');
            header('Content-Length: ' . filesize($archivo));
            readfile($archivo);
            exit;
        }
    }

    http_response_code(404);
    echo json_encode(['error' => 'CSV no encontrado']);
    exit;
}

// ====================================
// POST /api.php?op=sign_upload&codigo=ID
// ====================================
if ($method === 'POST' && $op === 'sign_upload' && isset($_GET['codigo'])) {
    $codigo = $_GET['codigo'];

    if (!isset($_FILES['pdf_file']) || $_FILES['pdf_file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Archivo no recibido']);
        exit;
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($_FILES['pdf_file']['tmp_name']);

    if ($mime !== 'application/pdf') {
        http_response_code(415);
        echo json_encode(['error' => 'Solo se permiten archivos PDF']);
        exit;
    }

    $name = preg_replace('/[^a-zA-Z0-9\.\-_]/', '', basename($_FILES['pdf_file']['name']));
    $targetPath = "$uploadDir/" . uniqid() . "_$name";

    if (move_uploaded_file($_FILES['pdf_file']['tmp_name'], $targetPath)) {
        $fakeDb[$codigo] = $targetPath;
        file_put_contents($dbFile, json_encode($fakeDb, JSON_PRETTY_PRINT));

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Archivo subido exitosamente',
            'path' => $targetPath,
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al guardar archivo']);
    }

    exit;
}

// ====================================
// Método o ruta no válida
// ====================================
http_response_code(405);
echo json_encode(['error' => 'Método o parámetro inválido']);
