<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200);
    exit; 
}

$conn = new mysqli("localhost", "root", "", "webacces_db");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Error de conexión: " . $conn->connect_error]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// --- OBTENER MENSAJES ---
if ($method === 'GET') {
    $mi_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : 0;

    if ($mi_id > 0) {
        $sql = "SELECT id, emisor_id, receptor_id, mensaje, fecha_envio 
                FROM chat_mensajes 
                WHERE emisor_id = $mi_id OR receptor_id = $mi_id 
                ORDER BY fecha_envio ASC";
                
        $result = $conn->query($sql);
        $mensajes = [];
        
        if ($result) {
            while($row = $result->fetch_assoc()) {
                $mensajes[] = $row;
            }
            echo json_encode($mensajes);
        } else {
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
    } else {
        echo json_encode(["error" => "ID de usuario no válido"]);
    }

// --- ENVIAR MENSAJE ---
} elseif ($method === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data) {
        echo json_encode(["success" => false, "error" => "No se recibieron datos JSON"]);
        exit;
    }

    $emisor   = intval($data['emisor_id']);
    $receptor = isset($data['receptor_id']) ? intval($data['receptor_id']) : 5; 
    $msg      = isset($data['mensaje']) ? $conn->real_escape_string($data['mensaje']) : '';

    if (!empty($msg) && $emisor > 0) {
        // Importante: Añadimos NOW() para la fecha si no es automática en la BD
        $sql = "INSERT INTO chat_mensajes (emisor_id, receptor_id, mensaje, fecha_envio) 
                VALUES ($emisor, $receptor, '$msg', NOW())";
        
        if ($conn->query($sql)) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "Mensaje vacío o ID emisor inválido"]);
    }
}

$conn->close();
?>