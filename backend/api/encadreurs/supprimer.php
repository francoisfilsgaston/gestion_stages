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
        "message" => "ID d'encadreur invalide"
    ]);

    exit;
}


// ========================================
// VÉRIFIER SI L'ENCADREUR EXISTE
// ========================================

$sql = "
    SELECT id
    FROM encadreurs
    WHERE id = ?
    LIMIT 1
";

$stmt = $pdo->prepare($sql);

$stmt->execute([$id]);

$encadreur = $stmt->fetch(PDO::FETCH_ASSOC);


if (!$encadreur) {

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Encadreur introuvable"
    ]);

    exit;
}


// ========================================
// VÉRIFIER SI L'ENCADREUR EST UTILISÉ
// ========================================

$sql = "
    SELECT COUNT(*) AS total
    FROM stages
    WHERE encadreur_id = ?
";

$stmt = $pdo->prepare($sql);

$stmt->execute([$id]);

$result = $stmt->fetch(PDO::FETCH_ASSOC);


// ========================================
// EMPÊCHER LA SUPPRESSION
// ========================================

if ((int)$result["total"] > 0) {

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "Impossible de supprimer cet encadreur car il est associé à un ou plusieurs stages"
    ]);

    exit;
}


// ========================================
// SUPPRESSION
// ========================================

$sql = "
    DELETE FROM encadreurs
    WHERE id = ?
";

$stmt = $pdo->prepare($sql);

$stmt->execute([$id]);


// ========================================
// RÉPONSE
// ========================================

echo json_encode([

    "success" => true,

    "message" => "Encadreur supprimé avec succès"

]);
