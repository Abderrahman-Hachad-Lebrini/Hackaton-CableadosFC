// --- 1. CONFIGURACIÓN DE RUTAS ---
const CHAT_URL = '../../PHP/chat_logic_trabajador.php'; 
const TAREAS_URL = '../../PHP/tareas_logic.php';
const TAREAS_FINALIZADAS_URL = '../../PHP/tareas_finalizadas.php';
const PERMISOS_URL = '../../PHP/permisos_logic.php';

let intervaloCronometro; 
let permisoCrearActivo = true; // Variable de control global

// --- 2. FUNCIONES DE APOYO Y NAVEGACIÓN ---

async function verificarBloqueo() {
    const miId = localStorage.getItem('usuario_id') || 1;
    try {
        const res = await fetch(`${PERMISOS_URL}?id=${miId}`);
        const data = await res.json();
        
        permisoCrearActivo = (data.permiso_crear == 1);
        const btnNuevaTarea = document.querySelector('.top-bar .btn-primary');
        
        if (!permisoCrearActivo) {
            if (btnNuevaTarea) btnNuevaTarea.style.display = 'none';
            console.log("Creación de tareas bloqueada por la empresa.");
        } else {
            if (btnNuevaTarea) btnNuevaTarea.style.display = 'block';
        }
    } catch (e) { console.error("Error verificando permisos", e); }
}

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
    if (!permisoCrearActivo) {
        alert("Tu permiso para crear tareas ha sido revocado por la empresa.");
        return;
    }
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
            <div class="task-card" style="border-left: 5px solid ${color}; margin-bottom: 15px; padding: 15px; background: var(--bg-card); border-radius: 8px; box-sizing: border-box; width: 100%; display: flex; flex-direction: column; gap: 12px; overflow: hidden;">
                <div style="width: 100%; min-width: 0; word-break: break-all; overflow-wrap: anywhere;">
                    <span style="color: ${color}; font-size: 0.7rem; font-weight: bold; text-transform: uppercase;">${t.status}</span>
                    <h4 style="margin: 5px 0; line-height: 1.2; font-size: 1.1rem; white-space: normal;">${t.name}</h4>
                    <p style="margin: 0; font-size: 0.85rem; opacity: 0.7; line-height: 1.4; white-space: normal;">${t.descripcion || ''}</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 10px;">
                    <div style="font-family: monospace; font-size: 1.1rem; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                        ⏱️ <span class="timer" data-start="${t.startTime || '00:00:00'}">${esPendiente ? '--:--:--' : '00:00:00'}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        ${esPendiente 
                            ? `<button onclick="actualizarEstadoTarea(${t.id}, 'iniciar')" style="background:#f1c40f; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold; font-size: 0.85rem; min-width: 90px;">▶ Iniciar</button>`
                            : `<button onclick="actualizarEstadoTarea(${t.id}, 'finalizar')" style="background:#2ecc71; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold; font-size: 0.85rem; min-width: 90px;">✔ Terminar</button>`
                        }
                        <button onclick="eliminarTarea(${t.id})" style="background:#e74c3c; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">🗑</button>
                    </div>
                </div>
            </div>`;
        }).join('');
        
        iniciarSegundero();
    } catch (e) { console.error("Error en cargarTareas:", e); }
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
            <div class="task-card completed" style="border-left: 5px solid #2ecc71; margin-bottom: 15px; padding: 15px; background: var(--bg-card); border-radius: 8px; box-sizing: border-box; width: 100%;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: start;">
                    <div style="min-width: 0; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word;">
                        <small style="color: #27ae60; font-weight: bold; display: block;">Finalizada el ${fechaOk}</small>
                        <h4 style="margin: 5px 0; line-height: 1.3; white-space: normal; color: var(--text-color);">${t.name}</h4>
                        <p style="margin: 0; font-size: 0.85rem; opacity: 0.7; line-height: 1.2;">${t.descripcion || ''}</p>
                    </div>
                    <div style="text-align: right; min-width: 0;">
                        <div style="font-family: monospace; font-weight: bold; color: #2ecc71; font-size: 1.1rem;">⏱️ ${tiempoTotal}</div>
                        <small style="color: #95a5a6; display: block;">${t.startTime.substring(0,5)} a ${t.finalTime ? t.finalTime.substring(0,5) : '--:--'}</small>
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
    if (!permisoCrearActivo) {
        alert("No tienes permiso para crear tareas.");
        return;
    }

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
        else { alert(data.error || "Error al crear tarea"); }
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

    try {
        const res = await fetch(CHAT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emisor_id: parseInt(miId), receptor_id: 1, mensaje: mensaje })
        });
        const data = await res.json();
        if (data.success) { input.value = ''; cargarMensajes(); }
    } catch (e) { console.error(e); }
}

async function cargarMensajes() {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    const miId = localStorage.getItem('usuario_id');
    if (!miId) return;

    try {
        const res = await fetch(`${CHAT_URL}?usuario_id=${miId}`);
        const mensajes = await res.json();
        if (!Array.isArray(mensajes)) return;
        
        chatBox.innerHTML = mensajes.map(m => {
            const esMio = Number(m.emisor_id) === Number(miId);
            const hora = m.fecha_envio ? m.fecha_envio.split(' ')[1].substring(0, 5) : '--:--';
            return `
                <div style="display: flex; justify-content: ${esMio ? 'flex-end' : 'flex-start'}; margin-bottom: 12px; padding: 0 10px;">
                    <div style="max-width: 75%; padding: 12px 16px; background: ${esMio ? '#007bff' : '#f0f0f0'}; color: ${esMio ? '#fff' : '#333'}; border-radius: ${esMio ? '18px 18px 0 18px' : '18px 18px 18px 0'}; word-break: break-word; overflow-wrap: anywhere; white-space: normal;">
                        <p style="margin: 0; line-height: 1.4;">${m.mensaje}</p>
                        <small style="display: block; margin-top: 5px; opacity: 0.7; text-align: right; font-size: 0.75rem;">${hora}</small>
                    </div>
                </div>`;
        }).join('') || '<div style="text-align:center; color:gray; margin-top:20px;">No hay mensajes aún.</div>';
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) { console.error(e); }
}

// --- 6. INICIALIZACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
    if (!localStorage.getItem('usuario_id')) localStorage.setItem('usuario_id', 1);

    document.addEventListener('click', (event) => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active') && !sidebar.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    });

    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', enviarMensaje);
        cargarMensajes();
        setInterval(cargarMensajes, 4000);
    }

    if (document.getElementById('activeTasksContainer')) cargarTareas();
    if (document.getElementById('completedTasksContainer')) cargarTareasFinalizadas();

    verificarBloqueo(); // Comprobación de permisos inicial

    Object.assign(window, { 
        toggleMenu, toggleDarkMode, openModal, closeModal, 
        createTask, actualizarEstadoTarea, eliminarTarea 
    });
});