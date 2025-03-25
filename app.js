document.addEventListener("DOMContentLoaded", function() {
  // Inicialización de Flatpickr (para formulario y recordatorios)
  flatpickr("#fecha-hora", {
    enableTime: true,
    dateFormat: "Y-m-d h:i K",
    time_24hr: false
  });

  flatpickr("#fecha-recordatorio", {
    enableTime: true,
    dateFormat: "Y-m-d h:i K",
    time_24hr: false
  });

  // [Todas las variables del DOM...]

  // Modo día/noche (funcionalidad completa)
  modoNocturnoBtn.addEventListener("click", function() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("modoNocturno", document.body.classList.contains("dark-mode"));
    modoNocturnoBtn.textContent = document.body.classList.contains("dark-mode") ? "Modo Día" : "Modo Noche";
  });

  // Función actualizarTabla (nuevo formato)
  function actualizarTabla() {
    const cuerpoTabla = document.getElementById("tabla-resultados");
    cuerpoTabla.innerHTML = "";

    const ultimosRegistros = [...registros].reverse().slice(0, 5);

    ultimosRegistros.forEach(registro => {
      // Fila principal
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${new Date(registro.fecha).toLocaleString("es-ES", { hour12: true })}</td>
        <td>${registro.resultado} mg/dL</td>
        <td>
          <button class="editar" onclick="editarRegistro(${registros.indexOf(registro)})">Editar</button>
          <button class="eliminar" onclick="eliminarRegistro(${registros.indexOf(registro)})">Eliminar</button>
        </td>
      `;
      cuerpoTabla.appendChild(fila);

      // Fila de notas
      const filaNotas = document.createElement("tr");
      filaNotas.className = "fila-notas";
      filaNotas.innerHTML = `
        <td colspan="3">
          <strong>Notas:</strong> ${registro.notas || "--"}
        </td>
      `;
      cuerpoTabla.appendChild(filaNotas);
    });
  }

  // [Todas las demás funciones permanecen IGUAL]
  // - Guardar registros
  // - Recordatorios
  // - Gráficas
  // - Exportar/importar
});
