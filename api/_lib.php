<?php
declare(strict_types=1);

const LUIPY_DATA = '/var/lib/ldeluipy';

function luipy_json(array $payload, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function luipy_cors_same_origin(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? 'ldeluipy.es';
    if ($origin !== '' && preg_match('#^https?://' . preg_quote($host, '#') . '$#i', $origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }
}

/** @return resource|false */
function luipy_lock(string $path, string $mode = 'c+') {
    $fh = fopen($path, $mode);
    if ($fh === false) {
        return false;
    }
    if (!flock($fh, LOCK_EX)) {
        fclose($fh);
        return false;
    }
    return $fh;
}

function luipy_unlock($fh): void {
    if (is_resource($fh)) {
        flock($fh, LOCK_UN);
        fclose($fh);
    }
}
