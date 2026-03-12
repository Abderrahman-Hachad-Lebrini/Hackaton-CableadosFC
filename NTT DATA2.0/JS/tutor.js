// --- 1. CONFIGURACIÓN DE RUTAS ---
const API_URL = '../../PHP/inicio_trab.php';
const CHAT_URL = '../../PHP/chat_logic_tutor.php';
const TAREAS_URL = '../../PHP/tareas_logic.php'; 

let cronometroInterval = null;

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

function calcularDuracion(inicio, fin) {
    if (!inicio || inicio === "00:00:00") return "00:00:00";
    try {
        const ahora = new Date();
        const [h, m, s] = inicio.split(':').map(Number);
        const fechaInicio = new Date();
        fechaInicio.setHours(h, m, s, 0);

        let fechaFin;
        if (fin && fin !== "00:00:00") {
            const [fh, fm, fs] = fin.split(':').map(Number);
            fechaFin = new Date();
            fechaFin.setHours(fh, fm, fs, 0);
        } else {
            fechaFin = ahora;
        }

        const diffMs = fechaFin - fechaInicio;
        if (diffMs < 0) return "00:00:00";

        const totalSegundos = Math.floor(diffMs / 1000);
        const hh = Math.floor(totalSegundos / 3600).toString().padStart(2, '0');
        const mm = Math.floor((totalSegundos % 3600) / 60).toString().padStart(2, '0');
        const ss = (totalSegundos % 60).toString().padStart(2, '0');

        return `${hh}:${mm}:${ss}`;
    } catch (e) { return "00:00:00"; }
}

function actualizarCronometrosEnVivo() {
    const elementos = document.querySelectorAll('.timer-duration');
    elementos.forEach(el => {
        if (el.getAttribute('data-estado') === 'En curso') {
            const inicio = el.getAttribute('data-inicio');
            el.innerText = calcularDuracion(inicio, null);
        }
    });
}

// --- 3. INTERFAZ Y TEMA ---
function toggleMenu(event) {
    // IMPORTANTE: Detenemos la propagación para que el clic en el botón 
    // no sea detectado por el listener de "clic fuera" inmediatamente.
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

// --- 4. GESTIÓN DE TRABAJADORES ---
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
            const botonHtml = esPaginaInicio 
                ? `<button class="btn-consultar" onclick="verTareas(${w.id}, '${nombreEscapado}')">📊 Consultar Tareas</button>` 
                : `<button class="btn-primary" onclick="irAlChat(event, ${w.id}, '${nombreEscapado}')">💬 Chatear</button>`;

            return `
                <div class="worker-card">
                    <div class="worker-info">
                        <div class="status-badge">Disponible</div>
                        <h4>${w.nombre}</h4>
                        <small>ID: ${w.id}</small>
                    </div>
                    <div class="worker-actions">${botonHtml}</div>
                </div>`;
        }).join('');
    } catch (e) { console.error("Error cargando contactos:", e); }
}

// --- 5. LÓGICA DE TAREAS (KANBAN) ---
async function verTareas(idTrabajador, nombre) {
    const secTrabajadores = document.getElementById('sec-trabajadores');
    const vistaTareas = document.getElementById('vistaTareas');
    if (!secTrabajadores || !vistaTareas) return;

    secTrabajadores.style.display = 'none';
    vistaTareas.style.display = 'block';
    document.getElementById('nombreTrabajadorSeleccionado').innerText = `Tareas de: ${nombre}`;

    if (cronometroInterval) clearInterval(cronometroInterval);

    try {
        const res = await fetch(`${TAREAS_URL}?usuario_id=${idTrabajador}&rol=tutor`);
        const tareas = await res.json();

        const colPendiente = document.getElementById('col-pendiente');
        const colEnCurso = document.getElementById('col-en-curso');
        const colFinalizada = document.getElementById('col-finalizada');

        colPendiente.innerHTML = '';
        colEnCurso.innerHTML = '';
        colFinalizada.innerHTML = '';

        if (!tareas || tareas.length === 0) {
            colPendiente.innerHTML = '<p class="empty-msg">Sin tareas asignadas</p>';
            return;
        }

        tareas.forEach(tarea => {
            const esFinalizada = tarea.status === 'Finalizada' || Number(tarea.is_completed) === 1;
            const esEnCurso = tarea.status === 'En curso';
            
            let statusColor = "#ccc"; 
            let textoEstado = "Pendiente";

            if (esEnCurso) { statusColor = "#3498db"; textoEstado = "En curso..."; }
            if (esFinalizada) { 
                statusColor = "#2ecc71"; 
                const fechaFin = tarea.dateFinished ? tarea.dateFinished.split('-').reverse().join('/') : '--/--/----';
                textoEstado = `Finalizada el ${fechaFin}`; 
            }

            const duracionVisual = (esEnCurso || esFinalizada) ? calcularDuracion(tarea.startTime, tarea.finalTime) : "00:00:00";
            const horaIni = tarea.startTime ? tarea.startTime.substring(0,5) : "--:--";
            const horaFin = tarea.finalTime ? tarea.finalTime.substring(0,5) : "--:--";

            const card = `
                <div class="task-card-kanban status-${tarea.status.toLowerCase().replace(/\s+/g, '-')}">
                    <div class="task-header-finished">
                        <span class="finish-date" style="color: ${statusColor}">${textoEstado}</span>
                    </div>
                    <div class="task-main-info">
                        <div class="task-text">
                            <h5 class="task-title-bold">${tarea.name}</h5>
                            <p class="task-desc-small">${tarea.descripcion || ''}</p>
                        </div>
                        <div class="task-timer-box" style="color: ${statusColor}">
                            <span class="timer-icon">⏱️</span>
                            <div class="timer-data">
                                <span class="timer-duration" 
                                      data-estado="${tarea.status}" 
                                      data-inicio="${tarea.startTime}"
                                      data-fin="${esFinalizada ? tarea.finalTime : ''}">${duracionVisual}</span>
                                <small class="timer-range">${horaIni} a ${horaFin}</small>
                            </div>
                        </div>
                    </div>
                </div>`;

            if (esFinalizada) colFinalizada.innerHTML += card;
            else if (esEnCurso) colEnCurso.innerHTML += card;
            else colPendiente.innerHTML += card;
        });

        cronometroInterval = setInterval(actualizarCronometrosEnVivo, 1000);

    } catch (e) { console.error("Error tareas:", e); }
}

function cerrarTareas() {
    if (cronometroInterval) clearInterval(cronometroInterval);
    document.getElementById('sec-trabajadores').style.display = 'block';
    document.getElementById('vistaTareas').style.display = 'none';
}

// --- 6. LÓGICA DEL CHAT ---
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
                <div class="message-container ${esMio ? 'tutor-msg' : 'worker-msg'}">
                    <div class="msg-bubble">
                        <p>${m.mensaje}</p>
                        <span class="msg-time">${formatearHora(m.fecha_envio)}</span>
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

// --- 7. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // Aplicar tema al cargar
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        actualizarInterfazTema(true);
    }

    // --- NUEVA LÓGICA: CERRAR MENÚ AL CLICAR FUERA ---
    document.addEventListener('click', (event) => {
        const sidebar = document.getElementById('sidebar');
        // Si el sidebar existe y tiene la clase 'active'
        if (sidebar && sidebar.classList.contains('active')) {
            // Si el clic NO ocurrió dentro del sidebar
            if (!sidebar.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    if (document.getElementById('listaContactos')) cargarListaContactos();

    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        const receptorNombre = localStorage.getItem('receptor_nombre');
        const header = document.querySelector('.top-bar h2') || document.getElementById('chatHeader');
        if (header && receptorNombre) header.innerText = `Chat con ${receptorNombre}`;
        chatForm.addEventListener('submit', enviarMensaje);
        cargarMensajes();
        setInterval(cargarMensajes, 3000);
    }

    // Exportar funciones globales
    window.toggleMenu = toggleMenu;
    window.toggleTheme = toggleTheme; 
    window.verTareas = verTareas;
    window.cerrarTareas = cerrarTareas;
});