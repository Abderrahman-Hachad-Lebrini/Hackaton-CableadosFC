<?php
// Asegúrate de que NO haya ni un espacio antes de esta etiqueta <?php
ob_start();

// 1. Conexión a la base de datos
$host = "localhost";
$user = "root"; 
$pass = "";     
$db   = "webacces_db";

$conexion = mysqli_connect($host, $user, $pass, $db);
mysqli_set_charset($conexion, "utf8");

// 2. Obtener el ID del trabajador consultado
$idTrabajador = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($idTrabajador > 0) {
    // Limpiamos cualquier salida previa del sistema
    if (ob_get_length()) ob_clean();

    // 3. Cabeceras para que el navegador entienda que es un ARCHIVO de datos
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=Tareas_Trabajador_' . $idTrabajador . '.csv');

    // 4. Abrir la salida de PHP como si fuera un archivo
    $archivo = fopen('php://output', 'w');

    // Añadir el BOM UTF-8 para que Excel reconozca eñes y acentos automáticamente
    fprintf($archivo, chr(0xEF).chr(0xBB).chr(0xBF));

    // 5. Definir los encabezados de las columnas (como están en tu phpMyAdmin)
    fputcsv($archivo, array('ID', 'Nombre Tarea', 'Descripcion', 'Estado', 'Fecha Finalizado', 'Hora Inicio', 'Hora Fin'), ';');

    // 6. Consultar los datos del trabajador específico
    $query = "SELECT id, name, descripcion, status, dateFinished, startTime, finalTime 
              FROM tareas 
              WHERE usuario_id = $idTrabajador";
    $result = mysqli_query($conexion, $query);

    // 7. Volcar los datos de la base de datos al archivo
    while ($fila = mysqli_fetch_assoc($result)) {
        fputcsv($archivo, array(
            $fila['id'],
            $fila['name'],
            $fila['descripcion'],
            $fila['status'],
            $fila['dateFinished'] ?: 'No finalizada',
            $fila['startTime'],
            $fila['finalTime']
        ), ';');
    }

    fclose($archivo);
    ob_end_flush();
    exit;

} else {
    echo "Error: ID de trabajador no recibido.";
}
?>