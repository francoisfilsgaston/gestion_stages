<?php

// ========================================
// CONFIGURATION
// ========================================

require_once "../../config/cors.php";
require_once "../../config/auth.php";
require_once "../../config/integration.php";


// ========================================
// VÉRIFIER LE RÔLE
// ========================================

if ($authUser["role"] !== "admin") {

    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Accès réservé à l'administrateur"
    ]);

    exit;
}


// ========================================
// INITIALISER CURL
// ========================================

$ch = curl_init(API_UNIVERSITAIRE_URL);


// ========================================
// CONFIGURER LA REQUÊTE
// ========================================

curl_setopt_array($ch, [

    CURLOPT_RETURNTRANSFER => true,

    CURLOPT_HTTPHEADER => [
        "X-API-KEY: " . API_KEY_UNIVERSITAIRE,
        "Accept: application/json"
    ],

    CURLOPT_CONNECTTIMEOUT => 5,

    CURLOPT_TIMEOUT => 10,

    CURLOPT_FOLLOWLOCATION => false

]);


// ========================================
// EXÉCUTER LA REQUÊTE
// ========================================

$response = curl_exec($ch);


// ========================================
// VÉRIFIER LES ERREURS CURL
// ========================================

if ($response === false) {

    $error = curl_error($ch);

    http_response_code(502);

    echo json_encode([
        "success" => false,
        "message" => "Impossible de contacter l'application universitaire",
        "error" => $error
    ]);

    exit;
}


// ========================================
// RÉCUPÉRER LE CODE HTTP
// ========================================

$httpCode = curl_getinfo(
    $ch,
    CURLINFO_HTTP_CODE
);


// ========================================
// VÉRIFIER LA RÉPONSE DE L'APP 1
// ========================================

if ($httpCode !== 200) {

    http_response_code(502);

    echo json_encode([
        "success" => false,
        "message" => "L'application universitaire a retourné une erreur",
        "http_code" => $httpCode
    ]);

    exit;
}


// ========================================
// DÉCODER LE JSON
// ========================================

$data = json_decode($response, true);


if (!is_array($data)) {

    http_response_code(502);

    echo json_encode([
        "success" => false,
        "message" => "Réponse invalide de l'application universitaire"
    ]);

    exit;
}


// ========================================
// RETOURNER LES ÉTUDIANTS
// ========================================

echo json_encode($data);
