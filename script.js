// ======================================================================
// FACTORES DE EMISIÓN Y CONSUMO (Globales y Correctos)
// ======================================================================
const FACTORES = {
    ELECTRICIDAD_KWH: 0.200, 
    GAS_LP_10KG: 30.0,  
    GAS_NATURAL_M3: 2.05, 
    GASOLINA_LITRO: 2.30,
    DIESEL_LITRO: 2.70,
    TRANSPORTE_PUBLICO_VIAJE_KG: 0.5, 
    MOTO_LINEAL_KM_KG: 0.05, 
    RESIDUOS_NO_RECICLADOS_KG: 0.15,
    AGUA_M3: 0.0005,
};

const ESTIMACION_KWH_MES = { APARATOS_ALTO: 25 };
const REDUCCION_PANELES = 0.30; 
const RESIDUOS_BASE_KG = 30; 
const FACTOR_RECICLAJE = { bajo: 1.0, medio: 0.5, alto: 0.1 };
const MESES_ANIO = 12;
const KG_TO_TON = 0.001; 

let huellaPieChart; 
let userName = "Invitado";

// Variables globales para almacenar el estado de los botones de selección
let selectedGasType = 'glp'; 
let selectedReciclaje = 'bajo'; 
let selectedPaneles = 'no'; 
let selectedAuto = 'no';
let selectedMoto = 'no';

// Función CRÍTICA de redondeo
const redondear = (valor) => parseFloat(valor.toFixed(3));

// ======================================================================
// MANEJO DE ESTADO Y UX (Login, Navegación, Botones)
// ======================================================================

function startSurvey() {
    const inputName = document.getElementById('userName').value.trim();
    if (inputName) {
        userName = inputName.split(' ')[0]; 
        const welcomeModal = bootstrap.Modal.getInstance(document.getElementById('welcomeModal'));
        welcomeModal.hide();

        document.getElementById('wrapper').classList.remove('hidden');
        document.getElementById('navUserName').textContent = userName;
        document.getElementById('sidebarUserName').textContent = userName;
        
        showSection('calculadora-section');
        
        if (window.innerWidth >= 992) {
             document.getElementById('wrapper').classList.remove('toggled');
        }
    } else {
        alert("Por favor, ingresa tu nombre para empezar.");
        document.getElementById('userName').focus();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const welcomeModalElement = document.getElementById('welcomeModal');
    const welcomeModal = new bootstrap.Modal(welcomeModalElement);
    
    if (document.getElementById('wrapper').classList.contains('hidden')) {
        welcomeModal.show();
        document.getElementById('userName').focus();
    }
    
    // START BUTTON click y ENTER en el login
    document.getElementById('startBtn').addEventListener('click', startSurvey);
    document.getElementById('userName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            startSurvey();
        }
    });

    // TOGGLE DEL SIDEBAR
    document.getElementById('sidebarToggle').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('wrapper').classList.toggle('toggled');
    });
    
    // Configuración de enlaces del Sidebar
    document.querySelectorAll('#sidebar-wrapper a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });

    // Lógica para botones de selección (CORRECCIÓN VITAL)
    function setupToggleButton(selector, variableSetter, attribute, showGroup) {
        document.querySelectorAll(selector).forEach(btn => {
            btn.addEventListener('click', function() {
                const value = this.getAttribute(`data-${attribute}`);
                
                document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                variableSetter(value);
                
                if (showGroup) {
                    const groupElement = document.getElementById(showGroup);
                    if (groupElement) {
                        groupElement.classList.toggle('hidden', value === 'no');
                    }
                }
            });
        });
    }
    
    // Setters (Funciones para actualizar las variables globales)
    const setPaneles = (value) => selectedPaneles = value;
    const setAuto = (value) => selectedAuto = value;
    const setMoto = (value) => selectedMoto = value;
    const setGas = (value) => {
        selectedGasType = value;
        document.getElementById('gas_glp_group').classList.toggle('hidden', value !== 'glp');
        document.getElementById('gas_gnv_group').classList.toggle('hidden', value !== 'gnv');
    };
    const setReciclaje = (value) => selectedReciclaje = value;


    // Inicialización de botones del Test (Activa los botones)
    setupToggleButton('[data-solar]', setPaneles, 'solar', null); 
    setupToggleButton('[data-auto]', setAuto, 'auto', 'uso_auto_group');
    setupToggleButton('[data-moto]', setMoto, 'moto', 'uso_moto_group');
    
    document.querySelectorAll('#tipo_gas_buttons button').forEach(btn => {
        btn.addEventListener('click', function() {
            const tipo = this.getAttribute('data-gas-type');
            document.querySelectorAll('#tipo_gas_buttons button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            setGas(tipo); 
        });
    });

    document.querySelectorAll('.card-select-vivid').forEach(card => {
        card.addEventListener('click', function() {
            const nivel = this.getAttribute('data-reciclaje');
            document.querySelectorAll('.card-select-vivid').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            setReciclaje(nivel); 
        });
    });
    
    // Estado por defecto (simula clicks en los botones iniciales)
    document.querySelector('[data-gas-type="glp"]').click(); 
    document.querySelector('[data-solar="no"]').click();
    document.querySelector('[data-auto="no"]').click();
    document.querySelector('[data-moto="no"]').click();
    document.querySelector('.card-select-vivid[data-reciclaje="bajo"]').click(); 
});

// Función para cambiar entre apartados del formulario (Paso a Paso)
function nextTab(tabNumber) {
    const tabs = document.querySelectorAll('#apartados-form .tab-pane');
    tabs.forEach(tab => tab.classList.add('hidden'));
    
    const nextTabElement = document.querySelector(`#apartados-form [data-tab="${tabNumber}"]`);
    if (nextTabElement) {
        nextTabElement.classList.remove('hidden');
        // Transición ligera
        nextTabElement.style.opacity = 0;
        setTimeout(() => {
            nextTabElement.style.opacity = 1;
        }, 50);
        nextTabElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Función para mostrar solo una sección y actualizar el sidebar
function showSection(targetId) {
    document.querySelectorAll('section').forEach(section => section.classList.add('hidden'));
    
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        targetElement.classList.remove('hidden');
        
        document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(link => link.classList.remove('active'));
        const sidebarLink = document.querySelector(`#sidebar-wrapper a[href="#${targetId}"]`);
        if(sidebarLink) {
             sidebarLink.classList.add('active');
        }

        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ======================================================================
// LÓGICA DE CÁLCULO CENTRAL
// ======================================================================

document.getElementById('calculadoraForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    // 1. Obtener valores y 2. Cálculo
    const numPersonas = parseFloat(document.getElementById('personas').value) || 1;
    const aguaM3Mes = parseFloat(document.getElementById('agua').value) || 0;
    const glpBalonesMes = (selectedGasType === 'glp') ? (parseFloat(document.getElementById('glp').value) || 0) : 0;
    const gnvM3Mes = (selectedGasType === 'gnv') ? (parseFloat(document.getElementById('gnv').value) || 0) : 0;
    const tienePaneles = selectedPaneles === 'si'; 
    const electricidadKWhMesDirecto = parseFloat(document.getElementById('electricidad_directo').value) || 0;
    const aparatosAlto = parseFloat(document.getElementById('aparatos_alto').value) || 0;
    const litrosMes = (selectedAuto === 'si') ? (parseFloat(document.getElementById('litros_mes').value) || 0) : 0;
    const motoKm = (selectedMoto === 'si') ? (parseFloat(document.getElementById('moto_km_mes').value) || 0) : 0;
    const transportePublicoVeces = parseFloat(document.getElementById('transporte_publico_veces').value) || 0;
    const nivelReciclaje = selectedReciclaje;
    
    let electricidadKWhElectrodomesticos = aparatosAlto * ESTIMACION_KWH_MES.APARATOS_ALTO;
    let electricidadKWhMesTotal = electricidadKWhMesDirecto > 0 ? electricidadKWhMesDirecto : electricidadKWhElectrodomesticos;

    if (tienePaneles) { electricidadKWhMesTotal *= (1 - REDUCCION_PANELES); }
    
    const huellaElectricidadKg = electricidadKWhMesTotal * FACTORES.ELECTRICIDAD_KWH * MESES_ANIO;
    const huellaGLPKg = glpBalonesMes * FACTORES.GAS_LP_10KG * MESES_ANIO;
    const huellaGNVKg = gnvM3Mes * FACTORES.GAS_NATURAL_M3 * MESES_ANIO;
    const huellaEnergiaKg = huellaElectricidadKg + huellaGLPKg + huellaGNVKg; 
    
    const huellaAutoKg = litrosMes * FACTORES.GASOLINA_LITRO * MESES_ANIO; 
    const huellaMotoKg = motoKm * FACTORES.MOTO_LINEAL_KM_KG * MESES_ANIO;
    const huellaBusTaxiKg = transportePublicoVeces * FACTORES.TRANSPORTE_PUBLICO_VIAJE_KG * MESES_ANIO;
    const huellaTransporteKg = huellaAutoKg + huellaMotoKg + huellaBusTaxiKg;
    
    const residuosNoRecicladosKgMes = RESIDUOS_BASE_KG * numPersonas * FACTOR_RECICLAJE[nivelReciclaje];
    const huellaResiduosKg = residuosNoRecicladosKgMes * FACTORES.RESIDUOS_NO_RECICLADOS_KG * MESES_ANIO;
    const huellaAguaKg = aguaM3Mes * FACTORES.AGUA_M3 * MESES_ANIO;
    const huellaResiduosAguaKg = huellaResiduosKg + huellaAguaKg;

    const huellaTotalKg = huellaEnergiaKg + huellaTransporteKg + huellaResiduosAguaKg;
    const huellaTotalTon = redondear(huellaTotalKg * KG_TO_TON);
    
    const huellaEnergiaTon = redondear(huellaEnergiaKg * KG_TO_TON);
    const huellaTransporteTon = redondear(huellaTransporteKg * KG_TO_TON);
    const huellaResiduosAguaTon = redondear(huellaResiduosAguaKg * KG_TO_TON);
    const huellaPorPersonaTon = redondear(huellaTotalTon / numPersonas);

    // 3. Mostrar Resultados (Actualiza los IDs del HTML)
    
    document.getElementById('huellaTotal').textContent = huellaTotalTon.toFixed(3);
    document.getElementById('huellaPorPersona').textContent = huellaPorPersonaTon.toFixed(3);
    document.getElementById('recomUser').textContent = userName; // Muestra el nombre en Consejos Verdes
    
    showSection('resultados-section'); // ¡Muestra la sección de resultados!
    
    // Alerta Condicional
    const alertaDiv = document.getElementById('alerta-consumo');
    if (huellaPorPersonaTon > 3.0) {
        alertaDiv.innerHTML = `<div class="alert alert-danger-vivid text-center mb-4"><i class="fas fa-exclamation-triangle me-2"></i> <strong>¡Atención, ${userName}!</strong> Tu huella por persona es elevada. Revisa **Consejos Verdes**.</div>`;
    } else if (huellaPorPersonaTon > 1.5) {
         alertaDiv.innerHTML = `<div class="alert alert-warning-vivid text-center mb-4"><i class="fas fa-lightbulb me-2"></i> <strong>¡Buen trabajo, ${userName}!</strong> Tu huella es moderada. Aún hay margen de mejora.</div>`;
    } else {
         alertaDiv.innerHTML = `<div class="alert alert-success-vivid text-center mb-4"><i class="fas fa-trophy me-2"></i> <strong>¡Excelente, ${userName}!</strong> Tu huella es relativamente baja. ¡Sigue con tus buenos hábitos!</div>`;
    }

    // Actualizar Gráfico
    renderPieChart(huellaEnergiaTon, huellaTransporteTon, huellaResiduosAguaTon);
});


// LÓGICA DEL GRÁFICO (Chart.js)
function renderPieChart(energia, transporte, residuosAgua) {
    const ctx = document.getElementById('huellaPieChart').getContext('2d');
    
    if (huellaPieChart) {
        huellaPieChart.destroy();
    }

    huellaPieChart = new Chart(ctx, {
        type: 'doughnut', 
        data: {
            labels: ['Energía (Eléctrica/Gas)', 'Transporte', 'Residuos y Agua'],
            datasets: [{
                data: [energia, transporte, residuosAgua],
                backgroundColor: ['#ffc107', '#dc3545', '#4682b4'], 
                borderColor: ['#fff', '#fff', '#fff'],
                borderWidth: 5
            }]
        },
        options: {
            responsive: true,
            cutout: '75%', 
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Distribución de tu Huella por Categoría (tCO₂e)' }
            }
        }
    });
}