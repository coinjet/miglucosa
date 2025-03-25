document.addEventListener("DOMContentLoaded", function() {
  // Inicialización de Flatpickr
  flatpickr("#fecha-hora", {
    enableTime: true,
    dateFormat: "Y-m-d h:i K",
    time_24hr: false,
    minuteIncrement: 5,
    defaultDate: new Date()
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
  const importarDatosBtn = document.getElementById("importar-datos");
  const archivoImportarInput = document.getElementById("archivo-importar");
  const mesSeleccionado = document.getElementById("mes-seleccionado");
  const graficaGlucosa = document.getElementById("grafica-glucosa").getContext("2d");
  const compartirEmailBtn = document.getElementById("compartir-email");
  const compartirWhatsappBtn = document.getElementById("compartir-whatsapp");
  const modoNocturnoBtn = document.getElementById("modo-nocturno");
  const fechaRecordatorioInput = document.getElementById("fecha-recordatorio");
  const agregarRecordatorioBtn = document.getElementById("agregar-recordatorio");
  const listaRecordatorios = document.getElementById("lista-recordatorios");

  // Datos
  let registros = JSON.parse(localStorage.getItem("registros")) || [];
  let recordatorios = JSON.parse(localStorage.getItem("recordatorios")) || [];
  let chartInstance = null;

  // Función para guardar registros (sin cambios)
  guardarBtn.addEventListener("click", function() {
    const fechaHora = fechaHoraInput.value;
    const resultado = parseFloat(glucosaInput.value);
    const notas = notasInput.value;

    if (!fechaHora || isNaN(resultado)) {
      alert("Por favor, ingresa una fecha/hora válida y un nivel de glucosa.");
      return;
    }

    const nuevoRegistro = {
      fecha: new Date(fechaHora).toISOString(),
      resultado: resultado,
      notas: notas || ""
    };

    registros.push(nuevoRegistro);
    localStorage.setItem("registros", JSON.stringify(registros));

    fechaHoraInput.value = "";
    glucosaInput.value = "";
    notasInput.value = "";

    actualizarTabla();
  });

  // =============================================
  // NUEVA FUNCIÓN PARA ACTUALIZAR TABLA (SOLICITADO)
  // =============================================
  function actualizarTabla() {
    const tabla = document.getElementById("tabla-resultados");
    tabla.innerHTML = "";

    const ultimosRegistros = [...registros].reverse().slice(0, 5);

    ultimosRegistros.forEach((registro) => {
      // Fila superior
      const filaSuperior = document.createElement("div");
      filaSuperior.className = "fila-superior";
      filaSuperior.innerHTML = `
        <div class="col-fecha">${new Date(registro.fecha).toLocaleString("es-ES", { hour12: true })}</div>
        <div class="col-nivel">${registro.resultado} mg/dL</div>
        <div class="col-acciones">
          <button class="editar" onclick="editarRegistro(${registros.findIndex(r => r.fecha === registro.fecha)})">Editar</button>
          <button class="eliminar" onclick="eliminarRegistro(${registros.findIndex(r => r.fecha === registro.fecha)})">Eliminar</button>
        </div>
      `;
      tabla.appendChild(filaSuperior);

      // Fila de notas
      const filaNotas = document.createElement("div");
      filaNotas.className = "fila-notas";
      filaNotas.innerHTML = `
        <div class="notas-titulo">Notas:</div>
        <div class="notas-contenido">${registro.notas || "--"}</div>
      `;
      tabla.appendChild(filaNotas);
    });
  }

  // Resto de funciones (sin cambios)
  function calcularPromedioHbA1c() {
    if (registros.length === 0) {
      promedioHbA1c.textContent = "Tu HbA1c estimado es: --%";
      return;
    }
    const suma = registros.reduce((acc, reg) => acc + reg.resultado, 0);
    const promedio = suma / registros.length;
    const hba1c = ((promedio + 46.7) / 28.7).toFixed(2);
    promedioHbA1c.textContent = `Tu HbA1c estimado es: ${hba1c}%`;
  }

  // ... (Todas las demás funciones se mantienen IGUAL)
  // Incluyendo: actualizarGrafica, recordatorios, exportar PDF, etc.

  // Inicialización
  actualizarTabla();
  mesSeleccionado.value = (new Date().getMonth() + 1).toString().padStart(2, "0");
  actualizarGrafica();
});
