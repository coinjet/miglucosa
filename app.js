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
  // 1. MODO DÍA/NOCHE
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
  // 2. RECORDATORIOS
  // =============================================
  flatpickr("#fecha-recordatorio", {
    enableTime: true,
    dateFormat: "Y-m-d h:i K",
    time_24hr: false,
    minuteIncrement: 5
  });

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

    const audio = new Audio("./assets/alarm.mp3");
    audio.loop = true;
    audio.play().catch(e => console.error("Error al reproducir:", e));

    document.getElementById("aceptar-alarma").addEventListener("click", () => {
      audio.pause();
      document.body.removeChild(modal);
    });
  }

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
  // FUNCIONES PRINCIPALES
  // =============================================
  function actualizarTabla() {
    tablaResultados.innerHTML = "";
    registros.slice(-5).reverse().forEach((registro, index) => {
      const fila = document.createElement("div");
      fila.className = "fila";
      fila.innerHTML = `
        <div class="columna">${new Date(registro.fecha).toLocaleString("es-ES", { hour12: true })}</div>
        <div class="columna">${registro.resultado} mg/dL</div>
        <div class="columna">
          <button class="editar" onclick="editarRegistro(${registros.length - 1 - index})">Editar</button>
          <button class="eliminar" onclick="eliminarRegistro(${registros.length - 1 - index})">Eliminar</button>
        </div>
        <div class="notas-registro">${registro.notas ? `<strong>Notas:</strong> ${registro.notas}` : "—"}</div>
      `;
      tablaResultados.appendChild(fila);
    });
    calcularPromedioHbA1c();
  }

  function calcularPromedioHbA1c() {
    if (registros.length === 0) {
      promedioHbA1c.textContent = "Tu HbA1c estimado es: —%";
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

  guardarBtn.addEventListener("click", () => {
    const fechaHora = fechaHoraInput.value;
    const glucosa = parseFloat(glucosaInput.value);
    const notas = notasInput.value.trim();

    if (!fechaHora || isNaN(glucosa)) {
      alert("Por favor, ingresa fecha/hora y un nivel de glucosa válido");
      return;
    }

    registros.push({
      fecha: new Date(fechaHora).toISOString(),
      resultado: glucosa,
      notas: notas || null
    });
    localStorage.setItem("registros", JSON.stringify(registros));

    glucosaInput.value = "";
    notasInput.value = "";
    flatpickr("#fecha-hora").setDate(new Date());

    actualizarTabla();
  });

  // =============================================
  // BOTONES INFERIORES (VERSIÓN FINAL CORREGIDA)
  // =============================================

  const generarPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("REGISTRO DE GLUCOSA", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("FECHA Y HORA", 25, 30);
    doc.text("NIVEL (mg/dL)", 80, 30);
    doc.text("NOTAS", 150, 30);
    doc.setDrawColor(0);
    doc.line(20, 35, 190, 35);
    
    doc.setFont("helvetica", "normal");
    let y = 45;
    registros.slice().reverse().forEach(reg => {
      doc.text(new Date(reg.fecha).toLocaleString("es-ES", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }), 25, y);
      doc.text(`${reg.resultado} mg/dL`, 80, y);
      doc.text(reg.notas || "—", 150, y, { maxWidth: 50 });
      y += 10;
    });
    
    return doc;
  };

  // 1. COMPARTIR POR WHATSAPP
  document.getElementById("compartir-whatsapp").addEventListener("click", async () => {
    if (registros.length === 0) {
      alert("No hay registros para compartir");
      return;
    }

    try {
      const doc = generarPDF();
      const pdfBlob = doc.output("blob");
      const pdfFile = new File([pdfBlob], "Registro_Glucosa.pdf", { 
        type: "application/pdf" 
      });

      if (navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({
          title: "Registro de Glucosa",
          files: [pdfFile]
        });
      } else {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(`https://web.whatsapp.com/send?text=Registro%20de%20Glucosa&file=${pdfUrl}`);
      }
    } catch (error) {
      alert("Error al compartir. Abre WhatsApp manualmente.");
    }
  });

  // 2. COMPARTIR POR EMAIL (VERSIÓN DEFINITIVA)
  document.getElementById("compartir-email").addEventListener("click", async () => {
    if (registros.length === 0) {
      alert("No hay registros para compartir");
      return;
    }

    try {
      const doc = generarPDF();
      // Generar PDF como Blob (método más confiable)
      const pdfBlob = doc.output("blob");
      const pdfFile = new File([pdfBlob], "Registro_Glucosa.pdf", {
        type: "application/pdf"
      });

      // Solución para PWAs (Android/iOS)
      if (navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({
          title: "Registro de Glucosa",
          text: "Adjunto mis registros de glucosa",
          files: [pdfFile]
        });
      } 
      // Fallback universal
      else {
        // Descargar primero el PDF
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = "Registro_Glucosa.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Abrir cliente de correo
        setTimeout(() => {
          window.open("mailto:?subject=Registro%20de%20Glucosa&body=Por%20favor%20adjunta%20el%20PDF%20descargado");
        }, 500);
      }
    } catch (error) {
      console.error("Error al compartir:", error);
      alert("Descarga el PDF y adjúntalo manualmente desde tu app de correo.");
    }
  });

  // 3. EXPORTAR DATOS
  document.getElementById("exportar-datos").addEventListener("click", () => {
    if (registros.length === 0) {
      alert("No hay registros para exportar");
      return;
    }
    
    const doc = generarPDF();
    doc.save("Registro_de_Glucosa.pdf");
  });

  // 4. IMPORTAR DATOS
  document.getElementById("importar-datos").addEventListener("click", () => {
    document.getElementById("archivo-importar").click();
  });

  document.getElementById("archivo-importar").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.csv')) {
      alert("Por favor, selecciona un archivo CSV válido");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target.result;
        const lineas = csvData.split('\n').filter(line => line.trim() !== '');
        const nuevosRegistros = [];

        lineas.forEach((linea, index) => {
          if (index === 0 && linea.toLowerCase().includes('fecha')) return;
          
          const partes = linea.split(',').map(part => part.trim());
          if (partes.length >= 2) {
            const fecha = new Date(partes[0]);
            const valor = parseFloat(partes[1]);
            
            if (!isNaN(fecha.getTime()) && !isNaN(valor)) {
              nuevosRegistros.push({
                fecha: fecha.toISOString(),
                resultado: valor,
                notas: partes[2] || null
              });
            }
          }
        });

        if (nuevosRegistros.length > 0) {
          registros = nuevosRegistros;
          localStorage.setItem("registros", JSON.stringify(registros));
          actualizarTabla();
          alert(`Se importaron ${nuevosRegistros.length} registros correctamente`);
        } else {
          alert("El archivo no contiene datos válidos. Formato esperado:\nFecha, Valor, Notas(opcional)");
        }
      } catch (error) {
        alert("Error al importar: " + error.message);
      }
    };
    reader.readAsText(file);
  });

  // 5. ELIMINAR REGISTROS
  document.getElementById("resetear").addEventListener("click", () => {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    modal.innerHTML = `
      <div style="
        background: ${document.body.classList.contains("dark-mode") ? "#1e1e1e" : "white"};
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        width: 80%;
        max-width: 300px;
      ">
        <h3 style="color: #d9534f; margin-bottom: 20px;">¿Eliminar TODOS los registros?</h3>
        <div style="display: flex; justify-content: center; gap: 10px;">
          <button id="confirmar-eliminar" style="
            background: #d9534f;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          ">Aceptar</button>
          <button id="cancelar-eliminar" style="
            background: #62A5ED;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          ">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("confirmar-eliminar").addEventListener("click", () => {
      registros = [];
      localStorage.setItem("registros", JSON.stringify(registros));
      actualizarTabla();
      document.body.removeChild(modal);
    });

    document.getElementById("cancelar-eliminar").addEventListener("click", () => {
      document.body.removeChild(modal);
    });
  });

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
