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
// RÉCUPÉRER LES STAGES
// ========================================

$sql = "
    SELECT

        s.id,

        s.etudiant_id,

        s.entreprise_id,
        e.nom AS entreprise_nom,

        s.encadreur_id,
        CONCAT(
            en.nom,
            ' ',
            en.prenom
        ) AS encadreur_nom,

        s.sujet,
        s.date_debut,
        s.date_fin,
        s.statut,
        s.date_creation

    FROM stages s

    INNER JOIN entreprises e
        ON e.id = s.entreprise_id

    INNER JOIN encadreurs en
        ON en.id = s.encadreur_id

    ORDER BY s.date_creation DESC
";


$stmt = $pdo->query($sql);

$stages = $stmt->fetchAll(PDO::FETCH_ASSOC);


// ========================================
// RÉPONSE
// ========================================

echo json_encode([

    "success" => true,

    "data" => $stages

]);
