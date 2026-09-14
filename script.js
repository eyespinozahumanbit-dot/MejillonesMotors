let servicios = [];
let repuestos = [];
let repuestosVisible = false;
let modoOscuro = false;
let proformaHTML = '';
let numeroProforma = '';

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const hoy = new Date();
    const fechaStr = String(hoy.getDate()).padStart(2, '0') + '-' + 
                    String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                    hoy.getFullYear();
    document.getElementById('fecha').value = fechaStr;
    
    const ultimoNumero = localStorage.getItem('ultimo_numero_proforma');
    if (ultimoNumero) {
        const proximo = parseInt(ultimoNumero) + 1;
        document.getElementById('numero_proforma').value = String(proximo).padStart(6, '0');
    } else {
        document.getElementById('numero_proforma').value = '002500';
    }
    
    if (localStorage.getItem('modo_oscuro') === 'true') {
        modoOscuro = true;
        document.body.classList.add('dark-mode');
        document.getElementById('btnTema').innerHTML = '<i class="fas fa-sun"></i><span>Modo Claro</span>';
    }
    
    for (let i = 0; i < 3; i++) {
        agregarServicio();
    }
});

// ============================================
// NAVEGACIÓN
// ============================================
function mostrarVista(vistaId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(vistaId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarFormulario() { mostrarVista('vista-formulario'); }
function mostrarPrevisualizacion() { mostrarVista('vista-previsualizacion'); }
function volverAlFormulario() { mostrarFormulario(); }

// ============================================
// SERVICIOS
// ============================================
function agregarServicio() {
    const container = document.getElementById('servicios-container');
    const item = crearItem('servicio');
    container.appendChild(item);
    servicios.push(item);
}

function eliminarServicio(element) {
    const row = element.closest('.item-row');
    const container = document.getElementById('servicios-container');
    if (container.querySelectorAll('.item-row').length <= 1) {
        mostrarNotificacion('Debe haber al menos un servicio', 'warning');
        return;
    }
    row.remove();
    servicios = servicios.filter(item => item !== row);
}

function eliminarTodosServicios() {
    const container = document.getElementById('servicios-container');
    const items = container.querySelectorAll('.item-row');
    if (items.length === 0) return;
    if (!confirm('¿Desea eliminar todos los servicios?')) return;
    items.forEach((item, index) => {
        if (index > 0) item.remove();
    });
    servicios = [servicios[0]];
    mostrarNotificacion('Servicios eliminados, solo queda uno', 'info');
}

// ============================================
// REPUESTOS
// ============================================
function agregarRepuesto() {
    const container = document.getElementById('repuestos-container');
    const item = crearItem('repuesto');
    container.appendChild(item);
    repuestos.push(item);
}

function eliminarRepuesto(element) {
    const row = element.closest('.item-row');
    const container = document.getElementById('repuestos-container');
    if (container.querySelectorAll('.item-row').length <= 1) {
        mostrarNotificacion('Debe haber al menos un repuesto', 'warning');
        return;
    }
    row.remove();
    repuestos = repuestos.filter(item => item !== row);
}

function toggleRepuestos() {
    repuestosVisible = !repuestosVisible;
    const section = document.getElementById('repuestos-section');
    const btnText = document.getElementById('btnRepuestosText');
    
    if (repuestosVisible) {
        section.style.display = 'block';
        btnText.textContent = 'Ocultar Repuestos';
        const container = document.getElementById('repuestos-container');
        if (container.querySelectorAll('.item-row').length === 0) {
            agregarRepuesto();
        }
    } else {
        section.style.display = 'none';
        btnText.textContent = 'Mostrar Repuestos';
    }
}

// ============================================
// CREAR ITEM
// ============================================
function crearItem(tipo) {
    const div = document.createElement('div');
    div.className = `item-row ${tipo}`;
    
    const isServicio = tipo === 'servicio';
    const placeholder = isServicio ? 'Descripción del servicio...' : 'Descripción del repuesto...';
    
    div.innerHTML = `
        <div class="form-group">
            <label>Cant.</label>
            <input type="number" class="cantidad" value="1" min="1">
        </div>
        <div class="form-group">
            <label>Especificación</label>
            <textarea class="especificacion" placeholder="${placeholder}" rows="2"></textarea>
        </div>
        <div class="form-group">
            <label>Importe (Bs)</label>
            <input type="text" class="importe" placeholder="0.00">
        </div>
        <button class="btn-remove" onclick="${isServicio ? 'eliminarServicio' : 'eliminarRepuesto'}(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    const importeInput = div.querySelector('.importe');
    importeInput.addEventListener('blur', function() {
        let valor = this.value.replace(/,/g, '.').trim();
        if (valor === '') {
            this.value = '';
            return;
        }
        const num = parseFloat(valor);
        if (!isNaN(num) && num >= 0) {
            this.value = num.toFixed(2);
        } else {
            this.value = '';
        }
    });
    
    return div;
}

// ============================================
// RECOGER DATOS
// ============================================
function recogerDatos() {
    const numeroInput = document.getElementById('numero_proforma').value.trim();
    if (!numeroInput) {
        mostrarNotificacion('El número de pro-forma es obligatorio', 'error');
        return null;
    }
    
    const campos = ['propietario', 'telefono', 'marca', 'modelo', 'tipo_vehiculo', 'placa', 'anio', 'color'];
    const datos = {};
    
    for (const campo of campos) {
        const element = document.getElementById(campo);
        if (!element) return null;
        const value = element.value.trim();
        if (!value) {
            mostrarNotificacion(`El campo ${campo.replace('_', ' ')} es obligatorio`, 'error');
            return null;
        }
        datos[campo] = value;
    }
    
    datos.numero = numeroInput;
    datos.fecha = document.getElementById('fecha').value || new Date().toLocaleDateString('es-BO');
    
    datos.servicios = [];
    document.querySelectorAll('#servicios-container .item-row').forEach(row => {
        const cantidad = parseInt(row.querySelector('.cantidad')?.value || 1);
        const especificacion = row.querySelector('.especificacion')?.value?.trim() || '';
        const importeInput = row.querySelector('.importe');
        let importe = 0;
        if (importeInput && importeInput.value.trim() !== '') {
            importe = parseFloat(importeInput.value.replace(/,/g, '.').trim()) || 0;
        }
        if (especificacion) {
            datos.servicios.push({ cantidad, especificacion, importe });
        }
    });
    
    datos.repuestos = [];
    if (repuestosVisible) {
        document.querySelectorAll('#repuestos-container .item-row').forEach(row => {
            const cantidad = parseInt(row.querySelector('.cantidad')?.value || 1);
            const especificacion = row.querySelector('.especificacion')?.value?.trim() || '';
            const importeInput = row.querySelector('.importe');
            let importe = 0;
            if (importeInput && importeInput.value.trim() !== '') {
                importe = parseFloat(importeInput.value.replace(/,/g, '.').trim()) || 0;
            }
            if (especificacion) {
                datos.repuestos.push({ cantidad, especificacion, importe });
            }
        });
    }
    
    if (datos.servicios.length === 0 && datos.repuestos.length === 0) {
        mostrarNotificacion('Debe agregar al menos un servicio o repuesto', 'error');
        return null;
    }
    
    return datos;
}

// ============================================
// UTILIDADES
// ============================================
function limpiarNumero(valor) {
    if (valor === null || valor === undefined || valor === '') return 0;
    if (typeof valor === 'number') return valor;
    let limpio = String(valor).trim().replace(',', '.');
    limpio = limpio.replace(/[^0-9.]/g, '');
    const num = parseFloat(limpio);
    return isNaN(num) ? 0 : num;
}

function formatearNumero(numero) {
    if (typeof numero === 'string') numero = limpiarNumero(numero);
    if (numero === 0) return "0";
    const partes = numero.toFixed(2).split('.');
    const entera = parseInt(partes[0]).toLocaleString('en-US');
    const decimal = partes[1];
    return decimal !== "00" ? `${entera}.${decimal}` : entera;
}

function numeroALetras(numero) {
    const numeroStr = parseFloat(numero).toFixed(2);
    const partes = numeroStr.split('.');
    const parteEntera = parseInt(partes[0]);
    const parteDecimal = parseInt(partes[1]);
    
    if (parteEntera === 0 && parteDecimal === 0) return "Cero Bolivianos";
    
    let letras = numeroALetrasEntero(parteEntera);
    if (parteEntera > 0) letras += " Bolivianos";
    
    if (parteDecimal > 0) {
        const centavosLetras = centavosALetras(parteDecimal);
        if (centavosLetras) letras += ` con ${centavosLetras} centavos`;
    }
    
    return letras;
}

function centavosALetras(num) {
    if (num === 0) return "";
    const palabras = {
        1: "un", 2: "dos", 3: "tres", 4: "cuatro", 5: "cinco",
        6: "seis", 7: "siete", 8: "ocho", 9: "nueve",
        10: "diez", 11: "once", 12: "doce", 13: "trece",
        14: "catorce", 15: "quince"
    };
    if (palabras[num]) return palabras[num];
    if (num >= 16 && num <= 19) {
        return ["dieciséis", "diecisiete", "dieciocho", "diecinueve"][num - 16];
    }
    if (num >= 20 && num <= 29) {
        if (num === 20) return "veinte";
        const unid = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
        return `veinti${unid[num - 20]}`;
    }
    const decenas = {
        3: "treinta", 4: "cuarenta", 5: "cincuenta",
        6: "sesenta", 7: "setenta", 8: "ochenta", 9: "noventa"
    };
    const d = Math.floor(num / 10);
    const u = num % 10;
    if (decenas[d]) {
        if (u === 0) return decenas[d];
        const unid = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
        return `${decenas[d]} y ${unid[u]}`;
    }
    return String(num);
}

function numeroALetrasEntero(num) {
    if (num === 0) return '';
    if (num === 100) return 'Cien';
    
    const unidades = ['', 'Un', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve'];
    const decenas = ['', 'Diez', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa'];
    const centenas = ['', 'Cien', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos'];
    
    if (num < 10) return unidades[num];
    if (num < 20) {
        const esp = ['Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve'];
        return esp[num - 10];
    }
    if (num >= 20 && num <= 29) {
        if (num === 20) return 'Veinte';
        const unid = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        if (num === 21) return 'Veintiún';
        return `Veinti${unid[num - 20]}`;
    }
    if (num < 100) {
        const d = Math.floor(num / 10);
        const u = num % 10;
        if (u === 0) return decenas[d];
        return `${decenas[d]} y ${unidades[u]}`;
    }
    if (num < 1000) {
        const c = Math.floor(num / 100);
        const resto = num % 100;
        if (c === 1 && resto === 0) return 'Cien';
        if (c === 1) return 'Ciento ' + numeroALetrasEntero(resto);
        if (resto === 0) return centenas[c];
        return `${centenas[c]} ${numeroALetrasEntero(resto)}`;
    }
    if (num < 1000000) {
        const miles = Math.floor(num / 1000);
        const resto = num % 1000;
        const textoMiles = miles === 1 ? 'Mil' : `${numeroALetrasEntero(miles)} Mil`;
        if (resto === 0) return textoMiles;
        return `${textoMiles} ${numeroALetrasEntero(resto)}`;
    }
    return String(num);
}

// ============================================
// GENERAR HTML PROFORMA
// ============================================
function generarHTMLProforma(datos) {
    const totalServicios = datos.servicios.reduce((s, i) => s + limpiarNumero(i.importe), 0);
    const totalRepuestos = datos.repuestos.reduce((s, i) => s + limpiarNumero(i.importe), 0);
    const totalGeneral = totalServicios + totalRepuestos;
    const totalLetras = numeroALetras(totalGeneral);
    
    let filasServicios = '';
    datos.servicios.forEach((item, i) => {
        const bg = i % 2 === 0 ? '#f8f9fa' : '#ffffff';
        const importeStr = formatearNumero(limpiarNumero(item.importe));
        const espec = String(item.especificacion).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        filasServicios += `
            <tr style="background-color: ${bg};">
                <td style="padding: 7px 10px; text-align: center; vertical-align: top;">${item.cantidad}</td>
                <td style="padding: 7px 10px; text-align: left; white-space: pre-line; word-wrap: break-word; max-width: 400px; line-height: 1.6;">${espec}</td>
                <td style="padding: 7px 10px; text-align: right; font-weight: 600; vertical-align: top;">Bs ${importeStr}</td>
            </tr>
        `;
    });
    
    let filasRepuestos = '';
    datos.repuestos.forEach((item, i) => {
        const bg = i % 2 === 0 ? '#fff8f0' : '#ffffff';
        const importeStr = formatearNumero(limpiarNumero(item.importe));
        const espec = String(item.especificacion).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        filasRepuestos += `
            <tr style="background-color: ${bg};">
                <td style="padding: 7px 10px; text-align: center; vertical-align: top;">${item.cantidad}</td>
                <td style="padding: 7px 10px; text-align: left; white-space: pre-line; word-wrap: break-word; max-width: 400px; line-height: 1.6;">${espec}</td>
                <td style="padding: 7px 10px; text-align: right; font-weight: 600; vertical-align: top;">Bs ${importeStr}</td>
            </tr>
        `;
    });
    
    let htmlServicios = '';
    if (datos.servicios.length > 0) {
        htmlServicios = `
            <div style="margin-bottom: 18px; page-break-inside: avoid;">
                <h3 style="color: #1a3a6b; font-size: 15px; margin-bottom: 8px; font-weight: 700;">🛠️ DETALLE DE SERVICIOS MECANICA/CHAPA Y PINTURA</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
                    <thead>
                        <tr style="background: #1a3a6b; color: #ffffff;">
                            <th style="padding: 8px 10px; text-align: left; font-weight: 600; font-size: 12px; width: 10%;">Cant.</th>
                            <th style="padding: 8px 10px; text-align: left; font-weight: 600; font-size: 12px; width: 65%;">Especificaciones</th>
                            <th style="padding: 8px 10px; text-align: right; font-weight: 600; font-size: 12px; width: 25%;">Importe Bs</th>
                        </tr>
                    </thead>
                    <tbody>${filasServicios}</tbody>
                    <tfoot>
                        <tr style="background: #1a3a6b; color: #ffffff;">
                            <td colspan="2" style="padding: 6px 10px; text-align: right; font-weight: 700; font-size: 13px;">TOTAL SERVICIOS</td>
                            <td style="padding: 6px 10px; text-align: right; font-weight: 700; font-size: 13px;">Bs ${formatearNumero(totalServicios)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }
    
    let htmlRepuestos = '';
    if (datos.repuestos.length > 0) {
        htmlRepuestos = `
            <div style="margin: 18px 0; padding-top: 12px; border-top: 2px solid #e2e8f0; page-break-inside: avoid;">
                <h3 style="color: #1a3a6b; font-size: 15px; margin-bottom: 8px; font-weight: 700;">🔧 DETALLE DE REPUESTOS</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
                    <thead>
                        <tr style="background: #d48c2c; color: #ffffff;">
                            <th style="padding: 8px 10px; text-align: left; font-weight: 600; font-size: 12px; width: 10%;">Cant.</th>
                            <th style="padding: 8px 10px; text-align: left; font-weight: 600; font-size: 12px; width: 65%;">Especificaciones</th>
                            <th style="padding: 8px 10px; text-align: right; font-weight: 600; font-size: 12px; width: 25%;">Importe Bs</th>
                        </tr>
                    </thead>
                    <tbody>${filasRepuestos}</tbody>
                    <tfoot>
                        <tr style="background: #d48c2c; color: #ffffff;">
                            <td colspan="2" style="padding: 6px 10px; text-align: right; font-weight: 700; font-size: 13px;">TOTAL REPUESTOS</td>
                            <td style="padding: 6px 10px; text-align: right; font-weight: 700; font-size: 13px;">Bs ${formatearNumero(totalRepuestos)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }
    
    let htmlTotalGeneral = '';
    if (datos.servicios.length > 0 && datos.repuestos.length > 0) {
        htmlTotalGeneral = `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #1a3a6b; page-break-inside: avoid;">
                <div style="background: #1a3a6b; color: #ffffff; padding: 10px 16px; border-radius: 4px; display: flex; justify-content: flex-end; font-size: 16px; font-weight: 700;">
                    <span style="margin-right: 35px;">TOTAL GENERAL</span>
                    <span>Bs ${formatearNumero(totalGeneral)}</span>
                </div>
            </div>
        `;
    }
    
    const numeroFormateado = String(datos.numero).padStart(6, '0');
    
    return `
        <div class="proforma-header">
            <div>
                <div class="empresa">
                    <img src="logo.png" style="height: 55px; width: 55px; object-fit: contain; margin-right: 12px;" onerror="this.style.display='none'">
                    <h1>MEJILLONES MOTORS</h1>
                </div>
                <p class="slogan">Mantenimiento preventivo y correctivo - Reparación de motores y electricidad en General - Chapa y pintura - Especialidad en vehículos siniestrados en general</p>
                <p class="direccion">Calle Cuba casi Esq. Guatemala #1187 (Zona Miraflores) • Cel: 69881115</p>
                <p class="direccion">mejillonesmotors@gmail.com</p>
            </div>
            <div class="header-right">
                <h2>PRO-FORMA</h2>
                <p class="numero">N°: ${numeroFormateado}</p>
                <p class="fecha-text"><strong>Fecha:</strong> ${datos.fecha}</p>
            </div>
        </div>
        
        <div class="info-cliente">
            <div class="item"><span class="label">Propietario:</span><span class="value">${datos.propietario}</span></div>
            <div class="item"><span class="label">Teléfono:</span><span class="value">${datos.telefono}</span></div>
            <div class="item"><span class="label">Vehículo:</span><span class="value">${datos.tipo_vehiculo}</span></div>
            <div class="item"><span class="label">Placa:</span><span class="value">${datos.placa}</span></div>
            <div class="item"><span class="label">Marca:</span><span class="value">${datos.marca}</span></div>
            <div class="item"><span class="label">Modelo:</span><span class="value">${datos.modelo}</span></div>
            <div class="item"><span class="label">Color:</span><span class="value">${datos.color}</span></div>
            <div class="item"><span class="label">Año:</span><span class="value">${datos.anio}</span></div>
        </div>
        
        ${htmlServicios}
        ${htmlRepuestos}
        ${htmlTotalGeneral}
        
        <div class="total-letras">
            <strong>Son:</strong> ${totalLetras}
        </div>
        
        <div style="display: flex; justify-content: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; page-break-inside: avoid;">
            <div style="text-align: center; width: 300px;">
                <img src="firma.png" style="max-height: 80px; max-width: 220px; object-fit: contain; display: block; margin: 0 auto -6px auto;" onerror="this.style.display='none'">
                <p style="margin: 3px 0; font-size: 12px; color: #2d3748;">_________________________</p>
                <p style="margin: 3px 0; font-size: 12px; color: #2d3748;"><strong>Grover Mejillones Ch.</strong></p>
                <p style="margin: 3px 0; font-size: 11px; color: #718096;">Gerente Propietario</p>
            </div>
        </div>
    `;
}

// ============================================
// FINALIZAR
// ============================================
function finalizarProforma() {
    const datos = recogerDatos();
    if (!datos) return;
    
    try {
        proformaHTML = generarHTMLProforma(datos);
        numeroProforma = String(datos.numero).padStart(6, '0');
        
        document.getElementById('proforma-papel').innerHTML = proformaHTML;
        localStorage.setItem('ultimo_numero_proforma', datos.numero);
        
        mostrarPrevisualizacion();
        mostrarNotificacion(`✅ Pro-Forma #${numeroProforma} generada`, 'success');
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al generar la proforma: ' + error.message, 'error');
    }
}

// ============================================
// NUEVA PROFORMA
// ============================================
function nuevaProforma() {
    if (!confirm('¿Desea crear una nueva pro-forma? Los datos actuales se perderán.')) return;
    
    const campos = ['propietario', 'telefono', 'marca', 'modelo', 'tipo_vehiculo', 'placa', 'anio', 'color'];
    for (const campo of campos) {
        document.getElementById(campo).value = '';
    }
    
    const ultimoNumero = localStorage.getItem('ultimo_numero_proforma');
    if (ultimoNumero) {
        const proximo = parseInt(ultimoNumero) + 1;
        document.getElementById('numero_proforma').value = String(proximo).padStart(6, '0');
    }
    
    const containerServicios = document.getElementById('servicios-container');
    containerServicios.innerHTML = '';
    servicios = [];
    for (let i = 0; i < 3; i++) agregarServicio();
    
    const containerRepuestos = document.getElementById('repuestos-container');
    containerRepuestos.innerHTML = '';
    repuestos = [];
    if (repuestosVisible) agregarRepuesto();
    
    document.getElementById('proforma-papel').innerHTML = '';
    proformaHTML = '';
    numeroProforma = '';
    
    mostrarFormulario();
    mostrarNotificacion('Formulario reiniciado', 'info');
}

// ============================================
// IMPRIMIR
// ============================================
function generarHTMLImpresion() {
    const baseURL = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const htmlConURLs = proformaHTML
        .replace(/src="logo\.png"/g, `src="${baseURL}logo.png"`)
        .replace(/src="firma\.png"/g, `src="${baseURL}firma.png"`);
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Pro-Forma ${numeroProforma}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; color: #1a2332; line-height: 1.5; }
        body { padding: 15mm; width: 210mm; min-height: 297mm; margin: 0 auto; }
        .proforma-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 3px double #1a3a6b; margin-bottom: 16px; }
        .empresa { display: flex; align-items: center; }
        .empresa h1 { color: #1a3a6b; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 0.5px; }
        .slogan { color: #4a5568; font-style: italic; font-size: 11px; margin: 3px 0; max-width: 480px; }
        .direccion { color: #718096; font-size: 11px; margin: 1px 0; }
        .header-right { text-align: right; flex-shrink: 0; margin-left: 20px; }
        .header-right h2 { color: #1a3a6b; font-size: 18px; font-weight: 800; margin: 0; }
        .numero { font-size: 15px; color: #2a5298; font-weight: 700; margin-top: 4px; }
        .fecha-text { color: #4a5568; margin-top: 3px; font-size: 12px; }
        .info-cliente { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 30px; margin-bottom: 18px; padding: 12px 16px; background: #f7f9fc; border-radius: 6px; border: 1px solid #e2e8f0; }
        .info-cliente .item { display: flex; gap: 5px; font-size: 12px; }
        .info-cliente .label { font-weight: 600; color: #1a3a6b; white-space: nowrap; }
        .info-cliente .value { color: #2d3748; word-break: break-word; }
        table { width: 100%; border-collapse: collapse; }
        table th { padding: 8px 10px; text-align: left; font-weight: 600; font-size: 12px; }
        table td { padding: 6px 10px; text-align: left; font-size: 13px; }
        .total-letras { background: #edf2f7; padding: 10px 14px; border-left: 4px solid #2a5298; margin: 16px 0; border-radius: 4px; font-size: 13px; }
        .total-letras strong { color: #1a3a6b; }
        @page { size: A4 portrait; margin: 15mm; }
        @media print {
            html, body { width: auto; min-height: auto; padding: 0; }
            body { padding: 0; }
            .info-cliente { background: #f7f9fc !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .total-letras { background: #edf2f7 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            table thead { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            table tfoot { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
    </style>
</head>
<body>
    ${htmlConURLs}
</body>
</html>`;
}

function imprimirProforma() {
    if (!proformaHTML) {
        mostrarNotificacion('No hay proforma para imprimir', 'warning');
        return;
    }
    
    const ventana = window.open('', '_blank');
    if (!ventana) {
        mostrarNotificacion('Permita ventanas emergentes para imprimir', 'warning');
        return;
    }
    
    ventana.document.write(generarHTMLImpresion());
    ventana.document.close();
    
    ventana.onload = function() {
        setTimeout(() => {
            ventana.focus();
            ventana.print();
        }, 600);
    };
}

// ============================================
// DESCARGAR PDF - CORREGIDO (PROPORCIONES EXACTAS A4)
// ============================================
// Cambios respecto a la versión anterior:
//  1. El <body> del iframe ya NO tiene padding. El padding va en un div interno (#contenido-pdf).
//  2. html2canvas captura SOLO el div interno (#contenido-pdf), no el body.
//  3. La altura del PDF se calcula con el ratio REAL del canvas (canvas.height / canvas.width),
//     no con un ancho inventado. Esto elimina el estiramiento vertical.
async function descargarPDF() {
    if (!proformaHTML) {
        mostrarNotificacion('No hay proforma para descargar', 'warning');
        return;
    }
    
    mostrarNotificacion('📥 Generando PDF...', 'info');
    
    // Convertir imágenes a base64 (evita problemas de carga en el iframe)
    const logoBase64 = await convertirImagenABase64('logo.png');
    const firmaBase64 = await convertirImagenABase64('firma.png');
    
    let htmlFinal = proformaHTML;
    if (logoBase64) htmlFinal = htmlFinal.replace(/src="logo\.png"/g, `src="${logoBase64}"`);
    if (firmaBase64) htmlFinal = htmlFinal.replace(/src="firma\.png"/g, `src="${firmaBase64}"`);
    
    // HTML del iframe: body SIN padding, div interno CON padding.
    // El ancho del body = 794px (A4 exacto a 96 DPI).
    const htmlIframe = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
        background: #ffffff;
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #1a2332;
        line-height: 1.5;
        width: 794px;
    }
    #contenido-pdf {
        width: 794px;
        box-sizing: border-box;
        padding: 40px 45px;
        background: #ffffff;
    }
    .proforma-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 3px double #1a3a6b; margin-bottom: 16px; }
    .empresa { display: flex; align-items: center; }
    .empresa h1 { color: #1a3a6b; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 0.5px; }
    .slogan { color: #4a5568; font-style: italic; font-size: 11px; margin: 3px 0; max-width: 480px; }
    .direccion { color: #718096; font-size: 11px; margin: 1px 0; }
    .header-right { text-align: right; flex-shrink: 0; margin-left: 20px; }
    .header-right h2 { color: #1a3a6b; font-size: 18px; font-weight: 800; margin: 0; }
    .numero { font-size: 15px; color: #2a5298; font-weight: 700; margin-top: 4px; }
    .fecha-text { color: #4a5568; margin-top: 3px; font-size: 12px; }
    .info-cliente { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 30px; margin-bottom: 18px; padding: 12px 16px; background: #f7f9fc; border-radius: 6px; border: 1px solid #e2e8f0; }
    .info-cliente .item { display: flex; gap: 5px; font-size: 12px; }
    .info-cliente .label { font-weight: 600; color: #1a3a6b; white-space: nowrap; }
    .info-cliente .value { color: #2d3748; word-break: break-word; }
    table { width: 100%; border-collapse: collapse; }
    table th { padding: 8px 10px; text-align: left; font-weight: 600; font-size: 12px; }
    table td { padding: 6px 10px; text-align: left; font-size: 13px; }
    .total-letras { background: #edf2f7; padding: 10px 14px; border-left: 4px solid #2a5298; margin: 16px 0; border-radius: 4px; font-size: 13px; }
    .total-letras strong { color: #1a3a6b; }
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
</head>
<body>
<div id="contenido-pdf">${htmlFinal}</div>
<script>
    // Se expone al padre para generar el canvas del div #contenido-pdf
    window.generarCanvas = function() {
        return new Promise(function(resolve, reject) {
            var elemento = document.getElementById('contenido-pdf');
            if (!elemento) { reject(new Error('No se encontró el contenido')); return; }
            
            var intentos = 0;
            var maxIntentos = 50;
            
            function verificar() {
                intentos++;
                var todasListas = true;
                elemento.querySelectorAll('img').forEach(function(img) {
                    if (!img.complete || img.naturalHeight === 0) todasListas = false;
                });
                
                if (todasListas || intentos > maxIntentos) {
                    setTimeout(function() {
                        html2canvas(elemento, {
                            scale: 2,
                            useCORS: true,
                            allowTaint: true,
                            backgroundColor: '#ffffff',
                            logging: false,
                            width: 794,
                            windowWidth: 794
                        }).then(function(canvas) {
                            resolve(canvas);
                        }).catch(function(err) {
                            reject(err);
                        });
                    }, 400);
                } else {
                    setTimeout(verificar, 100);
                }
            }
            
            verificar();
        });
    };
<\/script>
</body>
</html>`;
    
    let iframe = null;
    try {
        // Crear iframe oculto
        iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;left:-99999px;top:0;width:794px;height:2000px;border:0;';
        document.body.appendChild(iframe);
        
        // Escribir el HTML en el iframe
        const idoc = iframe.contentDocument || iframe.contentWindow.document;
        idoc.open();
        idoc.write(htmlIframe);
        idoc.close();
        
        // Esperar a que el iframe cargue completamente (incluyendo html2canvas)
        await new Promise((resolve, reject) => {
            let verificado = false;
            const timeout = setTimeout(() => {
                if (!verificado) reject(new Error('Tiempo de espera agotado al cargar el iframe'));
            }, 10000);
            
            function verificar() {
                try {
                    const win = iframe.contentWindow;
                    if (win && win.generarCanvas && win.document.readyState === 'complete') {
                        verificado = true;
                        clearTimeout(timeout);
                        resolve();
                    } else {
                        setTimeout(verificar, 100);
                    }
                } catch (e) {
                    setTimeout(verificar, 100);
                }
            }
            verificar();
        });
        
        // Esperar un poco más para asegurar que html2canvas esté listo
        await new Promise(r => setTimeout(r, 500));
        
        // Generar canvas (dentro del iframe)
        const canvas = await iframe.contentWindow.generarCanvas();
        if (!canvas) throw new Error('No se pudo generar el canvas');
        
        // Verificar que el canvas tenga contenido real
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (!imgData || imgData === 'data:,' || imgData.length < 5000) {
            throw new Error('El canvas está vacío');
        }
        
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('jsPDF no está cargado en el navegador');
        }
        
        // === CÁLCULO CORRECTO DE PROPORCIONES ===
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
        
        const pageWidthMM  = 210;
        const pageHeightMM = 297;
        const marginMM     = 10;   // margen de la hoja en el PDF
        
        const contentWidthMM  = pageWidthMM  - (marginMM * 2); // 190mm
        const contentHeightMM = pageHeightMM - (marginMM * 2); // 277mm
        
        // ⚠️ CLAVE: la proporción real del canvas (sin inventar anchos)
        const ratio = canvas.height / canvas.width;
        
        // Ancho final en el PDF = 190mm (área útil A4)
        // Alto final en el PDF = 190mm × ratio (mantiene proporción EXACTA)
        const imgWidthMM  = contentWidthMM;
        const imgHeightMM = contentWidthMM * ratio;
        
        // Paginación manual con jsPDF
        let heightLeft = imgHeightMM;
        let position = marginMM;
        
        pdf.addImage(imgData, 'JPEG', marginMM, position, imgWidthMM, imgHeightMM);
        heightLeft -= contentHeightMM;
        
        while (heightLeft > 0) {
            position = marginMM - (imgHeightMM - heightLeft);
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', marginMM, position, imgWidthMM, imgHeightMM);
            heightLeft -= contentHeightMM;
        }
        
        pdf.save(`ProForma_${numeroProforma || 'MejillonesMotors'}.pdf`);
        
        mostrarNotificacion('✅ PDF descargado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarNotificacion('Error al generar el PDF: ' + error.message, 'error');
    } finally {
        if (iframe && iframe.parentNode) {
            document.body.removeChild(iframe);
        }
    }
}

// ============================================
// Convertir imagen a Base64
// ============================================
function convertirImagenABase64(ruta) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            } catch (e) {
                console.warn('No se pudo convertir imagen:', ruta, e);
                resolve(null);
            }
        };
        img.onerror = function() {
            console.warn('No se pudo cargar imagen:', ruta);
            resolve(null);
        };
        img.src = ruta;
    });
}

// ============================================
// TEMA
// ============================================
function cambiarTema() {
    modoOscuro = !modoOscuro;
    document.body.classList.toggle('dark-mode', modoOscuro);
    localStorage.setItem('modo_oscuro', modoOscuro);
    const btn = document.getElementById('btnTema');
    btn.innerHTML = modoOscuro
        ? '<i class="fas fa-sun"></i><span>Modo Claro</span>'
        : '<i class="fas fa-moon"></i><span>Modo Oscuro</span>';
}

// ============================================
// NOTIFICACIONES
// ============================================
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notif = document.createElement('div');
    notif.className = `notification notification-${tipo}`;
    const iconos = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    notif.innerHTML = `<i class="fas ${iconos[tipo] || iconos.info}"></i><span>${mensaje}</span>`;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}