<?php

require_once __DIR__ . "/db.php";


// ========================================
// RÉCUPÉRER LE HEADER AUTHORIZATION
// ========================================

$headers = getallheaders();

$authorization =
    $headers["Authorization"]
    ?? $headers["authorization"]
    ?? null;


// ========================================
// VÉRIFIER SI LE TOKEN EXISTE
// ========================================

if (!$authorization) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Token manquant"
    ]);

    exit;
}


// ========================================
// VÉRIFIER LE FORMAT BEARER
// ========================================

if (!preg_match(
    '/^Bearer\s+(.+)$/i',
    $authorization,
    $matches
)) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Format du token invalide"
    ]);

    exit;
}


// ========================================
// RÉCUPÉRER LE TOKEN
// ========================================

$token = trim($matches[1]);


// ========================================
// HASHER LE TOKEN
// ========================================

$tokenHash = hash(
    "sha256",
    $token
);


// ========================================
// RECHERCHER LE TOKEN
// ========================================

$sql = "

    SELECT

        tokens.id AS token_id,

        tokens.utilisateur_id,

        tokens.expiration,

        utilisateurs.email,

        utilisateurs.role

    FROM tokens

    INNER JOIN utilisateurs

        ON utilisateurs.id =
           tokens.utilisateur_id

    WHERE tokens.token_hash = ?

    LIMIT 1

";


$stmt = $pdo->prepare($sql);

$stmt->execute([
    $tokenHash
]);


$authUser =
    $stmt->fetch(PDO::FETCH_ASSOC);


// ========================================
// TOKEN INVALIDE
// ========================================

if (!$authUser) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Token invalide"
    ]);

    exit;
}


// ========================================
// TOKEN EXPIRÉ
// ========================================

if (
    strtotime($authUser["expiration"])
    < time()
) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Token expiré"
    ]);

    exit;
}
