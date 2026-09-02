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
// VÉRIFIER LES ÉVALUATIONS
// ========================================

$sql = "
    SELECT COUNT(*) AS total
    FROM evaluations
    WHERE stage_id = ?
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $id
]);

$result = $stmt->fetch(PDO::FETCH_ASSOC);


// ========================================
// EMPÊCHER LA SUPPRESSION SI ÉVALUATIONS
// ========================================

if ((int)$result["total"] > 0) {

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "Impossible de supprimer ce stage car il possède des évaluations"
    ]);

    exit;
}


// ========================================
// SUPPRESSION
// ========================================

$sql = "
    DELETE FROM stages
    WHERE id = ?
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $id
]);


// ========================================
// RÉPONSE
// ========================================

echo json_encode([

    "success" => true,

    "message" => "Stage supprimé avec succès"

]);
