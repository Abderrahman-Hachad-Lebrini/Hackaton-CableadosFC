// --- 1. CONFIGURACIÓN DE RUTAS ---
const API_URL = '../../PHP/inicio_trab.php';
const CHAT_URL = '../../PHP/chat_logic_tutor.php';

// --- 2. FUNCIONES DE APOYO ---
function obtenerMiId() {
    return Number(localStorage.getItem('usuario_id')) || 5;
}

function formatearHora(fechaEnvio) {
    if (!fechaEnvio) return '--:--';
    try {
        return fechaEnvio.split(' ')[1].substring(0, 5);
    } catch (e) { return '--:--'; }
}

// --- 3. GESTIÓN DE TRABAJADORES (MODIFICADO) ---
async function cargarListaContactos() {
    const container = document.getElementById('listaContactos');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}?action=get_workers`);
        const workers = await res.json();

        if (!workers || workers.length === 0) {
            container.innerHTML = '<p class="empty-msg">No hay trabajadores asignados.</p>';
            return;
        }

        const esPaginaInicio = window.location.pathname.includes('inicio.html');

        container.innerHTML = workers.map(w => {
            const nombreEscapado = w.nombre.replace(/'/g, "\\'");
            
            // Botón dinámico
            const botonHtml = esPaginaInicio
                ? `<button class="btn-consultar" onclick="irADetalleTrabajador(${w.id})">📊 Ver Detalle</button>`
                : `<button class="btn-primary" onclick="irAlChat(event, ${w.id}, '${nombreEscapado}')">💬 Chatear</button>`;

            // Estructura de tarjeta con Nombre Completo y Empresa
            return `
                <div class="worker-card">
                    <div class="worker-info">
                        <div class="status-badge">Disponible</div>
                        <small style="color: #666; font-size: 0.75rem;">${w.nombre}</small>
                        
                        <h4 style="margin: 5px 0; color: #2c3e50; font-size: 1.1rem;">
                            ${w.nombre_completo || 'Sin nombre completo'}
                        </h4>
                        
                        <p style="margin: 8px 0; font-size: 0.85rem; color: #007bff; font-weight: 600;">
                            🏢 ${w.empresa || 'Empresa no asignada'}
                        </p>
                        
                        <small style="display: block; color: #999; margin-top: 5px;">ID: ${w.id}</small>
                    </div>
                    <div class="worker-actions" style="margin-top: 15px;">
                        ${botonHtml}
                    </div>
                </div>`;
        }).join('');
    } catch (e) { 
        console.error("Error cargando contactos:", e); 
        container.innerHTML = '<p class="error-msg">Error al cargar datos del servidor.</p>';
    }
}

// --- 4. REDIRECCIÓN A DETALLE ---
function irADetalleTrabajador(id) {
    localStorage.setItem('trabajador_detalle_id', id);
    window.location.assign('detalle_trabajador.html');
}

// --- 5. LÓGICA DEL CHAT ---
window.irAlChat = function(event, id, nombre) {
    if (event) event.preventDefault();
    localStorage.setItem('receptor_id', id);
    localStorage.setItem('receptor_nombre', nombre);
    window.location.assign('chat.html');
};

async function cargarMensajes() {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    const trabajadorId = localStorage.getItem('receptor_id');
    if (!trabajadorId) return;

    try {
        const res = await fetch(`${CHAT_URL}?trabajador_id=${trabajadorId}&t=${Date.now()}`);
        const mensajes = await res.json();
        const miId = obtenerMiId();
        
        chatBox.innerHTML = mensajes.map(m => {
            const esMio = Number(m.emisor_id) === miId;
            return `
                <div class="message-container ${esMio ? 'tutor-msg' : 'worker-msg'}" 
                     style="display: flex; justify-content: ${esMio ? 'flex-end' : 'flex-start'}; margin-bottom: 12px; padding: 0 10px;">
                    <div class="msg-bubble" style="
                        max-width: 75%; 
                        padding: 10px 15px; 
                        border-radius: 15px;
                        background: ${esMio ? '#007bff' : '#e9e9eb'};
                        color: ${esMio ? '#fff' : '#000'};
                        text-align: left; 
                        word-break: break-word; 
                    ">
                        <p style="margin: 0;">${m.mensaje}</p>
                        <span style="display: block; font-size: 0.7rem; margin-top: 5px; opacity: 0.7; text-align: right;">
                            ${formatearHora(m.fecha_envio)}
                        </span>
                    </div>
                </div>`;
        }).join('');
        
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) { console.error("Error chat:", e); }
}

async function enviarMensaje(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('messageInput');
    if (!input || !input.value.trim()) return;

    try {
        const response = await fetch(CHAT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emisor_id: obtenerMiId(),
                receptor_id: Number(localStorage.getItem('receptor_id')),
                mensaje: input.value.trim()
            })
        });
        const result = await response.json();
        if (result.success) {
            input.value = '';
            cargarMensajes();
        }
    } catch (e) { console.error("Error envio:", e); }
}

// --- 6. INTERFAZ Y TEMA ---
function toggleMenu(event) {
    if (event) event.stopPropagation();
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    actualizarInterfazTema(isDark);
}

function actualizarInterfazTema(isDark) {
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');
    if (icon) icon.innerText = isDark ? '☀️' : '🌙';
    if (text) text.innerText = isDark ? 'Modo Claro' : 'Modo Oscuro';
}

// --- 7. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        actualizarInterfazTema(true);
    }

    document.addEventListener('click', (event) => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    if (document.getElementById('listaContactos')) cargarListaContactos();

    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        const receptorNombre = localStorage.getItem('receptor_nombre');
        const header = document.querySelector('.top-bar h2');
        if (header && receptorNombre) header.innerText = `Chat con ${receptorNombre}`;
        
        chatForm.addEventListener('submit', enviarMensaje);
        cargarMensajes();
        setInterval(cargarMensajes, 3000);
    }

    window.toggleMenu = toggleMenu;
    window.toggleTheme = toggleTheme;
    window.irADetalleTrabajador = irADetalleTrabajador;
});