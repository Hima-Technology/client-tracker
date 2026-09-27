<?php
// save.php — Backend persistence script for ClientTrack
// Upload this file to your hosting server (e.g. at https://usamatalib.com/save.php or https://usamatalib.com/api/save.php)

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Secret-Key');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json');

// Handle preflight CORS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$EXPECTED_SECRET = 'lion-hima-ngombe-znz-Plan';
$DATA_FILE = __DIR__ . '/clients.json';

// Fetch X-Secret-Key from incoming HTTP headers
$headers = getallheaders();
$providedSecret = '';

if (isset($headers['X-Secret-Key'])) {
    $providedSecret = $headers['X-Secret-Key'];
} elseif (isset($headers['x-secret-key'])) {
    $providedSecret = $headers['x-secret-key'];
} elseif (isset($_SERVER['HTTP_X_SECRET_KEY'])) {
    $providedSecret = $_SERVER['HTTP_X_SECRET_KEY'];
}

// Secret authorization check
if ($providedSecret !== $EXPECTED_SECRET) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized: Invalid secret key']);
    exit();
}

// GET method → return client list
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($DATA_FILE)) {
        echo json_encode([]);
        exit();
    }
    $content = file_get_contents($DATA_FILE);
    echo $content ?: '[]';
    exit();
}

// POST method → save client list
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input. Expected an array.']);
        exit();
    }

    if (file_put_contents($DATA_FILE, json_encode($data, JSON_PRETTY_PRINT)) !== false) {
        echo json_encode(['ok' => true, 'count' => count($data)]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write clients.json on server. Check file permissions.']);
    }
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);
