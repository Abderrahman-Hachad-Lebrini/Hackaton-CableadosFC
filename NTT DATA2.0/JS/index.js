const IP_SERVIDOR = "192.168.2.30";
const NOMBRE_PROYECTO = "NTT DATA";
let modoRegistro = false; 

const urlBase = `http://${IP_SERVIDOR}/${encodeURIComponent(NOMBRE_PROYECTO)}`;

/**
 * Cambia la interfaz al modo de validación exclusivo para el Administrador
 */
window.prepararRegistro = function() {
    modoRegistro = true;
    
    // Cambios visuales para indicar que se requiere perfil Admin
    document.getElementById('loginTitle').innerText = "Validación de Administrador";
    document.getElementById('btnSubmit').innerText = "Validar y Gestionar Altas";
    
    // Gestión de visibilidad de botones
    document.getElementById('seccionTutor').style.display = 'none';
    document.getElementById('btnVolver').style.display = 'block';

    // Limpieza y enfoque
    document.getElementById('loginForm').reset();
    document.getElementById('user').focus();
};

/**
 * Restablece la interfaz al modo de inicio de sesión estándar
 */
window.resetearVista = function() {
    modoRegistro = false;
    
    document.getElementById('loginTitle').innerText = "Iniciar Sesión";
    document.getElementById('btnSubmit').innerText = "Entrar";
    
    document.getElementById('seccionTutor').style.display = 'block';
    document.getElementById('btnVolver').style.display = 'none';

    document.getElementById('loginForm').reset();
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const vUser = document.getElementById('user').value;
        const vPass = document.getElementById('pass').value;

        // Construcción de la URL de consulta
        const urlLogin = `${urlBase}/PHP/login_check.php?nombre=${encodeURIComponent(vUser)}&password=${encodeURIComponent(vPass)}`;

        try {
            const res = await fetch(urlLogin, { method: 'GET', mode: 'cors' });
            if (!res.ok) throw new Error("Error en la respuesta del servidor");

            const data = await res.json();

            if (data.id) {
                // Almacenamiento local de la sesión para uso posterior
                localStorage.setItem('usuario_id', data.id);
                localStorage.setItem('usuario_rol', data.rol);

                // --- LÓGICA DE ACCESO RESTRINGIDO ---

                if (modoRegistro) {
                    // ÚNICAMENTE permitimos el acceso a registro si el rol es 'admin'
                    if (data.rol === 'admin') {
                        window.location.href = `${urlBase}/HTML/usuarios/registro.html`;
                    } else {
                        alert("Acceso denegado: Se requieren permisos de Administrador para realizar registros.");
                        resetearVista();
                    }
                } else {
                    // Redirección normal según el rol
                    if (data.rol === 'admin' || data.rol === 'tutor') {
                        // Ambos perfiles de gestión van al panel de tutor/inicio
                        window.location.href = `${urlBase}/HTML/tutor/inicio.html`;
                    } else {
                        // El perfil trabajador va a su panel específico
                        window.location.href = `${urlBase}/HTML/trabajador/inicio.html`;
                    }
                }
            } else {
                alert("Usuario o contraseña incorrectos. Inténtelo de nuevo.");
            }
        } catch (error) {
            console.error("Error en la petición Fetch:", error);
            alert("No se ha podido conectar con el servidor. Verifique la red local.");
        }
    });
});