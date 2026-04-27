// --- 1. CONFIGURACIÓN ---
const TAREAS_URL = '../../PHP/tareas_logic.php';
const USUARIOS_URL = '../../PHP/obtener_trabajadores.php'; // Ruta para validar el nombre real
let chartStatus = null;
let chartWeekly = null;

// --- 2. FUNCIONES DE APOYO ---
function calcularDuracion(inicio, fin) {
    if (!inicio || inicio === "00:00:00") return "00:00:00";
    try {
        const [h, m, s] = inicio.split(':').map(Number);
        const fechaInicio = new Date();
        fechaInicio.setHours(h, m, s, 0);

        const fechaFin = new Date();
        if (fin && fin !== "00:00:00") {
            const [fh, fm, fs] = fin.split(':').map(Number);
            fechaFin.setHours(fh, fm, fs, 0);
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

function obtenerNumeroSemana(d) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// --- 3. LÓGICA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', async () => {
    // Priorizamos el ID de la URL si existe, si no del localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const idTrabajador = urlParams.get('id') || localStorage.getItem('trabajador_detalle_id');
    
    if (!idTrabajador) {
        console.error("No hay ID de trabajador seleccionado");
        return;
    }

    // ARREGLO: Cargar el nombre correcto del trabajador desde la lista oficial
    try {
        const resp = await fetch(USUARIOS_URL);
        const usuarios = await resp.json();
        const trabajadorActual = usuarios.find(u => u.id == idTrabajador);
        
        if (trabajadorActual && document.getElementById('nombreTrabajador')) {
            document.getElementById('nombreTrabajador').innerText = `Tareas de: ${trabajadorActual.nombre}`;
        }
    } catch (e) { console.error("Error cargando nombre:", e); }

    const selector = document.getElementById('semanaSelector');
    if (selector) {
        const ahora = new Date();
        const year = ahora.getFullYear();
        const week = obtenerNumeroSemana(ahora);
        selector.value = `${year}-W${week.toString().padStart(2, '0')}`;
        selector.addEventListener('change', () => cargarDatos(idTrabajador));
    }

    cargarDatos(idTrabajador);
});

async function cargarDatos(idTrabajador) {
    try {
        const res = await fetch(`${TAREAS_URL}?usuario_id=${idTrabajador}&rol=tutor`);
        const tareas = await res.json();

        const colPendiente = document.getElementById('col-pendiente');
        const colEnCurso = document.getElementById('col-en-curso');
        const colFinalizada = document.getElementById('col-finalizada');

        [colPendiente, colEnCurso, colFinalizada].forEach(col => { if(col) col.innerHTML = ''; });

        let counts = { pendiente: 0, enCurso: 0, finalizada: 0 };
        let dataSemanal = [0, 0, 0, 0, 0, 0, 0];

        const selectorValue = document.getElementById('semanaSelector').value;
        const [selYear, selWeek] = selectorValue.split('-W').map(Number);

        tareas.forEach(tarea => {
            const fechaTarea = tarea.dateFinished ? new Date(tarea.dateFinished) : new Date();
            const tareaSemana = obtenerNumeroSemana(fechaTarea);
            const tareaAnio = fechaTarea.getFullYear();

            if (tareaSemana === selWeek && tareaAnio === selYear) {
                const esFinalizada = tarea.status === 'Finalizada';
                const esEnCurso = tarea.status === 'En curso';
                const estadoKey = esFinalizada ? 'finalizada' : (esEnCurso ? 'enCurso' : 'pendiente');
                
                counts[estadoKey]++;

                if (esFinalizada) {
                    const idx = fechaTarea.getDay() === 0 ? 6 : fechaTarea.getDay() - 1;
                    dataSemanal[idx]++;
                }
            }

            const esFinalizadaCard = tarea.status === 'Finalizada';
            const esEnCursoCard = tarea.status === 'En curso';
            let statusColor = "#ccc";
            let textoEstado = "Pendiente";
            
            if (esEnCursoCard) { statusColor = "#3498db"; textoEstado = "En curso..."; }
            if (esFinalizadaCard) {
                statusColor = "#2ecc71";
                const fechaFin = tarea.dateFinished ? tarea.dateFinished.split('-').reverse().join('/') : '--/--/----';
                textoEstado = `Finalizada el ${fechaFin}`;
            }

            const duracion = (esEnCursoCard || esFinalizadaCard) ? calcularDuracion(tarea.startTime, tarea.finalTime) : "00:00:00";
            
            const cardHtml = `
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
                                <span class="timer-duration">${duracion}</span>
                                <small class="timer-range">${tarea.startTime?.substring(0,5) || '--:--'} a ${tarea.finalTime?.substring(0,5) || '--:--'}</small>
                            </div>
                        </div>
                    </div>
                </div>`;

            if (esFinalizadaCard) colFinalizada.innerHTML += cardHtml;
            else if (esEnCursoCard) colEnCurso.innerHTML += cardHtml;
            else colPendiente.innerHTML += cardHtml;
        });

        dibujarGraficos(counts, dataSemanal);

    } catch (e) { console.error("Error al cargar y filtrar:", e); }
}

function dibujarGraficos(c, s) {
    if (chartStatus) chartStatus.destroy();
    if (chartWeekly) chartWeekly.destroy();

    const ctxDona = document.getElementById('statusChart');
    const ctxBarras = document.getElementById('weeklyChart');

    if (ctxDona) {
        chartStatus = new Chart(ctxDona, {
            type: 'doughnut',
            data: {
                labels: [`Pendientes (${c.pendiente})`, `En Curso (${c.enCurso})`, `Finalizadas (${c.finalizada})`],
                datasets: [{ 
                    data: [c.pendiente, c.enCurso, c.finalizada], 
                    backgroundColor: ['#f1c40f', '#3498db', '#2ecc71'] 
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Resumen Semanal de Estados' }
                }
            }
        });
    }

    if (ctxBarras) {
        chartWeekly = new Chart(ctxBarras, {
            type: 'bar',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{ 
                    label: 'Tareas Finalizadas', 
                    data: s, 
                    backgroundColor: '#3498db' 
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }
}

function exportarExcel() {
    const id = localStorage.getItem('trabajador_detalle_id');
    if (id) {
        window.location.href = `../../PHP/exportar_excel.php?id=${id}`;
    } else {
        alert("No se encontró el ID del trabajador.");
    }
}

window.exportarExcel = exportarExcel;