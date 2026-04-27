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

// Validación básica de campos obligatorios
if (!empty($input['nombre']) && !empty($input['password']) && !empty($input['nombre_completo'])) {
    
    // Escapar datos para evitar Inyección SQL básica
    $u  = $conn->real_escape_string($input['nombre']);
    $nc = $conn->real_escape_string($input['nombre_completo']);
    $p  = $conn->real_escape_string($input['password']);
    $r  = $conn->real_escape_string($input['rol']);
    $e  = $conn->real_escape_string($input['empresa']);

    // INSERT con las 5 columnas correspondientes
    $sql = "INSERT INTO usuarios (nombre, nombre_completo, password, rol, empresa) 
            VALUES ('$u', '$nc', '$p', '$r', '$e')";

    if ($conn->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Error SQL: " . $conn->error]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
}

$conn->close();
?>