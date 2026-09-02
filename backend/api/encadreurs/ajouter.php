<?php

require_once "../../config/cors.php";
require_once "../../config/auth.php";
require_once "../../config/db.php";


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
// RÉCUPÉRER LES DONNÉES JSON
// ========================================

$data = json_decode(
    file_get_contents("php://input"),
    true
);


// ========================================
// VÉRIFIER LE JSON
// ========================================

if (!is_array($data)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Données JSON invalides"
    ]);

    exit;
}


// ========================================
// RÉCUPÉRER LES DONNÉES
// ========================================

$nom = trim($data["nom"] ?? "");

$prenom = trim($data["prenom"] ?? "");

$telephone = trim($data["telephone"] ?? "");

$email = trim($data["email"] ?? "");

$fonction = trim($data["fonction"] ?? "");


// ========================================
// VÉRIFIER LES CHAMPS OBLIGATOIRES
// ========================================

if ($nom === "" || $prenom === "") {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Le nom et le prénom sont obligatoires"
    ]);

    exit;
}


// ========================================
// VÉRIFIER L'EMAIL
// ========================================

if (
    $email !== "" &&
    !filter_var($email, FILTER_VALIDATE_EMAIL)
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Adresse email invalide"
    ]);

    exit;
}


// ========================================
// VÉRIFIER SI L'ENCADREUR EXISTE
// ========================================

$sql = "
    SELECT id
    FROM encadreurs
    WHERE nom = ?
    AND prenom = ?
    LIMIT 1
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $nom,
    $prenom
]);

$encadreurExiste = $stmt->fetch(PDO::FETCH_ASSOC);


if ($encadreurExiste) {

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "Cet encadreur existe déjà"
    ]);

    exit;
}


// ========================================
// INSÉRER L'ENCADREUR
// ========================================

$sql = "
    INSERT INTO encadreurs
    (
        nom,
        prenom,
        telephone,
        email,
        fonction
    )
    VALUES (?, ?, ?, ?, ?)
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $nom,
    $prenom,
    $telephone,
    $email,
    $fonction
]);


// ========================================
// RÉPONSE
// ========================================

http_response_code(201);

echo json_encode([

    "success" => true,

    "message" => "Encadreur ajouté avec succès",

    "encadreur_id" => $pdo->lastInsertId()

]);
