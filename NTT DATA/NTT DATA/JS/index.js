const IP_SERVIDOR = "52.4.65.168";
const NOMBRE_PROYECTO = "dashboard";
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
                    switch (data.rol) {
                        case 'admin':
                            window.location.href = `${urlBase}/HTML/empresa/inicio.html`;
                            break;
                        case 'tutor':
                            // Perfiles de gestión administrativa
                            window.location.href = `${urlBase}/HTML/tutor/inicio.html`;
                            break;

                        case 'empresa':
                            // Redirección específica para el nuevo rol Empresa
                            window.location.href = `${urlBase}/HTML/empresa/tareas.html`;
                            break;

                        case 'trabajador':
                            // Perfil de trabajador estándar
                            window.location.href = `${urlBase}/HTML/trabajador/inicio.html`;
                            break;

                        default:
                            alert("Rol no reconocido. Contacte con el administrador.");
                            break;
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