<?php

require_once "../../config/cors.php";
require_once "../../config/db.php";
require_once "../../config/integration.php";


/*
|--------------------------------------------------------------------------
| Vérification de la clé API
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Récupération des évaluations
|--------------------------------------------------------------------------
|
| On récupère :
| - informations de l'évaluation
| - stage
| - entreprise
| - encadreur
|
| L'étudiant reste identifié par etudiant_id.
| Ses informations personnelles seront récupérées
| par l'Application 1 depuis sa propre base.
|
|--------------------------------------------------------------------------
*/

try {

    $sql = "
        SELECT
            ev.id,
            ev.stage_id,
            ev.note,
            ev.appreciation,
            ev.date_evaluation,

            s.etudiant_id,
            s.sujet,
            s.date_debut,
            s.date_fin,
            s.statut AS stage_statut,

            e.id AS entreprise_id,
            e.nom AS entreprise_nom,

            en.id AS encadreur_id,
            en.nom AS encadreur_nom,
            en.prenom AS encadreur_prenom

        FROM evaluations ev

        INNER JOIN stages s
            ON s.id = ev.stage_id

        INNER JOIN entreprises e
            ON e.id = s.entreprise_id

        INNER JOIN encadreurs en
            ON en.id = s.encadreur_id

        ORDER BY ev.date_evaluation DESC
    ";


    $stmt = $pdo->query($sql);

    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);


    /*
    |--------------------------------------------------------------------------
    | Réponse
    |--------------------------------------------------------------------------
    */

    echo json_encode([
        "success" => true,
        "data" => $evaluations
    ]);
} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Erreur lors de la récupération des évaluations"
    ]);
}
