<?php
header("Content-Type: application/json; charset=utf-8");
$conn = new mysqli("localhost", "root", "", "webacces_db");

// Si no recibe usuario_id, intentamos usar el 6 (el de tu captura)
$uid = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : 6;

// IMPORTANTE: Buscamos donde is_completed sea 1
$sql = "SELECT * FROM tareas WHERE usuario_id = $uid AND is_completed = 1 ORDER BY id DESC";
$result = $conn->query($sql);

$tareas = [];
while($row = $result->fetch_assoc()) {
    $tareas[] = $row;
}

echo json_encode($tareas); // Si esto devuelve [], es que no hay tareas con is_completed = 1
$conn->close();
?>