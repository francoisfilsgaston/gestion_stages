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
// RÉCUPÉRER LE NOM
// ========================================

$nom = trim($data["nom"] ?? "");

$adresse = trim($data["adresse"] ?? "");

$telephone = trim($data["telephone"] ?? "");

$email = trim($data["email"] ?? "");

$secteur = trim($data["secteur"] ?? "");


// ========================================
// VÉRIFIER LE NOM
// ========================================

if ($nom === "") {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Le nom de l'entreprise est obligatoire"
    ]);

    exit;
}


// ========================================
// VÉRIFIER L'EMAIL
// ========================================

if ($email !== "" && !filter_var($email, FILTER_VALIDATE_EMAIL)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Adresse email invalide"
    ]);

    exit;
}


// ========================================
// VÉRIFIER SI L'ENTREPRISE EXISTE
// ========================================

$sql = "
    SELECT id
    FROM entreprises
    WHERE nom = ?
    LIMIT 1
";

$stmt = $pdo->prepare($sql);

$stmt->execute([$nom]);

$entrepriseExiste = $stmt->fetch(PDO::FETCH_ASSOC);


if ($entrepriseExiste) {

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "Cette entreprise existe déjà"
    ]);

    exit;
}


// ========================================
// INSÉRER L'ENTREPRISE
// ========================================

$sql = "
    INSERT INTO entreprises
    (
        nom,
        adresse,
        telephone,
        email,
        secteur
    )
    VALUES (?, ?, ?, ?, ?)
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $nom,
    $adresse,
    $telephone,
    $email,
    $secteur
]);


// ========================================
// RÉPONSE
// ========================================

http_response_code(201);

echo json_encode([

    "success" => true,

    "message" => "Entreprise ajoutée avec succès",

    "entreprise_id" => $pdo->lastInsertId()

]);
