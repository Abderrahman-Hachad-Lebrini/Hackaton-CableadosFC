<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// Conexión
$conn = new mysqli("localhost", "root", "", "webacces_db");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Error conexión BD"]);
    exit;
}

// Leer JSON
$input = json_decode(file_get_contents('php://input'), true);

if (!empty($input['nombre']) && !empty($input['password'])) {
    $u = $conn->real_escape_string($input['nombre']);
    $p = $conn->real_escape_string($input['password']);
    $r = $conn->real_escape_string($input['rol']);

    // INSERT en tu tabla usuarios
    $sql = "INSERT INTO usuarios (nombre, password, rol) VALUES ('$u', '$p', '$r')";

    if ($conn->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => $conn->error]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
}

$conn->close();
?>