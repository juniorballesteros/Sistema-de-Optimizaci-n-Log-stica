document.addEventListener('DOMContentLoaded', () => {
    const coordenadasBaseSedes = {
        "Ubaté": { lat: 5.3114, lng: -73.8169 },
        "Bogotá": { lat: 4.6097, lng: -74.0817 },
        "Villavicencio": { lat: 4.1420, lng: -73.6266 },
        "Pereira": { lat: 4.8133, lng: -75.6961 },
        "Montería": { lat: 8.7479, lng: -75.8814 }
    };

    let baseDeDatosUsuarios = JSON.parse(localStorage.getItem('bd_logistica_ubate_v7')) || {
        "distribuidora_ubate": {
            password: "Admin123*",
            ciudad: "Ubaté",
            direccion: "Calle Principal # 4-20",
            logo: "https://cdn-icons-png.flaticon.com/512/2897/2897785.png",
            lat: 5.3114,
            lng: -73.8169,
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
                }
            ],
            historial: []
        }
    };

    let usuarioSesionActiva = localStorage.getItem('sesion_activa_ubate_v7') || null;
    let modoOnline = true;
    let colaSincronizacion = JSON.parse(localStorage.getItem('cola_sync_ubate_v7')) || [];
    let mapaPrincipal = null;
    let mapaRegistro = null;
    let marcadorRegistro = null;

    // === ELEMENTOS DOM ===
    const pantallaLogin = document.getElementById('pantalla-login');
    const pantallaApp = document.getElementById('pantalla-app');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const mensajeAuth = document.getElementById('mensaje-auth');

    const regCiudad = document.getElementById('reg-ciudad');
    const regLat = document.getElementById('reg-lat');
    const regLng = document.getElementById('reg-lng');
    const lblCoordSeleccionada = document.getElementById('lbl-coord-seleccionada');

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
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');

    const btnReportes = document.getElementById('btn-reportes');
    const modalReportes = document.getElementById('modal-reportes');
    const btnCerrarReportes = document.getElementById('btn-cerrar-reportes');
    const tablaReportesBody = document.getElementById('tabla-reportes-body');

    function guardarEnStorage() {
        localStorage.setItem('bd_logistica_ubate_v7', JSON.stringify(baseDeDatosUsuarios));
        localStorage.setItem('cola_sync_ubate_v7', JSON.stringify(colaSincronizacion));
    }

    function mostrarMensaje(msg, tipo) {
        mensajeAuth.textContent = msg;
        mensajeAuth.className = tipo;
        mensajeAuth.classList.remove('hidden');
    }

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

        setTimeout(() => {
            inicializarMapaRegistro();
        }, 300);
    });

    function inicializarMapaRegistro() {
        const ciudadSel = regCiudad.value;
        const coordsBase = coordenadasBaseSedes[ciudadSel] || { lat: 5.3114, lng: -73.8169 };

        if (!mapaRegistro) {
            mapaRegistro = L.map('mapa-registro').setView([coordsBase.lat, coordsBase.lng], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(mapaRegistro);

            mapaRegistro.on('click', (e) => {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;

                regLat.value = lat;
                regLng.value = lng;
                lblCoordSeleccionada.innerHTML = `✅ Ubicación fijada: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;

                if (marcadorRegistro) {
                    marcadorRegistro.setLatLng([lat, lng]);
                } else {
                    marcadorRegistro = L.marker([lat, lng], { draggable: true }).addTo(mapaRegistro);
                }
            });
        } else {
            mapaRegistro.setView([coordsBase.lat, coordsBase.lng], 14);
            mapaRegistro.invalidateSize();
        }
    }

    regCiudad.addEventListener('change', () => {
        inicializarMapaRegistro();
    });

    // === REGISTRO DE EMPRESA CON LOGO Y COORDENADAS ===
    formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevoUsuario = document.getElementById('reg-usuario').value.trim();
        const nuevaCiudad = regCiudad.value;
        const nuevaDireccion = document.getElementById('reg-direccion').value.trim();
        const nuevoLogo = document.getElementById('reg-logo').value.trim() || "https://cdn-icons-png.flaticon.com/512/2897/2897785.png";
        const nuevaPassword = document.getElementById('reg-password').value.trim();
        const lat = parseFloat(regLat.value);
        const lng = parseFloat(regLng.value);

        if (!nuevoUsuario || !nuevaPassword || !nuevaDireccion) return;

        if (isNaN(lat) || isNaN(lng)) {
            alert("⚠️ Por favor haz clic en el mapa de registro para seleccionar la ubicación exacta de tu empresa.");
            return;
        }

        if (baseDeDatosUsuarios[nuevoUsuario]) {
            mostrarMensaje("El nombre de la empresa ya existe. Elige otro.", "error");
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
            direccion: nuevaDireccion,
            logo: nuevoLogo,
            lat: lat,
            lng: lng,
            inventario: [],
            historial: []
        };

        guardarEnStorage();
        mostrarMensaje("¡Empresa y perfil registrados con éxito!", "exito");
        formRegister.reset();
        regLat.value = '';
        regLng.value = '';
        if (marcadorRegistro) {
            mapaRegistro.removeLayer(marcadorRegistro);
            marcadorRegistro = null;
        }

        setTimeout(() => {
            tabLogin.click();
            document.getElementById('usuario').value = nuevoUsuario;
        }, 1500);
    });

    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const usr = document.getElementById('usuario').value.trim();
        const pass = document.getElementById('password').value.trim();

        if (baseDeDatosUsuarios[usr] && baseDeDatosUsuarios[usr].password === pass) {
            usuarioSesionActiva = usr;
            localStorage.setItem('sesion_activa_ubate_v7', usr);
            iniciarApp();
        } else {
            mostrarMensaje("Usuario o contraseña incorrectos.", "error");
        }
    });

    btnLogout.addEventListener('click', () => {
        usuarioSesionActiva = null;
        localStorage.removeItem('sesion_activa_ubate_v7');
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

    btnVistaMapa.addEventListener('click', () => {
        seccionMapa.classList.toggle('hidden');
        if (!seccionMapa.classList.contains('hidden')) {
            inicializarMapaPrincipal();
        }
    });

    btnVistaComparador.addEventListener('click', () => {
        seccionComparador.classList.toggle('hidden');
        if (!seccionComparador.classList.contains('hidden')) {
            poblarSelectorComparador();
            actualizarComparacionPrecios();
        }
    });

    // === MAPA GENERAL CON LOS LOGOS E IMÁGENES DE CADA EMPRESA ===
    function inicializarMapaPrincipal() {
        setTimeout(() => {
            const dataUsuarioActual = baseDeDatosUsuarios[usuarioSesionActiva];
            const latCentro = dataUsuarioActual ? dataUsuarioActual.lat : 5.3114;
            const lngCentro = dataUsuarioActual ? dataUsuarioActual.lng : -73.8169;

            if (!mapaPrincipal) {
                mapaPrincipal = L.map('mapa-sedes').setView([latCentro, lngCentro], 14);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap'
                }).addTo(mapaPrincipal);
            } else {
                mapaPrincipal.setView([latCentro, lngCentro], 14);
                mapaPrincipal.invalidateSize();
            }

            mapaPrincipal.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    mapaPrincipal.removeLayer(layer);
                }
            });

            Object.keys(baseDeDatosUsuarios).forEach(usr => {
                const dataUsr = baseDeDatosUsuarios[usr];
                const lat = dataUsr.lat || 5.3114;
                const lng = dataUsr.lng || -73.8169;
                const ciudad = dataUsr.ciudad || "Ubaté";
                const direccion = dataUsr.direccion || "Ubicación sede";
                const logo = dataUsr.logo || "https://cdn-icons-png.flaticon.com/512/2897/2897785.png";
                const totalProd = dataUsr.inventario ? dataUsr.inventario.length : 0;

                const esUsuarioActual = (usr === usuarioSesionActiva);
                const marker = L.marker([lat, lng]).addTo(mapaPrincipal);

                marker.bindPopup(`
                    <div style="font-family:sans-serif; text-align:center;">
                        <img src="${logo}" alt="Logo" style="width:45px; height:45px; border-radius:50%; object-fit:cover; border:2px solid #dc2626; margin-bottom:5px;"><br>
                        <strong style="color:${esUsuarioActual ? '#dc2626' : '#2563eb'}; font-size:1rem;">
                            ${usr.toUpperCase()} ${esUsuarioActual ? '(Tu Empresa)' : ''}
                        </strong><br>
                        <p style="margin:4px 0; font-size:0.85rem;">Ciudad: <strong>${ciudad}</strong></p>
                        <p style="margin:4px 0; font-size:0.85rem;">Ref: ${direccion}</p>
                        <p style="margin:0; font-size:0.85rem; font-weight:bold; color:#16a34a;">Productos: ${totalProd}</p>
                    </div>
                `);

                if (esUsuarioActual) {
                    marker.openPopup();
                }
            });
        }, 300);
    }

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
                        <th>Empresa</th>
                        <th>Ciudad / Ref</th>
                        <th>Precio Unitario</th>
                        <th>Stock</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let encontrado = false;
        let mejorPrecio = Infinity;
        let mejorSede = "";

        Object.keys(baseDeDatosUsuarios).forEach(usr => {
            const dataUsr = baseDeDatosUsuarios[usr];
            const prodEnSede = dataUsr.inventario.find(p => p.nombre === productoSeleccionado);
            const logo = dataUsr.logo || "https://cdn-icons-png.flaticon.com/512/2897/2897785.png";

            if (prodEnSede) {
                encontrado = true;
                if (prodEnSede.precio < mejorPrecio) {
                    mejorPrecio = prodEnSede.precio;
                    mejorSede = `${usr} (${dataUsr.ciudad})`;
                }

                comparativaHTML += `
                    <tr>
                        <td>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <img src="${logo}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border:1px solid #d1d5db;">
                                <strong>${usr}</strong>
                            </div>
                        </td>
                        <td>${dataUsr.ciudad}<br><small style="color:#6b7280;">${dataUsr.direccion}</small></td>
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
                    💡 <strong>Recomendación Logística:</strong> El mejor precio para <strong>${productoSeleccionado}</strong> lo ofrece <strong>${mejorSede}</strong> a solo <strong>$ ${mejorPrecio.toLocaleString()} COP</strong>.
                </div>
            ` + comparativaHTML;
        } else {
            comparativaHTML = `<p style="color:#dc2626;">Ninguna otra empresa tiene registrado este producto.</p>`;
        }

        resultadoComparacion.innerHTML = comparativaHTML;
    }

    selectProductoComparar.addEventListener('change', actualizarComparacionPrecios);

    btnToggleRed.addEventListener('click', () => {
        modoOnline = !modoOnline;
        actualizarEstadoRed();
    });

    function actualizarEstadoRed() {
        if (modoOnline) {
            estadoConexion.className = "badge";
            estadoConexion.innerHTML = `<i class="fa-solid fa-wifi"></i> Online | <strong>${usuarioSesionActiva}</strong>`;
        } else {
            estadoConexion.className = "badge offline";
            estadoConexion.innerHTML = `<i class="fa-solid fa-ban"></i> Offline | <strong>${usuarioSesionActiva}</strong>`;
        }
    }

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
            }
        } else {
            const nuevoProd = {
                id: "prod_" + Date.now(),
                codigo: codigo,
                nombre: nombre,
                stock: stockNum,
                minimo: minNum,
                precio: precioNum,
                lotes: [{ idLote: "lote_" + Date.now(), cantidad: stockNum, fechaVencimiento: fechaVenc }]
            };
            usrData.inventario.unshift(nuevoProd);
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

    function renderizarTabla() {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        if (!usrData) return;

        const filtro = inputBuscar.value.toLowerCase().trim();
        tablaBody.innerHTML = '';
        const productosFiltrados = usrData.inventario.filter(p => p.nombre.toLowerCase().includes(filtro) || p.codigo.includes(filtro));

        if (productosFiltrados.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#6b7280; padding:15px;">No se encontraron productos en el inventario.</td></tr>`;
            return;
        }

        const hoy = new Date().toISOString().split('T')[0];

        productosFiltrados.forEach(prod => {
            prod.lotes.sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));
            const loteProximo = prod.lotes[0];
            let estadoHTML = loteProximo ? `<span style="color:#16a34a;">Vence: ${loteProximo.fechaVencimiento}</span>` : `Sin lotes`;

            let lotesDetalleHTML = prod.lotes.map(l => `<div class="detalle-lotes">• Cant: <strong>${l.cantidad}</strong> | Vence: ${l.fechaVencimiento}</div>`).join('');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${prod.nombre}</strong><br><small>${prod.codigo}</small></td>
                <td>${prod.stock} un.</td>
                <td>${prod.minimo} un.</td>
                <td>$ ${prod.precio.toLocaleString()} COP</td>
                <td>${estadoHTML}${lotesDetalleHTML}</td>
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
        tituloFormProducto.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Modificar Producto`;
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
        if (tipo === 'ENTRADA') {
            modalTituloMov.textContent = "Registrar ENTRADA";
            grupoVencimientoMov.classList.remove('hidden');
        } else {
            modalTituloMov.textContent = "Registrar SALIDA FIFO";
            grupoVencimientoMov.classList.add('hidden');
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
        const prod = usrData.inventario.find(p => p.id === id);

        if (tipo === 'ENTRADA') {
            prod.stock += cantidad;
            prod.lotes.push({ idLote: "lote_" + Date.now(), cantidad: cantidad, fechaVencimiento: fechaVenc });
        } else {
            if (cantidad > prod.stock) return;
            prod.stock -= cantidad;
            let restante = cantidad;
            prod.lotes.sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));
            for (let i = 0; i < prod.lotes.length; i++) {
                if (restante <= 0) break;
                if (prod.lotes[i].cantidad <= restante) {
                    restante -= prod.lotes[i].cantidad;
                    prod.lotes[i].cantidad = 0;
                } else {
                    prod.lotes[i].cantidad -= restante;
                    restante = 0;
                }
            }
            prod.lotes = prod.lotes.filter(l => l.cantidad > 0);
        }

        guardarEnStorage();
        modalMovimiento.classList.add('hidden');
        renderizarTabla();
    });

    if (usuarioSesionActiva && baseDeDatosUsuarios[usuarioSesionActiva]) {
        iniciarApp();
    }
});