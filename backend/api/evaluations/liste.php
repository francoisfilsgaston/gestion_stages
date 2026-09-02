<?php

require_once "../../config/cors.php";
require_once "../../config/auth.php";
require_once "../../config/db.php";

header("Content-Type: application/json; charset=UTF-8");

// Vérifier le rôle
if ($authUser["role"] !== "admin") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Accès réservé à l'administrateur"
    ]);

    exit;
}

try {

    $sql = "
        SELECT
            ev.id,
            ev.stage_id,
            s.etudiant_id,
            s.sujet,
            s.date_debut,
            s.date_fin,
            s.statut AS stage_statut,

            e.id AS entreprise_id,
            e.nom AS entreprise_nom,

            en.id AS encadreur_id,
            CONCAT(en.nom, ' ', en.prenom) AS encadreur_nom,

            ev.note,
            ev.appreciation,
            ev.date_evaluation

        FROM evaluations ev

        INNER JOIN stages s
            ON s.id = ev.stage_id

        INNER JOIN entreprises e
            ON e.id = s.entreprise_id

        INNER JOIN encadreurs en
            ON en.id = s.encadreur_id

        ORDER BY ev.date_evaluation DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => $evaluations
    ]);
} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Erreur serveur lors de la récupération des évaluations"
    ]);
}
