<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
// Evitamos que errores de PHP ensucien la respuesta JSON
error_reporting(0); 

$conn = new mysqli("localhost", "root", "", "webacces_db");

if ($conn->connect_error) {
    echo json_encode(["error" => "Conexión fallida: " . $conn->connect_error]);
    exit;
}

// Acción para obtener la lista de trabajadores con la nueva información
if (isset($_GET['action']) && $_GET['action'] == 'get_workers') {
    
    // Añadimos 'nombre_completo' y 'empresa' a la selección
    $sql = "SELECT id, nombre, nombre_completo, empresa FROM usuarios WHERE rol = 'trabajador'";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        echo json_encode(["error" => "Error en la consulta: " . $conn->error]);
        exit;
    }
    
    $workers = [];
    while($row = $result->fetch_assoc()) {
        $workers[] = [
            "id" => $row['id'],
            "nombre" => $row['nombre'], // El login/usuario
            "nombre_completo" => $row['nombre_completo'] ?? 'Sin nombre',
            "empresa" => $row['empresa'] ?? 'Sin empresa'
        ];
    }
    
    echo json_encode($workers);
    exit;
}

$conn->close();
?>