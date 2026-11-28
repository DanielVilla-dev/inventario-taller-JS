const STORAGE_KEY = "motostock_inventario_v1";

// Inventario inicial con cinco repuestos.
const REPUESTOS_INICIALES = [
    {
        id: "rep-1",
        nombre: "Pastillas de Freno Delanteras",
        sku: "AKT-PF-125",
        categoria: "Frenos",
        moto: "AKT NKD 125",
        stock: 12,
        precio: 45000
    },
    {
        id: "rep-2",
        nombre: "Kit de Arrastre",
        sku: "PUL-KA-200",
        categoria: "Arrastre",
        moto: "Pulsar NS200",
        stock: 24,
        precio: 165000
    },
    {
        id: "rep-3",
        nombre: "Filtro de Aire",
        sku: "YAM-FA-016",
        categoria: "Motor",
        moto: "Yamaha FZ16",
        stock: 45,
        precio: 38000
    },
    {
        id: "rep-4",
        nombre: "Bujía NGK",
        sku: "HON-BU-190",
        categoria: "Eléctrico",
        moto: "Honda CB 190R",
        stock: 8,
        precio: 28000
    },
    {
        id: "rep-5",
        nombre: "Amortiguador Trasero",
        sku: "SUZ-AT-125",
        categoria: "Suspensión",
        moto: "Suzuki GN 125",
        stock: 32,
        precio: 135000
    }
];
function cargar() {

    // Consultar si existe información guardada en el navegador.
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
        guardar(REPUESTOS_INICIALES);
        return [...REPUESTOS_INICIALES];
    }
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
        }
    } catch (error) {
        console.error("Error al cargar el inventario:", error);
    }
    guardar(REPUESTOS_INICIALES);
    return [...REPUESTOS_INICIALES];
}
function guardar(inventario) {

    // Convertir el inventario a texto y guardarlo en localStorage.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventario));
}
function agregarRepuesto(inventario, nuevoRepuesto) {

    // Crear un nuevo arreglo colocando el repuesto al principio.
    const actualizado = [nuevoRepuesto, ...inventario];
    guardar(actualizado);
    return actualizado;
}
function actualizarStock(inventario, id, delta) {

    // Recorrer el inventario y actualizar el repuesto correspondiente.
    const actualizado = inventario.map(item => {
        if (item.id === id) {
            return {
                ...item,
                stock: Math.max(0, item.stock + delta)
            };
        }
        return item;
    });
    guardar(actualizado);
    return actualizado;
}
function eliminarRepuesto(inventario, id) {

    // Crear un arreglo sin el repuesto seleccionado.
    const actualizado = inventario.filter(item => item.id !== id);
    guardar(actualizado);
    return actualizado;
}
function restaurarRepuesto(inventario, repuesto, indice) {

    // Crear una copia del inventario actual.
    const copia = [...inventario];

    // Insertar nuevamente el repuesto en su posición original.
    copia.splice(indice, 0, repuesto);
    guardar(copia);
    return copia;
}