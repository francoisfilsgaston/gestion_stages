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

// Récupérer l'ID de l'évaluation
$id = $_GET["id"] ?? null;

if (!$id || !filter_var($id, FILTER_VALIDATE_INT)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID de l'évaluation invalide"
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

$stageId = $data["stage_id"] ?? null;
$note = $data["note"] ?? null;
$appreciation = trim($data["appreciation"] ?? "");

// Vérifier les champs obligatoires
if (!$stageId || $note === null) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Le stage et la note sont obligatoires"
    ]);

    exit;
}

// Vérifier stage_id
if (!filter_var($stageId, FILTER_VALIDATE_INT)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID du stage invalide"
    ]);

    exit;
}

// Vérifier la note
if (!is_numeric($note)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "La note doit être numérique"
    ]);

    exit;
}

$note = (float) $note;

// Vérifier la note entre 0 et 20
if ($note < 0 || $note > 20) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "La note doit être comprise entre 0 et 20"
    ]);

    exit;
}

try {

    // Vérifier que l'évaluation existe
    $sql = "
        SELECT id
        FROM evaluations
        WHERE id = ?
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);

    if (!$stmt->fetch()) {
        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Évaluation introuvable"
        ]);

        exit;
    }

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

    // Vérifier qu'un autre stage n'a pas déjà cette évaluation
    $sql = "
        SELECT id
        FROM evaluations
        WHERE stage_id = ?
        AND id != ?
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$stageId, $id]);

    if ($stmt->fetch()) {
        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "Ce stage possède déjà une autre évaluation"
        ]);

        exit;
    }

    // Modifier l'évaluation
    $sql = "
        UPDATE evaluations
        SET
            stage_id = ?,
            note = ?,
            appreciation = ?
        WHERE id = ?
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        $stageId,
        $note,
        $appreciation !== "" ? $appreciation : null,
        $id
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Évaluation modifiée avec succès"
    ]);
} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Erreur serveur lors de la modification de l'évaluation"
    ]);
}
