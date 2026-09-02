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
// RÉCUPÉRER LES ENTREPRISES
// ========================================

$sql = "
    SELECT
        id,
        nom,
        adresse,
        telephone,
        email,
        secteur,
        date_creation

    FROM entreprises

    ORDER BY nom ASC
";

$stmt = $pdo->query($sql);

$entreprises = $stmt->fetchAll(PDO::FETCH_ASSOC);


// ========================================
// RÉPONSE
// ========================================

echo json_encode([

    "success" => true,

    "data" => $entreprises

]);
