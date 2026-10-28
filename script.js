document.addEventListener('DOMContentLoaded', () => {
    const municipiosDeColombia = {
        "Cundinamarca": ["Ubaté", "Bogotá D.C.", "Zipaquirá", "Chocontá", "Fusagasugá", "Girardot", "Facatativá", "Soacha", "Chía"],
        "Boyacá": ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa", "Puerto Boyacá"],
        "Antioquia": ["Medellín", "Bello", "Itagüí", "Envigado", "Rionegro", "Apartadó"],
        "Valle del Cauca": ["Cali", "Buenaventura", "Palmira", "Tuluá", "Buga", "Cartago"],
        "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja"],
        "Meta": ["Villavicencio", "Acacías", "Granada", "Puerto López"],
        "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Sabanalarga"],
        "Córdoba": ["Montería", "Cereté", "Sahagún", "Lorica", "Tierralta"],
        "Risaralda": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"]
    };

    const coordenadasBaseSedes = {
        "Ubaté": { lat: 5.3114, lng: -73.8169 },
        "Bogotá D.C.": { lat: 4.6097, lng: -74.0817 },
        "Zipaquirá": { lat: 5.0233, lng: -74.0044 },
        "Chocontá": { lat: 5.1528, lng: -73.6822 },
        "Tunja": { lat: 5.5353, lng: -73.3678 },
        "Medellín": { lat: 6.2442, lng: -75.5812 },
        "Cali": { lat: 3.4516, lng: -76.5320 },
        "Bucaramanga": { lat: 7.1193, lng: -73.1227 },
        "Villavicencio": { lat: 4.1420, lng: -73.6266 },
        "Barranquilla": { lat: 10.9685, lng: -74.7813 },
        "Montería": { lat: 8.7479, lng: -75.8814 },
        "Pereira": { lat: 4.8133, lng: -75.6961 }
    };

    const cuentasPredeterminadas = {
        "distribuidora_ubate": {
            nombreOriginal: "Distribuidora Ubaté",
            password: "Admin123*",
            departamento: "Cundinamarca",
            ciudad: "Ubaté",
            direccion: "Carrera 4 # 5-20 (Bodega Central)",
            logo: "https://cdn-icons-png.flaticon.com/512/2897/2897785.png",
            lat: 5.3114,
            lng: -73.8169,
            inventario: [
                {
                    id: "prod_1",
                    codigo: "REF-101",
                    nombre: "Queso Doble Crema 500g",
                    stock: 50,
                    minimo: 10,
                    costoCompra: 8000,
                    ivaPorcentaje: 19,
                    margenPorcentaje: 30,
                    precio: 11424,
                    lotes: [{ idLote: "lote_101", cantidad: 50, fechaVencimiento: "2026-11-15" }]
                }
            ],
            historial: []
        },
        "distribuidora_bogota": {
            nombreOriginal: "Distribuidora Bogotá D.C.",
            password: "Admin123*",
            departamento: "Cundinamarca",
            ciudad: "Bogotá D.C.",
            direccion: "Zona Industrial Calle 13",
            logo: "https://cdn-icons-png.flaticon.com/512/2897/2897785.png",
            lat: 4.6097,
            lng: -74.0817,
            inventario: [
                {
                    id: "prod_bog_1",
                    codigo: "REF-102",
                    nombre: "Queso Doble Crema 500g",
                    stock: 120,
                    minimo: 20,
                    costoCompra: 7500,
                    ivaPorcentaje: 19,
                    margenPorcentaje: 25,
                    precio: 10710,
                    lotes: [{ idLote: "lote_bog_1", cantidad: 120, fechaVencimiento: "2026-12-10" }]
                }
            ],
            historial: []
        }
    };

    let baseDeDatosUsuarios = JSON.parse(localStorage.getItem('bd_logistica_ubate_v2026')) || cuentasPredeterminadas;

    Object.keys(cuentasPredeterminadas).forEach(key => {
        if (!baseDeDatosUsuarios[key]) {
            baseDeDatosUsuarios[key] = cuentasPredeterminadas[key];
        }
    });

    let usuarioSesionActiva = localStorage.getItem('sesion_activa_ubate_v2026') || null;
    let modoOnline = true;
    let colaSincronizacion = JSON.parse(localStorage.getItem('cola_sync_ubate_v2026')) || [];
    let productosDetectadosTemporal = [];

    let mapaPrincipal = null;
    let mapaRegistro = null;
    let marcadorRegistro = null;

    // DOM Elements
    const pantallaLogin = document.getElementById('pantalla-login');
    const pantallaApp = document.getElementById('pantalla-app');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const mensajeAuth = document.getElementById('mensaje-auth');

    const regDepartamento = document.getElementById('reg-departamento');
    const regCiudad = document.getElementById('reg-ciudad');
    const regLat = document.getElementById('reg-lat');
    const regLng = document.getElementById('reg-lng');
    const lblCoordSeleccionada = document.getElementById('lbl-coord-seleccionada');

    const nombreUsuarioActivo = document.getElementById('nombre-usuario-activo');
    const lblCiudadUsuario = document.getElementById('lbl-ciudad-usuario');
    const estadoConexion = document.getElementById('estado-conexion');
    const btnToggleRed = document.getElementById('btn-toggle-red');
    const btnLogout = document.getElementById('btn-logout');

    const btnEditarPerfil = document.getElementById('btn-editar-perfil');
    const modalPerfil = document.getElementById('modal-perfil');
    const btnCerrarPerfil = document.getElementById('btn-cerrar-perfil');
    const formEditarPerfil = document.getElementById('form-editar-perfil');
    const perfilDepartamento = document.getElementById('perfil-departamento');
    const perfilCiudad = document.getElementById('perfil-ciudad');
    const perfilDireccion = document.getElementById('perfil-direccion');
    const perfilLogo = document.getElementById('perfil-logo');

    const btnVistaMapa = document.getElementById('btn-vista-mapa');
    const btnVistaComparador = document.getElementById('btn-vista-comparador');
    const seccionMapa = document.getElementById('seccion-mapa');
    const seccionComparador = document.getElementById('seccion-comparador');

    const selectProductoComparar = document.getElementById('select-producto-comparar');
    const resultadoComparacion = document.getElementById('resultado-comparacion');

    const inputFotoFactura = document.getElementById('input-foto-factura');
    const btnProcesarOCR = document.getElementById('btn-procesar-ocr');
    const estadoOCR = document.getElementById('estado-ocr');

    const modalAuditoriaFactura = document.getElementById('modal-auditoria-factura');
    const tablaAuditoriaBody = document.getElementById('tabla-auditoria-body');
    const btnCerrarAuditoria = document.getElementById('btn-cerrar-auditoria');
    const btnCancelarAuditoria = document.getElementById('btn-cancelar-auditoria');
    const btnConfirmarIngresoFactura = document.getElementById('btn-confirmar-ingreso-factura');

    const formProducto = document.getElementById('form-producto');
    const prodId = document.getElementById('prod-id');
    const prodCodigo = document.getElementById('prod-codigo');
    const prodNombre = document.getElementById('prod-nombre');
    const prodStock = document.getElementById('prod-stock');
    const prodVencimiento = document.getElementById('prod-vencimiento');
    const prodMinimo = document.getElementById('prod-minimo');
    const prodCosto = document.getElementById('prod-costo');
    const prodIva = document.getElementById('prod-iva');
    const prodMargen = document.getElementById('prod-margen');
    const tituloFormProducto = document.getElementById('titulo-form-producto');

    const inputBuscar = document.getElementById('input-buscar');
    const tablaBody = document.getElementById('tabla-body');

    function guardarEnStorage() {
        localStorage.setItem('bd_logistica_ubate_v2026', JSON.stringify(baseDeDatosUsuarios));
        localStorage.setItem('cola_sync_ubate_v2026', JSON.stringify(colaSincronizacion));
    }

    function mostrarMensaje(msg, tipo) {
        mensajeAuth.textContent = msg;
        mensajeAuth.className = tipo;
        mensajeAuth.classList.remove('hidden');
    }

    function configurarSelectores(selectDepto, selectMun) {
        selectDepto.addEventListener('change', () => {
            const depto = selectDepto.value;
            selectMun.innerHTML = '<option value="">Seleccione un municipio...</option>';
            if (municipiosDeColombia[depto]) {
                municipiosDeColombia[depto].forEach(muni => {
                    const opt = document.createElement('option');
                    opt.value = muni;
                    opt.textContent = muni;
                    selectMun.appendChild(opt);
                });
            }
        });
    }

    configurarSelectores(regDepartamento, regCiudad);
    configurarSelectores(perfilDepartamento, perfilCiudad);

    regCiudad.addEventListener('change', () => {
        const muni = regCiudad.value;
        const coords = coordenadasBaseSedes[muni] || { lat: 4.6097, lng: -74.0817 };
        if (mapaRegistro) {
            mapaRegistro.setView([coords.lat, coords.lng], 13);
        }
    });

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
        if (!mapaRegistro) {
            mapaRegistro = L.map('mapa-registro').setView([5.3114, -73.8169], 13);
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
            mapaRegistro.invalidateSize();
        }
    }

    // REGISTRO DE EMPRESA
    formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const usuarioInput = document.getElementById('reg-usuario').value;
        const nuevoUsuarioKey = usuarioInput.trim().toLowerCase();
        const nuevoDepto = regDepartamento.value;
        const nuevaCiudad = regCiudad.value;
        const nuevaDireccion = document.getElementById('reg-direccion').value.trim();
        const nuevoLogo = document.getElementById('reg-logo').value.trim() || "https://cdn-icons-png.flaticon.com/512/2897/2897785.png";
        const nuevaPassword = document.getElementById('reg-password').value.trim();
        const lat = parseFloat(regLat.value);
        const lng = parseFloat(regLng.value);

        if (!nuevoUsuarioKey || !nuevaPassword || !nuevaDireccion || !nuevoDepto || !nuevaCiudad) return;

        if (isNaN(lat) || isNaN(lng)) {
            alert("⚠️ Por favor haz clic en el mapa de registro para seleccionar la ubicación exacta de tu empresa.");
            return;
        }

        if (baseDeDatosUsuarios[nuevoUsuarioKey]) {
            mostrarMensaje("El nombre de la empresa ya existe. Elige otro.", "error");
            return;
        }

        baseDeDatosUsuarios[nuevoUsuarioKey] = {
            nombreOriginal: usuarioInput.trim(),
            password: nuevaPassword,
            departamento: nuevoDepto,
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

        setTimeout(() => {
            tabLogin.click();
            document.getElementById('usuario').value = usuarioInput.trim();
        }, 1500);
    });

    // INICIO DE SESIÓN
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const usuarioInput = document.getElementById('usuario').value.trim();
        const usrKey = usuarioInput.toLowerCase();
        const pass = document.getElementById('password').value.trim();

        if (baseDeDatosUsuarios[usrKey] && baseDeDatosUsuarios[usrKey].password === pass) {
            usuarioSesionActiva = usrKey;
            localStorage.setItem('sesion_activa_ubate_v2026', usrKey);
            iniciarApp();
        } else {
            mostrarMensaje("Usuario o contraseña incorrectos.", "error");
        }
    });

    btnLogout.addEventListener('click', () => {
        usuarioSesionActiva = null;
        localStorage.removeItem('sesion_activa_ubate_v2026');
        pantallaApp.classList.add('hidden');
        pantallaLogin.classList.remove('hidden');
        formLogin.reset();
        mensajeAuth.classList.add('hidden');
    });

    // MÓDULO OCR: ESCANEO Y APERTURA DE VENTANA DE PRE-REVISIÓN
    btnProcesarOCR.addEventListener('click', async () => {
        const archivo = inputFotoFactura.files[0];
        if (!archivo) {
            alert("⚠️ Por favor selecciona o tómale una foto a la factura antes de procesarla.");
            return;
        }

        estadoOCR.innerHTML = "⏳ Escaneando factura con OCR... Extrayendo nombres, cantidades y costos...";
        productosDetectadosTemporal = [];

        try {
            const result = await Tesseract.recognize(archivo, 'spa', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        estadoOCR.innerHTML = `⏳ Escaneando factura: ${Math.round(m.progress * 100)}%`;
                    }
                }
            });

            const textoExtraido = result.data.text;
            console.log("Texto extraído de la factura:", textoExtraido);

            const lineas = textoExtraido.split('\n');

            lineas.forEach((linea, index) => {
                const numeros = linea.match(/\d+/g);
                if (numeros && numeros.length >= 1) {
                    const costoBase = parseInt(numeros[numeros.length - 1]);
                    const cantidad = numeros.length >= 2 ? parseInt(numeros[numeros.length - 2]) : 1;
                    let descripcion = linea.replace(/[0-9]/g, '').trim();

                    const textoMin = descripcion.toLowerCase();
                    const esBasura = textoMin.includes('nit') || textoMin.includes('total') || textoMin.includes('subtotal') || textoMin.includes('iva') || textoMin.includes('direccion') || textoMin.includes('tel') || textoMin.includes('factura');

                    if (descripcion.length > 3 && costoBase > 500 && !esBasura) {
                        productosDetectadosTemporal.push({
                            idTemp: index,
                            nombre: descripcion,
                            cantidad: cantidad > 0 ? cantidad : 1,
                            costo: costoBase,
                            iva: 19,
                            margen: 30
                        });
                    }
                }
            });

            if (productosDetectadosTemporal.length > 0) {
                estadoOCR.innerHTML = `✅ ¡Escaneo completado! Se detectaron ${productosDetectadosTemporal.length} ítems. Revisa y confirma los datos en la ventana emergente.`;
                abrirModalAuditoria();
            } else {
                estadoOCR.innerHTML = `⚠️ <strong>Factura no legible:</strong> No se detectaron productos claros. Por favor, <strong>toma una foto más nítida y con mejor iluminación</strong> o ingresa el producto manualmente abajo.`;
            }

        } catch (err) {
            console.error(err);
            estadoOCR.innerHTML = `⚠️ <strong>Error en OCR:</strong> No se pudo procesar la imagen. Inténtalo de nuevo con otra foto.`;
        }
    });

    function abrirModalAuditoria() {
        tablaAuditoriaBody.innerHTML = '';
        productosDetectadosTemporal.forEach((prod, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" value="${prod.nombre}" id="aud-nombre-${idx}" style="width:100%; padding:4px;"></td>
                <td><input type="number" value="${prod.cantidad}" min="1" id="aud-cant-${idx}" style="width:70px; padding:4px;"></td>
                <td><input type="number" value="${prod.costo}" min="0" id="aud-costo-${idx}" style="width:100px; padding:4px;"></td>
                <td>
                    <select id="aud-iva-${idx}" style="padding:4px;">
                        <option value="0" ${prod.iva === 0 ? 'selected' : ''}>0%</option>
                        <option value="5" ${prod.iva === 5 ? 'selected' : ''}>5%</option>
                        <option value="19" ${prod.iva === 19 ? 'selected' : ''}>19%</option>
                    </select>
                </td>
                <td><input type="number" value="${prod.margen}" min="0" id="aud-margen-${idx}" style="width:70px; padding:4px;"></td>
            `;
            tablaAuditoriaBody.appendChild(tr);
        });
        modalAuditoriaFactura.classList.remove('hidden');
    }

    btnCerrarAuditoria.addEventListener('click', () => modalAuditoriaFactura.classList.add('hidden'));
    btnCancelarAuditoria.addEventListener('click', () => modalAuditoriaFactura.classList.add('hidden'));

    // CONFIRMAR DATOS EDITADOS EN LA VENTANA DE PRE-REVISIÓN
    btnConfirmarIngresoFactura.addEventListener('click', () => {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        let ingresados = 0;

        productosDetectadosTemporal.forEach((prod, idx) => {
            const nombreCorregido = document.getElementById(`aud-nombre-${idx}`).value.trim();
            const cantidadCorregida = parseInt(document.getElementById(`aud-cant-${idx}`).value) || 1;
            const costoCorregido = parseInt(document.getElementById(`aud-costo-${idx}`).value) || 0;
            const ivaCorregido = parseFloat(document.getElementById(`aud-iva-${idx}`).value);
            const margenCorregido = parseFloat(document.getElementById(`aud-margen-${idx}`).value);

            if (nombreCorregido && costoCorregido > 0) {
                const precioFinal = Math.round((costoCorregido * (1 + ivaCorregido / 100)) * (1 + margenCorregido / 100));
                const fechaDefecto = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const refCode = "REF-" + Math.floor(1000 + Math.random() * 9000);

                usrData.inventario.unshift({
                    id: "prod_" + Date.now() + "_" + idx,
                    codigo: refCode,
                    nombre: nombreCorregido,
                    stock: cantidadCorregida,
                    minimo: 5,
                    costoCompra: costoCorregido,
                    ivaPorcentaje: ivaCorregido,
                    margenPorcentaje: margenCorregido,
                    precio: precioFinal,
                    lotes: [{ idLote: "lote_" + Date.now(), cantidad: cantidadCorregida, fechaVencimiento: fechaDefecto }]
                });
                ingresados++;
            }
        });

        guardarEnStorage();
        renderizarTabla();
        modalAuditoriaFactura.classList.add('hidden');
        inputFotoFactura.value = '';
        estadoOCR.innerHTML = `✅ <strong>¡Inventario actualizado!</strong> Se ingresaron oficialmente <strong>${ingresados} productos auditados</strong> con sus precios de venta calculados y publicados en el mapa.`;
    });

    function iniciarApp() {
        pantallaLogin.classList.add('hidden');
        pantallaApp.classList.remove('hidden');
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        nombreUsuarioActivo.textContent = usrData.nombreOriginal || usuarioSesionActiva;
        lblCiudadUsuario.textContent = `${usrData.ciudad || "Ubaté"}, ${usrData.departamento || "Cundinamarca"}`;
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

    function inicializarMapaPrincipal() {
        setTimeout(() => {
            const dataUsuarioActual = baseDeDatosUsuarios[usuarioSesionActiva];
            const latCentro = dataUsuarioActual ? dataUsuarioActual.lat : 5.3114;
            const lngCentro = dataUsuarioActual ? dataUsuarioActual.lng : -73.8169;

            if (!mapaPrincipal) {
                mapaPrincipal = L.map('mapa-sedes').setView([latCentro, lngCentro], 6);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap'
                }).addTo(mapaPrincipal);
            } else {
                mapaPrincipal.setView([latCentro, lngCentro], 6);
                mapaPrincipal.invalidateSize();
            }

            mapaPrincipal.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    mapaPrincipal.removeLayer(layer);
                }
            });

            Object.keys(baseDeDatosUsuarios).forEach(usrKey => {
                const dataUsr = baseDeDatosUsuarios[usrKey];
                const lat = dataUsr.lat || 5.3114;
                const lng = dataUsr.lng || -73.8169;
                const depto = dataUsr.departamento || "Cundinamarca";
                const ciudad = dataUsr.ciudad || "Ubaté";
                const direccion = dataUsr.direccion || "Ubicación sede";
                const logo = dataUsr.logo || "https://cdn-icons-png.flaticon.com/512/2897/2897785.png";
                const nombreMostrar = dataUsr.nombreOriginal || usrKey;
                const esUsuarioActual = (usrKey === usuarioSesionActiva);

                let listaProductosHTML = "";
                if (dataUsr.inventario && dataUsr.inventario.length > 0) {
                    listaProductosHTML = `
                        <div style="max-height: 140px; overflow-y: auto; text-align: left; margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 6px;">
                            <strong style="font-size:0.8rem; color:#1f2937;">📦 Inventario y Precios de Venta:</strong>
                            <ul style="margin: 4px 0 0 15px; padding: 0; font-size: 0.75rem; color: #4b5563;">
                    `;
                    dataUsr.inventario.forEach(prod => {
                        const precioFmt = prod.precio ? prod.precio.toLocaleString() : '0';
                        listaProductosHTML += `<li style="margin-bottom: 3px;"><strong>${prod.nombre}</strong> (${prod.stock} un.) $\u00A0<strong>${precioFmt} COP</strong></li>`;
                    });
                    listaProductosHTML += `</ul></div>`;
                } else {
                    listaProductosHTML = `<p style="margin: 6px 0 0 0; font-size: 0.75rem; color: #dc2626;">Sin productos registrados.</p>`;
                }

                const marker = L.marker([lat, lng]).addTo(mapaPrincipal);

                marker.bindPopup(`
                    <div style="font-family: sans-serif; text-align: center; width: 220px;">
                        <img src="${logo}" alt="Logo" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #dc2626; margin-bottom: 4px;"><br>
                        <strong style="color: ${esUsuarioActual ? '#dc2626' : '#2563eb'}; font-size: 0.95rem;">
                            ${nombreMostrar.toUpperCase()} ${esUsuarioActual ? '(Tu Empresa)' : ''}
                        </strong><br>
                        <span style="font-size: 0.8rem; color: #4b5563;">📍 ${ciudad}, ${depto}</span><br>
                        <span style="font-size: 0.75rem; color: #6b7280;">Ref: ${direccion}</span>
                        ${listaProductosHTML}
                    </div>
                `, { maxWidth: 260 });

                if (esUsuarioActual) {
                    marker.openPopup();
                }
            });
        }, 300);
    }

    function poblarSelectorComparador() {
        const productosUnicos = new Set();
        Object.keys(baseDeDatosUsuarios).forEach(usrKey => {
            baseDeDatosUsuarios[usrKey].inventario.forEach(p => productosUnicos.add(p.nombre));
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
            resultadoComparacion.innerHTML = `<p style="color:#6b7280;">No hay productos para comparar.</p>`;
            return;
        }

        let comparativaHTML = `
            <table class="tabla-inventario">
                <thead>
                    <tr>
                        <th>Empresa</th>
                        <th>Ubicación</th>
                        <th>Precio Venta Público</th>
                        <th>Stock</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let encontrado = false;
        let mejorPrecio = Infinity;
        let mejorSede = "";

        Object.keys(baseDeDatosUsuarios).forEach(usrKey => {
            const dataUsr = baseDeDatosUsuarios[usrKey];
            const prodEnSede = dataUsr.inventario.find(p => p.nombre === productoSeleccionado);
            const logo = dataUsr.logo || "https://cdn-icons-png.flaticon.com/512/2897/2897785.png";
            const nombreMostrar = dataUsr.nombreOriginal || usrKey;

            if (prodEnSede) {
                encontrado = true;
                if (prodEnSede.precio < mejorPrecio) {
                    mejorPrecio = prodEnSede.precio;
                    mejorSede = `${nombreMostrar} (${dataUsr.ciudad}, ${dataUsr.departamento})`;
                }

                comparativaHTML += `
                    <tr>
                        <td>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <img src="${logo}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border:1px solid #d1d5db;">
                                <strong>${nombreMostrar}</strong>
                            </div>
                        </td>
                        <td><strong>${dataUsr.ciudad} (${dataUsr.departamento})</strong></td>
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
                    💡 <strong>Mejor Precio Público:</strong> Ofrecido por <strong>${mejorSede}</strong> a solo <strong>$ ${mejorPrecio.toLocaleString()} COP</strong>.
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
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        const ubicacion = usrData ? `${usrData.ciudad}, ${usrData.departamento}` : "Colombia";
        const nombreMostrar = usrData ? (usrData.nombreOriginal || usuarioSesionActiva) : usuarioSesionActiva;
        
        if (modoOnline) {
            estadoConexion.className = "badge";
            estadoConexion.innerHTML = `<i class="fa-solid fa-wifi"></i> Online | <strong>${nombreMostrar}</strong> (${ubicacion})`;
        } else {
            estadoConexion.className = "badge offline";
            estadoConexion.innerHTML = `<i class="fa-solid fa-ban"></i> Offline | <strong>${nombreMostrar}</strong> (${ubicacion})`;
        }
    }

    // REGISTRO O EDICIÓN MANUAL DE PRODUCTO
    formProducto.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = prodId.value;
        const codigo = prodCodigo.value.trim() || ("REF-" + Math.floor(1000 + Math.random() * 9000));
        const nombre = prodNombre.value.trim();
        const stockNum = parseInt(prodStock.value);
        const fechaVenc = prodVencimiento.value;
        const minNum = parseInt(prodMinimo.value);
        const costoNum = parseInt(prodCosto.value);
        const ivaNum = parseFloat(prodIva.value);
        const margenNum = parseFloat(prodMargen.value);

        const precioFinal = Math.round((costoNum * (1 + ivaNum / 100)) * (1 + margenNum / 100));
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];

        if (id) {
            const prodIndex = usrData.inventario.findIndex(p => p.id === id);
            if (prodIndex !== -1) {
                usrData.inventario[prodIndex].codigo = codigo;
                usrData.inventario[prodIndex].nombre = nombre;
                usrData.inventario[prodIndex].minimo = minNum;
                usrData.inventario[prodIndex].costoCompra = costoNum;
                usrData.inventario[prodIndex].ivaPorcentaje = ivaNum;
                usrData.inventario[prodIndex].margenPorcentaje = margenNum;
                usrData.inventario[prodIndex].precio = precioFinal;
            }
        } else {
            const nuevoProd = {
                id: "prod_" + Date.now(),
                codigo: codigo,
                nombre: nombre,
                stock: stockNum,
                minimo: minNum,
                costoCompra: costoNum,
                ivaPorcentaje: ivaNum,
                margenPorcentaje: margenNum,
                precio: precioFinal,
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
        tituloFormProducto.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Gestión de Producto (Costo, IVA y Margen Independientes)`;
    }

    function renderizarTabla() {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        if (!usrData) return;

        const filtro = inputBuscar.value.toLowerCase().trim();
        tablaBody.innerHTML = '';
        const productosFiltrados = usrData.inventario.filter(p => p.nombre.toLowerCase().includes(filtro) || p.codigo.includes(filtro));

        if (productosFiltrados.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#6b7280; padding:15px;">No hay productos registrados. Carga una factura con foto o agrégalos manualmente.</td></tr>`;
            return;
        }

        productosFiltrados.forEach(prod => {
            prod.lotes.sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));
            const loteProximo = prod.lotes[0];
            let estadoHTML = loteProximo ? `<span style="color:#16a34a;">Vence: ${loteProximo.fechaVencimiento}</span>` : `Sin lotes`;
            let lotesDetalleHTML = prod.lotes.map(l => `<div class="detalle-lotes">• Cant: <strong>${l.cantidad}</strong> | Vence: ${l.fechaVencimiento}</div>`).join('');

            const costoTexto = prod.costoCompra ? `$ ${prod.costoCompra.toLocaleString()} COP` : 'N/A';
            const ivaMargenTexto = `IVA: ${prod.ivaPorcentaje || 19}% | Margen: ${prod.margenPorcentaje || 30}%`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${prod.nombre}</strong><br><small style="color:#2563eb;">Ref: ${prod.codigo}</small></td>
                <td>${prod.stock} un.</td>
                <td style="color:#4b5563;">${costoTexto}</td>
                <td style="font-size:0.8rem; color:#6b7280;">${ivaMargenTexto}</td>
                <td style="font-weight:bold; color:#16a34a;">$ ${prod.precio.toLocaleString()} COP</td>
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
        prodCosto.value = prod.costoCompra || 0;
        prodIva.value = prod.ivaPorcentaje || 19;
        prodMargen.value = prod.margenPorcentaje || 30;
        prodStock.disabled = true;
        prodVencimiento.disabled = true;
        tituloFormProducto.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Modificar Producto e Impuestos`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.abrirModalMovimiento = function(id, tipo) {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        const prod = usrData.inventario.find(p => p.id === id);
        if (!prod) return;
        document.getElementById('mov-prod-id').value = prod.id;
        document.getElementById('mov-tipo').value = tipo;
        document.getElementById('mov-prod-nombre').value = prod.nombre;
        document.getElementById('modal-movimiento').classList.remove('hidden');
    };

    if (usuarioSesionActiva && baseDeDatosUsuarios[usuarioSesionActiva]) {
        iniciarApp();
    }
});