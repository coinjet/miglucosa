document.addEventListener("DOMContentLoaded", () => {
  // Inicializar Flatpickr
  flatpickr("#fecha-hora", {
    enableTime: true,
    dateFormat: "Y-m-d h:i K",
    time_24hr: false,
    minuteIncrement: 5,
  });

  const fechaHoraInput = document.getElementById("fecha-hora");
  const glucosaInput = document.getElementById("glucosa");
  const guardarBtn = document.getElementById("guardar");
  const tablaResultados = document.getElementById("tabla-resultados");
  const promedioHbA1c = document.getElementById("promedio-hba1c");
  const resetearBtn = document.getElementById("resetear");
  const exportarDatosBtn = document.getElementById("exportar-datos");
  const importarDatosBtn = document.getElementById("importar-datos");
  const archivoImportarInput = document.getElementById("archivo-importar");
  const mesSeleccionado = document.getElementById("mes-seleccionado");
  const graficaGlucosa = document.getElementById("grafica-glucosa").getContext("2d");

  let registros = JSON.parse(localStorage.getItem("registros")) || [];
  let chartInstance = null;

  // Modal de confirmación
  const modalConfirmacion = document.getElementById("modal-confirmacion");
  const confirmarGuardar = document.getElementById("confirmar-guardar");
  const cancelarGuardar = document.getElementById("cancelar-guardar");

  function mostrarModal() {
    modalConfirmacion.style.display = "block";
  }

  function ocultarModal() {
    modalConfirmacion.style.display = "none";
  }

  function actualizarTabla() {
    tablaResultados.innerHTML = "";
    registros.forEach((registro, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(registro.fecha).toLocaleString("es-ES", { hour12: true })}</td>
        <td>${registro.resultado} mg/dL</td>
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

  guardarBtn.addEventListener("click", () => {
    const fechaHora = fechaHoraInput.value;
    const resultado = parseFloat(glucosaInput.value);

    if (!fechaHora || !resultado || isNaN(resultado)) {
      alert("Por favor, ingresa una fecha/hora válida y un nivel de glucosa.");
      return;
    }

    mostrarModal(); // Mostrar el modal de confirmación
  });

  confirmarGuardar.addEventListener("click", () => {
    const fechaHora = fechaHoraInput.value;
    const resultado = parseFloat(glucosaInput.value);

    const fechaISO = new Date(fechaHora).toISOString();

    const nuevoRegistro = {
      fecha: fechaISO,
      resultado: resultado,
    };

    registros.push(nuevoRegistro);
    localStorage.setItem("registros", JSON.stringify(registros));

    fechaHoraInput.value = "";
    glucosaInput.value = "";

    actualizarTabla();
    ocultarModal(); // Ocultar el modal después de guardar
  });

  cancelarGuardar.addEventListener("click", () => {
    ocultarModal(); // Ocultar el modal si se cancela
  });

  // Resto del código sin cambios...
});
