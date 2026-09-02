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
// VÉRIFIER SI L'ADMIN EXISTE
// ========================================

$sql = "
    SELECT id
    FROM utilisateurs
    WHERE email = ?
    LIMIT 1
";

$stmt = $pdo->prepare($sql);

$stmt->execute([$email]);


if ($stmt->fetch()) {

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "Cet administrateur existe déjà"
    ]);

    exit;
}


// ========================================
// HASHER LE MOT DE PASSE
// ========================================

$passwordHash = password_hash(
    $password,
    PASSWORD_DEFAULT
);


// ========================================
// CRÉER L'ADMINISTRATEUR
// ========================================

$sql = "
    INSERT INTO utilisateurs
    (email, password, role)
    VALUES (?, ?, 'admin')
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $email,
    $passwordHash
]);


// ========================================
// RÉPONSE
// ========================================

http_response_code(201);

echo json_encode([

    "success" => true,

    "message" =>
    "Administrateur créé avec succès",

    "admin_id" =>
    $pdo->lastInsertId()

]);
