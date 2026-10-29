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
            rol: "empresa",
            nombreOriginal: "Distribuidora Ubaté",
            password: "Admin123*",
            departamento: "Cundinamarca",
            ciudad: "Ubaté",
            direccion: "Carrera 4 # 5-20",
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
        "conductor_carlos": {
            rol: "conductor",
            nombreOriginal: "Carlos Pérez",
            password: "Admin123*",
            departamento: "Cundinamarca",
            ciudad: "Bogotá D.C.",
            vehiculo: "Chevrolet NPR Furgón 4.5 Ton",
            placa: "SXX-123",
            logo: "https://cdn-icons-png.flaticon.com/512/2972/2972195.png",
            lat: 4.6200,
            lng: -74.0900
        }
    };

    let bolsaFletesGlobal = JSON.parse(localStorage.getItem('bolsa_fletes_logistica_v2026')) || [];
    let chatsFletesGlobal = JSON.parse(localStorage.getItem('chats_fletes_logistica_v2026')) || {};
    let baseDeDatosUsuarios = JSON.parse(localStorage.getItem('bd_logistica_ubate_v2026')) || cuentasPredeterminadas;

    let usuarioSesionActiva = localStorage.getItem('sesion_activa_ubate_v2026') || null;
    let modoOnline = true;
    let productosDetectadosTemporal = [];
    let logoBase64Perfil = "";
    let fleteChatActivoId = null;

    let mapaPrincipal = null;
    let mapaPerfil = null;
    let marcadorPerfil = null;

    function guardarEnStorage() {
        localStorage.setItem('bd_logistica_ubate_v2026', JSON.stringify(baseDeDatosUsuarios));
        localStorage.setItem('bolsa_fletes_logistica_v2026', JSON.stringify(bolsaFletesGlobal));
        localStorage.setItem('chats_fletes_logistica_v2026', JSON.stringify(chatsFletesGlobal));
    }

    const pantallaLogin = document.getElementById('pantalla-login');
    const pantallaApp = document.getElementById('pantalla-app');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const mensajeAuth = document.getElementById('mensaje-auth');

    const regRol = document.getElementById('reg-rol');
    const camposConductor = document.getElementById('campos-conductor');
    const grupoDireccion = document.getElementById('grupo-direccion');
    const regDireccion = document.getElementById('reg-direccion');
    const regVehiculo = document.getElementById('reg-vehiculo');
    const regPlaca = document.getElementById('reg-placa');

    const regDepartamento = document.getElementById('reg-departamento');
    const regCiudad = document.getElementById('reg-ciudad');

    const imgAvatarHeader = document.getElementById('img-avatar-header');
    const btnPerfilAvatar = document.getElementById('btn-perfil-avatar');

    const navExplorar = document.getElementById('nav-explorar');
    const navMisProductos = document.getElementById('nav-mis-productos');
    const navPedirFleteTab = document.getElementById('nav-pedir-flete-tab');
    const navComparar = document.getElementById('nav-comparar');
    const navPerfil = document.getElementById('nav-perfil');

    const iconNavGestion = document.getElementById('icon-nav-gestion');
    const txtNavGestion = document.getElementById('txt-nav-gestion');
    const lblBtnGestion = document.getElementById('lbl-btn-gestion');

    const chipMapa = document.getElementById('chip-mapa');
    const chipMisProductos = document.getElementById('chip-mis-productos');
    const chipPedirFlete = document.getElementById('chip-pedir-flete');
    const chipComparar = document.getElementById('chip-comparar');
    const chipRedToggle = document.getElementById('chip-red-toggle');
    const lblEstadoRed = document.getElementById('lbl-estado-red');

    const sheetProductos = document.getElementById('sheet-productos');
    const sheetPedirFlete = document.getElementById('sheet-pedir-flete');
    const sheetComparador = document.getElementById('sheet-comparador');
    const btnCerrarSheet = document.getElementById('btn-cerrar-sheet');
    const btnCerrarFleteLib = document.getElementById('btn-cerrar-flete-lib');
    const btnCerrarComparador = document.getElementById('btn-cerrar-comparador');
    const sheetTituloPrincipal = document.getElementById('sheet-titulo-principal');
    const sheetContentBody = document.getElementById('sheet-content-body');

    const btnMiUbicacion = document.getElementById('btn-mi-ubicacion');
    const btnLogoutFab = document.getElementById('btn-logout-fab');
    const inputBuscarMapa = document.getElementById('input-buscar-mapa');
    const selectProductoComparar = document.getElementById('select-producto-comparar');
    const resultadoComparacion = document.getElementById('resultado-comparacion');

    const formPedirFleteLibre = document.getElementById('form-pedir-flete-libre');
    const listaMisFletes = document.getElementById('lista-mis-fletes');

    const modalChatUber = document.getElementById('modal-chat-uber');
    const btnCerrarChat = document.getElementById('btn-cerrar-chat');
    const chatMensajesContainer = document.getElementById('chat-mensajes-container');
    const inputMensajeChat = document.getElementById('input-mensaje-chat');
    const btnEnviarChat = document.getElementById('btn-enviar-chat');
    const chatTituloModal = document.getElementById('chat-titulo-modal');

    const modalPerfil = document.getElementById('modal-perfil');
    const btnCerrarPerfil = document.getElementById('btn-cerrar-perfil');
    const formEditarPerfil = document.getElementById('form-editar-perfil');
    const perfilDepartamento = document.getElementById('perfil-departamento');
    const perfilCiudad = document.getElementById('perfil-ciudad');
    const perfilDireccion = document.getElementById('perfil-direccion');
    const grupoDirPerfil = document.getElementById('grupo-dir-perfil');
    const perfilVehiculo = document.getElementById('perfil-vehiculo');
    const grupoVehiculoPerfil = document.getElementById('grupo-vehiculo-perfil');
    const perfilPlaca = document.getElementById('perfil-placa');
    const grupoPlacaPerfil = document.getElementById('grupo-placa-perfil');
    const perfilLogoFile = document.getElementById('perfil-logo-file');
    const previewPerfilLogo = document.getElementById('preview-perfil-logo');
    const perfilLat = document.getElementById('perfil-lat');
    const perfilLng = document.getElementById('perfil-lng');
    const lblCoordPerfil = document.getElementById('lbl-coord-perfil');

    function mostrarMensaje(msg, tipo) {
        mensajeAuth.textContent = msg;
        mensajeAuth.className = tipo;
        mensajeAuth.classList.remove('hidden');
    }

    regRol.addEventListener('change', () => {
        if (regRol.value === 'conductor') {
            camposConductor.classList.remove('hidden');
            grupoDireccion.style.display = 'none';
            regDireccion.removeAttribute('required');
            regVehiculo.setAttribute('required', 'true');
            regPlaca.setAttribute('required', 'true');
        } else {
            camposConductor.classList.add('hidden');
            grupoDireccion.style.display = 'block';
            regDireccion.setAttribute('required', 'true');
            regVehiculo.removeAttribute('required');
            regPlaca.removeAttribute('required');
        }
    });

    function convertirImagenABase64(fileInput, callback) {
        const file = fileInput.files[0];
        if (!file) { callback(null); return; }
        const reader = new FileReader();
        reader.onload = e => callback(e.target.result);
        reader.readAsDataURL(file);
    }

    perfilLogoFile.addEventListener('change', () => {
        convertirImagenABase64(perfilLogoFile, base64 => {
            if (base64) {
                logoBase64Perfil = base64;
                previewPerfilLogo.innerHTML = `<img src="${base64}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid #dc2626;">`;
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

    perfilCiudad.addEventListener('change', () => {
        const muni = perfilCiudad.value;
        const coords = coordenadasBaseSedes[muni];
        if (coords && mapaPerfil) {
            perfilLat.value = coords.lat;
            perfilLng.value = coords.lng;
            lblCoordPerfil.innerHTML = `✅ Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}`;
            mapaPerfil.setView([coords.lat, coords.lng], 13);
            if (marcadorPerfil) marcadorPerfil.setLatLng([coords.lat, coords.lng]);
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
    });

    formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const rol = regRol.value;
        const usuarioInput = document.getElementById('reg-usuario').value;
        const usrKey = usuarioInput.trim().toLowerCase();
        const depto = regDepartamento.value;
        const ciudad = regCiudad.value;
        const pass = document.getElementById('reg-password').value.trim();

        if (baseDeDatosUsuarios[usrKey]) {
            mostrarMensaje("⚠️ El usuario ya existe. Elige otro nombre o inicia sesión.", "error");
            return;
        }

        const coordsBase = coordenadasBaseSedes[ciudad] || { lat: 4.6097, lng: -74.0817 };

        let nuevoUsuario = {
            rol: rol,
            nombreOriginal: usuarioInput.trim(),
            password: pass,
            departamento: depto,
            ciudad: ciudad,
            logo: "https://cdn-icons-png.flaticon.com/512/2897/2897785.png",
            lat: coordsBase.lat,
            lng: coordsBase.lng
        };

        if (rol === 'conductor') {
            nuevoUsuario.vehiculo = regVehiculo.value.trim() || "Turbo Particular";
            nuevoUsuario.placa = regPlaca.value.trim().toUpperCase() || "SXX-000";
            nuevoUsuario.logo = "https://cdn-icons-png.flaticon.com/512/2972/2972195.png";
        } else {
            nuevoUsuario.direccion = regDireccion.value.trim() || "Bodega Central";
            nuevoUsuario.inventario = [];
        }

        baseDeDatosUsuarios[usrKey] = nuevoUsuario;
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

    function iniciarApp() {
        pantallaLogin.classList.add('hidden');
        pantallaApp.classList.remove('hidden');
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];

        if (usrData && usrData.logo) imgAvatarHeader.src = usrData.logo;

        if (usrData && usrData.rol === 'conductor') {
            sheetTituloPrincipal.innerHTML = `<i class="fa-solid fa-truck-fast"></i> Bolsa de Fletes y Carga Disponible`;
            iconNavGestion.className = "fa-solid fa-truck-fast";
            txtNavGestion.textContent = "Bolsa Carga";
            lblBtnGestion.textContent = "Bolsa Carga";
            if(navPedirFleteTab) navPedirFleteTab.style.display = 'none';
            if(chipPedirFlete) chipPedirFlete.style.display = 'none';
            if(navComparar) navComparar.style.display = 'none';
            if(chipComparar) chipComparar.style.display = 'none';
        } else {
            sheetTituloPrincipal.innerHTML = `<i class="fa-solid fa-boxes-stacked"></i> Gestión de Inventario`;
            iconNavGestion.className = "fa-solid fa-boxes-stacked";
            txtNavGestion.textContent = "Inventario";
            lblBtnGestion.textContent = "Inventario";
            if(navPedirFleteTab) navPedirFleteTab.style.display = 'flex';
            if(chipPedirFlete) chipPedirFlete.style.display = 'inline-flex';
            if(navComparar) navComparar.style.display = 'flex';
            if(chipComparar) chipComparar.style.display = 'inline-flex';
        }

        configurarContenidoSheet();
        setTimeout(() => inicializarMapaPrincipal(), 300);
    }

    function configurarContenidoSheet() {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        if (!usrData) return;

        if (usrData.rol === 'conductor') {
            let fletesHtml = "";
            const fletesDisponibles = bolsaFletesGlobal.filter(f => f.estado === "Disponible" || f.conductorKey === usuarioSesionActiva);

            if (fletesDisponibles.length > 0) {
                fletesDisponibles.forEach(f => {
                    const esMio = f.conductorKey === usuarioSesionActiva;
                    fletesHtml += `
                        <div style="background:#fff; padding:12px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:10px;">
                            <strong style="color:#dc2626;">🏢 Empresa: ${f.empresa}</strong>
                            <p style="font-size:0.8rem; color:#64748b; margin:4px 0;">Ruta: <strong>${f.origen} ➔ ${f.destino}</strong></p>
                            <p style="font-size:0.8rem; color:#334155; margin:4px 0;">Detalle: ${f.carga}</p>
                            <p style="font-size:0.85rem; color:#15803d; font-weight:bold; margin:4px 0;">💰 Tarifa Ofrecida: $${parseInt(f.tarifa).toLocaleString()} COP</p>
                            <div style="display:flex; gap:8px; margin-top:8px;">
                                ${!esMio ? `<button onclick="aceptarFlete('${f.id}')" style="background:#16a34a; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.78rem;"><i class="fa-solid fa-check"></i> Aceptar Viaje</button>` : `<span style="color:#16a34a; font-weight:bold; font-size:0.8rem;">✅ Viaje Asignado a Ti</span>`}
                                <button onclick="abrirChatFlete('${f.id}', '${f.empresa}')" style="background:#2563eb; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.78rem;"><i class="fa-solid fa-comments"></i> Chat con Empresa</button>
                            </div>
                        </div>
                    `;
                });
            } else {
                fletesHtml = `<p style="font-size:0.85rem; color:#64748b;">No hay solicitudes de fletes activas en la red en este momento.</p>`;
            }

            sheetContentBody.innerHTML = `
                <div class="card-section" style="background:#fef2f2; border-color:#fca5a5;">
                    <h4><i class="fa-solid fa-id-card"></i> Estado del Transportador</h4>
                    <p style="font-size:0.85rem; color:#475569; margin-top:4px;">Vehículo: <strong>${usrData.vehiculo}</strong> | Placa: <strong>${usrData.placa}</strong></p>
                    <p style="font-size:0.8rem; color:#16a34a; font-weight:bold; margin-top:2px;">🟢 Conectado en el mapa de cobertura</p>
                </div>
                <div class="card-section">
                    <h4><i class="fa-solid fa-route"></i> Bolsa de Carga Nacional</h4>
                    <div id="lista-fletes-conductor" style="margin-top:8px;">${fletesHtml}</div>
                </div>
            `;
        } else {
            sheetContentBody.innerHTML = `
                <div class="card-section ocr-highlight">
                    <h4><i class="fa-solid fa-file-invoice-dollar"></i> Ingreso Masivo por Foto de Factura (OCR)</h4>
                    <p style="font-size:0.8rem; color:#1e40af; margin-bottom:8px;">Tómale foto a tu factura para auditar y cargar productos al stock.</p>
                    <div class="input-group"><input type="file" id="input-foto-factura" accept="image/*" capture="environment"></div>
                    <button id="btn-procesar-ocr" class="btn-primary" style="background-color: #2563eb;"><i class="fa-solid fa-wand-magic-sparkles"></i> Escanear Factura y Revisar</button>
                    <div id="estado-ocr" class="ocr-status-text"></div>
                </div>
                <div class="card-section">
                    <h4 id="titulo-form-producto"><i class="fa-solid fa-pen-to-square"></i> Guardar / Modificar Producto</h4>
                    <form id="form-producto" class="form-grid-compact">
                        <input type="hidden" id="prod-id">
                        <div class="input-group"><label>Referencia / Código:</label><input type="text" id="prod-codigo" placeholder="Ej. REF-101" required></div>
                        <div class="input-group"><label>Descripción Producto:</label><input type="text" id="prod-nombre" placeholder="Ej. Queso Doble Crema" required></div>
                        <div class="input-group"><label>Stock (Unidades):</label><input type="number" id="prod-stock" min="0" placeholder="20" required></div>
                        <div class="input-group"><label>Fecha Vencimiento:</label><input type="date" id="prod-vencimiento" required></div>
                        <div class="input-group"><label>Stock Mínimo:</label><input type="number" id="prod-minimo" min="0" value="5" required></div>
                        <div class="input-group"><label>Costo Compra ($ COP):</label><input type="number" id="prod-costo" min="0" placeholder="10000" required></div>
                        <div class="input-group"><label>% IVA:</label>
                            <select id="prod-iva"><option value="0">0% Exento</option><option value="5">5% Especial</option><option value="19" selected>19% General</option></select>
                        </div>
                        <div class="input-group"><label>% Margen Ganancia:</label><input type="number" id="prod-margen" value="30" min="0" required></div>
                        <button type="submit" class="btn-primary grid-full-btn" style="margin-top:10px;"><i class="fa-solid fa-floppy-disk"></i> Guardar en Stock</button>
                    </form>
                </div>
                <div class="card-section">
                    <h4><i class="fa-solid fa-list-check"></i> Catálogo de Suministros</h4>
                    <div class="table-responsive">
                        <table class="tabla-inventario">
                            <thead><tr><th>Producto</th><th>Stock</th><th>Costo</th><th>IVA/Margen</th><th>Público</th><th>Acción</th></tr></thead>
                            <tbody id="tabla-body"></tbody>
                        </table>
                    </div>
                </div>
            `;
            renderizarTabla();
            setupOcrListeners();
            setupFormProductoListener();
        }
    }

    formPedirFleteLibre.addEventListener('submit', (e) => {
        e.preventDefault();
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        const origen = document.getElementById('flete-origen').value;
        const destino = document.getElementById('flete-destino').value;
        const tarifa = document.getElementById('flete-tarifa').value;
        const detalles = document.getElementById('flete-detalles').value.trim();

        const nuevoFlete = {
            id: "flete_" + Date.now(),
            empresaKey: usuarioSesionActiva,
            empresa: usrData.nombreOriginal,
            origen: origen,
            destino: destino,
            tarifa: tarifa,
            carga: detalles,
            estado: "Disponible",
            conductorKey: null
        };

        bolsaFletesGlobal.unshift(nuevoFlete);
        guardarEnStorage();
        formPedirFleteLibre.reset();
        renderizarMisFletesEmpresa();
        alert("✅ ¡Solicitud de flete publicada con éxito!");
    });

    function renderizarMisFletesEmpresa() {
        const misFletes = bolsaFletesGlobal.filter(f => f.empresaKey === usuarioSesionActiva);
        if (misFletes.length === 0) {
            listaMisFletes.innerHTML = `<p style="font-size:0.8rem; color:#64748b;">No has publicado solicitudes de fletes.</p>`;
            return;
        }

        let html = "";
        misFletes.forEach(f => {
            html += `
                <div style="background:#fff; padding:10px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:8px;">
                    <strong style="color:#1e293b;">Ruta: ${f.origen} ➔ ${f.destino}</strong>
                    <p style="font-size:0.78rem; color:#64748b; margin:2px 0;">Detalle: ${f.carga} | Tarifa: $${parseInt(f.tarifa).toLocaleString()} COP</p>
                    <p style="font-size:0.78rem; color:${f.estado==='Disponible'?'#d97706':'#16a34a'}; font-weight:bold;">Estado: ${f.estado}</p>
                    <button onclick="abrirChatFlete('${f.id}', 'Transportador')" style="background:#2563eb; color:#fff; border:none; padding:5px 10px; border-radius:6px; font-size:0.75rem; cursor:pointer; margin-top:4px;"><i class="fa-solid fa-comments"></i> Abrir Chat / Negociar</button>
                </div>
            `;
        });
        listaMisFletes.innerHTML = html;
    }

    window.aceptarFlete = function(fleteId) {
        const flete = bolsaFletesGlobal.find(f => f.id === fleteId);
        if (flete) {
            flete.estado = "Asignado";
            flete.conductorKey = usuarioSesionActiva;
            guardarEnStorage();
            alert(`✅ ¡Has aceptado el viaje de ${flete.empresa}!`);
            configurarContenidoSheet();
        }
    };

    window.abrirChatFlete = function(fleteId, nombreContraparte) {
        fleteChatActivoId = fleteId;
        chatTituloModal.innerHTML = `<i class="fa-solid fa-comments"></i> Chat Flete: ${nombreContraparte}`;
        renderizarMensajesChat();
        modalChatUber.classList.remove('hidden');
    };

    btnCerrarChat.addEventListener('click', () => modalChatUber.classList.add('hidden'));

    function renderizarMensajesChat() {
        if (!chatsFletesGlobal[fleteChatActivoId]) {
            chatsFletesGlobal[fleteChatActivoId] = [
                { emisor: "Sistema", texto: "Canal de negociación abierto." }
            ];
        }

        let html = "";
        chatsFletesGlobal[fleteChatActivoId].forEach(msg => {
            const esMio = msg.emisor === usuarioSesionActiva;
            const esSis = msg.emisor === "Sistema";
            let bg = esSis ? "#e2e8f0" : (esMio ? "#dcfce7" : "#eff6ff");
            let align = esSis ? "center" : (esMio ? "flex-end" : "flex-start");

            html += `
                <div style="display:flex; justify-content:${align}; margin-bottom:4px;">
                    <div style="background:${bg}; padding:8px 12px; border-radius:8px; max-width:80%; font-size:0.85rem; color:#1e293b;">
                        ${!esSis ? `<strong style="font-size:0.7rem; color:#475569; display:block;">${msg.emisor}</strong>` : ''}
                        ${msg.texto}
                    </div>
                </div>
            `;
        });
        chatMensajesContainer.innerHTML = html;
        chatMensajesContainer.scrollTop = chatMensajesContainer.scrollHeight;
    }

    btnEnviarChat.addEventListener('click', () => {
        const texto = inputMensajeChat.value.trim();
        if (!texto || !fleteChatActivoId) return;

        if (!chatsFletesGlobal[fleteChatActivoId]) chatsFletesGlobal[fleteChatActivoId] = [];
        chatsFletesGlobal[fleteChatActivoId].push({ emisor: usuarioSesionActiva, texto: texto });
        guardarEnStorage();
        inputMensajeChat.value = '';
        renderizarMensajesChat();
    });

    inputMensajeChat.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnEnviarChat.click();
    });

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
            const esConductor = (dataUsr.rol === 'conductor');

            let popupContent = "";
            if (esConductor) {
                popupContent = `
                    <div style="font-family:sans-serif; text-align:center; width:200px;">
                        <div style="background:#fef2f2; color:#dc2626; font-size:0.75rem; font-weight:bold; padding:2px; border-radius:4px; margin-bottom:4px;">🚚 TRANSPORTADOR UBER CARGA</div>
                        <strong style="font-size:0.9rem; color:#1e293b;">${nombreMostrar}</strong><br>
                        <span style="font-size:0.75rem; color:#64748b;">Vehículo: ${dataUsr.vehiculo}</span><br>
                        <span style="font-size:0.75rem; color:#16a34a; font-weight:bold;">Placa: ${dataUsr.placa}</span>
                    </div>
                `;
            } else {
                let listaProd = "";
                if (dataUsr.inventario && dataUsr.inventario.length > 0) {
                    listaProd = `<div style="max-height:110px; overflow-y:auto; text-align:left; margin-top:4px; border-top:1px solid #e2e8f0; padding-top:4px;"><ul style="margin:0 0 0 12px; font-size:0.72rem; color:#475569;">`;
                    dataUsr.inventario.forEach(p => {
                        listaProd += `<li><strong>${p.nombre}</strong> (${p.stock} un.) - $${p.precio.toLocaleString()} COP</li>`;
                    });
                    listaProd += `</ul></div>`;
                } else {
                    listaProd = `<p style="font-size:0.72rem; color:#dc2626; margin-top:4px;">Sin stock registrado.</p>`;
                }

                popupContent = `
                    <div style="font-family:sans-serif; text-align:center; width:210px;">
                        <strong style="color:${esActual ? '#16a34a' : '#dc2626'}; font-size:0.9rem;">${nombreMostrar.toUpperCase()} ${esActual ? '(Tu Sede)' : ''}</strong><br>
                        <span style="font-size:0.75rem; color:#64748b;">📍 ${dataUsr.ciudad}, ${dataUsr.departamento}</span><br>
                        <span style="font-size:0.72rem; color:#94a3b8;">${dataUsr.direccion}</span>
                        ${listaProd}
                    </div>
                `;
            }

            const pinColor = esConductor ? '#2563eb' : (esActual ? '#16a34a' : '#dc2626');
            const customIcon = L.divIcon({
                className: 'custom-map-pin',
                html: `<div style="width:38px; height:38px; border-radius:50%; border:3px solid ${pinColor}; overflow:hidden; background:#fff; box-shadow:0 2px 6px rgba(0,0,0,0.3);"><img src="${logo}" style="width:100%; height:100%; object-fit:cover;"></div>`,
                iconSize: [38, 38],
                iconAnchor: [19, 19]
            });

            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapaPrincipal);
            marker.bindPopup(popupContent, { maxWidth: 240 });
            if (esActual) marker.openPopup();
        });
    }

    function activarTab(tabName) {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];

        navExplorar.classList.remove('active');
        navMisProductos.classList.remove('active');
        if(navPedirFleteTab) navPedirFleteTab.classList.remove('active');
        navComparar.classList.remove('active');
        navPerfil.classList.remove('active');

        chipMapa.classList.remove('active');
        if(chipMisProductos) chipMisProductos.classList.remove('active');
        if(chipPedirFlete) chipPedirFlete.classList.remove('active');
        if(chipComparar) chipComparar.classList.remove('active');

        sheetProductos.classList.add('hidden');
        sheetPedirFlete.classList.add('hidden');
        sheetComparador.classList.add('hidden');

        if (tabName === 'explorar') {
            navExplorar.classList.add('active');
            chipMapa.classList.add('active');
            if (mapaPrincipal) mapaPrincipal.invalidateSize();
        } else if (tabName === 'productos') {
            navMisProductos.classList.add('active');
            if(chipMisProductos) chipMisProductos.classList.add('active');
            sheetProductos.classList.remove('hidden');
        } else if (tabName === 'pedir-flete' && usrData.rol === 'empresa') {
            if(navPedirFleteTab) navPedirFleteTab.classList.add('active');
            if(chipPedirFlete) chipPedirFlete.classList.add('active');
            renderizarMisFletesEmpresa();
            sheetPedirFlete.classList.remove('hidden');
        } else if (tabName === 'comparar' && usrData.rol === 'empresa') {
            navComparar.classList.add('active');
            if(chipComparar) chipComparar.classList.add('active');
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
    if(navPedirFleteTab) navPedirFleteTab.addEventListener('click', () => activarTab('pedir-flete'));
    navComparar.addEventListener('click', () => activarTab('comparar'));
    navPerfil.addEventListener('click', () => activarTab('perfil'));

    chipMapa.addEventListener('click', () => activarTab('explorar'));
    if(chipMisProductos) chipMisProductos.addEventListener('click', () => activarTab('productos'));
    if(chipPedirFlete) chipPedirFlete.addEventListener('click', () => activarTab('pedir-flete'));
    if(chipComparar) chipComparar.addEventListener('click', () => activarTab('comparar'));

    btnCerrarSheet.addEventListener('click', () => activarTab('explorar'));
    btnCerrarFleteLib.addEventListener('click', () => activarTab('explorar'));
    btnCerrarComparador.addEventListener('click', () => activarTab('explorar'));

    btnMiUbicacion.addEventListener('click', () => {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        if (usrData && mapaPrincipal) mapaPrincipal.setView([usrData.lat, usrData.lng], 14);
    });

    chipRedToggle.addEventListener('click', () => {
        modoOnline = !modoOnline;
        lblEstadoRed.textContent = modoOnline ? "Online" : "Offline";
    });

    btnPerfilAvatar.addEventListener('click', () => abrirModalPerfil());

    function abrirModalPerfil() {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        perfilDepartamento.value = usrData.departamento || "Cundinamarca";
        perfilDepartamento.dispatchEvent(new Event('change'));
        setTimeout(() => {
            perfilCiudad.value = usrData.ciudad || "";
        }, 50);

        if (usrData.rol === 'conductor') {
            grupoDirPerfil.style.display = 'none';
            grupoVehiculoPerfil.style.display = 'block';
            grupoPlacaPerfil.style.display = 'block';
            perfilVehiculo.value = usrData.vehiculo || "";
            perfilPlaca.value = usrData.placa || "";
        } else {
            grupoDirPerfil.style.display = 'block';
            grupoVehiculoPerfil.style.display = 'none';
            grupoPlacaPerfil.style.display = 'none';
            perfilDireccion.value = usrData.direccion || "";
        }

        logoBase64Perfil = usrData.logo || "";
        if (usrData.logo) {
            previewPerfilLogo.innerHTML = `<img src="${usrData.logo}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid #dc2626;">`;
        } else {
            previewPerfilLogo.innerHTML = "";
        }

        perfilLat.value = usrData.lat;
        perfilLng.value = usrData.lng;
        lblCoordPerfil.innerHTML = `✅ Lat ${usrData.lat.toFixed(4)}, Lng ${usrData.lng.toFixed(4)}`;

        modalPerfil.classList.remove('hidden');
        setTimeout(() => inicializarMapaPerfil(usrData.lat, usrData.lng), 300);
    }

    function inicializarMapaPerfil(lat, lng) {
        if (!mapaPerfil) {
            mapaPerfil = L.map('mapa-perfil-interactivo').setView([lat, lng], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapaPerfil);

            mapaPerfil.on('click', (e) => {
                const newLat = e.latlng.lat;
                const newLng = e.latlng.lng;
                perfilLat.value = newLat;
                perfilLng.value = newLng;
                lblCoordPerfil.innerHTML = `✅ Lat ${newLat.toFixed(4)}, Lng ${newLng.toFixed(4)}`;

                if (marcadorPerfil) marcadorPerfil.setLatLng([newLat, newLng]);
                else marcadorPerfil = L.marker([newLat, newLng], { draggable: true }).addTo(mapaPerfil);
            });
        } else {
            mapaPerfil.invalidateSize();
            mapaPerfil.setView([lat, lng], 14);
        }

        if (marcadorPerfil) mapaPerfil.removeLayer(marcadorPerfil);
        marcadorPerfil = L.marker([lat, lng], { draggable: true }).addTo(mapaPerfil);
        
        marcadorPerfil.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            perfilLat.value = pos.lat;
            perfilLng.value = pos.lng;
            lblCoordPerfil.innerHTML = `✅ Lat ${pos.lat.toFixed(4)}, Lng ${pos.lng.toFixed(4)}`;
        });
    }

    btnCerrarPerfil.addEventListener('click', () => modalPerfil.classList.add('hidden'));

    formEditarPerfil.addEventListener('submit', (e) => {
        e.preventDefault();
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        usrData.departamento = perfilDepartamento.value;
        usrData.ciudad = perfilCiudad.value;
        
        if (usrData.rol === 'empresa') {
            usrData.direccion = perfilDireccion.value.trim();
        } else {
            usrData.vehiculo = perfilVehiculo.value.trim();
            usrData.placa = perfilPlaca.value.trim().toUpperCase();
        }

        if (logoBase64Perfil) {
            usrData.logo = logoBase64Perfil;
            imgAvatarHeader.src = logoBase64Perfil;
        }

        usrData.lat = parseFloat(perfilLat.value) || usrData.lat;
        usrData.lng = parseFloat(perfilLng.value) || usrData.lng;

        guardarEnStorage();
        modalPerfil.classList.add('hidden');
        inicializarMapaPrincipal();
        alert("✅ ¡Perfil, foto y ubicación actualizados con éxito!");
    });

    function setupOcrListeners() {
        const btnProcesarOCR = document.getElementById('btn-procesar-ocr');
        if (!btnProcesarOCR) return;

        btnProcesarOCR.addEventListener('click', async () => {
            const inputFotoFactura = document.getElementById('input-foto-factura');
            const estadoOCR = document.getElementById('estado-ocr');
            const archivo = inputFotoFactura.files[0];
            if (!archivo) { alert("⚠️ Selecciona una foto de factura."); return; }

            estadoOCR.innerHTML = "⏳ Escaneando productos con OCR...";
            productosDetectadosTemporal = [];

            try {
                const result = await Tesseract.recognize(archivo, 'spa', {
                    logger: m => {
                        if (m.status === 'recognizing text') estadoOCR.innerHTML = `⏳ Escaneando: ${Math.round(m.progress * 100)}%`;
                    }
                });

                const lineas = result.data.text.split('\n');
                lineas.forEach((linea, index) => {
                    const numeros = linea.match(/\d+/g);
                    if (numeros && numeros.length >= 1) {
                        const costoBase = parseInt(numeros[numeros.length - 1]);
                        const cantidad = numeros.length >= 2 ? parseInt(numeros[numeros.length - 2]) : 1;
                        let descripcion = linea.replace(/[0-9]/g, '').trim();

                        if (descripcion.length > 3 && costoBase > 500 && !descripcion.toLowerCase().includes('nit')) {
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
                    estadoOCR.innerHTML = `⚠️ No se leyeron productos claros. Intenta con otra foto.`;
                }
            } catch (err) {
                console.error(err);
                estadoOCR.innerHTML = `⚠️ Error al escanear imagen.`;
            }
        });
    }

    function abrirModalAuditoria() {
        const tablaAuditoriaBody = document.getElementById('tabla-auditoria-body');
        tablaAuditoriaBody.innerHTML = '';
        productosDetectadosTemporal.forEach((prod, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" value="${prod.nombre}" id="aud-nombre-${idx}" style="width:100%;"></td>
                <td><input type="number" value="${prod.cantidad}" min="1" id="aud-cant-${idx}" style="width:50px;"></td>
                <td><input type="number" value="${prod.costo}" min="0" id="aud-costo-${idx}" style="width:80px;"></td>
                <td><select id="aud-iva-${idx}"><option value="0" ${prod.iva===0?'selected':''}>0%</option><option value="5" ${prod.iva===5?'selected':''}>5%</option><option value="19" ${prod.iva===19?'selected':''}>19%</option></select></td>
                <td><input type="number" value="${prod.margen}" min="0" id="aud-margen-${idx}" style="width:50px;"></td>
            `;
            tablaAuditoriaBody.appendChild(tr);
        });
        document.getElementById('modal-auditoria-factura').classList.remove('hidden');
    }

    document.getElementById('btn-cerrar-auditoria').addEventListener('click', () => document.getElementById('modal-auditoria-factura').classList.add('hidden'));
    document.getElementById('btn-cancelar-auditoria').addEventListener('click', () => document.getElementById('modal-auditoria-factura').classList.add('hidden'));

    document.getElementById('btn-confirmar-ingreso-factura').addEventListener('click', () => {
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
                usrData.inventario.unshift({
                    id: "prod_" + Date.now() + "_" + idx,
                    codigo: "REF-" + Math.floor(1000 + Math.random() * 9000),
                    nombre: nombreCorregido,
                    stock: cantidadCorregida,
                    minimo: 5,
                    costoCompra: costoCorregido,
                    ivaPorcentaje: ivaCorregido,
                    margenPorcentaje: margenCorregido,
                    precio: precioFinal,
                    lotes: [{ idLote: "lote_" + Date.now(), cantidad: cantidadCorregida, fechaVencimiento: "2026-12-30" }]
                });
                ingresados++;
            }
        });

        guardarEnStorage();
        renderizarTabla();
        inicializarMapaPrincipal();
        document.getElementById('modal-auditoria-factura').classList.add('hidden');
        alert(`✅ ¡Ingresados ${ingresados} productos al stock!`);
    });

    function setupFormProductoListener() {
        const formProducto = document.getElementById('form-producto');
        if (!formProducto) return;

        formProducto.addEventListener('submit', (e) => {
            e.preventDefault();
            const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
            const id = document.getElementById('prod-id').value;
            const codigo = document.getElementById('prod-codigo').value.trim() || ("REF-" + Math.floor(1000 + Math.random() * 9000));
            const nombre = document.getElementById('prod-nombre').value.trim();
            const stockNum = parseInt(document.getElementById('prod-stock').value);
            const fechaVenc = document.getElementById('prod-vencimiento').value;
            const minNum = parseInt(document.getElementById('prod-minimo').value);
            const costoNum = parseInt(document.getElementById('prod-costo').value);
            const ivaNum = parseFloat(document.getElementById('prod-iva').value);
            const margenNum = parseFloat(document.getElementById('prod-margen').value);
            const precioFinal = Math.round((costoNum * (1 + ivaNum / 100)) * (1 + margenNum / 100));

            if (id) {
                const idx = usrData.inventario.findIndex(p => p.id === id);
                if (idx !== -1) {
                    usrData.inventario[idx] = { ...usrData.inventario[idx], codigo, nombre, stock: stockNum, minimo: minNum, costoCompra: costoNum, ivaPorcentaje: ivaNum, margenPorcentaje: margenNum, precio: precioFinal };
                }
            } else {
                usrData.inventario.unshift({
                    id: "prod_" + Date.now(),
                    codigo, nombre, stock: stockNum, minimo: minNum, costoCompra: costoNum, ivaPorcentaje: ivaNum, margenPorcentaje: margenNum, precio: precioFinal,
                    lotes: [{ idLote: "lote_" + Date.now(), cantidad: stockNum, fechaVencimiento: fechaVenc }]
                });
            }

            guardarEnStorage();
            formProducto.reset();
            document.getElementById('prod-id').value = '';
            renderizarTabla();
            inicializarMapaPrincipal();
            alert("✅ Producto guardado correctamente.");
        });
    }

    function renderizarTabla() {
        const tablaBody = document.getElementById('tabla-body');
        if (!tablaBody) return;
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        if (!usrData || usrData.rol !== 'empresa') return;

        tablaBody.innerHTML = '';
        usrData.inventario.forEach(prod => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${prod.nombre}</strong><br><small style="color:#dc2626;">${prod.codigo}</small></td>
                <td>${prod.stock}</td>
                <td>$${prod.costoCompra.toLocaleString()}</td>
                <td style="font-size:0.75rem;">IVA ${prod.ivaPorcentaje}%</td>
                <td style="color:#16a34a; font-weight:bold;">$${prod.precio.toLocaleString()}</td>
                <td><button onclick="editarProducto('${prod.id}')" style="background:#eab308; color:#fff; border:none; padding:4px 8px; border-radius:4px;"><i class="fa-solid fa-pen"></i></button></td>
            `;
            tablaBody.appendChild(tr);
        });
    }

    window.editarProducto = function(id) {
        const usrData = baseDeDatosUsuarios[usuarioSesionActiva];
        const prod = usrData.inventario.find(p => p.id === id);
        if (!prod) return;
        document.getElementById('prod-id').value = prod.id;
        document.getElementById('prod-codigo').value = prod.codigo;
        document.getElementById('prod-nombre').value = prod.nombre;
        document.getElementById('prod-stock').value = prod.stock;
        document.getElementById('prod-minimo').value = prod.minimo;
        document.getElementById('prod-costo').value = prod.costoCompra;
        document.getElementById('prod-iva').value = prod.ivaPorcentaje;
        document.getElementById('prod-margen').value = prod.margenPorcentaje;
    };

    function poblarSelectorComparador() {
        const productosUnicos = new Set();
        Object.keys(baseDeDatosUsuarios).forEach(usrKey => {
            const u = baseDeDatosUsuarios[usrKey];
            if (u.rol === 'empresa' && u.inventario) {
                u.inventario.forEach(p => productosUnicos.add(p.nombre));
            }
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

        let html = `<table class="tabla-inventario"><thead><tr><th>Empresa Proveedora</th><th>Ubicación</th><th>Precio Público</th></tr></thead><tbody>`;
        let mejorPrecio = Infinity;
        let mejorSedeName = "";

        Object.keys(baseDeDatosUsuarios).forEach(usrKey => {
            const usr = baseDeDatosUsuarios[usrKey];
            if (usr.rol === 'empresa' && usr.inventario) {
                const prod = usr.inventario.find(p => p.nombre === prodSel);
                if (prod) {
                    if (prod.precio < mejorPrecio) {
                        mejorPrecio = prod.precio;
                        mejorSedeName = usr.nombreOriginal;
                    }
                    html += `
                        <tr>
                            <td><strong>${usr.nombreOriginal}</strong></td>
                            <td>${usr.ciudad}</td>
                            <td style="color:#16a34a; font-weight:bold;">$${prod.precio.toLocaleString()} COP</td>
                        </tr>
                    `;
                }
            }
        });
        html += `</tbody></table>`;

        if (mejorPrecio !== Infinity) {
            html = `<div style="background:#f0fdf4; border:1px solid #86efac; padding:8px; border-radius:8px; margin-bottom:8px; color:#15803d; font-size:0.8rem;">💡 <strong>Mejor Precio:</strong> ${mejorSedeName} a solo <strong>$${mejorPrecio.toLocaleString()} COP</strong>.</div>` + html;
        }
        resultadoComparacion.innerHTML = html;
    }

    selectProductoComparar.addEventListener('change', actualizarComparacionPrecios);

    inputBuscarMapa.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) return;

        Object.keys(baseDeDatosUsuarios).forEach(usrKey => {
            const usr = baseDeDatosUsuarios[usrKey];
            const coincide = usr.nombreOriginal.toLowerCase().includes(query) || usr.ciudad.toLowerCase().includes(query) || (usr.vehiculo && usr.vehiculo.toLowerCase().includes(query));
            if (coincide && mapaPrincipal) {
                mapaPrincipal.setView([usr.lat, usr.lng], 12);
            }
        });
    });

    if (usuarioSesionActiva && baseDeDatosUsuarios[usuarioSesionActiva]) {
        iniciarApp();
    }
});