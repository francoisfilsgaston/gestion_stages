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


if (
    !$id ||
    !filter_var($id, FILTER_VALIDATE_INT)
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID d'entreprise invalide"
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
// VÉRIFIER SI L'ENTREPRISE EST UTILISÉE
// ========================================

$sql = "
    SELECT COUNT(*) AS total
    FROM stages
    WHERE entreprise_id = ?
";

$stmt = $pdo->prepare($sql);

$stmt->execute([$id]);

$result = $stmt->fetch(PDO::FETCH_ASSOC);


// ========================================
// EMPÊCHER LA SUPPRESSION SI DES STAGES EXISTENT
// ========================================

if ((int)$result["total"] > 0) {

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "Impossible de supprimer cette entreprise car elle possède des stages"
    ]);

    exit;
}


// ========================================
// SUPPRESSION
// ========================================

$sql = "
    DELETE FROM entreprises
    WHERE id = ?
";

$stmt = $pdo->prepare($sql);

$stmt->execute([$id]);


// ========================================
// RÉPONSE
// ========================================

echo json_encode([

    "success" => true,

    "message" => "Entreprise supprimée avec succès"

]);
