document.addEventListener('DOMContentLoaded', () => {
    // Cargar usuarios desde localStorage o inicializar objeto vacío
    let baseDeDatosUsuarios = JSON.parse(localStorage.getItem('db_usuarios_inventario')) || {};

    let usuarioActual = "";
    let inventarioActual = [];

    // Elementos del DOM
    const pantallaLogin = document.getElementById('pantalla-login');
    const pantallaApp = document.getElementById('pantalla-app');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const mensajeAuth = document.getElementById('mensaje-auth');
    const nombreUsuarioActivo = document.getElementById('nombre-usuario-activo');
    const btnLogout = document.getElementById('btn-logout');
    const formProducto = document.getElementById('form-producto');
    const tablaBody = document.getElementById('tabla-body');

    // CONMUTADOR DE PESTAÑAS (LOGIN / REGISTRO)
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
        limpiarMensaje();
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        formRegister.classList.remove('hidden');
        formLogin.classList.add('hidden');
        limpiarMensaje();
    });

    // 1. REGISTRAR UN USUARIO NUEVO
    formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nuevoUsuario = document.getElementById('reg-usuario').value.trim().toLowerCase();
        const nuevaPassword = document.getElementById('reg-password').value.trim();

        if (!nuevoUsuario || !nuevaPassword) return;

        // Validar si el usuario ya existe
        if (baseDeDatosUsuarios[nuevoUsuario]) {
            mostrarMensaje("El nombre de usuario ya existe. Elige otro.", "error");
            return;
        }

        // Crear nuevo registro con inventario en blanco
        baseDeDatosUsuarios[nuevoUsuario] = {
            password: nuevaPassword,
            inventario: []
        };

        // Guardar cambios
        guardarEnStorage();

        mostrarMensaje("¡Cuenta creada con éxito! Ya puedes iniciar sesión.", "exito");
        formRegister.reset();

        // Cambiar automáticamente a la pestaña de inicio de sesión
        setTimeout(() => {
            tabLogin.click();
            document.getElementById('usuario').value = nuevoUsuario;
        }, 1200);
    });

    // 2. INICIAR SESIÓN CON VERIFICACIÓN DE CLAVE
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        limpiarMensaje();

        const usuarioInput = document.getElementById('usuario').value.trim().toLowerCase();
        const passwordInput = document.getElementById('password').value.trim();

        if (!usuarioInput || !passwordInput) return;

        // Verificar si el usuario existe en el sistema
        if (!baseDeDatosUsuarios[usuarioInput]) {
            mostrarMensaje("El usuario no existe. Regístralo primero.", "error");
            return;
        }

        const usuarioData = baseDeDatosUsuarios[usuarioInput];

        // Validar coincidencia de contraseña
        if (usuarioData.password === passwordInput) {
            usuarioActual = usuarioInput;
            inventarioActual = usuarioData.inventario;

            nombreUsuarioActivo.textContent = usuarioActual;
            pantallaLogin.classList.add('hidden');
            pantallaApp.classList.remove('hidden');
            renderizarTabla();
        } else {
            // Contraseña incorrecta
            mostrarMensaje("Contraseña incorrecta. Inténtalo de nuevo.", "error");
        }
    });

    // FUNCIONES DE MENSAJES DE ESTADO
    function mostrarMensaje(texto, tipo) {
        mensajeAuth.textContent = texto;
        mensajeAuth.className = `mensaje ${tipo}`;
        mensajeAuth.classList.remove('hidden');
    }

    function limpiarMensaje() {
        mensajeAuth.textContent = '';
        mensajeAuth.className = 'hidden';
    }

    function guardarEnStorage() {
        localStorage.setItem('db_usuarios_inventario', JSON.stringify(baseDeDatosUsuarios));
    }

    // 3. CERRAR SESIÓN
    btnLogout.addEventListener('click', () => {
        usuarioActual = "";
        inventarioActual = [];
        
        formLogin.reset();
        formRegister.reset();
        formProducto.reset();
        document.getElementById('prod-id').value = '';
        limpiarMensaje();

        pantallaApp.classList.add('hidden');
        pantallaLogin.classList.remove('hidden');
    });

    // 4. RENDERIZAR TABLA DE PRODUCTOS
    function renderizarTabla() {
        tablaBody.innerHTML = '';

        if (inventarioActual.length === 0) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #6b7280; padding: 20px;">
                        No hay productos registrados para <strong>${usuarioActual}</strong>. ¡Añade el primero arriba!
                    </td>
                </tr>
            `;
            return;
        }

        inventarioActual.forEach((prod) => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td><strong>${prod.nombre}</strong></td>
                <td>${prod.stock} un.</td>
                <td>$${prod.precio.toLocaleString('es-CO')}</td>
                <td>
                    <button class="btn-edit" data-id="${prod.id}">Editar</button>
                </td>
            `;
            tablaBody.appendChild(fila);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                cargarParaEditar(id);
            });
        });
    }

    // 5. CARGAR PRODUCTO PARA EDITAR
    function cargarParaEditar(id) {
        const producto = inventarioActual.find(p => p.id === id);
        if (producto) {
            document.getElementById('prod-id').value = producto.id;
            document.getElementById('prod-nombre').value = producto.nombre;
            document.getElementById('prod-stock').value = producto.stock;
            document.getElementById('prod-precio').value = producto.precio;
        }
    }

    // 6. GUARDAR / EDITAR PRODUCTO EN EL INVENTARIO
    formProducto.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('prod-id').value;
        const nombre = document.getElementById('prod-nombre').value;
        const stock = parseInt(document.getElementById('prod-stock').value);
        const precio = parseInt(document.getElementById('prod-precio').value);

        if (id) {
            const index = inventarioActual.findIndex(p => p.id == id);
            inventarioActual[index] = { id: parseInt(id), nombre, stock, precio };
        } else {
            const nuevoId = inventarioActual.length > 0 ? Math.max(...inventarioActual.map(p => p.id)) + 1 : 1;
            inventarioActual.push({ id: nuevoId, nombre, stock, precio });
        }

        baseDeDatosUsuarios[usuarioActual].inventario = inventarioActual;
        guardarEnStorage();

        formProducto.reset();
        document.getElementById('prod-id').value = '';
        renderizarTabla();
    });
});