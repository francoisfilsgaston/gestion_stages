<?php

header("Access-Control-Allow-Origin: http://127.0.0.1:5500");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");


// ========================================
// GÉRER LES REQUÊTES PREFLIGHT
// ========================================

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {

    http_response_code(200);

    exit;
}
