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
// RÉCUPÉRER L'ID DU STAGE
// ========================================

$id = $_GET["id"] ?? null;


if (
    !$id ||
    !filter_var($id, FILTER_VALIDATE_INT)
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID de stage invalide"
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
// VÉRIFIER LES CHAMPS
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
// VÉRIFIER SI LE STAGE EXISTE
// ========================================

$sql = "
    SELECT id
    FROM stages
    WHERE id = ?
    LIMIT 1
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $id
]);


if (!$stmt->fetch()) {

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Stage introuvable"
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
// VÉRIFIER SI L'ÉTUDIANT A UN AUTRE STAGE
// ========================================

$sql = "
    SELECT id
    FROM stages
    WHERE etudiant_id = ?
    AND statut != 'terminé'
    AND id != ?
    LIMIT 1
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $etudiantId,
    $id
]);


if ($stmt->fetch()) {

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "Cet étudiant possède déjà un autre stage en cours"
    ]);

    exit;
}


// ========================================
// MODIFICATION
// ========================================

$sql = "
    UPDATE stages

    SET
        etudiant_id = ?,
        entreprise_id = ?,
        encadreur_id = ?,
        sujet = ?,
        date_debut = ?,
        date_fin = ?,
        statut = ?

    WHERE id = ?
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $etudiantId,
    $entrepriseId,
    $encadreurId,
    $sujet,
    $dateDebut,
    $dateFin,
    $statut,
    $id
]);


// ========================================
// RÉPONSE
// ========================================

echo json_encode([

    "success" => true,

    "message" => "Stage modifié avec succès"

]);
