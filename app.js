document.addEventListener("DOMContentLoaded", function() {
  // Inicializar Flatpickr para registro principal
  flatpickr("#fecha-hora", {
    enableTime: true,
    dateFormat: "Y-m-d h:i K",
    time_24hr: false,
    minuteIncrement: 5,
    defaultDate: new Date()
  });

  // Inicializar Flatpickr para recordatorios (NUEVO)
  flatpickr("#fecha-recordatorio", {
    enableTime: true,
    dateFormat: "Y-m-d h:i K",
    time_24hr: false,
    minuteIncrement: 5
  });

  // Elementos del DOM
  const fechaHoraInput = document.getElementById("fecha-hora");
  const glucosaInput = document.getElementById("glucosa");
  const notasInput = document.getElementById("notas");
  const guardarBtn = document.getElementById("guardar");
  const tablaResultados = document.getElementById("tabla-resultados");
  const promedioHbA1c = document.getElementById("promedio-hba1c");
  const resetearBtn = document.getElementById("resetear");
  const exportarDatosBtn = document.getElementById("exportar-datos");
  const mesSeleccionado = document.getElementById("mes-seleccionado");
  const graficaGlucosa = document.getElementById("grafica-glucosa").getContext("2d");
  const modoNocturnoBtn = document.getElementById("modo-nocturno");
  const fechaRecordatorioInput = document.getElementById("fecha-recordatorio"); // NUEVO
  const agregarRecordatorioBtn = document.getElementById("agregar-recordatorio");
  const listaRecordatorios = document.getElementById("lista-recordatorios");

  // Datos
  let registros = JSON.parse(localStorage.getItem("registros")) || [];
  let recordatorios = JSON.parse(localStorage.getItem("recordatorios")) || [];
  let chartInstance = null;

  // =============================================
  // FUNCIONES PRINCIPALES (EXISTENTES - NO TOCAR)
  // =============================================
  function actualizarTabla() {
    tablaResultados.innerHTML = "";
    registros.forEach((registro, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(registro.fecha).toLocaleString("es-ES", { hour12: true })}</td>
        <td>${registro.resultado} mg/dL</td>
        <td>${registro.notas || "--"}</td>
        <td>
          <button class="editar" onclick="editarRegistro(${index})">Editar</button>
          <button class="eliminar" onclick="eliminarRegistro(${index})">Eliminar</button>
        </td>
      `;
      tablaResultados.appendChild(row);
    });
    calcularPromedioHbA1c();
    actualizarGrafica();
  }

  function calcularPromedioHbA1c() { /* ... */ } // Mantén esta función igual
  function actualizarGrafica() { /* ... */ } // Mantén esta función igual

  // =============================================
  // CORRECCIÓN DE RECORDATORIOS (SOLICITADO)
  // =============================================
  function actualizarListaRecordatorios() {
    listaRecordatorios.innerHTML = "";
    recordatorios.forEach((recordatorio, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${new Date(recordatorio.fecha).toLocaleString("es-ES", { hour12: true })}
        <button class="eliminar" onclick="eliminarRecordatorio(${index})">×</button>
      `;
      listaRecordatorios.appendChild(li);
    });
  }

  function mostrarModalAlarma(fecha) {
    // Crear modal
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        max-width: 80%;
      ">
        <h3 style="color: #d9534f;">¡HORA DE MEDIR SU GLUCOSA!</h3>
        <p>Programado: ${new Date(fecha).toLocaleString("es-ES")}</p>
        <button id="cerrar-modal" style="
          background: #62A5ED;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 15px;
        ">Aceptar</button>
      </div>
    `;
    document.body.appendChild(modal);

    // Sonido de alarma
    const audio = new Audio("./assets/alarm.mp3");
    audio.loop = true;
    audio.play().catch(e => console.error("Error al reproducir:", e));

    // Cerrar modal
    document.getElementById("cerrar-modal").addEventListener("click", () => {
      audio.pause();
      document.body.removeChild(modal);
    });
  }

  function verificarRecordatorios() {
    const ahora = new Date();
    recordatorios.forEach(recordatorio => {
      const fechaRecordatorio = new Date(recordatorio.fecha);
      if (
        !recordatorio.alarmaDisparada && 
        fechaRecordatorio <= ahora && 
        ahora <= new Date(fechaRecordatorio.getTime() + 60000) // Margen de 1 minuto
      ) {
        mostrarModalAlarma(recordatorio.fecha);
        recordatorio.alarmaDisparada = true;
        localStorage.setItem("recordatorios", JSON.stringify(recordatorios));
      }
    });
  }

  // =============================================
  // EVENT LISTENERS (ACTUALIZADOS)
  // =============================================
  agregarRecordatorioBtn.addEventListener("click", () => {
    const fechaHora = fechaRecordatorioInput.value;
    if (!fechaHora) return alert("Selecciona una fecha y hora");

    const nuevoRecordatorio = {
      fecha: new Date(fechaHora).toISOString(),
      alarmaDisparada: false
    };

    recordatorios.push(nuevoRecordatorio);
    localStorage.setItem("recordatorios", JSON.stringify(recordatorios));
    actualizarListaRecordatorios();
    fechaRecordatorioInput.value = "";
  });

  // Verificar recordatorios cada 30 segundos
  setInterval(verificarRecordatorios, 30000);

  // =============================================
  // INICIALIZACIÓN
  // =============================================
  actualizarTabla();
  actualizarListaRecordatorios();
  mesSeleccionado.value = (new Date().getMonth() + 1).toString().padStart(2, "0");
  actualizarGrafica();

  // Funciones globales
  window.editarRegistro = function(index) { /* ... */ }; // Mantén esta función igual
  window.eliminarRegistro = function(index) { /* ... */ }; // Mantén esta función igual
  window.eliminarRecordatorio = function(index) {
    if (confirm("¿Eliminar este recordatorio?")) {
      recordatorios.splice(index, 1);
      localStorage.setItem("recordatorios", JSON.stringify(recordatorios));
      actualizarListaRecordatorios();
    }
  };
});
