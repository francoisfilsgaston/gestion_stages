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
// RÉCUPÉRER LES ENCADREURS
// ========================================

$sql = "
    SELECT
        id,
        nom,
        prenom,
        telephone,
        email,
        fonction,
        date_creation

    FROM encadreurs

    ORDER BY nom ASC, prenom ASC
";


$stmt = $pdo->query($sql);

$encadreurs = $stmt->fetchAll(PDO::FETCH_ASSOC);


// ========================================
// RÉPONSE
// ========================================

echo json_encode([

    "success" => true,

    "data" => $encadreurs

]);
