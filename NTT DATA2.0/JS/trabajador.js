// --- 1. CONFIGURACIÓN DE RUTAS ---
const CHAT_URL = '../../PHP/chat_logic_trabajador.php'; 
const TAREAS_URL = '../../PHP/tareas_logic.php';
const TAREAS_FINALIZADAS_URL = '../../PHP/tareas_finalizadas.php';

let intervaloCronometro; 

// --- 2. FUNCIONES DE APOYO Y NAVEGACIÓN ---

function calcularDuracion(inicio, fin) {
    if (!inicio || !fin || fin === "00:00:00" || fin === "NULL") return "00:00:00";
    try {
        const [h1, m1, s1] = inicio.split(':').map(Number);
        const [h2, m2, s2] = fin.split(':').map(Number);
        const dateInicio = new Date();
        dateInicio.setHours(h1, m1, s1, 0);
        const dateFin = new Date();
        dateFin.setHours(h2, m2, s2, 0);
        if (dateFin < dateInicio) dateFin.setDate(dateFin.getDate() + 1);
        const difMs = dateFin - dateInicio;
        const totalSegundos = Math.floor(difMs / 1000);
        const h = Math.floor(totalSegundos / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSegundos % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSegundos % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    } catch (e) { return "00:00:00"; }
}

// MODIFICADO: Ahora acepta el evento para evitar el cierre inmediato al abrir
function toggleMenu(event) {
    if (event) event.stopPropagation(); 
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function openModal() {
    const modal = document.getElementById('taskModal');
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('taskInput').value = '';
        const descInput = document.getElementById('taskDescInput');
        if (descInput) descInput.value = '';
    }
}

// --- 3. LÓGICA DE TAREAS ---

async function cargarTareas() {
    const container = document.getElementById('activeTasksContainer');
    if (!container) return;
    const miId = localStorage.getItem('usuario_id') || 1;

    try {
        const res = await fetch(`${TAREAS_URL}?usuario_id=${miId}`);
        const tareas = await res.json();
        
        if (!Array.isArray(tareas) || tareas.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:gray; margin-top:20px;">No hay tareas pendientes.</p>`;
            return;
        }

        container.innerHTML = tareas.map(t => {
            const esPendiente = t.status === 'Pendiente';
            const color = esPendiente ? '#f1c40f' : '#2ecc71';
            return `
            <div class="task-card" style="border-left: 5px solid ${color}; margin-bottom: 15px; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                <span style="color: ${color}; font-size: 0.8rem; font-weight: bold;">${t.status}</span>
                <h4 style="margin: 10px 0;">${t.name}</h4>
                <div style="font-family: monospace; font-size: 1.2rem; font-weight: bold;">
                    ⏱️ <span class="timer" data-start="${t.startTime || '00:00:00'}">${esPendiente ? '--:--:--' : '00:00:00'}</span>
                </div>
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    ${esPendiente 
                        ? `<button onclick="actualizarEstadoTarea(${t.id}, 'iniciar')" style="background:#f1c40f; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">▶ Iniciar</button>`
                        : `<button onclick="actualizarEstadoTarea(${t.id}, 'finalizar')" style="background:#2ecc71; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">✔ Terminar</button>`
                    }
                    <button onclick="eliminarTarea(${t.id})" style="background:#e74c3c; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">🗑</button>
                </div>
            </div>`;
        }).join('');
        iniciarSegundero();
    } catch (e) { console.error(e); }
}

async function cargarTareasFinalizadas() {
    const container = document.getElementById('completedTasksContainer');
    if (!container) return;
    const miId = localStorage.getItem('usuario_id') || 1;

    try {
        const res = await fetch(`${TAREAS_FINALIZADAS_URL}?usuario_id=${miId}`);
        const tareas = await res.json();
        
        if (!Array.isArray(tareas) || tareas.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:gray; margin-top:20px;">No hay historial de tareas.</p>`;
            return;
        }

        container.innerHTML = tareas.map(t => {
            const tiempoTotal = calcularDuracion(t.startTime, t.finalTime);
            const fechaOk = t.dateFinished ? t.dateFinished.split('-').reverse().join('/') : '---';
            return `
            <div class="task-card completed" style="border-left: 5px solid #2ecc71; margin-bottom: 15px; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <small style="color: #27ae60; font-weight: bold;">Finalizada el ${fechaOk}</small>
                        <h4 style="margin: 5px 0;">${t.name}</h4>
                        <p style="margin: 0; font-size: 0.9rem; opacity: 0.7;">${t.descripcion || ''}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-family: monospace; font-weight: bold; color: #2ecc71; font-size: 1.1rem;">⏱️ ${tiempoTotal}</div>
                        <small style="color: #95a5a6;">${t.startTime.substring(0,5)} a ${t.finalTime ? t.finalTime.substring(0,5) : '--:--'}</small>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (e) { console.error(e); }
}

function iniciarSegundero() {
    if (intervaloCronometro) clearInterval(intervaloCronometro);
    intervaloCronometro = setInterval(() => {
        document.querySelectorAll('.timer').forEach(timer => {
            const horaInicio = timer.getAttribute('data-start');
            if (!horaInicio || horaInicio === "00:00:00") return;
            const ahora = new Date();
            const [hrs, mins, secs] = horaInicio.split(':');
            const inicio = new Date();
            inicio.setHours(hrs, mins, secs);
            const difMs = ahora - inicio;
            if (difMs < 0) return;
            const totalSegundos = Math.floor(difMs / 1000);
            const h = Math.floor(totalSegundos / 3600).toString().padStart(2, '0');
            const m = Math.floor((totalSegundos % 3600) / 60).toString().padStart(2, '0');
            const s = (totalSegundos % 60).toString().padStart(2, '0');
            timer.innerText = `${h}:${m}:${s}`;
        });
    }, 1000);
}

// --- 4. ACCIONES DE TAREAS ---

async function createTask() {
    const nameInput = document.getElementById('taskInput');
    const descInput = document.getElementById('taskDescInput');
    const miId = localStorage.getItem('usuario_id') || 1;
    if (!nameInput.value.trim()) return alert("Introduce un nombre.");

    try {
        const res = await fetch(TAREAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nameInput.value.trim(), descripcion: descInput.value.trim(), usuario_id: Number(miId) })
        });
        const data = await res.json();
        if (data.success) { closeModal(); cargarTareas(); }
    } catch (e) { console.error(e); }
}

async function actualizarEstadoTarea(id, accion) {
    if (accion === 'finalizar' && !confirm("¿Terminar tarea?")) return;
    
    try {
        const res = await fetch(TAREAS_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, accion })
        });
        const data = await res.json();
        if (data.success) {
            cargarTareas();
            if (document.getElementById('completedTasksContainer')) cargarTareasFinalizadas();
        }
    } catch (e) { console.error(e); }
}

async function eliminarTarea(id) {
    if (!confirm("¿Eliminar permanentemente?")) return;
    
    try {
        const res = await fetch(TAREAS_URL, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) cargarTareas();
    } catch (e) { console.error(e); }
}

// --- 5. LÓGICA DEL CHAT ---

async function enviarMensaje(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('messageInput');
    const mensaje = input.value.trim();
    const miId = localStorage.getItem('usuario_id');
    if (!miId || !mensaje) return;

    const payload = { 
        emisor_id: parseInt(miId), 
        receptor_id: 1, 
        mensaje: mensaje 
    };

    try {
        const res = await fetch(CHAT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            input.value = ''; 
            cargarMensajes(); 
        }
    } catch (e) { console.error(e); }
}

async function cargarMensajes() {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    const miId = localStorage.getItem('usuario_id');
    if (!miId) return;

    try {
        const res = await fetch(`${CHAT_URL}?usuario_id=${miId}`);
        if (!res.ok) return;
        const mensajes = await res.json();
        if (!Array.isArray(mensajes)) return;
        
        chatBox.innerHTML = mensajes.map(m => {
            const esMio = Number(m.emisor_id) === Number(miId);
            const hora = m.fecha_envio ? m.fecha_envio.split(' ')[1].substring(0, 5) : '--:--';
            return `
                <div style="display: flex; justify-content: ${esMio ? 'flex-end' : 'flex-start'}; margin-bottom: 12px; padding: 0 10px;">
                    <div style="max-width: 75%; padding: 12px 16px; background: ${esMio ? '#007bff' : '#f0f0f0'}; color: ${esMio ? '#fff' : '#333'}; border-radius: ${esMio ? '18px 18px 0 18px' : '18px 18px 18px 0'}; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        <p style="margin: 0;">${m.mensaje}</p>
                        <small style="display: block; margin-top: 5px; opacity: 0.7; text-align: right; font-size: 0.75rem;">${hora}</small>
                    </div>
                </div>`;
        }).join('') || '<div style="text-align:center; color:gray; margin-top:20px;">No hay mensajes aún.</div>';
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) { console.error(e); }
}

// --- 6. INICIALIZACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    // Tema
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
    
    // Sesión
    if (!localStorage.getItem('usuario_id')) {
        localStorage.setItem('usuario_id', 1);
    }

    // --- NUEVA LÓGICA: CERRAR MENÚ AL CLICAR FUERA ---
    document.addEventListener('click', (event) => {
        const sidebar = document.getElementById('sidebar');
        // Si el menú está abierto y el clic no es dentro de él, se cierra
        if (sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // Chat
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', enviarMensaje);
        cargarMensajes();
        setInterval(cargarMensajes, 4000);
    }

    // Tareas
    if (document.getElementById('activeTasksContainer')) cargarTareas();
    if (document.getElementById('completedTasksContainer')) cargarTareasFinalizadas();

    // Exponer globales
    Object.assign(window, { 
        toggleMenu, toggleDarkMode, openModal, closeModal, 
        createTask, actualizarEstadoTarea, eliminarTarea 
    });
});