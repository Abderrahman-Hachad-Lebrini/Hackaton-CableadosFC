<?php
ob_clean();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost"; $user = "root"; $pass = ""; $db = "webacces_db";
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Error de conexión"]);
    exit;
}

$nombre = $_REQUEST['nombre'] ?? '';
$password = $_REQUEST['password'] ?? '';

if (empty($nombre) || empty($password)) {
    echo json_encode(["success" => false, "error" => "Campos vacíos"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, nombre, rol, password FROM usuarios WHERE nombre = ?");
$stmt->bind_param("s", $nombre);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if ($user && $user['password'] === $password) {
    echo json_encode([
        "success" => true,
        "id" => $user['id'],
        "nombre" => $user['nombre'],
        "rol" => $user['rol']
    ]);
} else {
    echo json_encode(["success" => false, "error" => "Credenciales incorrectas"]);
}
$conn->close();
?>