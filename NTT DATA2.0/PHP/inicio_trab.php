<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
error_reporting(0); // Para que no se cuele ningún texto raro en el JSON

$conn = new mysqli("localhost", "root", "", "webacces_db");

if ($conn->connect_error) {
    echo json_encode(["error" => "Conexión fallida"]);
    exit;
}

// Acción para obtener la lista de trabajadores
if (isset($_GET['action']) && $_GET['action'] == 'get_workers') {
    // IMPORTANTE: El rol debe ser 'trabajador' en tu tabla usuarios
    $sql = "SELECT id, nombre FROM usuarios WHERE rol = 'trabajador'";
    $result = $conn->query($sql);
    
    $workers = [];
    while($row = $result->fetch_assoc()) {
        $workers[] = $row;
    }
    echo json_encode($workers);
    exit;
}
$conn->close();