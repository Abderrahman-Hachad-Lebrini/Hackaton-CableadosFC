const IP_SERVIDOR = "52.4.65.168";
const NOMBRE_PROYECTO = "dashboard";

const urlRegistro = `http://${IP_SERVIDOR}/${encodeURIComponent(NOMBRE_PROYECTO)}/PHP/usuarios_logic.php`;

document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroForm');
    const mensaje = document.getElementById('mensaje');

    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Captura de todos los campos
            const nombre = document.getElementById('regNombre').value;
            const nombre_completo = document.getElementById('regNombreCompleto').value;
            const password = document.getElementById('regPass').value;
            const rol = document.getElementById('regRol').value;
            const empresa = document.getElementById('regEmpresa').value;

            mensaje.innerText = "Guardando...";
            mensaje.style.color = "black";

            try {
                const res = await fetch(urlRegistro, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        nombre, 
                        nombre_completo, 
                        password, 
                        rol, 
                        empresa 
                    }),
                    mode: 'cors'
                });

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
                mensaje.innerText = "❌ Error de conexión o respuesta inválida";
                mensaje.style.color = "red";
            }
        });
    }
});