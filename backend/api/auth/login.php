<?php

require_once "../../config/cors.php";
require_once "../../config/db.php";


// ========================================
// RÉCUPÉRER LES DONNÉES JSON
// ========================================

$data = json_decode(
    file_get_contents("php://input"),
    true
);


// ========================================
// VÉRIFIER LES DONNÉES
// ========================================

if (
    !is_array($data) ||
    empty(trim($data["email"] ?? "")) ||
    empty($data["password"] ?? "")
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Email et mot de passe obligatoires"
    ]);

    exit;
}


$email = trim($data["email"]);
$password = $data["password"];


// ========================================
// RECHERCHER L'ADMINISTRATEUR
// ========================================

$sql = "
    SELECT
        id,
        email,
        password,
        role
    FROM utilisateurs
    WHERE email = ?
    AND role = 'admin'
    LIMIT 1
";

$stmt = $pdo->prepare($sql);

$stmt->execute([$email]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);


// ========================================
// VÉRIFIER L'UTILISATEUR
// ========================================

if (!$user) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Email ou mot de passe incorrect"
    ]);

    exit;
}


// ========================================
// VÉRIFIER LE MOT DE PASSE
// ========================================

if (!password_verify(
    $password,
    $user["password"]
)) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Email ou mot de passe incorrect"
    ]);

    exit;
}


// ========================================
// GÉNÉRER LE TOKEN
// ========================================

$token = bin2hex(
    random_bytes(32)
);


// ========================================
// HASHER LE TOKEN
// ========================================

$tokenHash = hash(
    "sha256",
    $token
);


// ========================================
// EXPIRATION : 24 HEURES
// ========================================

$expiration = date(
    "Y-m-d H:i:s",
    time() + (60 * 60 * 24)
);


// ========================================
// ENREGISTRER LE TOKEN
// ========================================

$sql = "
    INSERT INTO tokens
    (
        utilisateur_id,
        token_hash,
        expiration
    )
    VALUES (?, ?, ?)
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $user["id"],
    $tokenHash,
    $expiration
]);


// ========================================
// RÉPONSE
// ========================================

echo json_encode([

    "success" => true,

    "message" => "Connexion réussie",

    "token" => $token,

    "expiration" => $expiration,

    "user" => [

        "id" => $user["id"],

        "email" => $user["email"],

        "role" => $user["role"]

    ]

]);
