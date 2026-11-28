/**
 * ============================================================================
 * MOTOSTOCK PRO — Controlador de Pantalla y Eventos (js/app.js)
 * Responsable: Integrante 3
 * ----------------------------------------------------------------------------
 * Funciones principales:
 *  1. Sincronizar el estado visual de filtros, búsqueda y ordenamiento.
 *  2. Renderizar KPIs y tarjetas de repuestos en #catalogo de forma segura.
 *  3. Delegar eventos de despacho (-1), reabastecimiento (+1) y eliminación.
 *  4. Controlar el modal de confirmación y la notificación flotante (Toast)
 *     con opción de "Deshacer" tras eliminar un repuesto.
 * ============================================================================
 */

// Estado central de la interfaz (inventario en memoria, filtros activos y Deshacer)
const estadoApp = {
  inventario: [],
  texto: '',
  categoria: 'Todos',
  moto: 'Todas',
  orden: 'defecto',
  soloCriticos: false,
  idPendienteEliminar: null,
  ultimoEliminado: null, // Guarda { repuesto, indice } para restaurar
  temporizadorToast: null
};

// ============================================================================
// 1. UTILIDADES DE FORMATO Y CONSTRUCCIÓN SEGURA DEL DOM
// ============================================================================

/**
 * Formatea un número entero a pesos colombianos (ej. 45000 -> "$45.000")
 * @param {number} valor
 * @returns {string}
 */
function formatearCOP(valor) {
  return '$' + Math.round(Number(valor) || 0).toLocaleString('es-CO');
}

/**
 * Crea un elemento HTML con clase y texto seguro (sin innerHTML)
 * @param {string} etiqueta
 * @param {string} [clase]
 * @param {string} [texto]
 * @returns {HTMLElement}
 */
function crearElemento(etiqueta, clase = '', texto = '') {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== '') el.textContent = texto;
  return el;
}

/**
 * Crea un nodo SVG con namespace correcto
 * @param {string} etiqueta
 * @param {Object} [atributos]
 * @returns {SVGElement}
 */
function crearNodoSVG(etiqueta, atributos = {}) {
  const nodo = document.createElementNS('http://www.w3.org/2000/svg', etiqueta);
  Object.entries(atributos).forEach(([clave, valor]) => {
    nodo.setAttribute(clave, String(valor));
  });
  return nodo;
}

/**
 * Genera el plano técnico SVG según la categoría del repuesto
 * @param {string} categoria
 * @returns {SVGElement}
 */
function crearIconoBlueprint(categoria) {
  const svg = crearNodoSVG('svg', {
    viewBox: '0 0 48 48',
    width: '38',
    height: '38',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  });

  switch (categoria) {
    case 'Frenos':
      svg.append(
        crearNodoSVG('circle', { cx: '24', cy: '24', r: '15' }),
        crearNodoSVG('circle', { cx: '24', cy: '24', r: '6' }),
        crearNodoSVG('path', { d: 'M24 9v4M24 35v4M9 24h4M35 24h4' })
      );
      break;
    case 'Arrastre':
      svg.append(
        crearNodoSVG('circle', { cx: '16', cy: '24', r: '9' }),
        crearNodoSVG('circle', { cx: '34', cy: '24', r: '5' }),
        crearNodoSVG('path', { d: 'M16 15l18 4M16 33l18-4' })
      );
      break;
    case 'Eléctrico':
      svg.append(
        crearNodoSVG('path', { d: 'M27 6L14 26h10l-3 16 13-20H24l3-16z' })
      );
      break;
    case 'Suspensión':
      svg.append(
        crearNodoSVG('path', { d: 'M24 6v6M18 12h12l-12 6 12 6-12 6 12 6H18M24 36v6' })
      );
      break;
    case 'Motor':
    default:
      svg.append(
        crearNodoSVG('rect', { x: '13', y: '10', width: '22', height: '16', rx: '3' }),
        crearNodoSVG('line', { x1: '13', y1: '15', x2: '35', y2: '15' }),
        crearNodoSVG('path', { d: 'M20 26l-2 10M28 26l2 10' }),
        crearNodoSVG('circle', { cx: '24', cy: '38', r: '4' })
      );
      break;
  }

  return svg;
}

// ============================================================================
// 2. CONEXIÓN CON datos.js Y filtros.js
// ============================================================================

/**
 * Obtiene los 4 indicadores KPI usando calcularTotales() de filtros.js
 * @param {Array<Object>} inventario
 */
function obtenerKPIsSeguros(inventario) {
  if (typeof calcularTotales === 'function') {
    return calcularTotales(inventario);
  }
  return {
    valorBodega: inventario.reduce((acc, item) => acc + item.precio * item.stock, 0),
    stockOptimo: inventario.filter((item) => item.stock > 15).length,
    alertasCriticas: inventario.filter((item) => item.stock <= 15).length,
    totalReferencias: inventario.length
  };
}

/**
 * Filtra y ordena el catálogo usando filtrarInventario() y ordenarInventario() de filtros.js
 * @param {Array<Object>} inventario
 * @returns {Array<Object>}
 */
function obtenerCatalogoFiltradoSeguro(inventario) {
  const filtrados =
    typeof filtrarInventario === 'function'
      ? filtrarInventario(inventario, estadoApp)
      : [...inventario];

  return typeof ordenarInventario === 'function'
    ? ordenarInventario(filtrados, estadoApp.orden)
    : filtrados;
}

// ============================================================================
// 3. FUNCIONES DE RENDERIZADO DEL DOM (KPIs, PILLS Y TARJETAS)
// ============================================================================

/**
 * Actualiza los 4 contadores KPI y el estado visual de la tarjeta de alertas críticas
 * @param {Array<Object>} inventario
 */
function renderKPIs(inventario) {
  const totales = obtenerKPIsSeguros(inventario);

  const elValor = document.getElementById('kpi-valor');
  const elOptimo = document.getElementById('kpi-optimo');
  const elCriticos = document.getElementById('kpi-criticos');
  const elTotal = document.getElementById('kpi-total');
  const cardCriticos = document.getElementById('card-kpi-criticos');

  if (elValor) elValor.textContent = formatearCOP(totales.valorBodega);
  if (elOptimo) elOptimo.textContent = `${totales.stockOptimo} refs`;
  if (elCriticos) elCriticos.textContent = `${totales.alertasCriticas} refs`;
  if (elTotal) elTotal.textContent = `${totales.totalReferencias} refs`;

  if (cardCriticos) {
    cardCriticos.classList.toggle('kpi-activo', estadoApp.soloCriticos);
    cardCriticos.setAttribute('aria-pressed', String(estadoApp.soloCriticos));
  }
}

/**
 * Sincroniza la clase .pill-activa en los botones de categoría
 */
function renderPillsActivas() {
  const botones = document.querySelectorAll('#filtro-categorias .pill');
  botones.forEach((btn) => {
    const esActiva = btn.dataset.categoria === estadoApp.categoria;
    btn.classList.toggle('pill-activa', esActiva);
  });
}

/**
 * Construye el elemento DOM completo de una tarjeta de repuesto
 * @param {Object} repuesto
 * @returns {HTMLElement}
 */
function crearTarjetaRepuesto(repuesto) {
  const esCritico = repuesto.stock <= 15;
  const sinStock = repuesto.stock <= 0;

  // Contenedor principal de la tarjeta
  const card = crearElemento(
    'article',
    esCritico ? 'tarjeta-repuesto tarjeta-critica' : 'tarjeta-repuesto'
  );

  // --- A. Encabezado: Categoría + Botón Eliminar ---
  const header = crearElemento('div', 'tarjeta-header');
  const badgeCat = crearElemento('span', 'badge-categoria', repuesto.categoria);

  const btnEliminar = crearElemento('button', 'btn-eliminar-card');
  btnEliminar.type = 'button';
  btnEliminar.title = 'Eliminar repuesto';
  btnEliminar.setAttribute('aria-label', `Eliminar ${repuesto.nombre}`);
  btnEliminar.dataset.accion = 'eliminar';
  btnEliminar.dataset.id = repuesto.id;

  const iconoPapelera = crearNodoSVG('svg', {
    viewBox: '0 0 24 24',
    width: '15',
    height: '15',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  });
  iconoPapelera.append(
    crearNodoSVG('path', { d: 'M3 6h18' }),
    crearNodoSVG('path', { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' }),
    crearNodoSVG('path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' })
  );
  btnEliminar.appendChild(iconoPapelera);
  header.append(badgeCat, btnEliminar);

  // --- B. Cuerpo: Plano SVG + Nombre, SKU y Moto ---
  const body = crearElemento('div', 'tarjeta-body');
  const cajaBlueprint = crearElemento('div', 'caja-blueprint');
  cajaBlueprint.setAttribute('aria-hidden', 'true');
  cajaBlueprint.appendChild(crearIconoBlueprint(repuesto.categoria));

  const info = crearElemento('div', 'tarjeta-info');
  const titulo = crearElemento('h3', 'tarjeta-nombre', repuesto.nombre);
  titulo.title = repuesto.nombre;
  const sku = crearElemento('p', 'tarjeta-sku', repuesto.sku);
  const moto = crearElemento('p', 'tarjeta-moto', `Compatible: ${repuesto.moto}`);

  info.append(titulo, sku, moto);
  body.append(cajaBlueprint, info);

  // --- C. Tacómetro de Stock (10 barras) ---
  const tacometro = crearElemento('div', 'tacometro-wrapper');
  const tacoInfo = crearElemento('div', 'tacometro-info');

  const estadoTexto = sinStock ? 'Agotado' : esCritico ? 'Stock crítico' : 'Óptimo';
  const etiquetaStock = crearElemento('span', 'texto-secundario', 'Existencias');
  const valorStock = crearElemento(
    'span',
    esCritico ? 'texto-mono texto-alerta' : 'texto-mono',
    `${repuesto.stock} uds • ${estadoTexto}`
  );
  tacoInfo.append(etiquetaStock, valorStock);

  const barrasContainer = crearElemento('div', 'tacometro-barras');
  // Escala visual sobre 30 unidades = 10 barras llenas
  const barrasActivas = sinStock
    ? 0
    : Math.max(1, Math.min(10, Math.round((repuesto.stock / 30) * 10)));

  for (let i = 1; i <= 10; i++) {
    let claseBarra = 'taco-barra';
    if (i <= barrasActivas) {
      claseBarra += esCritico ? ' taco-critica' : ' taco-llena';
    }
    barrasContainer.appendChild(crearElemento('span', claseBarra));
  }
  tacometro.append(tacoInfo, barrasContainer);

  // --- D. Pie de Tarjeta: Precio COP + Botones Operativos ---
  const footer = crearElemento('div', 'tarjeta-footer');
  const precio = crearElemento('span', 'tarjeta-precio', formatearCOP(repuesto.precio));

  const acciones = crearElemento('div', 'tarjeta-acciones');

  const btnSumar = crearElemento('button', 'btn-card-secundario', '+1');
  btnSumar.type = 'button';
  btnSumar.title = 'Ingresar +1 unidad a bodega';
  btnSumar.dataset.accion = 'sumar';
  btnSumar.dataset.id = repuesto.id;

  const btnDespachar = crearElemento(
    'button',
    'btn-card-primario',
    sinStock ? 'Sin stock' : '+ Despachar'
  );
  btnDespachar.type = 'button';
  btnDespachar.disabled = sinStock;
  btnDespachar.dataset.accion = 'despachar';
  btnDespachar.dataset.id = repuesto.id;

  acciones.append(btnSumar, btnDespachar);
  footer.append(precio, acciones);

  card.append(header, body, tacometro, footer);
  return card;
}

/**
 * Renderiza el catálogo filtrado en #catalogo y actualiza el contador de resultados
 * @param {Array<Object>} inventario
 */
function renderCatalogo(inventario) {
  const contenedor = document.getElementById('catalogo');
  const contador = document.getElementById('contador-resultados');
  if (!contenedor) return;

  const visibles = obtenerCatalogoFiltradoSeguro(inventario);

  if (contador) {
    const sufijoCritico = estadoApp.soloCriticos ? ' (solo alertas críticas)' : '';
    contador.textContent = `Mostrando ${visibles.length} de ${inventario.length} repuestos${sufijoCritico}`;
  }

  contenedor.replaceChildren();

  if (visibles.length === 0) {
    const vacio = crearElemento('div', 'estado-vacio');
    const tituloVacio = crearElemento(
      'p',
      'texto-blanco',
      inventario.length === 0
        ? 'La bodega aún no tiene repuestos registrados.'
        : 'No se encontraron repuestos con los filtros actuales.'
    );
    const ayudaVacio = crearElemento(
      'p',
      'panel-subtitulo',
      inventario.length === 0
        ? 'Usa el formulario de la derecha para registrar la primera referencia.'
        : 'Prueba cambiando la categoría, motocicleta o limpiando el buscador.'
    );
    vacio.append(tituloVacio, ayudaVacio);
    contenedor.appendChild(vacio);
    return;
  }

  const fragmento = document.createDocumentFragment();
  visibles.forEach((repuesto) => {
    fragmento.appendChild(crearTarjetaRepuesto(repuesto));
  });
  contenedor.appendChild(fragmento);
}

/**
 * Función maestra de renderizado: actualiza KPIs, pills y grilla de tarjetas
 */
function render() {
  renderKPIs(estadoApp.inventario);
  renderPillsActivas();
  renderCatalogo(estadoApp.inventario);
}

// ============================================================================
// 4. MODAL DE ELIMINACIÓN Y NOTIFICACIÓN FLOTANTE (TOAST + DESHACER)
// ============================================================================

/**
 * Muestra una notificación flotante en la esquina inferior derecha
 * @param {string} mensaje
 * @param {boolean} permitirDeshacer
 */
function mostrarToast(mensaje, permitirDeshacer = false) {
  const toast = document.getElementById('toast-notificacion');
  const texto = document.getElementById('toast-mensaje');
  const btnDeshacer = document.getElementById('btn-deshacer');

  if (!toast || !texto) return;

  if (estadoApp.temporizadorToast) {
    clearTimeout(estadoApp.temporizadorToast);
  }

  texto.textContent = mensaje;
  if (btnDeshacer) {
    btnDeshacer.classList.toggle('oculto', !permitirDeshacer);
  }

  toast.classList.remove('oculto');

  estadoApp.temporizadorToast = setTimeout(() => {
    toast.classList.add('oculto');
  }, permitirDeshacer ? 5500 : 3000);
}

/**
 * Abre el modal de confirmación de eliminación para un repuesto específico
 * @param {string} id
 */
function abrirModalEliminar(id) {
  const repuesto = estadoApp.inventario.find((item) => item.id === id);
  if (!repuesto) return;

  estadoApp.idPendienteEliminar = repuesto.id;

  const modal = document.getElementById('modal-eliminar');
  const detalle = document.getElementById('modal-detalle-repuesto');
  const btnConfirmar = document.getElementById('btn-confirmar-eliminar');

  if (detalle) {
    detalle.textContent = `${repuesto.nombre} (${repuesto.sku})`;
  }
  if (modal) {
    modal.classList.remove('oculto');
  }
  if (btnConfirmar) {
    btnConfirmar.focus();
  }
}

/**
 * Cierra el modal de confirmación sin realizar cambios
 */
function cerrarModalEliminar() {
  estadoApp.idPendienteEliminar = null;
  const modal = document.getElementById('modal-eliminar');
  if (modal) {
    modal.classList.add('oculto');
  }
}

/**
 * Ejecuta la eliminación confirmada usando eliminarRepuesto(inventario, id) de datos.js
 */
function confirmarEliminacion() {
  const id = estadoApp.idPendienteEliminar;
  if (!id) return;

  const indiceOriginal = estadoApp.inventario.findIndex((item) => item.id === id);
  const repuestoObjetivo = estadoApp.inventario[indiceOriginal];

  if (!repuestoObjetivo) {
    cerrarModalEliminar();
    return;
  }

  estadoApp.inventario = eliminarRepuesto(estadoApp.inventario, id);

  estadoApp.ultimoEliminado = {
    repuesto: { ...repuestoObjetivo },
    indice: indiceOriginal
  };

  cerrarModalEliminar();
  render();
  mostrarToast(`Eliminado: ${repuestoObjetivo.nombre} (${repuestoObjetivo.sku})`, true);
}

/**
 * Restaura el último repuesto eliminado usando restaurarRepuesto(inventario, repuesto, indice)
 */
function deshacerUltimaEliminacion() {
  if (!estadoApp.ultimoEliminado) return;

  const { repuesto, indice } = estadoApp.ultimoEliminado;
  estadoApp.inventario = restaurarRepuesto(estadoApp.inventario, repuesto, indice);

  estadoApp.ultimoEliminado = null;
  render();
  mostrarToast(`Restaurado: ${repuesto.nombre} (${repuesto.sku})`, false);
}

// ============================================================================
// 5. ACCIONES OPERATIVAS SOBRE EL CATÁLOGO
// ============================================================================

/**
 * Descuenta 1 unidad al despachar un repuesto usando actualizarStock(inventario, id, -1)
 * @param {string} id
 */
function manejarDespacho(id) {
  const repuesto = estadoApp.inventario.find((item) => item.id === id);
  if (!repuesto || repuesto.stock <= 0) return;

  const stockPrevio = repuesto.stock;
  estadoApp.inventario = actualizarStock(estadoApp.inventario, id, -1);

  render();
  const actualizado = estadoApp.inventario.find((item) => item.id === id);
  const nuevoStock = actualizado ? actualizado.stock : Math.max(0, stockPrevio - 1);
  mostrarToast(`Despachado: ${repuesto.nombre} • Stock restante: ${nuevoStock} uds`);
}

/**
 * Suma 1 unidad al reabastecer un repuesto usando actualizarStock(inventario, id, +1)
 * @param {string} id
 */
function manejarReabastecimiento(id) {
  const repuesto = estadoApp.inventario.find((item) => item.id === id);
  if (!repuesto) return;

  const stockPrevio = repuesto.stock;
  estadoApp.inventario = actualizarStock(estadoApp.inventario, id, +1);

  render();
  const actualizado = estadoApp.inventario.find((item) => item.id === id);
  const nuevoStock = actualizado ? actualizado.stock : stockPrevio + 1;
  mostrarToast(`Ingreso +1: ${repuesto.nombre} • Stock actual: ${nuevoStock} uds`);
}

// ============================================================================
// 6. REGISTRO DE EVENTOS E INICIALIZACIÓN DE LA APLICACIÓN
// ============================================================================

function inicializarEventos() {
  // 1. Buscador global instantáneo (sincronizado con filtros.texto)
  const buscador = document.getElementById('buscador-global');
  if (buscador) {
    buscador.addEventListener('input', (e) => {
      estadoApp.texto = e.target.value;
      render();
    });
  }

  // 2. Atajos de teclado: "/" enfoca buscador, "Escape" cierra modal
  document.addEventListener('keydown', (e) => {
    const etiquetaActiva = document.activeElement ? document.activeElement.tagName : '';
    const escribiendo = ['INPUT', 'SELECT', 'TEXTAREA'].includes(etiquetaActiva);

    if (e.key === '/' && !escribiendo && buscador) {
      e.preventDefault();
      buscador.focus();
      buscador.select();
    } else if (e.key === 'Escape') {
      cerrarModalEliminar();
    }
  });

  // 3. Filtro de pills por categoría (delegación)
  const barraCategorias = document.getElementById('filtro-categorias');
  if (barraCategorias) {
    barraCategorias.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      estadoApp.categoria = pill.dataset.categoria || 'Todos';
      render();
    });
  }

  // 4. Select de motocicleta compatible
  const selectMoto = document.getElementById('filtro-moto');
  if (selectMoto) {
    selectMoto.addEventListener('change', (e) => {
      estadoApp.moto = e.target.value;
      render();
    });
  }

  // 5. Select de ordenamiento
  const selectOrden = document.getElementById('orden-inventario');
  if (selectOrden) {
    selectOrden.addEventListener('change', (e) => {
      estadoApp.orden = e.target.value;
      render();
    });
  }

  // 6. Tarjeta KPI de Alertas Críticas (clic o Enter/Espacio para filtrar stock <= 15)
  const cardCriticos = document.getElementById('card-kpi-criticos');
  if (cardCriticos) {
    const alternarCriticos = () => {
      estadoApp.soloCriticos = !estadoApp.soloCriticos;
      render();
    };
    cardCriticos.addEventListener('click', alternarCriticos);
    cardCriticos.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        alternarCriticos();
      }
    });
  }

  // 7. Delegación de acciones en el catálogo (+ Despachar, +1, Eliminar)
  const catalogo = document.getElementById('catalogo');
  if (catalogo) {
    catalogo.addEventListener('click', (e) => {
      const boton = e.target.closest('button[data-accion]');
      if (!boton) return;

      const { accion, id } = boton.dataset;
      if (!id) return;

      if (accion === 'despachar') {
        manejarDespacho(id);
      } else if (accion === 'sumar') {
        manejarReabastecimiento(id);
      } else if (accion === 'eliminar') {
        abrirModalEliminar(id);
      }
    });
  }

  // 8. Controles del modal de eliminación
  const btnCancelar = document.getElementById('btn-cancelar-eliminar');
  const btnConfirmar = document.getElementById('btn-confirmar-eliminar');
  const modalOverlay = document.getElementById('modal-eliminar');

  if (btnCancelar) btnCancelar.addEventListener('click', cerrarModalEliminar);
  if (btnConfirmar) btnConfirmar.addEventListener('click', confirmarEliminacion);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) cerrarModalEliminar();
    });
  }

  // 9. Botón Deshacer en la notificación flotante
  const btnDeshacer = document.getElementById('btn-deshacer');
  if (btnDeshacer) {
    btnDeshacer.addEventListener('click', deshacerUltimaEliminacion);
  }
}

// Punto de entrada al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  // 1. Carga el inventario inicial desde datos.js
  estadoApp.inventario = typeof cargar === 'function' ? cargar() : [];

  // 2. Activa los eventos de búsqueda, filtros, tarjetas y modal
  inicializarEventos();

  // 3. Conecta formulario.js con sus dos callbacks exactos: (obtenerInventario, alCrearRepuesto)
  if (typeof inicializarFormulario === 'function') {
    inicializarFormulario(
      () => estadoApp.inventario,
      (nuevoRepuesto) => {
        estadoApp.inventario = agregarRepuesto(estadoApp.inventario, nuevoRepuesto);
        estadoApp.soloCriticos = false;
        render();
        mostrarToast(`Registrado: ${nuevoRepuesto.nombre} (${nuevoRepuesto.sku})`);
      }
    );
  }

  // 4. Primer pintado de la interfaz
  render();
});