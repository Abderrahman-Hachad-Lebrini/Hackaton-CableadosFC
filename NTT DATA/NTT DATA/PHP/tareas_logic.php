<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

// 1. Conexión a la base de datos
$conn = new mysqli("localhost", "root", "", "webacces_db");

if ($conn->connect_error) {
    die(json_encode(["success" => false, "error" => "Error de conexión"]));
}

$metodo = $_SERVER['REQUEST_METHOD'];

// --- OBTENER TAREAS (GET) ---
if ($metodo === 'GET') {
    $uid = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : 0;
    // Detectamos si la petición viene del tutor
    $esTutor = isset($_GET['rol']) && $_GET['rol'] === 'tutor';

    if ($uid === 0) {
        echo json_encode([]);
        exit;
    }

    if ($esTutor) {
        // El TUTOR necesita ver TODO para el tablero Kanban (Finalizadas, Pendientes y En curso)
        $sql = "SELECT * FROM tareas WHERE usuario_id = $uid ORDER BY id DESC";
    } else {
        // EL TRABAJADOR solo debe ver lo que NO está terminado (is_completed = 0)
        // Esto evita que las tareas finalizadas le sigan saliendo en su lista de "En curso"
        $sql = "SELECT * FROM tareas WHERE usuario_id = $uid AND is_completed = 0 ORDER BY id DESC";
    }
    
    $result = $conn->query($sql);
    $tareas = [];
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $tareas[] = $row;
        }
    }
    echo json_encode($tareas);
    $conn->close();
    exit; 
}

// --- CREAR TAREA (POST) ---
// En tareas_logic.php, sección POST:
if ($metodo === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $name = $conn->real_escape_string($data['name']);
    $descripcion = $conn->real_escape_string($data['descripcion']);
    $usuario_id = intval($data['usuario_id']);

    // Insertamos con los campos exactos de tu imagen
    $sql = "INSERT INTO tareas (name, descripcion, usuario_id, status, is_completed, startTime, finalTime) 
            VALUES ('$name', '$descripcion', $usuario_id, 'Pendiente', 0, '00:00:00', '00:00:00')";

    if ($conn->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => $conn->error]);
    }
    exit;
}

// --- ACTUALIZAR TAREA (PUT) ---
if ($metodo === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $accion = $data['accion'];

    date_default_timezone_set('Europe/Madrid'); 
    $hora = date("H:i:s");
    $fecha = date("Y-m-d");

    if ($accion === 'iniciar') {
        $sql = "UPDATE tareas SET status='En curso', startTime='$hora' WHERE id=$id";
    } elseif ($accion === 'finalizar') {
        // Al finalizar, actualizamos status E is_completed para que desaparezca del inicio del trabajador
        $sql = "UPDATE tareas SET status='Finalizada', is_completed=1, finalTime='$hora', dateFinished='$fecha' WHERE id=$id";
    }

    if (isset($sql) && $conn->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => $conn->error]);
    }
    $conn->close();
    exit;
}

// --- ELIMINAR TAREA (DELETE) ---
if ($metodo === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $sql = "DELETE FROM tareas WHERE id=$id";
    if ($conn->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false]);
    }
    $conn->close();
    exit;
}

$conn->close();
?>