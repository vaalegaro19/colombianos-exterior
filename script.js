let datosCSV = [];
let chartUnico;

// ================= FUNCIONES UTILES =================
function contar(array) {
  return array.reduce((acc, item) => {
    if (!item) return acc;
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function obtenerDepartamento(valor) {
  if (!valor) return "";
  const partes = valor.split("/");
  if (partes.length >= 2 && partes[0].trim().toUpperCase() === "COLOMBIA") {
    return partes[1].trim();
  }
  return "";  
}

function obtenerAnio(valor) {
  if (!valor) return "";
  const partes = valor.split("/");
  return partes.length === 3 ? partes[2] : valor;
}

// ================= CARRUSEL =================
if (document.querySelector(".mySwiper")) {
  const swiper = new Swiper(".mySwiper", {
    loop: true,
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
    autoHeight: false   // mantiene altura fija
  });
}






// ================= DOMCONTENTLOADED =================
document.addEventListener("DOMContentLoaded", () => {

  // ======= SIDEBAR =======
  const menuBtn = document.querySelector(".menu-btn");
  const sidebar = document.querySelector(".sidebar");

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  // ======= CARGAR CSV =======
  Papa.parse("https://drive.google.com/uc?export=download&id=1O0MX6tdkBE-NGOrXDSEa4t-vWMthY5gs", {
    download: true,
    header: true,
    complete: function(results) {
      datosCSV = results.data;

      // Gráfico principal en index.html
      if (document.getElementById("graficoPaises")) {
        generarGraficoPrincipal();
      }
    }
  });
});

// ================= GRÁFICO PRINCIPAL (index.html) =================
function generarGraficoPrincipal() {
  const graficoPaises = document.getElementById("graficoPaises");
  if (!graficoPaises) return;

  let paises = contar(datosCSV.map(d => d["País"]));
  let paisesOrdenados = Object.entries(paises).sort((a,b)=>b[1]-a[1]).slice(0,10);

  const labels = paisesOrdenados.map(e => e[0]);
  const data = paisesOrdenados.map(e => e[1]);

  new Chart(graficoPaises.getContext("2d"), {
    type: "bar",
    data: { 
      labels, 
      datasets: [{ 
        label: "Top 10 países", 
        data, 
        backgroundColor:["#004080","#0066cc","#0099ff","#33ccff","#66d9ff","#99e6ff","#ccefff"] 
      }] 
    },
    options: { 
      responsive: true,
      maintainAspectRatio: true,  // altura proporcional al ancho
      scales:{ y:{ beginAtZero:true } }
    }
  });
}

// ================= CONSULTAR DATOS (estadisticas.html) =================
function consultarDatos() {
  const criterio = document.getElementById("criterio")?.value;
  if (!criterio || !datosCSV.length) return;

  let datosAgrupados = {};

  if (criterio === "pais") {
    let paises = contar(datosCSV.map(d=>d["País"]));
    let top10 = Object.entries(paises).sort((a,b)=>b[1]-a[1]).slice(0,10);
    crearGrafico("bar", top10.map(e=>e[0]), top10.map(e=>e[1]), "Top 10 países de residencia");
    return;
  }

  if (criterio === "anio") {
    let años = datosCSV.map(d => d["Fecha de Registro"] ? d["Fecha de Registro"].slice(0, 4) : "");
    let conteoAños = contar(años);
    let añosOrdenados = Object.entries(conteoAños).sort((a, b) => a[0] - b[0]);

    crearGrafico("line",
      añosOrdenados.map(e => e[0]),
      añosOrdenados.map(e => e[1]),
      "Migración por año"
    );
    return;
  }

  if (criterio === "nivel") {
    const nivelesValidos = [
      "PREGRADO - PROFESIONAL",
      "PREGRADO - TÉCNICO PROFESIONAL",
      "PREGRADO - TECNOLÓGICO",
      "POSTGRADO - MAESTRIA",
      "POSTGRADO - DOCTORADO",
      "PRIMARIA",
      "BACHILLERATO"
    ];

    const nivelesFiltrados = datosCSV.map(d => {
      const valor = d["Nivel Académico"]?.toUpperCase() || "";
      return nivelesValidos.includes(valor) ? valor : "No indica";
    });

    datosAgrupados = contar(nivelesFiltrados);
  }

  if (criterio === "departamento") {
    let departamentos = datosCSV.map(d => obtenerDepartamento(d["Ciudad de Nacimiento"]));
    let conteo = contar(departamentos);

    let top10 = Object.entries(conteo).sort((a,b)=>b[1]-a[1]).slice(0,10);

    crearGrafico("bar", top10.map(e=>e[0]), top10.map(e=>e[1]), "Top 10 departamentos de nacimiento");
    return;
  }

  // Gráfico general
  crearGrafico(
    criterio === "nivel" ? "pie" : criterio === "anio" ? "line" : "bar",
    Object.keys(datosAgrupados),
    Object.values(datosAgrupados),
    criterio === "anio" ? "Migración por año" :
    criterio === "nivel" ? "Nivel académico" :
    "Colombianos por departamento"
  );
}

// ================= CREAR GRÁFICO (estadisticas.html) =================
function crearGrafico(tipo, labels, data, titulo) {
  const graficoUnico = document.getElementById("graficoUnico");
  if (!graficoUnico) return;

  if (chartUnico) chartUnico.destroy();

  chartUnico = new Chart(graficoUnico.getContext("2d"), {
    type: tipo,
    data: { 
      labels, 
      datasets:[{ 
        label: titulo, 
        data, 
        backgroundColor:["#004080","#ffa600ff","#0099ff","#3d1ad8ff","#66ff7fff","#ff99d8ff","#e3ff44ff"] 
      }]
    },
    options: { 
      responsive: true,
      maintainAspectRatio: true, // altura proporcional al ancho
      plugins: { legend: { display: tipo === "pie" } },
      scales: tipo === "bar" || tipo === "line" ? { y: { beginAtZero: true } } : {}
    }
  });
}

