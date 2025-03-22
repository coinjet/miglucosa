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

    // Validar campos
    if (!fechaHora || !resultado || isNaN(resultado)) {
      alert("Por favor, ingresa una fecha/hora válida y un nivel de glucosa.");
      return;
    }

    // Convertir la fecha a formato ISO
    const fechaISO = new Date(fechaHora).toISOString();

    // Crear un nuevo registro
    const nuevoRegistro = {
      fecha: fechaISO,
      resultado: resultado,
    };

    // Guardar el registro
    registros.push(nuevoRegistro);
    localStorage.setItem("registros", JSON.stringify(registros));

    // Limpiar campos
    fechaHoraInput.value = "";
    glucosaInput.value = "";

    // Actualizar la tabla
    actualizarTabla();
  });

  window.editarRegistro = (index) => {
    const nuevaFechaHora = prompt("Ingrese la nueva fecha y hora (formato YYYY-MM-DD hh:mm AM/PM):");
    const nuevoValor = prompt("Ingrese el nuevo valor de glucosa:");

    if (nuevaFechaHora && nuevoValor !== null && !isNaN(nuevoValor)) {
      // Convertir la nueva fecha a formato ISO
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
