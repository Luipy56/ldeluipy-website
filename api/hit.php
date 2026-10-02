<?php
declare(strict_types=1);

require __DIR__ . '/_lib.php';

luipy_cors_same_origin();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    luipy_json(['error' => 'method'], 405);
}

$path = LUIPY_DATA . '/hits.json';
$cookie = 'ldeluipy_v';
$already = isset($_COOKIE[$cookie]);

$fh = luipy_lock($path);
if ($fh === false) {
    luipy_json(['error' => 'lock'], 500);
}

rewind($fh);
$raw = stream_get_contents($fh);
$state = ['total' => 0];
if (is_string($raw) && $raw !== '') {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $state = $decoded;
    }
}
$total = (int)($state['total'] ?? 0);

if (!$already) {
    $total++;
    $state['total'] = $total;
    $state['updated'] = gmdate('c');
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($state, JSON_UNESCAPED_SLASHES));
    fflush($fh);
    setcookie($cookie, '1', [
        'expires' => time() + 86400,
        'path' => '/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

luipy_unlock($fh);
luipy_json(['n' => $total, 'counted' => !$already]);
