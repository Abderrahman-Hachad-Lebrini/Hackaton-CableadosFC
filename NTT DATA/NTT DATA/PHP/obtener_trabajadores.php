<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

// Datos de conexión
$conn = new mysqli("localhost", "root", "", "webacces_db");

if ($conn->connect_error) {
    echo json_encode(["error" => "Conexión fallida"]);
    exit;
}

// Seleccionamos las nuevas columnas: nombre_completo y empresa
$sql = "SELECT id, nombre, nombre_completo, empresa FROM usuarios WHERE rol = 'trabajador'";
$result = $conn->query($sql);

$trabajadores = [];
if ($result) {
    while($row = $result->fetch_assoc()) {
        // Aseguramos que si están vacíos, devuelvan un texto coherente
        $row['nombre_completo'] = $row['nombre_completo'] ?? 'Sin nombre registrado';
        $row['empresa'] = $row['empresa'] ?? 'Sin empresa';
        $trabajadores[] = $row;
    }
}

echo json_encode($trabajadores);
$conn->close();
?>