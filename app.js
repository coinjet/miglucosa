document.addEventListener("DOMContentLoaded", function() {
  // Inicializar Flatpickr para registro principal
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
  const mesSeleccionado = document.getElementById("mes-seleccionado");
  const graficaGlucosa = document.getElementById("grafica-glucosa").getContext("2d");
  const modoNocturnoBtn = document.getElementById("modo-nocturno");
  const fechaRecordatorioInput = document.getElementById("fecha-recordatorio");
  const agregarRecordatorioBtn = document.getElementById("agregar-recordatorio");
  const listaRecordatorios = document.getElementById("lista-recordatorios");

  // Datos
  let registros = JSON.parse(localStorage.getItem("registros")) || [];
  let recordatorios = JSON.parse(localStorage.getItem("recordatorios")) || [];
  let chartInstance = null;

  // =============================================
  // 1. CORRECCIÓN MODO DÍA/NOCHE (SOLICITADO)
  // =============================================
  modoNocturnoBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    modoNocturnoBtn.textContent = document.body.classList.contains("dark-mode") ? "Modo Día" : "Modo Noche";
    localStorage.setItem("modoNocturno", document.body.classList.contains("dark-mode"));
  });

  // Inicializar modo
  if (localStorage.getItem("modoNocturno") === "true") {
    document.body.classList.add("dark-mode");
    modoNocturnoBtn.textContent = "Modo Día";
  }

  // =============================================
  // 2. CORRECCIÓN RECORDATORIOS (SOLICITADO)
  // =============================================
  // Inicializar Flatpickr para recordatorios
  flatpickr("#fecha-recordatorio", {
    enableTime: true,
    dateFormat: "Y-m-d h:i K",
    time_24hr: false,
    minuteIncrement: 5
  });

  // Función para mostrar alarma
  function mostrarAlarma() {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        width: 80%;
        max-width: 400px;
      ">
        <h3 style="color: #d9534f; margin-bottom: 20px;">¡HORA DE MEDIR TU GLUCOSA!</h3>
        <button id="aceptar-alarma" style="
          background: #62A5ED;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
        ">Aceptar</button>
      </div>
    `;
    document.body.appendChild(modal);

    // Sonido de alarma
    const audio = new Audio("./assets/alarm.mp3");
    audio.loop = true;
    audio.play().catch(e => console.error("Error al reproducir:", e));

    // Cerrar modal
    document.getElementById("aceptar-alarma").addEventListener("click", () => {
      audio.pause();
      document.body.removeChild(modal);
    });
  }

  // Verificar recordatorios cada 30 segundos
  setInterval(() => {
    const ahora = new Date();
    recordatorios.forEach(recordatorio => {
      const fechaRecordatorio = new Date(recordatorio.fecha);
      if (!recordatorio.disparado && fechaRecordatorio <= ahora) {
        mostrarAlarma();
        recordatorio.disparado = true;
        localStorage.setItem("recordatorios", JSON.stringify(recordatorios));
      }
    });
  }, 30000);

  // Actualizar lista de recordatorios
  function actualizarListaRecordatorios() {
    listaRecordatorios.innerHTML = "";
    recordatorios.forEach((recordatorio, index) => {
      const li = document.createElement("li");
      li.style.margin = "10px 0";
      li.innerHTML = `
        ${new Date(recordatorio.fecha).toLocaleString("es-ES", { hour12: true })}
        <button onclick="eliminarRecordatorio(${index})" style="
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 5px 10px;
          margin-left: 10px;
          cursor: pointer;
        ">Eliminar</button>
      `;
      listaRecordatorios.appendChild(li);
    });
  }

  // Agregar recordatorio
  agregarRecordatorioBtn.addEventListener("click", () => {
    const fechaHora = fechaRecordatorioInput.value;
    if (!fechaHora) return alert("Selecciona una fecha y hora");

    recordatorios.push({
      fecha: new Date(fechaHora).toISOString(),
      disparado: false
    });
    localStorage.setItem("recordatorios", JSON.stringify(recordatorios));
    actualizarListaRecordatorios();
    fechaRecordatorioInput.value = "";
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

  // Inicialización
  actualizarTabla();
  actualizarListaRecordatorios();
  mesSeleccionado.value = (new Date().getMonth() + 1).toString().padStart(2, "0");
  actualizarGrafica();

  // Funciones globales
  window.editarRegistro = function(index) {
    const registro = registros[index];
    const nuevaFechaHora = prompt("Nueva fecha/hora:", new Date(registro.fecha).toLocaleString("es-ES"));
    const nuevoValor = prompt("Nuevo nivel de glucosa:", registro.resultado);
    const nuevasNotas = prompt("Nuevas notas:", registro.notas || "");

    if (nuevaFechaHora && !isNaN(parseFloat(nuevoValor))) {
      registros[index] = {
        fecha: new Date(nuevaFechaHora).toISOString(),
        resultado: parseFloat(nuevoValor),
        notas: nuevasNotas
      };
      localStorage.setItem("registros", JSON.stringify(registros));
      actualizarTabla();
    }
  };

  window.eliminarRegistro = function(index) {
    if (confirm("¿Estás seguro de eliminar este registro?")) {
      registros.splice(index, 1);
      localStorage.setItem("registros", JSON.stringify(registros));
      actualizarTabla();
    }
  };

  window.eliminarRecordatorio = function(index) {
    if (confirm("¿Eliminar este recordatorio?")) {
      recordatorios.splice(index, 1);
      localStorage.setItem("recordatorios", JSON.stringify(recordatorios));
      actualizarListaRecordatorios();
    }
  };
});
