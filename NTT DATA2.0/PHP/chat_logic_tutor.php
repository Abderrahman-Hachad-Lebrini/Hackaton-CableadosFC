<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$conn = new mysqli("localhost", "root", "", "webacces_db");

if ($conn->connect_error) {
    echo json_encode(["error" => "Error de conexión"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Intentamos capturar el ID del trabajador de todas las formas posibles
    $trabajador_id = 0;
    if (isset($_GET['trabajador_id'])) {
        $trabajador_id = intval($_GET['trabajador_id']);
    } elseif (isset($_GET['receptor'])) {
        $trabajador_id = intval($_GET['receptor']);
    }

    if ($trabajador_id > 0) {
        // Buscamos todos los mensajes donde ese trabajador específico sea el emisor o el receptor
        $sql = "SELECT * FROM chat_mensajes 
                WHERE emisor_id = $trabajador_id OR receptor_id = $trabajador_id 
                ORDER BY fecha_envio ASC";
                
        $result = $conn->query($sql);
        $mensajes = [];
        while($row = $result->fetch_assoc()) {
            $mensajes[] = $row;
        }
        echo json_encode($mensajes);
    } else {
        // Si llega aquí es que el JS no está enviando el ID correctamente
        echo json_encode(["error" => "ID de trabajador no recibido o es 0"]);
    }

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $emisor = intval($data['emisor_id']);
    $receptor = intval($data['receptor_id']);
    $msg = $conn->real_escape_string($data['mensaje']);

    $sql = "INSERT INTO chat_mensajes (emisor_id, receptor_id, mensaje) VALUES ($emisor, $receptor, '$msg')";
    echo json_encode(["success" => $conn->query($sql)]);
}
$conn->close();
?>