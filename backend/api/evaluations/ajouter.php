<?php

require_once "../../config/cors.php";
require_once "../../config/auth.php";
require_once "../../config/db.php";

header("Content-Type: application/json; charset=UTF-8");

// Vérifier que l'utilisateur est administrateur
if ($authUser["role"] !== "admin") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Accès réservé à l'administrateur"
    ]);

    exit;
}

// Récupérer les données JSON
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Données JSON invalides"
    ]);

    exit;
}

// Récupération des champs
$stageId = $data["stage_id"] ?? null;
$note = $data["note"] ?? null;
$appreciation = trim($data["appreciation"] ?? "");

// Vérification des champs obligatoires
if (!$stageId || $note === null) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Le stage et la note sont obligatoires"
    ]);

    exit;
}

// Vérifier que stage_id est un entier
if (!filter_var($stageId, FILTER_VALIDATE_INT)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID du stage invalide"
    ]);

    exit;
}

// Vérifier que la note est numérique
if (!is_numeric($note)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "La note doit être numérique"
    ]);

    exit;
}

$note = (float) $note;

// Vérifier la plage de la note
if ($note < 0 || $note > 20) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "La note doit être comprise entre 0 et 20"
    ]);

    exit;
}

try {

    // Vérifier que le stage existe
    $sql = "
        SELECT id
        FROM stages
        WHERE id = ?
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$stageId]);

    if (!$stmt->fetch()) {
        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Stage introuvable"
        ]);

        exit;
    }

    // Vérifier si le stage possède déjà une évaluation
    $sql = "
        SELECT id
        FROM evaluations
        WHERE stage_id = ?
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$stageId]);

    if ($stmt->fetch()) {
        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "Ce stage possède déjà une évaluation"
        ]);

        exit;
    }

    // Ajouter l'évaluation
    $sql = "
        INSERT INTO evaluations (
            stage_id,
            note,
            appreciation
        )
        VALUES (?, ?, ?)
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        $stageId,
        $note,
        $appreciation !== "" ? $appreciation : null
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Évaluation ajoutée avec succès",
        "evaluation_id" => $pdo->lastInsertId()
    ]);
} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Erreur serveur lors de l'ajout de l'évaluation"
    ]);
}
