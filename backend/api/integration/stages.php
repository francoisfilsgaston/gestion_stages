<?php

require_once "../../config/cors.php";
require_once "../../config/db.php";
require_once "../../config/integration.php";


$headers = function_exists("getallheaders")
    ? getallheaders()
    : [];

$apiKey = null;

foreach ($headers as $name => $value) {

    if (strtolower($name) === "x-api-key") {
        $apiKey = trim($value);
        break;
    }
}

if ($apiKey === null && isset($_SERVER["HTTP_X_API_KEY"])) {
    $apiKey = trim($_SERVER["HTTP_X_API_KEY"]);
}


if ($apiKey === null || $apiKey === "") {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Clé API manquante"
    ]);

    exit;
}


if (!hash_equals(API_KEY_UNIVERSITAIRE, $apiKey)) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Clé API invalide"
    ]);

    exit;
}


try {

    $sql = "
        SELECT
            s.id,
            s.etudiant_id,

            s.entreprise_id,
            e.nom AS entreprise_nom,

            s.encadreur_id,
            en.nom AS encadreur_nom,
            en.prenom AS encadreur_prenom,

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

        ORDER BY s.id DESC
    ";


    $stmt = $pdo->query($sql);

    $stages = $stmt->fetchAll(PDO::FETCH_ASSOC);


    echo json_encode([
        "success" => true,
        "data" => $stages
    ]);
} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Erreur lors de la récupération des stages"
    ]);
}
