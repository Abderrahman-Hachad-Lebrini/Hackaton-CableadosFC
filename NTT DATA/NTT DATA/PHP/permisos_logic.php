<?php
header("Content-Type: application/json");
$conn = new mysqli("localhost", "root", "", "webacces_db");

$metodo = $_SERVER['REQUEST_METHOD'];

// CONSULTAR PERMISO (GET)
if ($metodo === 'GET') {
    $id = $_GET['id'];
    $res = $conn->query("SELECT nombre, permiso_crear FROM usuarios WHERE id = $id");
    echo json_encode($res->fetch_assoc());
}

// CAMBIAR PERMISO (POST)
if ($metodo === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    $permiso = $data['permiso']; // 0 o 1

    $sql = "UPDATE usuarios SET permiso_crear = $permiso WHERE id = $id";
    if ($conn->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false]);
    }
}
$conn->close();
?>