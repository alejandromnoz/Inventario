let productos = [];
let categorias = [];


// ==========================================
// NAVEGACIÓN
// ==========================================

function mostrarSeccion(nombre, boton) {

    document.querySelectorAll(".seccion").forEach(seccion => {
        seccion.classList.remove("activa");
        seccion.style.display = "none";
    });

    const seccion = document.getElementById(nombre);

    if (!seccion) {
        console.error("No existe la sección:", nombre);
        return;
    }

    seccion.classList.add("activa");
    seccion.style.display = "block";

    document.querySelectorAll(".menu-btn").forEach(btn => {
        btn.classList.remove("activo");
    });

    if (boton) {
        boton.classList.add("activo");
    }

    const titulos = {
        inicio: "Inicio",
        productos: "Productos",
        inventario: "Inventario",
        categorias: "Categorías",
        usuarios: "Usuarios",
        configuracion: "Configuración"
    };

    const titulo = document.getElementById("tituloPagina");

    if (titulo) {
        titulo.textContent = titulos[nombre] || "Inventario";
    }

    if (nombre === "productos") {
        mostrarProductos();
    }

    if (nombre === "inventario") {
        actualizarInventario();
    }

    if (nombre === "categorias") {
        mostrarCategorias();
    }
}


// ==========================================
// PRODUCTOS
// ==========================================

async function cargarProductos() {

    try {

        const respuesta = await fetch("/api/productos");

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los productos");
        }

        productos = await respuesta.json();

        actualizarTodo();

    } catch (error) {

        console.error(error);

        alert("No se pudieron cargar los productos.");

    }
}


function mostrarProductos(lista = productos) {

    const tabla = document.getElementById("listaProductos");

    if (!tabla) return;

    tabla.innerHTML = "";

    if (lista.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:30px;">
                    No hay productos registrados.
                </td>
            </tr>
        `;

        return;
    }

    lista.forEach(producto => {

        const cantidad = Number(producto.cantidad);

        const estado =
            cantidad <= 5
                ? `<span class="estado estado-bajo">Stock bajo</span>`
                : `<span class="estado estado-ok">Disponible</span>`;

        tabla.innerHTML += `
            <tr>

                <td>${producto.id}</td>

                <td>
                    <strong>${producto.nombre}</strong>
                </td>

                <td>
                    ${producto.categoria}
                </td>

                <td>
                    ${cantidad}
                </td>

                <td>
                    $${Number(producto.precio).toLocaleString("es-CO")}
                </td>

                <td>
                    ${estado}
                </td>

                <td>

                    <button
                        class="btn-editar"
                        onclick="editarProducto(${producto.id})">
                        ✏️
                    </button>

                    <button
                        class="btn-eliminar"
                        onclick="eliminarProducto(${producto.id})">
                        🗑️
                    </button>

                </td>

            </tr>
        `;
    });
}


// ==========================================
// GUARDAR PRODUCTO
// ==========================================

async function guardarProducto(event) {

    event.preventDefault();

    const nombre =
        document.getElementById("nombreProducto").value.trim();

    const categoria =
        document.getElementById("categoriaProducto").value;

    const cantidad =
        Number(document.getElementById("cantidadProducto").value);

    const precio =
        Number(document.getElementById("precioProducto").value);

    if (!nombre) {
        alert("Ingrese el nombre del producto.");
        return;
    }

    if (!categoria) {
        alert("Seleccione una categoría.");
        return;
    }

    if (isNaN(cantidad) || cantidad < 0) {
        alert("Ingrese una cantidad válida.");
        return;
    }

    if (isNaN(precio) || precio < 0) {
        alert("Ingrese un precio válido.");
        return;
    }

    try {

        const respuesta = await fetch("/api/productos", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                nombre,
                categoria,
                cantidad,
                precio
            })

        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.error || "Error al guardar");
        }

        productos.unshift(resultado);

        cerrarModal();

        actualizarTodo();

        alert("✅ Producto guardado correctamente.");

    } catch (error) {

        console.error(error);

        alert("❌ " + error.message);

    }
}


// ==========================================
// EDITAR PRODUCTO
// ==========================================

async function editarProducto(id) {

    const producto =
        productos.find(p => p.id === id);

    if (!producto) return;

    const nombre =
        prompt("Nombre:", producto.nombre);

    if (nombre === null) return;

    const categoria =
        prompt("Categoría:", producto.categoria);

    if (categoria === null) return;

    const cantidad =
        prompt("Cantidad:", producto.cantidad);

    if (cantidad === null) return;

    const precio =
        prompt("Precio:", producto.precio);

    if (precio === null) return;

    const nuevaCantidad = Number(cantidad);
    const nuevoPrecio = Number(precio);

    if (
        isNaN(nuevaCantidad) ||
        nuevaCantidad < 0 ||
        isNaN(nuevoPrecio) ||
        nuevoPrecio < 0
    ) {

        alert("Cantidad o precio inválido.");

        return;
    }

    try {

        const respuesta =
            await fetch(`/api/productos/${id}`, {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    nombre: nombre.trim(),

                    categoria: categoria.trim(),

                    cantidad: nuevaCantidad,

                    precio: nuevoPrecio

                })

            });

        const resultado =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || "Error actualizando"
            );
        }

        const posicion =
            productos.findIndex(p => p.id === id);

        productos[posicion] = resultado;

        actualizarTodo();

        alert("✅ Producto actualizado.");

    } catch (error) {

        console.error(error);

        alert("❌ " + error.message);

    }
}


// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

async function eliminarProducto(id) {

    const producto =
        productos.find(p => p.id === id);

    if (!producto) return;

    const confirmar =
        confirm(`¿Eliminar "${producto.nombre}"?`);

    if (!confirmar) return;

    try {

        const respuesta =
            await fetch(`/api/productos/${id}`, {
                method: "DELETE"
            });

        const resultado =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || "Error eliminando"
            );
        }

        productos =
            productos.filter(p => p.id !== id);

        actualizarTodo();

        alert("✅ Producto eliminado.");

    } catch (error) {

        console.error(error);

        alert("❌ " + error.message);

    }
}


// ==========================================
// CATEGORÍAS
// ==========================================

async function cargarCategorias() {

    try {

        const respuesta =
            await fetch("/api/categorias");

        if (!respuesta.ok) {
            throw new Error("Error cargando categorías");
        }

        categorias =
            await respuesta.json();

        mostrarCategorias();

        actualizarSelectCategorias();

    } catch (error) {

        console.error(error);

        alert("No se pudieron cargar las categorías.");

    }
}


function mostrarCategorias() {

    const lista =
        document.getElementById("listaCategorias");

    if (!lista) return;

    lista.innerHTML = "";

    if (categorias.length === 0) {

        lista.innerHTML = `
            <div class="categoria-item">
                <span>No hay categorías registradas.</span>
            </div>
        `;

        return;
    }

    categorias.forEach(categoria => {

        lista.innerHTML += `
            <div class="categoria-item">

                <span>
                    🏷️
                    <strong>${categoria.nombre}</strong>
                </span>

                <div>

                    <button
                        onclick="editarCategoria(${categoria.id})">
                        ✏️
                    </button>

                    <button
                        onclick="eliminarCategoria(${categoria.id})">
                        🗑️
                    </button>

                </div>

            </div>
        `;

    });
}


async function crearCategoria() {

    const input =
        document.getElementById("nuevaCategoria");

    const nombre =
        input.value.trim();

    if (!nombre) {

        alert("Escriba una categoría.");

        return;
    }

    try {

        const respuesta =
            await fetch("/api/categorias", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    nombre
                })

            });

        const resultado =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || "Error creando categoría"
            );
        }

        input.value = "";

        await cargarCategorias();

        alert("✅ Categoría creada.");

    } catch (error) {

        console.error(error);

        alert("❌ " + error.message);

    }
}


async function editarCategoria(id) {

    const categoria =
        categorias.find(c => c.id === id);

    if (!categoria) return;

    const nombre =
        prompt(
            "Nuevo nombre:",
            categoria.nombre
        );

    if (nombre === null) return;

    if (!nombre.trim()) {
        alert("El nombre no puede estar vacío.");
        return;
    }

    try {

        const respuesta =
            await fetch(`/api/categorias/${id}`, {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    nombre: nombre.trim()
                })

            });

        const resultado =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || "Error actualizando categoría"
            );
        }

        await cargarCategorias();

        alert("✅ Categoría actualizada.");

    } catch (error) {

        console.error(error);

        alert("❌ " + error.message);

    }
}


async function eliminarCategoria(id) {

    const categoria =
        categorias.find(c => c.id === id);

    if (!categoria) return;

    const confirmar =
        confirm(
            `¿Eliminar "${categoria.nombre}"?`
        );

    if (!confirmar) return;

    try {

        const respuesta =
            await fetch(`/api/categorias/${id}`, {
                method: "DELETE"
            });

        const resultado =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || "Error eliminando categoría"
            );
        }

        await cargarCategorias();

        alert("✅ Categoría eliminada.");

    } catch (error) {

        console.error(error);

        alert("❌ " + error.message);

    }
}


// ==========================================
// SELECT CATEGORÍAS
// ==========================================

function actualizarSelectCategorias() {

    const select =
        document.getElementById(
            "categoriaProducto"
        );

    if (!select) return;

    select.innerHTML = `
        <option value="">
            Seleccionar categoría
        </option>
    `;

    categorias.forEach(categoria => {

        const opcion =
            document.createElement("option");

        opcion.value =
            categoria.nombre;

        opcion.textContent =
            categoria.nombre;

        select.appendChild(opcion);

    });
}


// ==========================================
// MODAL
// ==========================================

async function abrirModal() {

    const modal =
        document.getElementById(
            "modalProducto"
        );

    if (!modal) return;

    modal.style.display = "flex";

    document.getElementById(
        "nombreProducto"
    ).value = "";

    document.getElementById(
        "cantidadProducto"
    ).value = "";

    document.getElementById(
        "precioProducto"
    ).value = "";

    await cargarCategorias();

    const select =
        document.getElementById(
            "categoriaProducto"
        );

    if (select) {
        select.value = "";
    }

    document.getElementById(
        "nombreProducto"
    ).focus();
}


function cerrarModal() {

    const modal =
        document.getElementById(
            "modalProducto"
        );

    if (modal) {
        modal.style.display = "none";
    }
}


// ==========================================
// BÚSQUEDA
// ==========================================

function buscarProductos() {

    const input =
        document.getElementById(
            "buscarProductos"
        );

    if (!input) return;

    const texto =
        input.value.toLowerCase().trim();

    const resultados =
        productos.filter(producto => {

            return (
                String(producto.nombre)
                    .toLowerCase()
                    .includes(texto)
                ||
                String(producto.categoria)
                    .toLowerCase()
                    .includes(texto)
            );

        });

    mostrarProductos(resultados);
}


// ==========================================
// DASHBOARD
// ==========================================

function mostrarProductosDashboard() {

    const tabla =
        document.getElementById(
            "productosDashboard"
        );

    if (!tabla) return;

    tabla.innerHTML = "";

    if (productos.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td colspan="4"
                    style="text-align:center;padding:25px;">
                    No hay productos registrados.
                </td>
            </tr>
        `;

        return;
    }

    productos.slice(0, 5).forEach(producto => {

        const estado =
            Number(producto.cantidad) <= 5
                ? `<span class="estado estado-bajo">Stock bajo</span>`
                : `<span class="estado estado-ok">Disponible</span>`;

        tabla.innerHTML += `
            <tr>

                <td>
                    <strong>
                        ${producto.nombre}
                    </strong>
                </td>

                <td>
                    ${producto.categoria}
                </td>

                <td>
                    ${producto.cantidad}
                </td>

                <td>
                    ${estado}
                </td>

            </tr>
        `;

    });
}


// ==========================================
// ALERTAS
// ==========================================

function mostrarAlertas() {

    const contenedor =
        document.getElementById("alertas");

    if (!contenedor) return;

    const bajos =
        productos.filter(
            p => Number(p.cantidad) <= 5
        );

    contenedor.innerHTML = "";

    if (bajos.length === 0) {

        contenedor.innerHTML = `
            <div class="alerta">
                <strong>✅ Inventario correcto</strong>
                No hay productos con stock bajo.
            </div>
        `;

        return;
    }

    bajos.forEach(producto => {

        contenedor.innerHTML += `
            <div class="alerta">

                <strong>
                    ⚠️ ${producto.nombre}
                </strong>

                Solo quedan
                ${producto.cantidad}
                unidades.

            </div>
        `;

    });
}


// ==========================================
// ESTADÍSTICAS
// ==========================================

function actualizarEstadisticas() {

    const total =
        productos.length;

    const bajos =
        productos.filter(
            p => Number(p.cantidad) <= 5
        ).length;

    const unidades =
        productos.reduce(
            (total, producto) =>
                total + Number(producto.cantidad),
            0
        );

    const valor =
        productos.reduce(
            (total, producto) =>
                total +
                (
                    Number(producto.cantidad) *
                    Number(producto.precio)
                ),
            0
        );

    const totalElemento =
        document.getElementById("totalProductos");

    const unidadesElemento =
        document.getElementById("unidadesTotales");

    const bajosElemento =
        document.getElementById("stockBajo");

    const valorElemento =
        document.getElementById("valorInventario");

    if (totalElemento)
        totalElemento.textContent = total;

    if (unidadesElemento)
        unidadesElemento.textContent = unidades;

    if (bajosElemento)
        bajosElemento.textContent = bajos;

    if (valorElemento)
        valorElemento.textContent =
            "$" + valor.toLocaleString("es-CO");
}


// ==========================================
// INVENTARIO
// ==========================================

function actualizarInventario() {

    const unidades =
        productos.reduce(
            (total, producto) =>
                total + Number(producto.cantidad),
            0
        );

    const disponibles =
        productos.filter(
            p => Number(p.cantidad) > 5
        ).length;

    const bajos =
        productos.filter(
            p => Number(p.cantidad) <= 5
        ).length;

    const unidadesElemento =
        document.getElementById(
            "unidadesInventario"
        );

    const disponiblesElemento =
        document.getElementById(
            "inventarioDisponible"
        );

    const bajosElemento =
        document.getElementById(
            "inventarioBajo"
        );

    if (unidadesElemento)
        unidadesElemento.textContent = unidades;

    if (disponiblesElemento)
        disponiblesElemento.textContent = disponibles;

    if (bajosElemento)
        bajosElemento.textContent = bajos;


    // TABLA DE INVENTARIO

    const tabla =
        document.getElementById(
            "listaInventario"
        );

    if (!tabla) return;

    tabla.innerHTML = "";

    if (productos.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center;padding:30px;">
                    No hay productos registrados.
                </td>
            </tr>
        `;

        return;
    }

    productos.forEach(producto => {

        const cantidad =
            Number(producto.cantidad);

        const estado =
            cantidad <= 5
                ? `<span class="estado estado-bajo">Stock bajo</span>`
                : `<span class="estado estado-ok">Disponible</span>`;

        tabla.innerHTML += `
            <tr>

                <td>
                    ${producto.id}
                </td>

                <td>
                    <strong>
                        ${producto.nombre}
                    </strong>
                </td>

                <td>
                    ${producto.categoria}
                </td>

                <td>
                    ${cantidad}
                </td>

                <td>
                    $${Number(producto.precio)
                        .toLocaleString("es-CO")}
                </td>

                <td>
                    ${estado}
                </td>

            </tr>
        `;

    });
}


// ==========================================
// ACTUALIZAR TODO
// ==========================================

function actualizarTodo() {

    mostrarProductos();

    mostrarProductosDashboard();

    mostrarAlertas();

    actualizarEstadisticas();

    actualizarInventario();

}


// ==========================================
// TEMA
// ==========================================

function alternarTema() {

    document.body.classList.toggle(
        "tema-oscuro"
    );

    const oscuro =
        document.body.classList.contains(
            "tema-oscuro"
        );

    localStorage.setItem(
        "tema",
        oscuro ? "oscuro" : "claro"
    );

    actualizarBotonTema();
}


function actualizarBotonTema() {

    const boton =
        document.getElementById(
            "botonTema"
        );

    if (!boton) return;

    const oscuro =
        document.body.classList.contains(
            "tema-oscuro"
        );

    boton.textContent =
        oscuro
            ? "☀️ Tema claro"
            : "🌙 Tema oscuro";
}


function cargarTema() {

    const tema =
        localStorage.getItem("tema");

    if (tema === "oscuro") {

        document.body.classList.add(
            "tema-oscuro"
        );

    }

    actualizarBotonTema();
}


// ==========================================
// INICIO
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        cargarTema();

        await cargarCategorias();

        await cargarProductos();

        mostrarSeccion(
            "inicio",
            document.querySelector(
                ".menu-btn"
            )
        );

    }
);
