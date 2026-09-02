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

// Récupérer l'ID
$id = $_GET["id"] ?? null;

if (!$id || !filter_var($id, FILTER_VALIDATE_INT)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID de l'évaluation invalide"
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

    // Supprimer l'évaluation
    $sql = "
        DELETE FROM evaluations
        WHERE id = ?
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);

    echo json_encode([
        "success" => true,
        "message" => "Évaluation supprimée avec succès"
    ]);
} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Erreur serveur lors de la suppression de l'évaluation"
    ]);
}
