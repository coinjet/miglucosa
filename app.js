document.addEventListener("DOMContentLoaded", () => {
  // Inicializar Flatpickr
  flatpickr("#fecha-hora", {
    enableTime: true, // Habilitar selección de hora
    dateFormat: "Y-m-d h:i K", // Formato de fecha y hora (12 horas)
    time_24hr: false, // Usar formato de 12 horas
    minuteIncrement: 5, // Incremento de minutos (opcional)
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

  let registros = JSON.parse(localStorage.getItem("registros")) || [];

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

  guardarBtn.addEventListener("click", () => {
    const fechaHora = fechaHoraInput.value;
    const resultado = parseFloat(glucosaInput.value);

    if (!fechaHora || !resultado || isNaN(resultado)) {
      alert("Por favor, ingresa una fecha/hora válida y un nivel de glucosa.");
      return;
    }

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
  });

  exportarDatosBtn.addEventListener("click", () => {
    const datosExportar = JSON.stringify(registros);
    const blob = new Blob([datosExportar], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "registros-glucosa.json";
    a.click();

    URL.revokeObjectURL(url);
  });

  importarDatosBtn.addEventListener("click", () => {
    archivoImportarInput.click(); // Abrir el selector de archivos
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

        // Validar que los datos importados tengan el formato correcto
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

    if (nuevaFechaHora && nuevoValor !== null && !isNaN(nuevoValor)) {
      const nuevaFechaISO = new Date(nuevaFechaHora).toISOString();

      registros[index].fecha = nuevaFechaISO;
      registros[index].resultado = parseFloat(nuevoValor);
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

  // Inicializar la tabla al cargar la página
  actualizarTabla();
});
