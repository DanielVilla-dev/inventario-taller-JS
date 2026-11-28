<img width="1600" height="765" alt="boceto" src="https://github.com/user-attachments/assets/60d43907-d7cb-4950-b3f1-d7d5e046b6cd" /># MOTOSTOCK PRO — Gestión de Inventario para Taller de Motos

## Equipo
- Daniel Piedrahita Villa· DanielVilla-dev
- Manuela Castaño Flórez · florezmanu2007-design
- Santiago Gomez · santy0726

## El problema
Los talleres de motocicletas y almacenes de repuestos suelen controlar sus existencias en cuadernos o planillas manuales, lo que provoca quiebres de stock en piezas de alta rotación, despachos sin trazabilidad y desconocimiento del capital real invertido en bodega. **MOTOSTOCK PRO** resuelve este problema brindando una aplicación web de inventario y telemetría operativa diseñada para administradores y mecánicos de talleres de motos, permitiendo registrar referencias, despachar unidades, monitorear alertas críticas y conocer el valor total de la bodega en tiempo real desde cualquier navegador.

## Funcionalidades
1. **Registro de repuestos con validación por campo:** Formulario lateral con validación en tiempo real y mensajes de error individuales por cada entrada (nombre mínimo de 3 caracteres, código SKU único en mayúsculas, categoría, motocicleta compatible, stock inicial con botones `+/-` y precio unitario en COP).
2. **Despacho y reabastecimiento rápido en catálogo:** Control operativo directo desde cada tarjeta mediante el botón `+ Despachar` (descuenta `1` unidad y se deshabilita automáticamente al llegar a `0`) y `+1` para ingresos rápidos de mercancía.
3. **Panel de indicadores KPI en tiempo real:** Cálculo automático del **Valor Bodega** en pesos colombianos (COP), cantidad de referencias en **Stock Óptimo** (`> 15 uds`), **Alertas Críticas** (`<= 15 uds`, clicable para filtrar urgencias) y **Total de Referencias**.
4. **Búsqueda instantánea, filtros combinados y ordenamiento:** Buscador global con atajo de teclado (`/`), filtrado simultáneo por categoría (*Motor, Frenos, Arrastre, Eléctrico, Suspensión*), motocicleta compatible y stock crítico, además de ordenamiento dinámico.
5. **Telemetría visual de existencias (Tacómetro de 10 segmentos):** Indicador gráfico en cada repuesto que cambia de estado saludable (verde) a alerta crítica (rojo) cuando el inventario baja de 15 unidades.
6. **Eliminación segura con confirmación y opción Deshacer:** Modal de verificación antes de retirar un repuesto de la bodega, acompañado de una notificación flotante (*toast*) que permite restaurar el artículo eliminado en su posición original.

## Datos que se guardan en localStorage
La aplicación persiste todo el inventario bajo la clave `motostock_inventario_v1` en formato JSON (`JSON.stringify` / `JSON.parse` protegido con `try/catch`). Cada repuesto almacenado respeta la siguiente estructura:

- `id` (`string`): Identificador único generado al crear el registro (ej. `"rep-1732419200"`).
- `nombre` (`string`): Nombre comercial del repuesto (ej. `"Pastillas de Freno Delanteras"`).
- `sku` (`string`): Código único de referencia en mayúsculas (ej. `"AKT-PF-240"`).
- `categoria` (`string`): Subsistema al que pertenece (`"Motor"`, `"Frenos"`, `"Arrastre"`, `"Eléctrico"` o `"Suspensión"`).
- `moto` (`string`): Modelo de motocicleta compatible (ej. `"AKT NKD 125"`, `"Pulsar NS200"`, `"Yamaha FZ16"`).
- `stock` (`number`): Cantidad de unidades disponibles en bodega (`>= 0`).
- `precio` (`number`): Precio unitario en pesos colombianos (`COP`).

## Búsqueda, filtro u orden
- **`.filter()`** (`js/filtros.js` y `js/datos.js`): Filtra el catálogo combinando texto libre (coincidencia en `nombre`, `sku` o `moto`), categoría seleccionada, motocicleta compatible y filtro de alertas críticas (`stock <= 15`). También se utiliza para contabilizar referencias en estado óptimo/crítico y para eliminar repuestos por `id`.
- **`.toSorted()`** (`js/filtros.js`): Ordena los resultados visibles sin mutar el arreglo maestro guardado en memoria, permitiendo organizar por menor stock (`a.stock - b.stock`), mayor precio (`b.precio - a.precio`) o alfabéticamente de la A a la Z (`localeCompare`).
- **`.reduce()`** (`js/filtros.js`): Calcula el **Valor Bodega** total sumando `precio * stock` de todas las referencias registradas.
- **`.find()` y `.some()`** (`js/app.js` y `js/formulario.js`): `.find()` localiza un repuesto específico por `id` antes de confirmar su eliminación; `.some()` valida en tiempo real que no se ingresen códigos `sku` duplicados en el formulario.
- **`.map()`** (`js/datos.js`): Actualiza de forma inmutable el `stock` de un repuesto específico al despachar (`-1`) o reabastecer (`+1`).

## Boceto
<img width="1600" height="765" alt="boceto" src="https://github.com/user-attachments/assets/865a17d0-e703-4b1e-b65f-eaddb367fed1" />


## Reparto de tareas
| Integrante | Se encarga de |
|---|---|
| **Integrante 1 (Daniel)** | Configuración base del repositorio (`index.html`, `styles.css`), persistencia segura en `localStorage` y operaciones CRUD (`js/datos.js`), y lógica pura de búsqueda, filtros, ordenamiento y cálculo de KPIs (`js/filtros.js`). |
| **Integrante 2** | Validaciones puras del formulario, control de SKU duplicado, mensajes de error por campo y manejo de `submit` (`js/formulario.js`), captura del diseño (`boceto.jpg`) y documentación en `README.md`. |
| **Integrante 3** | Renderizado dinámico y seguro del DOM (`renderKPIs`, `renderCatalogo`, `render()`), delegación de eventos, modal de eliminación con opción *Deshacer* (`js/app.js`) y despliegue final en GitHub Pages. |
