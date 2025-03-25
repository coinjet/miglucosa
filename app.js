document.addEventListener("DOMContentLoaded", function() {
  // Inicializar Flatpickr
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

  // =============================================
  // FUNCIÓN CORREGIDA PARA GUARDAR REGISTROS (ÚNICO CAMBIO)
  // =============================================
  guardarBtn.addEventListener("click", function() {
    const fechaHora = fechaHoraInput.value;
    const resultado = parseFloat(glucosaInput.value);
    const notas = notasInput.value;

    if (!fechaHora || isNaN(resultado)) {
      alert("Por favor, ingresa una fecha/hora válida y un nivel de glucosa.");
      return;
    }

    const nuevoRegistro = {
      fecha: new Date(fechaHora).toISOString(), // Formato ISO para consistencia
      resultado: resultado,
      notas: notas || "" // Notas opcionales
    };

    registros.push(nuevoRegistro);
    localStorage.setItem("registros", JSON.stringify(registros));

    // Limpiar campos
    fechaHoraInput.value = "";
    glucosaInput.value = "";
    notasInput.value = "";

    // Actualizar interfaz
    actualizarTabla();
  });

  // =============================================
  // FUNCIONES EXISTENTES (NO MODIFICADAS)
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

  function actualizarGrafica() {
    const mes = mesSeleccionado.value;
    const datosMes = registros.filter((registro) => {
      const fecha = new Date(registro.fecha);
      return fecha.getMonth() + 1 === parseInt(mes);
    }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const fechas = datosMes.map((registro) =>
      new Date(registro.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    );
    const niveles = datosMes.map((registro) => registro.resultado);

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(graficaGlucosa, {
      type: "line",
      data: {
        labels: fechas,
        datasets: [
          {
            label: "Nivel de Glucosa (mg/dL)",
            data: niveles,
            borderColor: "#62A5ED",
            backgroundColor: "rgba(98, 165, 237, 0.2)",
            borderWidth: 2,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  }

  // ... (El resto de tu código existente permanece IGUAL)
  // Incluyendo: recordatorios, exportar PDF, modo nocturno, etc.
  // NO MODIFIQUES NADA MÁS

  // Inicialización
  actualizarTabla();
  mesSeleccionado.value = (new Date().getMonth() + 1).toString().padStart(2, "0");
  actualizarGrafica();
});
