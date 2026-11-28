// ============================================================================
// 1. SELECTORES DOM DEL FORMULARIO (Capturados con querySelector)
// ============================================================================
const formRepuesto = document.querySelector("#form-repuesto");
const btnStockMenos = document.querySelector("#btn-stock-menos");
const btnStockMas = document.querySelector("#btn-stock-mas");
const btnLimpiarForm = document.querySelector("#btn-limpiar-form");

// Inputs y Selects
const inputNombre = document.querySelector("#nombre");
const inputSku = document.querySelector("#sku");
const selectCategoria = document.querySelector("#categoria");
const selectMoto = document.querySelector("#moto");
const inputStock = document.querySelector("#stock");
const inputPrecio = document.querySelector("#precio");

// Contenedores <small> de mensajes por campo
const errorNombre = document.querySelector("#error-nombre");
const errorSku = document.querySelector("#error-sku");
const errorCategoria = document.querySelector("#error-categoria");
const errorMoto = document.querySelector("#error-moto");
const errorStock = document.querySelector("#error-stock");
const errorPrecio = document.querySelector("#error-precio");

// Listas de los 6 campos y sus mensajes (para limpiar todo con un solo recorrido)
const todosLosCampos = [inputNombre, inputSku, selectCategoria, selectMoto, inputStock, inputPrecio];
const todosLosErrores = [errorNombre, errorSku, errorCategoria, errorMoto, errorStock, errorPrecio];

// Molde del SKU: letras mayúsculas, números o guion, de 4 a 20 caracteres
const moldeSku = /^[A-Z0-9-]{4,20}$/;

// ============================================================================
// 2. VALIDADORES PUROS (Devuelven Contrato { valido, mensaje })
// ============================================================================
function validarNombre(valor) {
const nombre = valor.trim();
    if (nombre === "") return { 
        valido: false, 
        mensaje: "El nombre es obligatorio" 
    };
    if (nombre.length < 3) return {
        valido: false,  
        mensaje: "Mínimo 3 caracteres" 
    };
    return { valido: true, mensaje: "" };
}
function validarSKU(valor, inventario) {
const skuLimpio = valor.trim().toUpperCase();
if (skuLimpio === "") return { 
    valido: false, 
    mensaje: "El código SKU es obligatorio" 
};
if (!moldeSku.test(skuLimpio)) {
    return { 
        valido: false, 
        mensaje: "Usa 4-20 caracteres (letras, números o guion, sin espacios)" 
    };
}

if (inventario.some((item) => item.sku.toUpperCase() === skuLimpio)) {
    return { valido: false, mensaje: "Este código SKU ya existe en bodega" };
}
return { valido: true, mensaje: "" };
}
function validarSelect(valor, nombreCampo) {
if (!valor || valor.trim() === "") {
    return { valido: false, mensaje: `Selecciona una ${nombreCampo}` };
}
return { valido: true, mensaje: "" };
}
function validarStock(valor) {
const num = Number(valor);
// Number("") da 0, por eso se revisa el vacío aparte
if (valor.trim() === "" || Number.isNaN(num) || !Number.isInteger(num) || num < 1) {
    return { valido: false, mensaje: "Ingresa una cantidad entera mayor a 0" };
}
return { valido: true, mensaje: "" };
}
function validarPrecio(valor) {
const num = Number(valor);
if (valor.trim() === "" || Number.isNaN(num) || num <= 0) {
    return { valido: false, mensaje: "El precio debe ser mayor a $0" };
}
return { valido: true, mensaje: "" };
}
// ============================================================================
// 3. PINTADO Y LIMPIEZA DEL FORMULARIO (Clase CSS: .input-error)
// ============================================================================
function pintarErrorCampo(inputEl, smallEl, resultado) {
if (!resultado.valido) {
    inputEl.classList.add("input-error");
    smallEl.textContent = resultado.mensaje;
} else {
    inputEl.classList.remove("input-error");
    smallEl.textContent = "";
}
}
function limpiarFormulario() {
formRepuesto.reset();
inputStock.value = "1";
todosLosCampos.forEach((campo) => campo.classList.remove("input-error"));
todosLosErrores.forEach((small) => {
    small.textContent = "";
});
}
// ============================================================================
// 4. EVENTOS DEL FORMULARIO (Todos viven dentro de inicializarFormulario)
// ============================================================================
function inicializarFormulario(obtenerInventario, alCrearRepuesto) {
// EVENTO A: Envío del formulario
formRepuesto.addEventListener("submit", (e) => {
    e.preventDefault();

    // Se validan y pintan los 6 campos (sin cortar en el primer error)
    const resultados = [
    validarNombre(inputNombre.value),
    validarSKU(inputSku.value, obtenerInventario()),
    validarSelect(selectCategoria.value, "categoría"),
    validarSelect(selectMoto.value, "moto"),
    validarStock(inputStock.value),
    validarPrecio(inputPrecio.value)
    ];
    resultados.forEach((resultado, i) => {
    pintarErrorCampo(todosLosCampos[i], todosLosErrores[i], resultado);
    });
    if (!resultados.every((resultado) => resultado.valido)) return;
    
    // Contrato Repuesto: stock y precio como Number, sku en MAYÚSCULAS
    const nuevoRepuesto = {
    id: "rep-" + Date.now(),
    nombre: inputNombre.value.trim(),
    sku: inputSku.value.trim().toUpperCase(),
    categoria: selectCategoria.value,
    moto: selectMoto.value,
    stock: Number(inputStock.value),
    precio: Number(inputPrecio.value)
    };
    alCrearRepuesto(nuevoRepuesto);
    limpiarFormulario();
});
// EVENTO B: Validación en vivo al escribir en inputs de texto/número
inputNombre.addEventListener("input", () => {
    pintarErrorCampo(inputNombre, errorNombre, validarNombre(inputNombre.value));
});
inputSku.addEventListener("input", () => {
    pintarErrorCampo(inputSku, errorSku, validarSKU(inputSku.value, obtenerInventario()));
});
inputStock.addEventListener("input", () => {
    pintarErrorCampo(inputStock, errorStock, validarStock(inputStock.value));
});
inputPrecio.addEventListener("input", () => {
    pintarErrorCampo(inputPrecio, errorPrecio, validarPrecio(inputPrecio.value));
});
// EVENTO C: Validación en vivo al cambiar selects
selectCategoria.addEventListener("change", () => {
    pintarErrorCampo(selectCategoria, errorCategoria, validarSelect(selectCategoria.value, "categoría"));
});
selectMoto.addEventListener("change", () => {
    pintarErrorCampo(selectMoto, errorMoto, validarSelect(selectMoto.value, "moto"));
});
// EVENTO D: Botones + y - del stepper de stock
btnStockMenos.addEventListener("click", () => {
    const actual = Number(inputStock.value);
    const base = Number.isInteger(actual) ? actual : 1;
    inputStock.value = Math.max(1, base - 1);
    pintarErrorCampo(inputStock, errorStock, validarStock(inputStock.value));
});
btnStockMas.addEventListener("click", () => {
    const actual = Number(inputStock.value);
    const base = Number.isInteger(actual) ? actual : 0;
    inputStock.value = base + 1;
    pintarErrorCampo(inputStock, errorStock, validarStock(inputStock.value));
});
// EVENTO E: Botón Limpiar formulario
btnLimpiarForm.addEventListener("click", () => {
    limpiarFormulario();
});
}