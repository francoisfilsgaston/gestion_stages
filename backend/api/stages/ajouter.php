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
// RÉCUPÉRER LES CHAMPS
// ========================================

$etudiantId = $data["etudiant_id"] ?? null;
$entrepriseId = $data["entreprise_id"] ?? null;
$encadreurId = $data["encadreur_id"] ?? null;

$sujet = trim($data["sujet"] ?? "");

$dateDebut = trim($data["date_debut"] ?? "");
$dateFin = trim($data["date_fin"] ?? "");

$statut = trim($data["statut"] ?? "en cours");


// ========================================
// VÉRIFIER LES CHAMPS OBLIGATOIRES
// ========================================

if (
    !$etudiantId ||
    !$entrepriseId ||
    !$encadreurId ||
    $sujet === "" ||
    $dateDebut === "" ||
    $dateFin === ""
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Étudiant, entreprise, encadreur, sujet et dates sont obligatoires"
    ]);

    exit;
}


// ========================================
// VÉRIFIER LES ID
// ========================================

if (!filter_var($etudiantId, FILTER_VALIDATE_INT)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID étudiant invalide"
    ]);

    exit;
}


if (!filter_var($entrepriseId, FILTER_VALIDATE_INT)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID entreprise invalide"
    ]);

    exit;
}


if (!filter_var($encadreurId, FILTER_VALIDATE_INT)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID encadreur invalide"
    ]);

    exit;
}


// ========================================
// VÉRIFIER LES DATES
// ========================================

$dateDebutObj = DateTime::createFromFormat(
    "Y-m-d",
    $dateDebut
);

$dateFinObj = DateTime::createFromFormat(
    "Y-m-d",
    $dateFin
);


if (
    !$dateDebutObj ||
    $dateDebutObj->format("Y-m-d") !== $dateDebut
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Date de début invalide"
    ]);

    exit;
}


if (
    !$dateFinObj ||
    $dateFinObj->format("Y-m-d") !== $dateFin
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Date de fin invalide"
    ]);

    exit;
}


// ========================================
// VÉRIFIER L'ORDRE DES DATES
// ========================================

if ($dateFinObj < $dateDebutObj) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "La date de fin doit être après la date de début"
    ]);

    exit;
}


// ========================================
// VÉRIFIER L'ENTREPRISE
// ========================================

$sql = "
    SELECT id
    FROM entreprises
    WHERE id = ?
    LIMIT 1
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $entrepriseId
]);


if (!$stmt->fetch()) {

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Entreprise introuvable"
    ]);

    exit;
}


// ========================================
// VÉRIFIER L'ENCADREUR
// ========================================

$sql = "
    SELECT id
    FROM encadreurs
    WHERE id = ?
    LIMIT 1
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $encadreurId
]);


if (!$stmt->fetch()) {

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Encadreur introuvable"
    ]);

    exit;
}


// ========================================
// VÉRIFIER SI L'ÉTUDIANT A DÉJÀ UN STAGE
// ========================================

$sql = "
    SELECT id
    FROM stages
    WHERE etudiant_id = ?
    AND statut != 'terminé'
    LIMIT 1
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $etudiantId
]);


if ($stmt->fetch()) {

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "Cet étudiant possède déjà un stage en cours"
    ]);

    exit;
}


// ========================================
// INSERTION
// ========================================

$sql = "
    INSERT INTO stages
    (
        etudiant_id,
        entreprise_id,
        encadreur_id,
        sujet,
        date_debut,
        date_fin,
        statut
    )

    VALUES (?, ?, ?, ?, ?, ?, ?)
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $etudiantId,
    $entrepriseId,
    $encadreurId,
    $sujet,
    $dateDebut,
    $dateFin,
    $statut
]);


// ========================================
// RÉPONSE
// ========================================

http_response_code(201);

echo json_encode([

    "success" => true,

    "message" => "Stage ajouté avec succès",

    "stage_id" => $pdo->lastInsertId()

]);
