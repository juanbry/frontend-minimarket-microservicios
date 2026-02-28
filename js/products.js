document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const mainContent = document.getElementById('main-content');
    const searchBar = document.getElementById('search-bar');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const customerDocInput = document.getElementById('customer-doc');
    const createOrderButton = document.getElementById('create-order-button');
    const ordersTableBody = document.getElementById('orders-table-body');
    const modal = document.getElementById('confirmation-modal');
    const modalDetails = document.getElementById('modal-order-details');
    const modalClose = document.querySelector('.modal-close');
    
    // --- ESTADO DE LA APLICACIÓN ---
    const token = localStorage.getItem('authToken');
    let allProducts = [];
    let cart = [];

    // --- VERIFICACIÓN INICIAL ---
    if (!mainContent) return;
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- LÓGICA PRINCIPAL ---
    async function initialize() {
        loadOrdersHistory();
        addEventListeners();
        await loadProducts();
    }

    async function loadProducts() {
        try {
            const response = await apiFetch('/api/productos/findAll', 'GET', null, token);
            if (response.ok) {
                allProducts = await response.json();
                renderProducts(allProducts);
            } else if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                window.location.href = 'login.html';
            } else {
                mainContent.innerHTML = '<h2>Error al cargar los productos.</h2>';
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            mainContent.innerHTML = `<h2>${error.message}</h2>`;
        }
    }

    function addEventListeners() {
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredProducts = allProducts.filter(p => p.nombre.toLowerCase().includes(searchTerm));
            renderProducts(filteredProducts);
        });
        createOrderButton.addEventListener('click', createOrder);
        modalClose.addEventListener('click', hideConfirmationModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideConfirmationModal();
            }
        });
    }

    // --- RENDERIZADO DE PRODUCTOS ---
    function renderProducts(products) {
        mainContent.innerHTML = '';
        const productGrid = document.createElement('div');
        productGrid.className = 'product-grid';
        if (products.length === 0) {
            mainContent.innerHTML = '<h2>No se encontraron productos.</h2>';
            return;
        }
        products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    // Validamos si existe el objeto stock para evitar errores de "undefined"
    const stockDisponible = product.stock ? product.stock.cantidadDisponible : 0;

    productCard.innerHTML = `
        <h3>${product.nombre}</h3>
        <p class="price">S/ ${product.precioVenta.toFixed(2)}</p>
        <p>Stock: ${stockDisponible}</p>
        <button class="add-to-cart-button" data-id="${product.idProducto}">Añadir al Carrito</button>
    `;
    productGrid.appendChild(productCard);
});
        mainContent.appendChild(productGrid);
        document.querySelectorAll('.add-to-cart-button').forEach(button => {
            button.addEventListener('click', () => addToCart(button.dataset.id));
        });
    }

    // --- LÓGICA DEL CARRITO ---
    function renderCart() {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>El carrito está vacío.</p>';
        } else {
            cart.forEach(item => {
                const cartItemDiv = document.createElement('div');
                cartItemDiv.className = 'cart-item';
                cartItemDiv.innerHTML = `
                    <span class="item-name">${item.nombre} (x${item.cantidad})</span>
                    <span>S/ ${(item.precioVenta * item.cantidad).toFixed(2)}</span>
                    <button class="remove-from-cart-button" data-id="${item.idProducto}">Quitar</button>
                `;
                cartItemsContainer.appendChild(cartItemDiv);
            });
        }
        document.querySelectorAll('.remove-from-cart-button').forEach(button => {
            button.addEventListener('click', () => removeFromCart(button.dataset.id));
        });
        const total = cart.reduce((sum, item) => sum + (item.precioVenta * item.cantidad), 0);
        cartTotalSpan.textContent = total.toFixed(2);
    }
    function addToCart(productId) {
        const product = allProducts.find(p => p.idProducto == productId);
        if (!product) return;
        const cartItem = cart.find(item => item.idProducto == productId);
        if (cartItem) {
            cartItem.cantidad++;
        } else {
            cart.push({ idProducto: product.idProducto, nombre: product.nombre, precioVenta: product.precioVenta, cantidad: 1 });
        }
        renderCart();
    }
    function removeFromCart(productId) {
        const itemIndex = cart.findIndex(item => item.idProducto == productId);
        if (itemIndex > -1) {
            cart[itemIndex].cantidad--;
            if (cart[itemIndex].cantidad === 0) {
                cart.splice(itemIndex, 1);
            }
        }
        renderCart();
    }

    // --- LÓGICA DE LA ORDEN ---
    async function createOrder() {
        const numeroDocumento = customerDocInput.value.trim();
        if (!numeroDocumento) { alert('Por favor, ingresa tu DNI o RUC.'); return; }
        if (cart.length === 0) { alert('Tu carrito está vacío.'); return; }
        
        const orderData = {
            numeroDocumento: numeroDocumento,
            rucEmisor: "20000000001",
            razonSocial: "MODDATOS",
            productos: cart.map(item => ({ idProducto: item.idProducto, cantidad: item.cantidad }))
        };
        
        try {
            const response = await apiFetch('/api/ordenes/crear', 'POST', orderData, token);
            if (response.ok) {
                const result = await response.json();
                showConfirmationModal(result);
                saveOrderToHistory(result);
                cart = [];
                renderCart();
                loadProducts(); 
            } else {
                const error = await response.json();
                alert(`Error al crear la orden: ${error.message || 'Error desconocido.'}`);
            }
        } catch (error) {
            alert(error.message);
        }
    }

    // --- HISTORIAL DE ÓRDENES (localStorage) ---
    function saveOrderToHistory(orderData) {
        const history = JSON.parse(localStorage.getItem('ordersHistory') || '[]');
        history.push(orderData);
        localStorage.setItem('ordersHistory', JSON.stringify(history));
        loadOrdersHistory();
    }

    function loadOrdersHistory() {
    const history = JSON.parse(localStorage.getItem('ordersHistory') || '[]');
    ordersTableBody.innerHTML = '';
    
    if (history.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="5">No hay órdenes recientes.</td></tr>';
        return;
    }

    history.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.idPedido}</td>
            <td>${new Date(order.fechaEmision).toLocaleDateString()}</td>
            <td>${order.numDocCliente}</td>
            <td>S/ ${order.precioTotal.toFixed(2)}</td>
            <td>${order.estado}</td>
        `;
        ordersTableBody.appendChild(row);
    });
}

    // --- LÓGICA DEL MODAL ---
    function showConfirmationModal(orderData) {
    // Según tu OrdenResponseDTO y la imagen de consola:
    modalDetails.innerHTML = `
        <p><strong>ID de Orden:</strong> ${orderData.idPedido}</p>
        <p><strong>Fecha:</strong> ${new Date(orderData.fechaEmision).toLocaleDateString()}</p>
        <p><strong>Estado:</strong> <span class="badge">${orderData.estado}</span></p>
        <p><strong>Cliente:</strong> ${orderData.nombreCliente}</p>
        <p><strong>Documento:</strong> ${orderData.numDocCliente} (Tipo: ${orderData.tipoDocCliente})</p>
        <p><strong>Total Pagado:</strong> S/ ${orderData.precioTotal.toFixed(2)}</p>
        <hr>
        <p style="text-align:center; color: green;">✔ La orden ha sido procesada con éxito.</p>
    `;
    modal.style.display = 'flex';
}

    function hideConfirmationModal() {
        modal.style.display = 'none';
    }

    // --- INICIAR LA APLICACIÓN ---
    initialize();
});
