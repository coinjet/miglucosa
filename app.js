document.addEventListener("DOMContentLoaded", () => {
  const glucosaInput = document.getElementById("glucosa");
  const guardarBtn = document.getElementById("guardar");
  const tablaResultados = document.getElementById("tabla-resultados");
  const promedioHbA1c = document.getElementById("promedio-hba1c");
  const resetearBtn = document.getElementById("resetear");

  let registros = JSON.parse(localStorage.getItem("registros")) || [];

  function actualizarTabla() {
    tablaResultados.innerHTML = "";
    const ultimosRegistros = registros.slice(-5);
    ultimosRegistros.forEach((registro, index) => {
      const row = document.createElement("tr");
      const fechaHora = new Date(registro.fecha).toLocaleString("es-ES", { hour12: true });
      row.innerHTML = `
        <td>${fechaHora}</td>
        <td>${registro.resultado}</td>
        <td>
          <button onclick="editarRegistro(${index})">Editar</button>
          <button onclick="eliminarRegistro(${index})">Eliminar</button>
        </td>
      `;
      tablaResultados.appendChild(row);
    });
    calcularPromedioHbA1c();
  }

  function calcularPromedioHbA1c() {
    if (registros.length === 0) {
      promedioHbA1c.textContent = "Promedio HbA1C: --%";
      return;
    }
    const suma = registros.reduce((acc, reg) => acc + reg.resultado, 0);
    const promedio = suma / registros.length;
    const hba1c = ((promedio + 46.7) / 28.7).toFixed(1);
    promedioHbA1c.textContent = `Promedio HbA1C: ${hba1c}%`;
  }

  guardarBtn.addEventListener("click", () => {
    const resultado = parseFloat(glucosaInput.value);
    if (!resultado) return alert("Ingrese un valor válido");
    const fecha = new Date();
    registros.push({ resultado, fecha });
    localStorage.setItem("registros", JSON.stringify(registros));
    glucosaInput.value = "";
    actualizarTabla();
  });

  window.editarRegistro = (index) => {
    const nuevoValor = prompt("Ingrese el nuevo valor:");
    if (nuevoValor !== null && !isNaN(nuevoValor)) {
      registros[index].resultado = parseFloat(nuevoValor);
      localStorage.setItem("registros", JSON.stringify(registros));
      actualizarTabla();
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

  actualizarTabla();
});