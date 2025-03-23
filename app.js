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

  let registros = JSON.parse(localStorage.getItem("registros")) || [];
  let chartInstance = null;

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

      // Agregar nota debajo de la fila (si existe)
      if (registro.notas) {
        const nota = document.createElement("tr");
        nota.innerHTML = `
          <td colspan="3" style="padding: 8px; background-color: #f9f9f9; border: 1px solid #ddd;">
            Nota: ${registro.notas}
          </td>
        `;
        row.appendChild(nota);
      }

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
    });

    const fechas = datosMes.map((registro) =>
      new Date(registro.fecha).toLocaleDateString("es-ES")
    );
    const niveles = datosMes.map((registro) => registro.resultado);

    if (chartInstance) {
      chartInstance.destroy(); // Destruir el gráfico anterior si existe
    }

    chartInstance = new Chart(graficaGlucosa, {
      type: "line", // Tipo de gráfico (línea)
      data: {
        labels: fechas, // Eje X: Fechas
        datasets: [
          {
            label: "Nivel de Glucosa (mg/dL)",
            data: niveles, // Eje Y: Niveles de glucosa
            borderColor: "#62A5ED",
            backgroundColor: "rgba(98, 165, 237, 0.2)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Fecha",
            },
          },
          y: {
            title: {
              display: true,
              text: "Nivel de Glucosa (mg/dL)",
            },
          },
        },
      },
    });
  }

  mesSeleccionado.addEventListener("change", () => {
    actualizarGrafica(); // Actualizar gráfica al cambiar el mes
  });

  guardarBtn.addEventListener("click", () => {
    const fechaHora = fechaHoraInput.value;
    const resultado = parseFloat(glucosaInput.value);
    const notas = notasInput.value;

    if (!fechaHora || !resultado || isNaN(resultado)) {
      alert("Por favor, ingresa una fecha/hora válida y un nivel de glucosa.");
      return;
    }

    const confirmacion = confirm(
      "¿Está seguro de la fecha/hora y nivel de glucosa que va a agregar?"
    );

    if (confirmacion) {
      const fechaISO = new Date(fechaHora).toISOString();

      const nuevoRegistro = {
        fecha: fechaISO,
        resultado: resultado,
        notas: notas,
      };

      registros.push(nuevoRegistro);
      localStorage.setItem("registros", JSON.stringify(registros));

      fechaHoraInput.value = "";
      glucosaInput.value = "";
      notasInput.value = "";

      actualizarTabla();
    }
  });

  exportarDatosBtn.addEventListener("click", () => {
    const doc = new jsPDF();
    doc.text("Registros de Glucosa", 10, 10);

    registros.forEach((r, index) => {
      const y = 20 + index * 10;
      doc.text(
        `${new Date(r.fecha).toLocaleString()} - ${r.resultado} mg/dL${
          r.notas ? ` (${r.notas})` : ""
        }`,
        10,
        y
      );
    });

    doc.save("registros-glucosa.pdf");
  });

  importarDatosBtn.addEventListener("click", () => {
    archivoImportarInput.click();
  });

  archivoImportarInput.addEventListener("change", (event) => {
    const archivo = event.target.files[0];

    if (!archivo) {
      alert("No se seleccionó ningún archivo.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const datosImportados = JSON.parse(e.target.result);

        if (!Array.isArray(datosImportados)) {
          throw new Error("El archivo no tiene el formato correcto.");
        }

        registros = datosImportados;
        localStorage.setItem("registros", JSON.stringify(registros));
        actualizarTabla();
        alert("Datos importados correctamente.");
      } catch (error) {
        alert(`Error al importar los datos: ${error.message}`);
      }
    };

    reader.readAsText(archivo);
  });

  window.editarRegistro = (index) => {
    const nuevaFechaHora = prompt("Ingrese la nueva fecha y hora (formato YYYY-MM-DD hh:mm AM/PM):");
    const nuevoValor = prompt("Ingrese el nuevo valor de glucosa:");
    const nuevasNotas = prompt("Ingrese las nuevas notas:");

    if (nuevaFechaHora && nuevoValor !== null && !isNaN(nuevoValor)) {
      const nuevaFechaISO = new Date(nuevaFechaHora).toISOString();

      registros[index].fecha = nuevaFechaISO;
      registros[index].resultado = parseFloat(nuevoValor);
      registros[index].notas = nuevasNotas;
      localStorage.setItem("registros", JSON.stringify(registros));
      actualizarTabla();
    } else {
      alert("Por favor, ingresa valores válidos.");
    }
  };

  window.eliminarRegistro = (index) => {
    if (confirm("¿Está seguro de eliminar este registro?")) {
      registros.splice(index, 1);
      localStorage.setItem("registros", JSON.stringify(registros));
      actualizarTabla();
    }
  };

  resetearBtn.addEventListener("click", () => {
    if (confirm("¿Está seguro de resetear todos los datos?")) {
      registros = [];
      localStorage.removeItem("registros");
      actualizarTabla();
    }
  });

  // Modo Nocturno
  modoNocturnoBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
      modoNocturnoBtn.textContent = "Modo Día";
    } else {
      modoNocturnoBtn.textContent = "Modo Noche";
    }
  });

  // Recordatorios Personalizados
  const horaRecordatorioInput = document.getElementById("hora-recordatorio");
  const agregarRecordatorioBtn = document.getElementById("agregar-recordatorio");
  const listaRecordatorios = document.getElementById("lista-recordatorios");

  let recordatorios = JSON.parse(localStorage.getItem("recordatorios")) || [];

  function actualizarListaRecordatorios() {
    listaRecordatorios.innerHTML = "";
    recordatorios.forEach((hora, index) => {
      const li = document.createElement("li");
      li.textContent = hora;

      // Botón para eliminar un recordatorio específico
      const eliminarBtn = document.createElement("button");
      eliminarBtn.textContent = "Eliminar";
      eliminarBtn.style.marginLeft = "10px";
      eliminarBtn.onclick = () => {
        recordatorios.splice(index, 1); // Eliminar el recordatorio del array
        actualizarListaRecordatorios();
      };

      li.appendChild(eliminarBtn);
      listaRecordatorios.appendChild(li);
    });
    localStorage.setItem("recordatorios", JSON.stringify(recordatorios));
  }

  agregarRecordatorioBtn.addEventListener("click", () => {
    const hora = horaRecordatorioInput.value;
    if (!hora) {
      alert("Por favor, selecciona una hora válida.");
      return;
    }
    recordatorios.push(hora);
    actualizarListaRecordatorios();
    horaRecordatorioInput.value = "";
  });

  setInterval(() => {
    const ahora = new Date();
    const horaActual = `${agregarCero(ahora.getHours())}:${agregarCero(ahora.getMinutes())}`;
    if (recordatorios.includes(horaActual)) {
      alert(`¡Es hora de medir tu glucosa! (${horaActual})`);
      const audio = new Audio("assets/alarm.mp3"); // Asegúrate de tener el archivo de audio
      audio.play().catch((error) => {
        console.error("Error al reproducir el audio:", error);
      });
    }
  }, 60000);

  function agregarCero(numero) {
    return numero < 10 ? `0${numero}` : numero;
  }

  // Compartir Resultados
  compartirEmailBtn.addEventListener("click", () => {
    const datos = registros.map(
      (r) =>
        `${new Date(r.fecha).toLocaleString()} - ${r.resultado} mg/dL${
          r.notas ? ` (${r.notas})` : ""
        }`
    ).join("\n");

    const mailtoLink = `mailto:?subject=Registros%20de%20Glucosa&body=${encodeURIComponent(datos)}`;
    window.location.href = mailtoLink;
  });

  compartirWhatsappBtn.addEventListener("click", () => {
    const datos = registros.map(
      (r) =>
        `${new Date(r.fecha).toLocaleString()} - ${r.resultado} mg/dL${
          r.notas ? ` (${r.notas})` : ""
        }`
    ).join("\n");

    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(datos)}`;
    window.open(whatsappLink, "_blank");
  });
});
