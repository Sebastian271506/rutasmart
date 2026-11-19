
// ==========================================
// 1. USUARIOS DEL SISTEMA
// ==========================================

const domiciliariosIniciales = [
    {
        correo: "domiciliario@domitrack.com",
        password: "domi123",
        rol: "domiciliario",
        nombre: "Brandon Gálvez"
    },
    {
        correo: "sebastian@domitrack.com",
        password: "domi123",
        rol: "domiciliario",
        nombre: "Sebastián Márquez"
    },
    {
        correo: "david@domitrack.com",
        password: "domi123",
        rol: "domiciliario",
        nombre: "David Leal"
    }
];

let domiciliarios = JSON.parse(
    localStorage.getItem("domitrack_domiciliarios")
) || domiciliariosIniciales;

const usuarios = [
    {
        correo: "admin@domitrack.com",
        password: "admin123",
        rol: "admin",
        nombre: "Administrador"
    },
    ...domiciliarios.map(d => ({
        ...d,
        rol: "domiciliario"
    }))
];

let usuarioActual = null;


// ==========================================
// 2. DATOS INICIALES DE LOS PEDIDOS
// ==========================================

const pedidosIniciales = [];

const versionReinicioPedidos = "v1";
if (localStorage.getItem("domitrack_version_reinicio_pedidos") !== versionReinicioPedidos) {
    localStorage.setItem("domitrack_pedidos", "[]");
    localStorage.setItem("domitrack_version_reinicio_pedidos", versionReinicioPedidos);
}

let pedidos = JSON.parse(localStorage.getItem("domitrack_pedidos"))
    || pedidosIniciales;

let filtroInicioEstado = "Todos";
let filtroInicioAsignacion = "Todos";
let busquedaInicio = "";
let vistaPedidos = "table";

document.getElementById("fechaReporte").value = fechaLocalActual();

let siguienteId = Math.max(
    1000,
    ...pedidos.map(p => Number(p.id))
) + 1;


// ==========================================
// 3. GUARDAR INFORMACIÓN
// ==========================================

function guardarPedidos() {
    localStorage.setItem(
        "domitrack_pedidos",
        JSON.stringify(pedidos)
    );
}

function guardarDomiciliarios() {
    localStorage.setItem(
        "domitrack_domiciliarios",
        JSON.stringify(domiciliarios)
    );
}


// ==========================================
// 4. INICIAR SESIÓN
// ==========================================

document.getElementById("loginForm").addEventListener("submit", function(e) {

    e.preventDefault();

    let correo = document.getElementById("correo").value.trim();
    let password = document.getElementById("password").value;

    let usuario = usuarios.find(u =>
        u.correo === correo &&
        u.password === password
    );

    if (usuario) {

        usuarioActual = usuario;

        document.getElementById("login").classList.add("hidden");
        document.getElementById("error").textContent = "";

        if (usuario.rol === "admin") {

            document.getElementById("adminPanel").classList.remove("hidden");

            mostrarAdmin("inicioAdmin");

        } else {

            document.getElementById("domiPanel").classList.remove("hidden");

            document.getElementById("nombreDomi").textContent =
                usuario.nombre;

            mostrarDomi("misPedidos");

        }

        actualizarTodo();

    } else {

        document.getElementById("error").textContent =
            "Correo o contraseña incorrectos.";

    }

});


// ==========================================
// 5. CERRAR SESIÓN
// ==========================================

function cerrarSesion() {

    usuarioActual = null;

    document.getElementById("adminPanel").classList.add("hidden");
    document.getElementById("domiPanel").classList.add("hidden");
    document.getElementById("login").classList.remove("hidden");

    document.getElementById("loginForm").reset();

    document.getElementById("error").textContent = "";

}


// ==========================================
// 6. NAVEGACIÓN DEL ADMINISTRADOR
// ==========================================

function mostrarAdmin(seccion, boton) {

    if (!usuarioActual || usuarioActual.rol !== "admin") {
        return;
    }

    document.querySelectorAll(".admin-section").forEach(s => {
        s.classList.add("hidden");
        s.classList.remove("section-enter");
    });

    let seccionActiva = document.getElementById(seccion);
    seccionActiva.classList.remove("hidden");
    void seccionActiva.offsetWidth;
    seccionActiva.classList.add("section-enter");

    let titulos = {
        inicioAdmin: "Panel principal",
        pedidosAdmin: "Gestión de pedidos",
        registrarAdmin: "Registrar pedido",
        domiciliariosAdmin: "Equipo de domiciliarios",
        reportesAdmin: "Reportes y rendimiento"
    };
    document.getElementById("adminTitle").textContent = titulos[seccion] || "Panel principal";

    document.querySelectorAll("#adminPanel nav button").forEach(b => {
        b.classList.remove("active");
    });

    if (boton) {
        boton.classList.add("active");
    } else {
        const botones = document.querySelectorAll("#adminPanel nav button");

        botones.forEach(b => {
            if (b.getAttribute("onclick").includes(seccion)) {
                b.classList.add("active");
            }
        });
    }

    if (seccion === "registrarAdmin") {
        actualizarOpcionesDomiciliarioPedido();
    }

    actualizarTodo();

}


// ==========================================
// 7. NAVEGACIÓN DEL DOMICILIARIO
// ==========================================

function mostrarDomi(seccion, boton) {

    if (!usuarioActual || usuarioActual.rol !== "domiciliario") {
        return;
    }

    document.querySelectorAll(".domi-section").forEach(s => {
        s.classList.add("hidden");
    });

    document.getElementById(seccion).classList.remove("hidden");

    document.querySelectorAll("#domiPanel nav button").forEach(b => {
        b.classList.remove("active");
    });

    if (boton) {
        boton.classList.add("active");
    } else {
        document.querySelectorAll("#domiPanel nav button").forEach(b => {
            if (b.getAttribute("onclick").includes(seccion)) {
                b.classList.add("active");
            }
        });
    }

    actualizarPedidosDomi();

}


// ==========================================
// 8. REGISTRAR NUEVO PEDIDO
// ==========================================

document.getElementById("pedidoForm").addEventListener("submit", function(e) {

    e.preventDefault();

    if (!usuarioActual || usuarioActual.rol !== "admin") {
        return;
    }

    let nuevoPedido = {

        id: siguienteId++,

        cliente: document.getElementById("cliente").value.trim(),

        telefono: document.getElementById("telefono").value.trim(),

        direccion: document.getElementById("direccion").value.trim(),

        descripcion: document.getElementById("descripcion").value.trim(),

        valor: Number(document.getElementById("valor").value),

        observaciones: document.getElementById("observaciones").value.trim(),

        fechaProgramada: fechaLocalActual(),
        fechaSalida: "",
        domiciliarioSalida: "",
        fechaEntrega: "",
        domiciliarioEntrega: "",

        domiciliario: document.getElementById("domiciliarioPedido").value,

        estado: "Pendiente"

    };

    pedidos.unshift(nuevoPedido);
    let pedidoAsignado = nuevoPedido.domiciliario;

    guardarPedidos();

    this.reset();

    actualizarTodo();

    mostrarAdmin("pedidosAdmin");

    mostrarMensaje(pedidoAsignado
        ? `Pedido registrado y asignado a ${pedidoAsignado}.`
        : "Pedido registrado correctamente.");

});

function actualizarOpcionesDomiciliarioPedido() {
    let selector = document.getElementById("domiciliarioPedido");
    let seleccionActual = selector.value;

    selector.innerHTML = `
        <option value="">Sin asignar por ahora</option>
        ${domiciliarios.map(d => `
            <option value="${escaparHTML(d.nombre)}">${escaparHTML(d.nombre)}</option>
        `).join("")}
    `;

    if (domiciliarios.some(d => d.nombre === seleccionActual)) {
        selector.value = seleccionActual;
    }
}

document.getElementById("domiciliarioForm").addEventListener("submit", function(e) {

    e.preventDefault();

    if (!usuarioActual || usuarioActual.rol !== "admin") {
        return;
    }

    let nombre = document.getElementById("nombreDomiciliario").value.trim();
    let correo = document.getElementById("correoDomiciliario").value.trim();
    let password = document.getElementById("passwordDomiciliario").value;

    if (
        usuarios.some(u => u.correo.toLowerCase() === correo.toLowerCase()) ||
        domiciliarios.some(d => d.nombre.toLowerCase() === nombre.toLowerCase())
    ) {
        mostrarMensaje("El correo o el nombre ya están registrados.");
        return;
    }

    let nuevoDomiciliario = {
        nombre,
        correo,
        password,
        rol: "domiciliario"
    };

    domiciliarios.push(nuevoDomiciliario);
    usuarios.push(nuevoDomiciliario);

    guardarDomiciliarios();
    this.reset();
    actualizarTodo();
    mostrarMensaje("Domiciliario agregado correctamente.");

});

function eliminarDomiciliario(correo) {

    if (!usuarioActual || usuarioActual.rol !== "admin") {
        return;
    }

    let domiciliario = domiciliarios.find(d => d.correo === correo);

    if (!domiciliario) {
        return;
    }

    let pedidosActivos = pedidos.filter(p =>
        p.domiciliario === domiciliario.nombre &&
        p.estado !== "Entregado"
    ).length;

    if (pedidosActivos > 0) {
        mostrarMensaje("Reasigna o completa sus pedidos antes de eliminarlo.");
        return;
    }

    if (!confirm(`¿Eliminar a ${domiciliario.nombre} del equipo?`)) {
        return;
    }

    domiciliarios = domiciliarios.filter(d => d.correo !== correo);
    let indiceUsuario = usuarios.findIndex(u => u.correo === correo);
    if (indiceUsuario !== -1) {
        usuarios.splice(indiceUsuario, 1);
    }

    guardarDomiciliarios();
    actualizarTodo();
    mostrarMensaje("Domiciliario eliminado correctamente.");

}


// ==========================================
// 9. ASIGNAR DOMICILIARIO
// ==========================================

function asignarDomiciliario(id, nombre) {

    if (!usuarioActual || usuarioActual.rol !== "admin") {
        return;
    }

    let pedido = pedidos.find(p => p.id === id);

    if (pedido) {

        pedido.domiciliario = nombre;

        guardarPedidos();

        actualizarTodo();

        mostrarMensaje("Domiciliario asignado correctamente.");

    }

}

function filtrarPanel(estado) {
    filtroInicioEstado = estado;
    filtroInicioAsignacion = "Todos";
    busquedaInicio = "";
    document.getElementById("filtroEstadoInicio").value = estado;
    document.getElementById("filtroAsignacionInicio").value = "Todos";
    document.getElementById("buscarInicio").value = "";
    actualizarTablaInicio();
}

function filtrarPedidosSinAsignar() {
    filtroInicioEstado = "Todos";
    filtroInicioAsignacion = "Sin asignar activos";
    busquedaInicio = "";
    document.getElementById("filtroEstadoInicio").value = "Todos";
    document.getElementById("filtroAsignacionInicio").value = "Sin asignar activos";
    document.getElementById("buscarInicio").value = "";
    actualizarTablaInicio();
}


// ==========================================
// 10. CAMBIAR ESTADO DEL PEDIDO
// ==========================================

function cambiarEstado(id, estado) {

    if (!usuarioActual || usuarioActual.rol !== "domiciliario") {
        return;
    }

    let pedido = pedidos.find(p =>
        p.id === id &&
        p.domiciliario === usuarioActual.nombre
    );

    if (!pedido) {
        return;
    }

    if (
        estado !== "En camino" &&
        estado !== "Entregado"
    ) {
        return;
    }

    if (estado === "En camino" && pedido.estado !== "En camino") {
        pedido.fechaSalida = fechaLocalActual();
        pedido.domiciliarioSalida = usuarioActual.nombre;
        pedido.fechaEntrega = "";
        pedido.domiciliarioEntrega = "";
    } else if (estado === "Entregado" && pedido.estado !== "Entregado") {
        pedido.fechaEntrega = fechaLocalActual();
        pedido.domiciliarioEntrega = usuarioActual.nombre;
    }

    pedido.estado = estado;

    guardarPedidos();

    actualizarPedidosDomi();

    mostrarMensaje("Estado del pedido actualizado.");

}


// ==========================================
// 11. ACTUALIZAR ESTADÍSTICAS
// ==========================================

function actualizarEstadisticas() {

    let total = pedidos.length;

    let pendientes = pedidos.filter(p =>
        p.estado === "Pendiente"
    ).length;

    let camino = pedidos.filter(p =>
        p.estado === "En camino"
    ).length;

    let entregados = pedidos.filter(p =>
        p.estado === "Entregado"
    ).length;

    document.getElementById("totalPedidos").textContent = total;

    document.getElementById("totalPendientes").textContent = pendientes;

    document.getElementById("totalCamino").textContent = camino;

    document.getElementById("totalEntregados").textContent = entregados;
    document.getElementById("fechaPanelHoy").textContent =
        new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });

    document.getElementById("reporteTotal").textContent = total;

    document.getElementById("reportePendientes").textContent = pendientes;

    document.getElementById("reporteCamino").textContent = camino;

    document.getElementById("reporteEntregados").textContent = entregados;

    document.getElementById("resumenReportes").textContent =
        "Total de pedidos: " + total +
        " | Pendientes: " + pendientes +
        " | En camino: " + camino +
        " | Entregados: " + entregados;

    let sinAsignar = pedidos.filter(p =>
        p.estado !== "Entregado" && !p.domiciliario
    ).length;
    let alerta = document.getElementById("unassignedAlert");
    document.getElementById("unassignedCount").textContent = sinAsignar;
    alerta.classList.toggle("hidden", sinAsignar === 0);

    actualizarReporteDiario();
    actualizarPedidosAgrupadosPorDia();

}


// ==========================================
// 12. TABLA DE PEDIDOS RECIENTES
// ==========================================

function filtrarListaPedidos(lista, busqueda, estado, asignacion) {
    let texto = busqueda.toLocaleLowerCase("es");

    return lista.filter(p => {
        let coincideTexto = [
            p.id,
            p.cliente,
            p.telefono,
            p.direccion,
            p.domiciliario,
            p.fechaProgramada,
            p.fechaSalida,
            p.fechaEntrega
        ].some(valor => String(valor || "").toLocaleLowerCase("es").includes(texto));

        let coincideEstado = estado === "Todos" || p.estado === estado;
        let tieneDomiciliario = Boolean(p.domiciliario);
        let coincideAsignacion = asignacion === "Todos" ||
            (asignacion === "Asignado" && tieneDomiciliario) ||
            (asignacion === "Sin asignar" && !tieneDomiciliario) ||
            (asignacion === "Sin asignar activos" && !tieneDomiciliario && p.estado !== "Entregado");

        return coincideTexto && coincideEstado && coincideAsignacion;
    });
}

function actualizarTablaInicio() {

    let tabla = document.getElementById("tablaInicio");
    tabla.innerHTML = "";

    filtroInicioEstado = document.getElementById("filtroEstadoInicio").value;
    filtroInicioAsignacion = document.getElementById("filtroAsignacionInicio").value;
    busquedaInicio = document.getElementById("buscarInicio").value.trim();

    let encontrados = filtrarListaPedidos(
        pedidos,
        busquedaInicio,
        filtroInicioEstado,
        filtroInicioAsignacion
    );
    let filtrosActivos = filtroInicioEstado !== "Todos" ||
        filtroInicioAsignacion !== "Todos" ||
        busquedaInicio !== "";
    let visibles = filtrosActivos ? encontrados : encontrados.slice(0, 5);

    document.querySelectorAll(".metric-card").forEach(card => {
        card.setAttribute(
            "aria-pressed",
            String(card.dataset.filterStatus === filtroInicioEstado && filtroInicioAsignacion === "Todos")
        );
    });

    document.getElementById("resumenFiltroInicio").textContent = filtrosActivos
        ? `${encontrados.length} ${encontrados.length === 1 ? "pedido encontrado" : "pedidos encontrados"}`
        : `Mostrando los ${visibles.length} pedidos más recientes de ${pedidos.length}.`;

    visibles.forEach(p => {

        tabla.innerHTML += `
            <tr>
                <td>#${escaparHTML(p.id)}</td>
                <td>${escaparHTML(formatoFecha(p.fechaProgramada))}</td>
                <td>${escaparHTML(p.cliente)}</td>
                <td>${escaparHTML(p.direccion)}</td>
                <td>${escaparHTML(p.domiciliario || "Sin asignar")}</td>
                <td>
                    <span class="status ${claseEstado(p.estado)}">
                        ${escaparHTML(p.estado)}
                    </span>
                </td>
            </tr>
        `;

    });

    if (visibles.length === 0) {
        tabla.innerHTML = "<tr><td colspan='6' class='vacio'>No hay pedidos que coincidan con estos filtros.</td></tr>";
    }

}


// ==========================================
// 13. TABLA GENERAL DE PEDIDOS
// ==========================================

function actualizarTablaPedidos() {

    let tabla = document.getElementById("tablaPedidos");

    let busqueda = document.getElementById("buscarPedido").value.trim();
    let estado = document.getElementById("filtroEstadoPedidos").value;
    let asignacion = document.getElementById("filtroAsignacionPedidos").value;

    tabla.innerHTML = "";

    let encontrados = filtrarListaPedidos(
        pedidos,
        busqueda,
        estado,
        asignacion
    );

    actualizarContadoresPedidos();
    document.getElementById("pedidosCount").textContent =
        `${encontrados.length} ${encontrados.length === 1 ? "pedido" : "pedidos"}`;

    encontrados.forEach(p => {

        let opciones = domiciliarios.map(d => `
            <option value="${escaparHTML(d.nombre)}" ${p.domiciliario === d.nombre ? "selected" : ""}>
                ${escaparHTML(d.nombre)}
            </option>
        `).join("");

        tabla.innerHTML += `
            <tr>
                <td>#${escaparHTML(p.id)}</td>
                <td>
                    ${escaparHTML(formatoFecha(p.fechaProgramada))}
                </td>
                <td>
                    ${escaparHTML(formatoFecha(p.fechaSalida))}
                </td>
                <td>
                    ${escaparHTML(formatoFecha(p.fechaEntrega))}
                </td>
                <td>${escaparHTML(p.cliente)}</td>
                <td>${escaparHTML(p.telefono)}</td>
                <td>${escaparHTML(p.direccion)}</td>
                <td>${formatoDinero(p.valor)}</td>

                <td>
                    <select onchange="asignarDomiciliario(${p.id}, this.value)">
                        <option value="">Sin asignar</option>
                        ${opciones}
                    </select>
                </td>

                <td>
                    <label class="sr-only" for="estadoPedido${Number(p.id)}">Estado del pedido ${escaparHTML(p.id)}</label>
                    <select class="status-select status-${claseEstado(p.estado) || "pendiente"}"
                            id="estadoPedido${Number(p.id)}"
                            onchange="actualizarEstadoAdmin(${Number(p.id)}, this.value)">
                        ${opcionesEstado(p.estado)}
                    </select>
                </td>
            </tr>
        `;

    });

    if (encontrados.length === 0) {
        tabla.innerHTML =
            "<tr><td colspan='10' class='vacio'>No se encontraron pedidos.</td></tr>";
    }

    actualizarTableroPedidos(encontrados);

}

function opcionesEstado(estadoActual) {
    return ["Pendiente", "En camino", "Entregado"].map(estado => `
        <option value="${estado}" ${estado === estadoActual ? "selected" : ""}>${estado}</option>
    `).join("");
}

function actualizarEstadoAdmin(id, estado) {
    if (!usuarioActual || usuarioActual.rol !== "admin") {
        return;
    }

    let pedido = pedidos.find(p => Number(p.id) === id);
    if (!pedido || !["Pendiente", "En camino", "Entregado"].includes(estado)) {
        return;
    }

    if (estado === "En camino" && pedido.estado !== "En camino") {
        pedido.fechaSalida = fechaLocalActual();
        pedido.domiciliarioSalida = pedido.domiciliario || "";
        pedido.fechaEntrega = "";
        pedido.domiciliarioEntrega = "";
    } else if (estado === "Entregado" && pedido.estado !== "Entregado") {
        pedido.fechaEntrega = fechaLocalActual();
        pedido.domiciliarioEntrega = pedido.domiciliario || "";
    } else if (estado === "Pendiente") {
        pedido.fechaSalida = "";
        pedido.domiciliarioSalida = "";
        pedido.fechaEntrega = "";
        pedido.domiciliarioEntrega = "";
    }

    pedido.estado = estado;
    guardarPedidos();
    actualizarTodo();
    mostrarMensaje(`Pedido #${id} actualizado a ${estado}.`);
}

function actualizarContadoresPedidos() {
    let conteos = {
        Todos: pedidos.length,
        Pendiente: pedidos.filter(p => p.estado === "Pendiente").length,
        "En camino": pedidos.filter(p => p.estado === "En camino").length,
        Entregado: pedidos.filter(p => p.estado === "Entregado").length
    };

    document.getElementById("quickCountTodos").textContent = conteos.Todos;
    document.getElementById("quickCountPendiente").textContent = conteos.Pendiente;
    document.getElementById("quickCountCamino").textContent = conteos["En camino"];
    document.getElementById("quickCountEntregado").textContent = conteos.Entregado;
    document.querySelectorAll(".quick-filter").forEach(button => {
        let activo = button.dataset.quickStatus === document.getElementById("filtroEstadoPedidos").value;
        button.classList.toggle("active", activo);
        button.setAttribute("aria-pressed", String(activo));
    });
}

function filtroRapidoPedidos(estado, boton) {
    document.getElementById("filtroEstadoPedidos").value = estado;
    document.querySelectorAll(".quick-filter").forEach(item => {
        item.classList.remove("active");
        item.setAttribute("aria-pressed", "false");
    });
    boton.classList.add("active");
    boton.setAttribute("aria-pressed", "true");
    actualizarTablaPedidos();
}

function cambiarVistaPedidos(vista, boton) {
    vistaPedidos = vista;
    document.getElementById("pedidosTableView").classList.toggle("hidden", vista !== "table");
    document.getElementById("pedidosBoardView").classList.toggle("hidden", vista !== "board");
    document.querySelectorAll(".view-switch-button").forEach(item => {
        let activo = item === boton;
        item.classList.toggle("active", activo);
        item.setAttribute("aria-pressed", String(activo));
    });
}

function actualizarTableroPedidos(lista) {
    let tablero = document.getElementById("tableroPedidos");
    let estados = ["Pendiente", "En camino", "Entregado"];
    tablero.innerHTML = estados.map((estado, indice) => {
        let pedidosEstado = lista.filter(p => p.estado === estado);
        let clase = ["pending", "route", "done"][indice];
        let tarjetas = pedidosEstado.map(p => {
            let opcionesDomiciliarios = domiciliarios.map(d => `
                <option value="${escaparHTML(d.nombre)}" ${p.domiciliario === d.nombre ? "selected" : ""}>
                    ${escaparHTML(d.nombre)}
                </option>
            `).join("");

            return `
                <article class="board-order">
                    <div class="board-order-top">
                        <span class="board-order-id">#${escaparHTML(p.id)}</span>
                        <span class="status ${claseEstado(p.estado)}">${escaparHTML(p.estado)}</span>
                    </div>
                    <h4>${escaparHTML(p.cliente)}</h4>
                    <p class="board-order-address">${escaparHTML(p.direccion)}</p>
                    <div class="board-order-meta">
                        <span>${escaparHTML(formatoFecha(p.fechaProgramada))}</span>
                        <b>${formatoDinero(p.valor)}</b>
                    </div>
                    <label class="sr-only" for="tableroDomiciliario${Number(p.id)}">Asignar domiciliario al pedido ${escaparHTML(p.id)}</label>
                    <select id="tableroDomiciliario${Number(p.id)}" onchange="asignarDomiciliario(${Number(p.id)}, this.value)">
                        <option value="">Sin asignar</option>
                        ${opcionesDomiciliarios}
                    </select>
                    <label class="sr-only" for="tableroEstado${Number(p.id)}">Actualizar estado del pedido ${escaparHTML(p.id)}</label>
                    <select class="status-select status-${claseEstado(p.estado) || "pendiente"}"
                            id="tableroEstado${Number(p.id)}"
                            onchange="actualizarEstadoAdmin(${Number(p.id)}, this.value)">
                        ${opcionesEstado(p.estado)}
                    </select>
                </article>
            `;
        }).join("");

        return `
            <section class="board-column board-${clase}">
                <header><span><i></i>${estado}</span><b>${pedidosEstado.length}</b></header>
                <div class="board-column-body">
                    ${tarjetas || `<p class="board-empty">No hay pedidos ${estado === "Pendiente" ? "pendientes" : estado === "En camino" ? "en ruta" : "entregados"}.</p>`}
                </div>
            </section>
        `;
    }).join("");
}

function actualizarReporteDiario() {
    let fecha = document.getElementById("fechaReporte").value || fechaLocalActual();
    let hoy = fechaLocalActual();
    let ayerDate = new Date();
    ayerDate.setDate(ayerDate.getDate() - 1);
    let ayer = `${ayerDate.getFullYear()}-${String(ayerDate.getMonth() + 1).padStart(2, "0")}-${String(ayerDate.getDate()).padStart(2, "0")}`;
    document.querySelectorAll(".date-shortcut").forEach(boton => {
        let activo = (boton.dataset.dateShortcut === "today" && fecha === hoy) ||
            (boton.dataset.dateShortcut === "yesterday" && fecha === ayer);
        boton.classList.toggle("active", activo);
        boton.setAttribute("aria-pressed", String(activo));
    });

    let programados = pedidos.filter(p => p.fechaProgramada === fecha);
    let salieron = pedidos.filter(p => p.fechaSalida === fecha);
    let entregados = pedidos.filter(p => p.fechaEntrega === fecha);

    document.getElementById("reporteDiarioProgramados").textContent = programados.length;
    document.getElementById("reporteDiarioSalieron").textContent = salieron.length;
    document.getElementById("reporteDiarioEntregados").textContent = entregados.length;

    let tabla = document.getElementById("tablaReporteDiario");
    let nombresDomiciliarios = [...new Set([
        ...domiciliarios.map(d => d.nombre),
        ...programados.map(p => p.domiciliario),
        ...salieron.map(p => p.domiciliarioSalida),
        ...entregados.map(p => p.domiciliarioEntrega)
    ].filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));

    let filas = nombresDomiciliarios.map(nombre => {
        let asignadosDia = programados.filter(p => p.domiciliario === nombre).length;
        let salidasDia = salieron.filter(p => p.domiciliarioSalida === nombre).length;
        let entregasDia = entregados.filter(p => p.domiciliarioEntrega === nombre).length;

        return `
            <tr>
                <td>${escaparHTML(nombre)}</td>
                <td>${asignadosDia}</td>
                <td>${salidasDia}</td>
                <td>${entregasDia}</td>
            </tr>
        `;
    });

    let sinAsignar = programados.filter(p => !p.domiciliario).length;
    if (sinAsignar > 0) {
        filas.push(`
            <tr>
                <td>Sin domiciliario</td>
                <td>${sinAsignar}</td>
                <td>—</td>
                <td>—</td>
            </tr>
        `);
    }

    if (filas.length === 0) {
        tabla.innerHTML = "<tr><td colspan='4' class='vacio'>No hay domiciliarios registrados.</td></tr>";
        return;
    }

    tabla.innerHTML = filas.join("");
}

function seleccionarFechaReporte(relativa, boton) {
    let fecha = new Date();
    if (relativa === "yesterday") {
        fecha.setDate(fecha.getDate() - 1);
    }

    let valor = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
    document.getElementById("fechaReporte").value = valor;
    document.querySelectorAll(".date-shortcut").forEach(item => {
        let activo = item === boton;
        item.classList.toggle("active", activo);
        item.setAttribute("aria-pressed", String(activo));
    });
    actualizarReporteDiario();
}

function exportarReporteDiario() {
    if (!usuarioActual || usuarioActual.rol !== "admin") {
        return;
    }

    let fecha = document.getElementById("fechaReporte").value || fechaLocalActual();
    let programados = pedidos.filter(p => p.fechaProgramada === fecha);
    let salieron = pedidos.filter(p => p.fechaSalida === fecha);
    let entregados = pedidos.filter(p => p.fechaEntrega === fecha);
    let filas = [
        ["Domiciliario", "Programados", "Salieron", "Entregados"],
        ["Totales", programados.length, salieron.length, entregados.length],
        ...[...document.querySelectorAll("#tablaReporteDiario tr")]
            .filter(fila => !fila.classList.contains("vacio") && !fila.querySelector(".vacio"))
            .map(fila => [...fila.cells].map(celda => celda.textContent.trim()))
    ];
    let csv = filas.map(fila => fila.map(valor =>
        `"${String(valor).replace(/"/g, '""')}"`
    ).join(",")).join("\r\n");
    let archivo = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    let url = URL.createObjectURL(archivo);
    let enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `rutasmart-reporte-${fecha || fechaLocalActual()}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
    mostrarMensaje("Reporte diario descargado.");
}

function actualizarPedidosAgrupadosPorDia() {
    let contenedor = document.getElementById("pedidosAgrupadosDia");
    let fechas = [...new Set(pedidos.map(p => p.fechaProgramada || ""))]
        .sort((a, b) => b.localeCompare(a));

    if (fechas.length === 0) {
        contenedor.innerHTML = "<div class='vacio'>Todavía no hay pedidos registrados.</div>";
        return;
    }

    contenedor.innerHTML = fechas.map(fecha => {
        let pedidosDia = pedidos.filter(p => (p.fechaProgramada || "") === fecha);
        let nombreFecha = fecha ? formatoFecha(fecha) : "Fecha no registrada";
        let entregasPorDomiciliario = domiciliarios
            .map(d => ({
                nombre: d.nombre,
                cantidad: pedidosDia.filter(p => p.domiciliario === d.nombre).length
            }))
            .filter(d => d.cantidad > 0);
        let resumenDomiciliarios = entregasPorDomiciliario.length
            ? entregasPorDomiciliario.map(d =>
                `<span>${escaparHTML(d.nombre)}: <b>${d.cantidad}</b></span>`
            ).join("")
            : "<span>Sin pedidos asignados</span>";

        let filas = pedidosDia.map(p => `
            <tr>
                <td>#${escaparHTML(p.id)}</td>
                <td>${escaparHTML(p.cliente)}</td>
                <td>${escaparHTML(p.domiciliario || "Sin asignar")}</td>
                <td><span class="status ${claseEstado(p.estado)}">${escaparHTML(p.estado)}</span></td>
            </tr>
        `).join("");

        return `
            <details class="day-group">
                <summary>
                    <span>${escaparHTML(nombreFecha)}</span>
                    <span class="day-group-count">${pedidosDia.length} ${pedidosDia.length === 1 ? "domicilio" : "domicilios"}</span>
                </summary>
                <div class="day-group-content">
                    <div class="day-courier-summary">${resumenDomiciliarios}</div>
                    <div class="table-container">
                        <table class="daily-table">
                            <thead><tr><th>Pedido</th><th>Cliente</th><th>Domiciliario</th><th>Estado</th></tr></thead>
                            <tbody>${filas}</tbody>
                        </table>
                    </div>
                </div>
            </details>
        `;
    }).join("");
}


// ==========================================
// 14. LISTA DE DOMICILIARIOS
// ==========================================

function actualizarListaDomiciliarios() {

    let lista = document.getElementById("listaDomiciliarios");

    let disponibilidad = document.getElementById("disponibilidad");

    let rendimiento = document.getElementById("tablaRendimiento");

    lista.innerHTML = "";
    disponibilidad.innerHTML = "";
    rendimiento.innerHTML = "";

    let totalDisponibles = 0;
    let totalEnRuta = 0;

    domiciliarios.forEach(domiciliario => {

        let d = domiciliario.nombre;

        let asignados = pedidos.filter(p =>
            p.domiciliario === d
        );

        let enCamino = asignados.filter(p =>
            p.estado === "En camino"
        ).length;

        let entregados = asignados.filter(p =>
            p.estado === "Entregado"
        ).length;

        let pendientes = asignados.filter(p =>
            p.estado === "Pendiente"
        ).length;

        let disponible = pendientes === 0 && enCamino === 0;
        if (disponible) totalDisponibles += 1;
        if (enCamino > 0) totalEnRuta += 1;

        let pedidosActivos = pendientes + enCamino;
        let cargaPorcentaje = Math.min(100, pedidosActivos * 25);
        lista.innerHTML += `
            <div class="persona">
                <div>
                    <b>${escaparHTML(d)}</b>
                    <small>${escaparHTML(domiciliario.correo)}</small>
                    <small>${pedidosActivos} activos · ${entregados} entregados</small>
                    <div class="courier-load" aria-label="Carga de trabajo ${cargaPorcentaje}%"><span style="width:${cargaPorcentaje}%"></span></div>
                </div>
                <div class="persona-acciones">
                    <span class="team-status ${disponible ? "is-available" : "is-busy"}">
                        ${disponible ? "Disponible" : enCamino > 0 ? "En ruta" : "Con pedidos"}
                    </span>
                    <button type="button" class="boton-eliminar"
                            data-correo="${escaparHTML(domiciliario.correo)}"
                            onclick="eliminarDomiciliario(this.dataset.correo)">
                        Eliminar
                    </button>
                </div>
            </div>
        `;

        disponibilidad.innerHTML += `
            <div class="persona">
                <div class="team-member">
                    <b>${escaparHTML(d)}</b>
                    <small>${pedidosActivos} ${pedidosActivos === 1 ? "pedido activo" : "pedidos activos"}</small>
                </div>
                <span class="team-status ${disponible ? "is-available" : "is-busy"}">
                    ${disponible ? "Disponible" : enCamino > 0 ? "En ruta" : "Con pedidos"}
                </span>
            </div>
        `;

        rendimiento.innerHTML += `
            <tr>
                <td>${escaparHTML(d)}</td>
                <td>${asignados.length}</td>
                <td>${enCamino}</td>
                <td>${entregados}</td>
            </tr>
        `;

    });

    document.getElementById("resumenDomiciliarios").textContent = domiciliarios.length;
    document.getElementById("resumenDisponibles").textContent = totalDisponibles;
    document.getElementById("resumenEnRuta").textContent = totalEnRuta;

}


// ==========================================
// 15. PEDIDOS DEL DOMICILIARIO
// ==========================================

function actualizarPedidosDomi() {

    if (!usuarioActual || usuarioActual.rol !== "domiciliario") {
        return;
    }

    let misPedidos = pedidos.filter(p =>
        p.domiciliario === usuarioActual.nombre &&
        p.estado !== "Entregado"
    );

    let historial = pedidos.filter(p =>
        p.domiciliario === usuarioActual.nombre &&
        p.estado === "Entregado"
    );

    let pendientes = misPedidos.filter(p =>
        p.estado === "Pendiente"
    ).length;

    let camino = misPedidos.filter(p =>
        p.estado === "En camino"
    ).length;

    document.getElementById("misPendientes").textContent = pendientes;

    document.getElementById("misCamino").textContent = camino;

    document.getElementById("misEntregados").textContent = historial.length;

    let lista = document.getElementById("listaMisPedidos");

    lista.innerHTML = "";

    if (misPedidos.length === 0) {

        lista.innerHTML =
            "<div class='vacio'>No tienes pedidos pendientes.</div>";

    }

    misPedidos.forEach(p => {

        lista.innerHTML += `
            <div class="pedido-domi">

                <h3>Pedido #${p.id}</h3>

                <p><b>Cliente:</b> ${p.cliente}</p>

                <p><b>Teléfono:</b> ${p.telefono}</p>

                <p><b>Dirección:</b> ${p.direccion}</p>

                <p><b>Día del domicilio:</b> ${formatoFecha(p.fechaProgramada)}</p>

                <p><b>Descripción:</b> ${p.descripcion}</p>

                <p><b>Valor:</b> ${formatoDinero(p.valor)}</p>

                <p><b>Observaciones:</b> ${p.observaciones || "Ninguna"}</p>

                <p><b>Estado actual:</b>
                    <span class="status ${claseEstado(p.estado)}">
                        ${p.estado}
                    </span>
                </p>

                <label>Actualizar estado</label>

                <select onchange="cambiarEstado(${p.id},this.value)">

                    <option value="">Seleccionar estado</option>

                    <option value="En camino">
                        En camino
                    </option>

                    <option value="Entregado">
                        Entregado
                    </option>

                </select>

            </div>
        `;

    });

    actualizarHistorial();

}


// ==========================================
// 16. HISTORIAL DE ENTREGAS
// ==========================================

function actualizarHistorial() {

    let lista = document.getElementById("listaHistorial");

    lista.innerHTML = "";

    let historial = pedidos.filter(p =>
        p.domiciliario === usuarioActual.nombre &&
        p.estado === "Entregado"
    );

    if (historial.length === 0) {

        lista.innerHTML =
            "<div class='vacio'>Todavía no tienes entregas completadas.</div>";

        return;

    }

    historial.forEach(p => {

        lista.innerHTML += `
            <div class="pedido-domi">
                <h3>Pedido #${p.id}</h3>
                <p><b>Cliente:</b> ${p.cliente}</p>
                <p><b>Dirección:</b> ${p.direccion}</p>
                <p><b>Entregado el:</b> ${formatoFecha(p.fechaEntrega)}</p>
                <p><b>Valor:</b> ${formatoDinero(p.valor)}</p>
                <span class="status entregado">Entregado</span>
            </div>
        `;

    });

}


// ==========================================
// 17. PERFIL DEL DOMICILIARIO
// ==========================================

function actualizarPerfil() {

    if (!usuarioActual) return;

    let asignados = pedidos.filter(p =>
        p.domiciliario === usuarioActual.nombre
    );

    document.getElementById("datosPerfil").innerHTML = `
        <div class="persona">
            <div>
                <b>Nombre:</b>
                <small>${usuarioActual.nombre}</small>
            </div>
        </div>

        <div class="persona">
            <div>
                <b>Correo electrónico:</b>
                <small>${usuarioActual.correo}</small>
            </div>
        </div>

        <div class="persona">
            <div>
                <b>Rol:</b>
                <small>Domiciliario</small>
            </div>
        </div>

        <div class="persona">
            <div>
                <b>Pedidos asignados:</b>
                <small>${asignados.length}</small>
            </div>
        </div>
    `;

}


// ==========================================
// 18. ACTUALIZAR TODA LA INFORMACIÓN
// ==========================================

function actualizarTodo() {

    if (!usuarioActual) return;

    if (usuarioActual.rol === "admin") {

        actualizarEstadisticas();

        actualizarTablaInicio();

        actualizarTablaPedidos();

        actualizarListaDomiciliarios();

    }

    if (usuarioActual.rol === "domiciliario") {

        actualizarPedidosDomi();

        actualizarPerfil();

    }

}


// ==========================================
// 19. FUNCIONES AUXILIARES
// ==========================================

function claseEstado(estado) {

    if (estado === "Entregado") {
        return "entregado";
    }

    if (estado === "En camino") {
        return "camino";
    }

    return "";

}


function formatoDinero(valor) {

    return "$" + Number(valor).toLocaleString("es-CO");

}

function fechaLocalActual() {
    let ahora = new Date();
    let anio = ahora.getFullYear();
    let mes = String(ahora.getMonth() + 1).padStart(2, "0");
    let dia = String(ahora.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function formatoFecha(fecha) {
    if (!fecha) {
        return "Sin fecha";
    }

    let [anio, mes, dia] = fecha.split("-").map(Number);
    if (!anio || !mes || !dia) {
        return "Sin fecha";
    }

    return new Date(anio, mes - 1, dia).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}


function mostrarMensaje(mensaje) {

    let toast = document.getElementById("toast");

    toast.textContent = mensaje;

    toast.style.display = "block";

    setTimeout(() => {
        toast.style.display = "none";
    }, 2500);

}
