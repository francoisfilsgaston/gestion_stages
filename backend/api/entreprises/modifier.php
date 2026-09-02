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
// RÉCUPÉRER L'ID
// ========================================

$id = $_GET["id"] ?? null;


if (!$id || !filter_var($id, FILTER_VALIDATE_INT)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID d'entreprise invalide"
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
    WHERE id = ?
    LIMIT 1
";

$stmt = $pdo->prepare($sql);

$stmt->execute([$id]);

$entreprise = $stmt->fetch(PDO::FETCH_ASSOC);


if (!$entreprise) {

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Entreprise introuvable"
    ]);

    exit;
}


// ========================================
// VÉRIFIER LE DOUBLON
// ========================================

$sql = "
    SELECT id
    FROM entreprises
    WHERE nom = ?
    AND id != ?
    LIMIT 1
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $nom,
    $id
]);


if ($stmt->fetch(PDO::FETCH_ASSOC)) {

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "Une autre entreprise porte déjà ce nom"
    ]);

    exit;
}


// ========================================
// MODIFIER L'ENTREPRISE
// ========================================

$sql = "
    UPDATE entreprises

    SET
        nom = ?,
        adresse = ?,
        telephone = ?,
        email = ?,
        secteur = ?

    WHERE id = ?
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $nom,
    $adresse,
    $telephone,
    $email,
    $secteur,
    $id
]);


// ========================================
// RÉPONSE
// ========================================

echo json_encode([

    "success" => true,

    "message" => "Entreprise modifiée avec succès"

]);
