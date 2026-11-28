function filtrarInventario(inventario, filtros) {

    const q = filtros.texto.trim().toLowerCase();

    // Filtrar los repuestos según las condiciones seleccionadas
    return inventario.filter(item => {

        // Condición 1: Buscar por nombre, SKU o motocicleta
        const coincideTexto =
            q === "" ||
            item.nombre.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            item.moto.toLowerCase().includes(q);
        const coincideCategoria =
            filtros.categoria === "Todos" ||
            item.categoria === filtros.categoria;
        const coincideMoto =
            filtros.moto === "Todas" ||
            item.moto === filtros.moto;
        const coincideCriticos =
            !filtros.soloCriticos ||
            item.stock <= 15;
        // El repuesto debe cumplir todas las condiciones.
        return (
            coincideTexto &&
            coincideCategoria &&
            coincideMoto &&
            coincideCriticos
        );
    });

}

function ordenarInventario(lista, criterio) {

    switch (criterio) {
        case "stock-asc":
            return lista.toSorted((a, b) => a.stock - b.stock);
        case "precio-desc":
            return lista.toSorted((a, b) => b.precio - a.precio);
        case "nombre-asc":
            return lista.toSorted((a, b) =>
                a.nombre.localeCompare(b.nombre, "es")
            );
        case "defecto":
        default:
            return [...lista];

    }

}

function calcularTotales(inventario) {

    return {

        // Calcular el valor total de los productos disponibles.
        valorBodega: inventario.reduce(
            (acc, item) => acc + (item.precio * item.stock),
            0
        ),
        stockOptimo: inventario.filter(
            item => item.stock > 15
        ).length,
        alertasCriticas: inventario.filter(
            item => item.stock <= 15
        ).length,
        totalReferencias: inventario.length
    };

}