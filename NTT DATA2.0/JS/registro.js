const IP_SERVIDOR = "192.168.2.30";
const NOMBRE_PROYECTO = "NTT DATA";

const urlRegistro = `http://${IP_SERVIDOR}/${encodeURIComponent(NOMBRE_PROYECTO)}/PHP/usuarios_logic.php`;

document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroForm');
    const mensaje = document.getElementById('mensaje');

    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('regNombre').value;
            const password = document.getElementById('regPass').value;
            const rol = document.getElementById('regRol').value; // Asegúrate de que este ID sea correcto en tu HTML

            mensaje.innerText = "Guardando...";
            mensaje.style.color = "black";

            try {
                const res = await fetch(urlRegistro, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, password, rol }),
                    mode: 'cors'
                });

                // Si el PHP no devuelve un JSON válido, esto lanzará un error al catch
                const data = await res.json();

                if (data.success) {
                    mensaje.innerText = "✅ Usuario (" + rol + ") creado correctamente";
                    mensaje.style.color = "green";
                    registroForm.reset();
                } else {
                    mensaje.innerText = "❌ Error: " + (data.message || "No se pudo crear");
                    mensaje.style.color = "red";
                }
            } catch (error) {
                console.error("Detalle del error:", error);
                mensaje.innerText = "❌ Error de conexión o respuesta inválida del servidor";
                mensaje.style.color = "red";
            }
        });
    }
});