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
            ]
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
            ]
        }
    };

    let baseDeDatosUsuarios = JSON.parse(localStorage.getItem('bd_logistica_ubate_v2026')) || cuentasPredeterminadas;
    Object.keys(cuentasPredeterminadas).forEach(key => {
        if (!baseDeDatosUsuarios[key]) baseDeDatosUsuarios[key] = cuentasPredeterminadas[key];
    });

    let usuarioSesionActiva = localStorage.getItem('sesion_activa_ubate_v2026') || null;
    let modoOnline = true;
    let productosDetectadosTemporal = [];
    let logoBase64Registro = "https://cdn-icons-png.flaticon.com/512/2897/2897785.png";
    let logoBase64Perfil = "";

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
    const regLogoFile = document.getElementById('reg-logo-file');
    const previewRegLogo = document.getElementById('preview-reg-logo');

    const imgAvatarHeader = document.getElementById('img-avatar-header');
    const btnPerfilAvatar = document.getElementById('btn-perfil-avatar');

    const navExplorar = document.getElementById('nav-explorar');
    const navMisProductos = document.getElementById('nav-mis-productos');
    const navComparar = document.getElementById('nav-comparar');
    const navPerfil = document.getElementById('nav-perfil');

    const chipMapa = document.getElementById('chip-mapa');
    const chipMisProductos = document.getElementById('chip-mis-productos');
    const chipComparar = document.getElementById('chip-comparar');
    const chipRedToggle = document.getElementById('chip-red-toggle');
    const lblEstadoRed = document.getElementById('lbl-estado-red');

    const sheetProductos = document.getElementById('sheet-productos');
    const sheetComparador = document.getElementById('sheet-comparador');
    const btnCerrarSheet = document.getElementById('btn-cerrar-sheet');
    const btnCerrarComparador = document.getElementById('btn-cerrar-comparador');

    const btnMiUbicacion = document.getElementById('btn-mi-ubicacion');
    const btnLogoutFab = document.getElementById('btn-logout-fab');

    const inputBuscarMapa = document.getElementById('input-buscar-mapa');
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
    const tablaBody = document.getElementById('tabla-body');

    const modalPerfil = document.getElementById('modal-perfil');
    const btnCerrarPerfil = document.getElementById('btn-cerrar-perfil');
    const formEditarPerfil = document.getElementById('form-editar-perfil');
    const perfilDepartamento = document.getElementById('perfil-departamento');
    const perfilCiudad = document.getElementById('perfil-ciudad');
    const perfilDireccion = document.getElementById('perfil-direccion');
    const perfilLogoFile = document.getElementById('perfil-logo-file');
    const previewPerfilLogo = document.getElementById('preview-perfil-logo');

    function guardarEnStorage() {
        localStorage.setItem('bd_logistica_ubate_v2026', JSON.stringify(baseDeDatosUsuarios));
    }

    function mostrarMensaje(msg, tipo) {
        mensajeAuth.textContent = msg;
        mensajeAuth.className = tipo;
        mensajeAuth.classList.remove('hidden');
    }

    function convertirImagenABase64(fileInput, callback) {
        const file = fileInput.files[0];
        if (!file) { callback(null); return; }
        const reader = new FileReader();
        reader.onload = e => callback(e.target.result);
        reader.readAsDataURL(file);
    }

    regLogoFile.addEventListener('change', () => {
        convertirImagenABase64(regLogoFile, base64 => {
            if (base64) {
                logoBase64Registro = base64;
                previewRegLogo.innerHTML = `<img src="${base64}" style="width:45px; height:45px; border-radius:50%; object-fit:cover; border:2px solid #16a34a;">`;
            }
        });
    });

    perfilLogoFile.addEventListener('change', () => {
        convertirImagenABase64(perfilLogoFile, base64 => {
            if (base64) {
                logoBase64Perfil = base64;
                previewPerfilLogo.innerHTML = `<img src="${base64}" style="width:45px; height:45px; border-radius:50%; object-fit:cover; border:2px solid #2563eb;">`;
            }
        });
    });

    function configurarSelectores(selectDepto, selectMun) {
        selectDepto.addEventListener('change', () => {
            const depto = selectDepto.value;
            selectMun.innerHTML = '<option value="">Seleccione...</option>';
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
        if (mapaRegistro) mapaRegistro.setView([coords.lat, coords.lng], 13);
    });

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        formRegister.classList.remove('hidden');
        formLogin.classList.add('hidden');
        setTimeout(() => inicializarMapaRegistro(), 300);
    });

    function inicializarMapaRegistro() {
        if (!mapaRegistro) {
            mapaRegistro = L.map('mapa-registro').setView([5.3114, -73.8169], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapaRegistro);

            mapaRegistro.on('click', (e) => {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                regLat.value = lat;
                regLng.value = lng;
                lblCoordSeleccionada.innerHTML = `✅ Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;

                if (marcadorRegistro) marcadorRegistro.setLatLng([lat, lng]);
                else marcadorRegistro = L.marker([lat, lng], { draggable: true }).addTo(mapaRegistro);
            });
        } else {
            mapaRegistro.invalidateSize();
        }
    }

    formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const usuarioInput = document.getElementById('reg-usuario').value;
        const usrKey = usuarioInput.trim().toLowerCase();
        const depto = regDepartamento.value;
        const ciudad = regCiudad.value;
        const dir = document.getElementById('reg-direccion').value.trim();
        const pass = document.getElementById('reg-password').value.trim();
        const lat = parseFloat(regLat.value);
        const lng = parseFloat(regLng.value);

        if (isNaN(lat) || isNaN(lng)) {
            alert("⚠️ Haz clic en el mapa para seleccionar la ubicación exacta de tu bodega.");
            return;
        }

        if (baseDeDatosUsuarios[usrKey]) {
            mostrarMensaje("El nombre de la empresa ya existe.", "error");
            return;
        }

        baseDeDatosUsuarios[usrKey] = {
            nombreOriginal: usuarioInput.trim(),
            password: pass,
            departamento: depto,
            ciudad: ciudad,
            direccion: dir,
            logo: logoBase64Registro,
            lat: lat,
            lng: lng,
            inventario: []
        };

        guardarEnStorage();
        usuarioSesionActiva = usrKey;
        localStorage.setItem('sesion_activa_ubate_v2026', usrKey);
        iniciarApp();
    });

    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const usrKey = document.getElementById('usuario').value.trim().toLowerCase();
        const pass = document.getElementById('password').value.trim();

        if (baseDeDatosUsuarios[usrKey] && baseDeDatosUsuarios[usrKey].password === pass) {
            usuarioSesionActiva = usrKey;
            localStorage.setItem('sesion_activa_ubate_v2026', usrKey);
            iniciarApp();
        } else {
            mostrarMensaje("Usuario o contraseña incorrectos.", "error");
        }
    });

    btnLogoutFab.addEventListener('click', () => {
        usuarioSesionActiva = null;
        localStorage.removeItem('sesion_activa_ubate_v2026');
        pantallaApp.classList.add('hidden');
        pantallaLogin.classList.remove('hidden');
    });

    // INICIALIZACIÓN APP ESTILO GOOGLE MAPS
    function iniciarApp() {
        pantallaLogin.classList.add('hidden');
        pantallaApp.classList.remove('hidden');
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];

        if (usrData.logo) {
            imgAvatarHeader.src = usrData.logo;
        }

        renderizarTabla();
        setTimeout(() => inicializarMapaPrincipal(), 300);
    }

    function inicializarMapaPrincipal() {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        const latCentro = usrData ? usrData.lat : 5.3114;
        const lngCentro = usrData ? usrData.lng : -73.8169;

        if (!mapaPrincipal) {
            mapaPrincipal = L.map('mapa-sedes', { zoomControl: false }).setView([latCentro, lngCentro], 7);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapaPrincipal);
        } else {
            mapaPrincipal.setView([latCentro, lngCentro], 7);
            mapaPrincipal.invalidateSize();
        }

        mapaPrincipal.eachLayer(layer => {
            if (layer instanceof L.Marker) mapaPrincipal.removeLayer(layer);
        });

        Object.keys(baseDeDatosUsuarios).forEach(usrKey => {
            const dataUsr = baseDeDatosUsuarios[usrKey];
            const lat = dataUsr.lat || 5.3114;
            const lng = dataUsr.lng || -73.8169;
            const logo = dataUsr.logo || "https://cdn-icons-png.flaticon.com/512/2897/2897785.png";
            const nombreMostrar = dataUsr.nombreOriginal || usrKey;
            const esActual = (usrKey === usuarioSesionActiva);

            let listaProductosHTML = "";
            if (dataUsr.inventario && dataUsr.inventario.length > 0) {
                listaProductosHTML = `
                    <div style="max-height: 130px; overflow-y: auto; text-align: left; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
                        <strong style="font-size:0.75rem; color:#1f2937;">📦 Productos y Precios:</strong>
                        <ul style="margin: 3px 0 0 12px; padding: 0; font-size: 0.72rem; color: #475569;">
                `;
                dataUsr.inventario.forEach(prod => {
                    listaProductosHTML += `<li style="margin-bottom:2px;"><strong>${prod.nombre}</strong> (${prod.stock} un.) - <strong>$${prod.precio.toLocaleString()} COP</strong></li>`;
                });
                listaProductosHTML += `</ul></div>`;
            } else {
                listaProductosHTML = `<p style="margin-top:4px; font-size:0.72rem; color:#dc2626;">Sin productos en stock.</p>`;
            }

            const customIcon = L.divIcon({
                className: 'custom-map-pin',
                html: `<div style="width:38px; height:38px; border-radius:50%; border:3px solid ${esActual ? '#16a34a' : '#1a73e8'}; overflow:hidden; background:#fff; box-shadow:0 2px 6px rgba(0,0,0,0.3);"><img src="${logo}" style="width:100%; height:100%; object-fit:cover;"></div>`,
                iconSize: [38, 38],
                iconAnchor: [19, 19]
            });

            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapaPrincipal);
            marker.bindPopup(`
                <div style="font-family:sans-serif; text-align:center; width:210px;">
                    <strong style="color:${esActual ? '#16a34a' : '#1a73e8'}; font-size:0.9rem;">${nombreMostrar.toUpperCase()} ${esActual ? '(Tu Distribuidora)' : ''}</strong><br>
                    <span style="font-size:0.75rem; color:#64748b;">📍 ${dataUsr.ciudad}, ${dataUsr.departamento}</span><br>
                    <span style="font-size:0.72rem; color:#94a3b8;">${dataUsr.direccion}</span>
                    ${listaProductosHTML}
                </div>
            `, { maxWidth: 240 });

            if (esActual) marker.openPopup();
        });
    }

    // NAVEGACIÓN BOTTOM BAR Y CHIPS
    function activarTab(tabName) {
        navExplorar.classList.remove('active');
        navMisProductos.classList.remove('active');
        navComparar.classList.remove('active');
        navPerfil.classList.remove('active');

        chipMapa.classList.remove('active');
        chipMisProductos.classList.remove('active');
        chipComparar.classList.remove('active');

        sheetProductos.classList.add('hidden');
        sheetComparador.classList.add('hidden');

        if (tabName === 'explorar') {
            navExplorar.classList.add('active');
            chipMapa.classList.add('active');
            if (mapaPrincipal) mapaPrincipal.invalidateSize();
        } else if (tabName === 'productos') {
            navMisProductos.classList.add('active');
            chipMisProductos.classList.add('active');
            sheetProductos.classList.remove('hidden');
        } else if (tabName === 'comparar') {
            navComparar.classList.add('active');
            chipComparar.classList.add('active');
            poblarSelectorComparador();
            actualizarComparacionPrecios();
            sheetComparador.classList.remove('hidden');
        } else if (tabName === 'perfil') {
            navPerfil.classList.add('active');
            abrirModalPerfil();
        }
    }

    navExplorar.addEventListener('click', () => activarTab('explorar'));
    navMisProductos.addEventListener('click', () => activarTab('productos'));
    navComparar.addEventListener('click', () => activarTab('comparar'));
    navPerfil.addEventListener('click', () => activarTab('perfil'));

    chipMapa.addEventListener('click', () => activarTab('explorar'));
    chipMisProductos.addEventListener('click', () => activarTab('productos'));
    chipComparar.addEventListener('click', () => activarTab('comparar'));

    btnCerrarSheet.addEventListener('click', () => activarTab('explorar'));
    btnCerrarComparador.addEventListener('click', () => activarTab('explorar'));

    btnMiUbicacion.addEventListener('click', () => {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        if (usrData && mapaPrincipal) {
            mapaPrincipal.setView([usrData.lat, usrData.lng], 14);
        }
    });

    chipRedToggle.addEventListener('click', () => {
        modoOnline = !modoOnline;
        lblEstadoRed.textContent = modoOnline ? "Online" : "Offline";
        chipRedToggle.style.color = modoOnline ? "#1a73e8" : "#dc2626";
    });

    btnPerfilAvatar.addEventListener('click', () => abrirModalPerfil());

    function abrirModalPerfil() {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        perfilDepartamento.value = usrData.departamento || "Cundinamarca";
        perfilDepartamento.dispatchEvent(new Event('change'));
        setTimeout(() => perfilCiudad.value = usrData.ciudad || "", 50);
        perfilDireccion.value = usrData.direccion || "";
        modalPerfil.classList.remove('hidden');
    }

    btnCerrarPerfil.addEventListener('click', () => modalPerfil.classList.add('hidden'));

    formEditarPerfil.addEventListener('submit', (e) => {
        e.preventDefault();
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        usrData.departamento = perfilDepartamento.value;
        usrData.ciudad = perfilCiudad.value;
        usrData.direccion = perfilDireccion.value.trim();
        if (logoBase64Perfil) {
            usrData.logo = logoBase64Perfil;
            imgAvatarHeader.src = logoBase64Perfil;
        }

        const coords = coordenadasBaseSedes[usrData.ciudad];
        if (coords) {
            usrData.lat = coords.lat;
            usrData.lng = coords.lng;
        }

        guardarEnStorage();
        modalPerfil.classList.add('hidden');
        inicializarMapaPrincipal();
        alert("✅ Datos de la distribuidora actualizados.");
    });

    // ESCANEO OCR FACTURA CON VENTANA DE PRE-REVISIÓN
    btnProcesarOCR.addEventListener('click', async () => {
        const archivo = inputFotoFactura.files[0];
        if (!archivo) {
            alert("⚠️ Selecciona o tómale una foto a la factura.");
            return;
        }

        estadoOCR.innerHTML = "⏳ Escaneando productos con OCR...";
        productosDetectadosTemporal = [];

        try {
            const result = await Tesseract.recognize(archivo, 'spa', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        estadoOCR.innerHTML = `⏳ Escaneando factura: ${Math.round(m.progress * 100)}%`;
                    }
                }
            });

            const lineas = result.data.text.split('\n');
            lineas.forEach((linea, index) => {
                const numeros = linea.match(/\d+/g);
                if (numeros && numeros.length >= 1) {
                    const costoBase = parseInt(numeros[numeros.length - 1]);
                    const cantidad = numeros.length >= 2 ? parseInt(numeros[numeros.length - 2]) : 1;
                    let descripcion = linea.replace(/[0-9]/g, '').trim();

                    const textoMin = descripcion.toLowerCase();
                    const esBasura = textoMin.includes('nit') || textoMin.includes('total') || textoMin.includes('subtotal') || textoMin.includes('iva') || textoMin.includes('tel');

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
                estadoOCR.innerHTML = `✅ ¡Escaneo completado! ${productosDetectadosTemporal.length} productos detectados.`;
                abrirModalAuditoria();
            } else {
                estadoOCR.innerHTML = `⚠️ No se leyeron productos claros. Toma una foto más nítida.`;
            }

        } catch (err) {
            console.error(err);
            estadoOCR.innerHTML = `⚠️ Error al escanear imagen.`;
        }
    });

    function abrirModalAuditoria() {
        tablaAuditoriaBody.innerHTML = '';
        productosDetectadosTemporal.forEach((prod, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" value="${prod.nombre}" id="aud-nombre-${idx}" style="width:100%;"></td>
                <td><input type="number" value="${prod.cantidad}" min="1" id="aud-cant-${idx}" style="width:50px;"></td>
                <td><input type="number" value="${prod.costo}" min="0" id="aud-costo-${idx}" style="width:80px;"></td>
                <td>
                    <select id="aud-iva-${idx}">
                        <option value="0" ${prod.iva === 0 ? 'selected' : ''}>0%</option>
                        <option value="5" ${prod.iva === 5 ? 'selected' : ''}>5%</option>
                        <option value="19" ${prod.iva === 19 ? 'selected' : ''}>19%</option>
                    </select>
                </td>
                <td><input type="number" value="${prod.margen}" min="0" id="aud-margen-${idx}" style="width:50px;"></td>
            `;
            tablaAuditoriaBody.appendChild(tr);
        });
        modalAuditoriaFactura.classList.remove('hidden');
    }

    btnCerrarAuditoria.addEventListener('click', () => modalAuditoriaFactura.classList.add('hidden'));
    btnCancelarAuditoria.addEventListener('click', () => modalAuditoriaFactura.classList.add('hidden'));

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
        inicializarMapaPrincipal();
        modalAuditoriaFactura.classList.add('hidden');
        inputFotoFactura.value = '';
        estadoOCR.innerHTML = `✅ ¡Ingresados ${ingresados} productos al stock del mapa!`;
    });

    // BUSCADOR EN EL MAPA
    inputBuscarMapa.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) return;

        Object.keys(baseDeDatosUsuarios).forEach(usrKey => {
            const usr = baseDeDatosUsuarios[usrKey];
            const coincideDistribuidora = usr.nombreOriginal.toLowerCase().includes(query) || usr.ciudad.toLowerCase().includes(query);
            const coincideProducto = usr.inventario.some(p => p.nombre.toLowerCase().includes(query));

            if ((coincideDistribuidora || coincideProducto) && mapaPrincipal) {
                mapaPrincipal.setView([usr.lat, usr.lng], 12);
            }
        });
    });

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
        const prodSel = selectProductoComparar.value;
        if (!prodSel) {
            resultadoComparacion.innerHTML = `<p style="color:#64748b;">No hay productos para comparar.</p>`;
            return;
        }

        let html = `<table class="tabla-inventario"><thead><tr><th>Empresa</th><th>Ubicación</th><th>Precio Público</th><th>Stock</th></tr></thead><tbody>`;
        let encontrado = false;
        let mejorPrecio = Infinity;
        let mejorSede = "";

        Object.keys(baseDeDatosUsuarios).forEach(usrKey => {
            const usr = baseDeDatosUsuarios[usrKey];
            const prod = usr.inventario.find(p => p.nombre === prodSel);
            if (prod) {
                encontrado = true;
                if (prod.precio < mejorPrecio) {
                    mejorPrecio = prod.precio;
                    mejorSede = `${usr.nombreOriginal} (${usr.ciudad})`;
                }
                html += `<tr><td><strong>${usr.nombreOriginal}</strong></td><td>${usr.ciudad}</td><td style="color:#16a34a; font-weight:bold;">$${prod.precio.toLocaleString()} COP</td><td>${prod.stock} un.</td></tr>`;
            }
        });
        html += `</tbody></table>`;

        if (encontrado) {
            html = `<div style="background:#f0fdf4; border:1px solid #86efac; padding:8px; border-radius:8px; margin-bottom:8px; color:#15803d; font-size:0.8rem;">💡 <strong>Mejor Precio:</strong> ${mejorSede} a solo <strong>$${mejorPrecio.toLocaleString()} COP</strong></div>` + html;
        }
        resultadoComparacion.innerHTML = html;
    }

    selectProductoComparar.addEventListener('change', actualizarComparacionPrecios);

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
            const idx = usrData.inventario.findIndex(p => p.id === id);
            if (idx !== -1) {
                usrData.inventario[idx].codigo = codigo;
                usrData.inventario[idx].nombre = nombre;
                usrData.inventario[idx].minimo = minNum;
                usrData.inventario[idx].costoCompra = costoNum;
                usrData.inventario[idx].ivaPorcentaje = ivaNum;
                usrData.inventario[idx].margenPorcentaje = margenNum;
                usrData.inventario[idx].precio = precioFinal;
            }
        } else {
            usrData.inventario.unshift({
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
            });
        }

        guardarEnStorage();
        formProducto.reset();
        prodId.value = '';
        renderizarTabla();
        inicializarMapaPrincipal();
        alert("✅ Producto guardado en el stock del mapa.");
    });

    function renderizarTabla() {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        if (!usrData) return;
        tablaBody.innerHTML = '';

        usrData.inventario.forEach(prod => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${prod.nombre}</strong><br><small style="color:#2563eb;">${prod.codigo}</small></td>
                <td>${prod.stock}</td>
                <td>$${prod.costoCompra.toLocaleString()}</td>
                <td style="font-size:0.75rem;">IVA ${prod.ivaPorcentaje}% / Margen ${prod.margenPorcentaje}%</td>
                <td style="color:#16a34a; font-weight:bold;">$${prod.precio.toLocaleString()}</td>
                <td>
                    <button onclick="editarProducto('${prod.id}')" style="background:#eab308; color:#fff; border:none; padding:4px 8px; border-radius:4px;"><i class="fa-solid fa-pen"></i></button>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }

    window.editarProducto = function(id) {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        const prod = usrData.inventario.find(p => p.id === id);
        if (!prod) return;
        prodId.value = prod.id;
        prodCodigo.value = prod.codigo;
        prodNombre.value = prod.nombre;
        prodStock.value = prod.stock;
        prodMinimo.value = prod.minimo;
        prodCosto.value = prod.costoCompra;
        prodIva.value = prod.ivaPorcentaje;
        prodMargen.value = prod.margenPorcentaje;
    };

    if (usuarioSesionActiva && baseDeDatosUsuarios[usuarioSesionActiva]) {
        iniciarApp();
    }
});