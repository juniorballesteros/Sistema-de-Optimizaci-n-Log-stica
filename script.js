document.addEventListener('DOMContentLoaded', () => {
    // === COORDENADAS GEOGRÁFICAS DE SEDES EN COLOMBIA ===
    const coordenadasSedes = {
        "Ubaté": { lat: 5.3114, lng: -73.8169, direccion: "Calle Principal # 4-20, Bodega Central" },
        "Bogotá": { lat: 4.6097, lng: -74.0817, direccion: "Zona Industrial Álamos / Autopista Norte" },
        "Villavicencio": { lat: 4.1420, lng: -73.6266, direccion: "Anillo Vial Vía Puerto López" },
        "Pereira": { lat: 4.8133, lng: -75.6961, direccion: "Parque Industrial Bodega 12" },
        "Montería": { lat: 8.7479, lng: -75.8814, direccion: "Vía Arboletes Sector Comercial" }
    };

    // === BASE DE DATOS LOCAL Y ESTADO ===
    let baseDeDatosUsuarios = JSON.parse(localStorage.getItem('bd_logistica_ubate_v2')) || {
        "admin_ubate": {
            password: "Admin123*",
            ciudad: "Ubaté",
            inventario: [
                {
                    id: "prod_1",
                    codigo: "7701234567891",
                    nombre: "Leche Entera Larga Vida 1L",
                    stock: 50,
                    minimo: 10,
                    precio: 4200,
                    lotes: [
                        { idLote: "lote_101", cantidad: 30, fechaVencimiento: "2026-11-15" },
                        { idLote: "lote_102", cantidad: 20, fechaVencimiento: "2026-12-20" }
                    ]
                },
                {
                    id: "prod_2",
                    codigo: "7709876543210",
                    nombre: "Queso Doble Crema 500g",
                    stock: 8,
                    minimo: 15,
                    precio: 14500,
                    lotes: [
                        { idLote: "lote_201", cantidad: 8, fechaVencimiento: "2026-11-05" }
                    ]
                }
            ],
            historial: [
                {
                    fecha: new Date().toLocaleString(),
                    operario: "admin_ubate",
                    producto: "Leche Entera Larga Vida 1L",
                    tipo: "Registro Inicial",
                    detalle: "50 unidades cargadas en 2 lotes"
                }
            ]
        },
        "admin_bogota": {
            password: "Admin123*",
            ciudad: "Bogotá",
            inventario: [
                {
                    id: "prod_bog_1",
                    codigo: "7701234567891",
                    nombre: "Leche Entera Larga Vida 1L",
                    stock: 120,
                    minimo: 20,
                    precio: 3900,
                    lotes: [
                        { idLote: "lote_bog_1", cantidad: 120, fechaVencimiento: "2026-12-10" }
                    ]
                },
                {
                    id: "prod_bog_2",
                    codigo: "7709876543210",
                    nombre: "Queso Doble Crema 500g",
                    stock: 45,
                    minimo: 10,
                    precio: 15200,
                    lotes: [
                        { idLote: "lote_bog_2", cantidad: 45, fechaVencimiento: "2026-11-20" }
                    ]
                }
            ],
            historial: []
        }
    };

    let usuarioSesionActiva = localStorage.getItem('sesion_activa_ubate_v2') || null;
    let modoOnline = true;
    let colaSincronizacion = JSON.parse(localStorage.getItem('cola_sync_ubate_v2')) || [];
    let mapaLeaflet = null;

    // === ELEMENTOS DOM ===
    const pantallaLogin = document.getElementById('pantalla-login');
    const pantallaApp = document.getElementById('pantalla-app');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const mensajeAuth = document.getElementById('mensaje-auth');

    const nombreUsuarioActivo = document.getElementById('nombre-usuario-activo');
    const lblCiudadUsuario = document.getElementById('lbl-ciudad-usuario');
    const estadoConexion = document.getElementById('estado-conexion');
    const btnToggleRed = document.getElementById('btn-toggle-red');
    const btnSincronizar = document.getElementById('btn-sincronizar');
    const countCola = document.getElementById('count-cola');
    const btnLogout = document.getElementById('btn-logout');

    const btnVistaMapa = document.getElementById('btn-vista-mapa');
    const btnVistaComparador = document.getElementById('btn-vista-comparador');
    const seccionMapa = document.getElementById('seccion-mapa');
    const seccionComparador = document.getElementById('seccion-comparador');
    const seccionInventarioForm = document.getElementById('seccion-inventario-form');
    const seccionInventarioTabla = document.getElementById('seccion-inventario-tabla');

    const selectProductoComparar = document.getElementById('select-producto-comparar');
    const resultadoComparacion = document.getElementById('resultado-comparacion');

    const formProducto = document.getElementById('form-producto');
    const prodId = document.getElementById('prod-id');
    const prodCodigo = document.getElementById('prod-codigo');
    const prodNombre = document.getElementById('prod-nombre');
    const prodStock = document.getElementById('prod-stock');
    const prodVencimiento = document.getElementById('prod-vencimiento');
    const prodMinimo = document.getElementById('prod-minimo');
    const prodPrecio = document.getElementById('prod-precio');
    const tituloFormProducto = document.getElementById('titulo-form-producto');

    const inputBuscar = document.getElementById('input-buscar');
    const tablaBody = document.getElementById('tabla-body');

    const modalMovimiento = document.getElementById('modal-movimiento');
    const formMovimiento = document.getElementById('form-movimiento');
    const modalTituloMov = document.getElementById('modal-titulo-mov');
    const movProdId = document.getElementById('mov-prod-id');
    const movTipo = document.getElementById('mov-tipo');
    const movProdNombre = document.getElementById('mov-prod-nombre');
    const movCantidad = document.getElementById('mov-cantidad');
    const movVencimiento = document.getElementById('mov-vencimiento');
    const grupoVencimientoMov = document.getElementById('grupo-vencimiento-mov');
    const movAlertaFifo = document.getElementById('mov-alerta-fifo');
    const movAlertaStock = document.getElementById('mov-alerta-stock');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');

    const btnReportes = document.getElementById('btn-reportes');
    const modalReportes = document.getElementById('modal-reportes');
    const btnCerrarReportes = document.getElementById('btn-cerrar-reportes');
    const tablaReportesBody = document.getElementById('tabla-reportes-body');

    // === MÉTODOS DE ALMACENAMIENTO ===
    function guardarEnStorage() {
        localStorage.setItem('bd_logistica_ubate_v2', JSON.stringify(baseDeDatosUsuarios));
        localStorage.setItem('cola_sync_ubate_v2', JSON.stringify(colaSincronizacion));
    }

    function mostrarMensaje(msg, tipo) {
        mensajeAuth.textContent = msg;
        mensajeAuth.className = tipo;
        mensajeAuth.classList.remove('hidden');
    }

    // === LÓGICA DE PESTAÑAS LOGIN/REGISTRO ===
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
        mensajeAuth.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        formRegister.classList.remove('hidden');
        formLogin.classList.add('hidden');
        mensajeAuth.classList.add('hidden');
    });

    // === REGISTRO DE USUARIOS Y SEDES ===
    formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevoUsuario = document.getElementById('reg-usuario').value.trim().toLowerCase();
        const nuevaCiudad = document.getElementById('reg-ciudad').value;
        const nuevaPassword = document.getElementById('reg-password').value.trim();

        if (!nuevoUsuario || !nuevaPassword) return;

        if (baseDeDatosUsuarios[nuevoUsuario]) {
            mostrarMensaje("El nombre de usuario ya existe. Elige otro.", "error");
            return;
        }

        const regexPassword = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>0-9]).{6,}$/;
        if (!regexPassword.test(nuevaPassword)) {
            mostrarMensaje("La contraseña debe tener al menos 6 caracteres, una mayúscula y un carácter especial o número.", "error");
            return;
        }

        baseDeDatosUsuarios[nuevoUsuario] = {
            password: nuevaPassword,
            ciudad: nuevaCiudad,
            inventario: [],
            historial: []
        };

        guardarEnStorage();
        mostrarMensaje("¡Sede y cuenta creada con éxito! Ya puedes iniciar sesión.", "exito");
        formRegister.reset();

        setTimeout(() => {
            tabLogin.click();
            document.getElementById('usuario').value = nuevoUsuario;
        }, 1500);
    });

    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const usr = document.getElementById('usuario').value.trim().toLowerCase();
        const pass = document.getElementById('password').value.trim();

        if (baseDeDatosUsuarios[usr] && baseDeDatosUsuarios[usr].password === pass) {
            usuarioSesionActiva = usr;
            localStorage.setItem('sesion_activa_ubate_v2', usr);
            iniciarApp();
        } else {
            mostrarMensaje("Usuario o contraseña incorrectos.", "error");
        }
    });

    btnLogout.addEventListener('click', () => {
        usuarioSesionActiva = null;
        localStorage.removeItem('sesion_activa_ubate_v2');
        pantallaApp.classList.add('hidden');
        pantallaLogin.classList.remove('hidden');
        formLogin.reset();
        mensajeAuth.classList.add('hidden');
    });

    function iniciarApp() {
        pantallaLogin.classList.add('hidden');
        pantallaApp.classList.remove('hidden');
        nombreUsuarioActivo.textContent = usuarioSesionActiva;
        lblCiudadUsuario.textContent = baseDeDatosUsuarios[usuarioSesionActiva].ciudad || "Ubaté";
        actualizarEstadoRed();
        renderizarTabla();
    }

    // === BOTONES DE NAVEGACIÓN (MAPA Y COMPARADOR) ===
    btnVistaMapa.addEventListener('click', () => {
        seccionMapa.classList.toggle('hidden');
        if (!seccionMapa.classList.contains('hidden')) {
            inicializarMapaLeaflet();
        }
    });

    btnVistaComparador.addEventListener('click', () => {
        seccionComparador.classList.toggle('hidden');
        if (!seccionComparador.classList.contains('hidden')) {
            poblarSelectorComparador();
            actualizarComparacionPrecios();
        }
    });

    // === INICIALIZAR MAPA INTERACTIVO (LEAFLET) ===
    function inicializarMapaLeaflet() {
        setTimeout(() => {
            if (!mapaLeaflet) {
                // Centrado inicial en Colombia (Ubaté / Cundinamarca)
                mapaLeaflet = L.map('mapa-sedes').setView([5.0, -73.8], 7);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors'
                }).addTo(mapaLeaflet);
            } else {
                mapaLeaflet.invalidateSize();
            }

            // Limpiar capas previas de marcadores si las hubiera
            mapaLeaflet.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    mapaLeaflet.removeLayer(layer);
                }
            });

            // Contar sedes activas por ciudad
            const conteoPorCiudad = {};
            Object.keys(baseDeDatosUsuarios).forEach(usr => {
                const ciudad = baseDeDatosUsuarios[usr].ciudad || "Ubaté";
                conteoPorCiudad[ciudad] = (conteoPorCiudad[ciudad] || 0) + 1;
            });

            // Añadir marcadores por cada sede registrada
            Object.keys(conteoPorCiudad).forEach(ciudad => {
                const infoCoord = coordenadasSedes[ciudad] || { lat: 4.6, lng: -74.0, direccion: "Sede Regional" };
                const totalSedes = conteoPorCiudad[ciudad];

                const marker = L.marker([infoCoord.lat, infoCoord.lng]).addTo(mapaLeaflet);
                marker.bindPopup(`
                    <div style="font-family:sans-serif;">
                        <strong style="color:#dc2626; font-size:1rem;">📍 Sede: ${ciudad}</strong><br>
                        <p style="margin:4px 0; font-size:0.85rem;">Dirección: ${infoCoord.direccion}</p>
                        <p style="margin:0; font-size:0.85rem; font-weight:bold;">Centros registrados: ${totalSedes}</p>
                    </div>
                `);
            });
        }, 200);
    }

    // === COMPARADOR DE PRECIOS MULTICIUDAD ===
    function poblarSelectorComparador() {
        const productosUnicos = new Set();
        Object.keys(baseDeDatosUsuarios).forEach(usr => {
            baseDeDatosUsuarios[usr].inventario.forEach(p => productosUnicos.add(p.nombre));
        });

        selectProductoComparar.innerHTML = '';
        productosUnicos.forEach(nombreProd => {
            const opt = document.createElement('option');
            opt.value = nombreProd;
            opt.textContent = nombreProd;
            selectProductoComparar.appendChild(opt);
        });
    }

    function actualizarComparacionPrecios() {
        const productoSeleccionado = selectProductoComparar.value;
        if (!productoSeleccionado) {
            resultadoComparacion.innerHTML = `<p style="color:#6b7280;">No hay productos disponibles para comparar.</p>`;
            return;
        }

        let comparativaHTML = `
            <table class="tabla-inventario">
                <thead>
                    <tr>
                        <th>Ciudad / Sede</th>
                        <th>Gestor / Usuario</th>
                        <th>Precio Unitario</th>
                        <th>Stock Disponible</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let encontrado = false;
        let mejorPrecio = Infinity;
        let mejorCiudad = "";

        Object.keys(baseDeDatosUsuarios).forEach(usr => {
            const dataUsr = baseDeDatosUsuarios[usr];
            const prodEnSede = dataUsr.inventario.find(p => p.nombre === productoSeleccionado);

            if (prodEnSede) {
                encontrado = true;
                if (prodEnSede.precio < mejorPrecio) {
                    mejorPrecio = prodEnSede.precio;
                    mejorCiudad = dataUsr.ciudad || "Ubaté";
                }

                comparativaHTML += `
                    <tr>
                        <td><strong>${dataUsr.ciudad || "Ubaté"}</strong></td>
                        <td>${usr}</td>
                        <td style="font-weight:bold; color:#16a34a;">$ ${prodEnSede.precio.toLocaleString()} COP</td>
                        <td>${prodEnSede.stock} un.</td>
                    </tr>
                `;
            }
        });

        comparativaHTML += `</tbody></table>`;

        if (encontrado) {
            comparativaHTML = `
                <div style="background:#f0fdf4; border:1px solid #86efac; padding:10px; border-radius:8px; margin-bottom:12px; color:#15803d; font-size:0.9rem;">
                    💡 <strong>Recomendación Logística:</strong> El mejor precio para comprar <strong>${productoSeleccionado}</strong> se encuentra en la sede de <strong>${mejorCiudad}</strong> a un costo de <strong>$ ${mejorPrecio.toLocaleString()} COP</strong>.
                </div>
            ` + comparativaHTML;
        } else {
            comparativaHTML = `<p style="color:#dc2626;">Ninguna otra sede tiene registrado este producto actualmente.</p>`;
        }

        resultadoComparacion.innerHTML = comparativaHTML;
    }

    selectProductoComparar.addEventListener('change', actualizarComparacionPrecios);

    // === CONTROL DE CONEXIÓN Y MODO OFFLINE ===
    btnToggleRed.addEventListener('click', () => {
        modoOnline = !modoOnline;
        actualizarEstadoRed();
    });

    function actualizarEstadoRed() {
        if (modoOnline) {
            estadoConexion.className = "badge";
            estadoConexion.innerHTML = `<i class="fa-solid fa-wifi"></i> Online | <strong>${usuarioSesionActiva}</strong> (${baseDeDatosUsuarios[usuarioSesionActiva].ciudad || "Ubaté"})`;
            btnToggleRed.innerHTML = `<i class="fa-solid fa-toggle-on"></i> Simular Red`;
        } else {
            estadoConexion.className = "badge offline";
            estadoConexion.innerHTML = `<i class="fa-solid fa-ban"></i> Offline | <strong>${usuarioSesionActiva}</strong> (${baseDeDatosUsuarios[usuarioSesionActiva].ciudad || "Ubaté"})`;
            btnToggleRed.innerHTML = `<i class="fa-solid fa-toggle-off"></i> Simular Red`;
        }

        if (colaSincronizacion.length > 0) {
            btnSincronizar.classList.remove('hidden');
            countCola.textContent = colaSincronizacion.length;
        } else {
            btnSincronizar.classList.add('hidden');
        }
    }

    btnSincronizar.addEventListener('click', () => {
        if (!modoOnline) {
            alert("Atención: Active la red para sincronizar las transacciones en la red nacional.");
            return;
        }
        alert(`¡Sincronización exitosa! Se han enviado ${colaSincronizacion.length} movimientos al servidor central.`);
        colaSincronizacion = [];
        guardarEnStorage();
        actualizarEstadoRed();
    });

    function registrarTransaccionCola(tipo, detalle) {
        if (!modoOnline) {
            colaSincronizacion.push({
                fecha: new Date().toLocaleString(),
                operario: usuarioSesionActiva,
                ciudad: baseDeDatosUsuarios[usuarioSesionActiva].ciudad || "Ubaté",
                tipo: tipo,
                detalle: detalle
            });
            guardarEnStorage();
            actualizarEstadoRed();
        }
    }

    // === GESTIÓN DE PRODUCTOS Y LOTES ===
    formProducto.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = prodId.value;
        const codigo = prodCodigo.value.trim();
        const nombre = prodNombre.value.trim();
        const stockNum = parseInt(prodStock.value);
        const fechaVenc = prodVencimiento.value;
        const minNum = parseInt(prodMinimo.value);
        const precioNum = parseInt(prodPrecio.value);

        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];

        if (id) {
            const prodIndex = usrData.inventario.findIndex(p => p.id === id);
            if (prodIndex !== -1) {
                usrData.inventario[prodIndex].codigo = codigo;
                usrData.inventario[prodIndex].nombre = nombre;
                usrData.inventario[prodIndex].minimo = minNum;
                usrData.inventario[prodIndex].precio = precioNum;

                usrData.historial.unshift({
                    fecha: new Date().toLocaleString(),
                    operario: usuarioSesionActiva,
                    producto: nombre,
                    tipo: "Modificación",
                    detalle: `Datos actualizados en sede ${usrData.ciudad}`
                });

                registrarTransaccionCola("Modificación", `${nombre} editado`);
            }
        } else {
            const nuevoProd = {
                id: "prod_" + Date.now(),
                codigo: codigo,
                nombre: nombre,
                stock: stockNum,
                minimo: minNum,
                precio: precioNum,
                lotes: [
                    {
                        idLote: "lote_" + Date.now(),
                        cantidad: stockNum,
                        fechaVencimiento: fechaVenc
                    }
                ]
            };

            usrData.inventario.unshift(nuevoProd);

            usrData.historial.unshift({
                fecha: new Date().toLocaleString(),
                operario: usuarioSesionActiva,
                producto: nombre,
                tipo: "Alta de Producto",
                detalle: `Stock: ${stockNum} un. (Sede: ${usrData.ciudad})`
            });

            registrarTransaccionCola("Alta Producto", `${nombre} registrado (${stockNum} un.)`);
        }

        guardarEnStorage();
        limpiarFormProducto();
        renderizarTabla();
    });

    function limpiarFormProducto() {
        prodId.value = '';
        formProducto.reset();
        prodStock.disabled = false;
        prodVencimiento.disabled = false;
        tituloFormProducto.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Registrar Nuevo Producto Alimentario con Lote`;
    }

    // === RENDERIZADO DE TABLA E INVENTARIO ===
    function renderizarTabla() {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        if (!usrData) return;

        const filtro = inputBuscar.value.toLowerCase().trim();
        tablaBody.innerHTML = '';

        const productosFiltrados = usrData.inventario.filter(p => 
            p.nombre.toLowerCase().includes(filtro) || p.codigo.includes(filtro)
        );

        if (productosFiltrados.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#6b7280; padding:15px;">No se encontraron productos en el inventario.</td></tr>`;
            return;
        }

        const hoy = new Date().toISOString().split('T')[0];

        productosFiltrados.forEach(prod => {
            prod.lotes.sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

            const loteProximo = prod.lotes[0];
            let estadoHTML = '';

            if (loteProximo) {
                const diffDias = Math.ceil((new Date(loteProximo.fechaVencimiento) - new Date(hoy)) / (1000 * 60 * 60 * 24));

                if (diffDias < 0) {
                    estadoHTML = `<span style="color:#dc2626; font-weight:bold;">⛔ Vencido (${loteProximo.fechaVencimiento})</span>`;
                } else if (diffDias <= 7) {
                    estadoHTML = `<span style="color:#ea580c; font-weight:bold;">⚠️ Vence en ${diffDias} días</span>`;
                } else {
                    estadoHTML = `<span style="color:#16a34a;">✅ Vence: ${loteProximo.fechaVencimiento}</span>`;
                }
            } else {
                estadoHTML = `<span style="color:#6b7280;">Sin lotes activos</span>`;
            }

            let stockEstilo = prod.stock <= prod.minimo ? 'color:#dc2626; font-weight:bold;' : 'font-weight:bold;';
            let lotesDetalleHTML = prod.lotes.map(l => 
                `<div class="detalle-lotes">• Cant: <strong>${l.cantidad}</strong> un. | Vence: <strong>${l.fechaVencimiento}</strong></div>`
            ).join('');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${prod.nombre}</strong><br>
                    <small style="color:#6b7280;"><i class="fa-solid fa-barcode"></i> ${prod.codigo}</small>
                </td>
                <td style="${stockEstilo}">${prod.stock} un.</td>
                <td>${prod.minimo} un.</td>
                <td>$ ${prod.precio.toLocaleString()} COP</td>
                <td>
                    ${estadoHTML}
                    ${lotesDetalleHTML}
                </td>
                <td>
                    <button class="btn-in" onclick="abrirModalMovimiento('${prod.id}', 'ENTRADA')"><i class="fa-solid fa-plus"></i></button>
                    <button class="btn-out" onclick="abrirModalMovimiento('${prod.id}', 'SALIDA')"><i class="fa-solid fa-minus"></i></button>
                    <button class="btn-edit" onclick="editarProducto('${prod.id}')"><i class="fa-solid fa-pen"></i></button>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }

    inputBuscar.addEventListener('input', renderizarTabla);

    window.editarProducto = function(id) {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        const prod = usrData.inventario.find(p => p.id === id);
        if (!prod) return;

        prodId.value = prod.id;
        prodCodigo.value = prod.codigo;
        prodNombre.value = prod.nombre;
        prodStock.value = prod.stock;
        prodMinimo.value = prod.minimo;
        prodPrecio.value = prod.precio;

        prodStock.disabled = true;
        prodVencimiento.disabled = true;
        prodVencimiento.value = prod.lotes[0] ? prod.lotes[0].fechaVencimiento : '';

        tituloFormProducto.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Modificar Datos de: ${prod.nombre}`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.abrirModalMovimiento = function(id, tipo) {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        const prod = usrData.inventario.find(p => p.id === id);
        if (!prod) return;

        movProdId.value = prod.id;
        movTipo.value = tipo;
        movProdNombre.value = prod.nombre;
        movCantidad.value = '';
        movAlertaStock.classList.add('hidden');

        if (tipo === 'ENTRADA') {
            modalTituloMov.textContent = "Registrar ENTRADA con Nuevo Lote";
            grupoVencimientoMov.classList.remove('hidden');
            movVencimiento.required = true;
            movAlertaFifo.classList.add('hidden');
        } else {
            modalTituloMov.textContent = "Registrar SALIDA de Inventario (Estrategia FIFO)";
            grupoVencimientoMov.classList.add('hidden');
            movVencimiento.required = false;
            movAlertaFifo.classList.remove('hidden');
        }

        modalMovimiento.classList.remove('hidden');
    };

    btnCerrarModal.addEventListener('click', () => modalMovimiento.classList.add('hidden'));

    formMovimiento.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = movProdId.value;
        const tipo = movTipo.value;
        const cantidad = parseInt(movCantidad.value);
        const fechaVenc = movVencimiento.value;

        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        const prodIndex = usrData.inventario.findIndex(p => p.id === id);
        if (prodIndex === -1) return;

        let prod = usrData.inventario[prodIndex];

        if (tipo === 'ENTRADA') {
            prod.stock += cantidad;
            prod.lotes.push({
                idLote: "lote_" + Date.now(),
                cantidad: cantidad,
                fechaVencimiento: fechaVenc
            });

            usrData.historial.unshift({
                fecha: new Date().toLocaleString(),
                operario: usuarioSesionActiva,
                producto: prod.nombre,
                tipo: "Entrada de Lote",
                detalle: `+${cantidad} un. (Vence: ${fechaVenc})`
            });

            registrarTransaccionCola("Entrada Stock", `${prod.nombre} +${cantidad} un.`);

        } else if (tipo === 'SALIDA') {
            if (cantidad > prod.stock) {
                movAlertaStock.classList.remove('hidden');
                return;
            }

            let cantidadRestante = cantidad;
            prod.stock -= cantidad;

            prod.lotes.sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

            for (let i = 0; i < prod.lotes.length; i++) {
                if (cantidadRestante <= 0) break;

                if (prod.lotes[i].cantidad <= cantidadRestante) {
                    cantidadRestante -= prod.lotes[i].cantidad;
                    prod.lotes[i].cantidad = 0;
                } else {
                    prod.lotes[i].cantidad -= cantidadRestante;
                    cantidadRestante = 0;
                }
            }

            prod.lotes = prod.lotes.filter(l => l.cantidad > 0);

            usrData.historial.unshift({
                fecha: new Date().toLocaleString(),
                operario: usuarioSesionActiva,
                producto: prod.nombre,
                tipo: "Salida FIFO",
                detalle: `-${cantidad} un. (FIFO)`
            });

            registrarTransaccionCola("Salida Stock", `${prod.nombre} -${cantidad} un.`);
        }

        guardarEnStorage();
        modalMovimiento.classList.add('hidden');
        renderizarTabla();
    });

    btnReportes.addEventListener('click', () => {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        if (!usrData) return;

        tablaReportesBody.innerHTML = '';

        if (usrData.historial.length === 0) {
            tablaReportesBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:#6b7280;">No hay movimientos registrados.</td></tr>`;
        } else {
            usrData.historial.forEach(h => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${h.fecha}</td>
                    <td><strong>${h.operario}</strong></td>
                    <td>${h.producto}</td>
                    <td><span class="badge" style="background-color:#4b5563;">${h.tipo}</span></td>
                    <td>${h.detalle}</td>
                `;
                tablaReportesBody.appendChild(tr);
            });
        }

        modalReportes.classList.remove('hidden');
    });

    btnCerrarReportes.addEventListener('click', () => modalReportes.classList.add('hidden'));

    if (usuarioSesionActiva && baseDeDatosUsuarios[usuarioSesionActiva]) {
        iniciarApp();
    }
});