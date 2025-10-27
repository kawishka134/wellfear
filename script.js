document.addEventListener('DOMContentLoaded', function() {
    // Sound effects
    const clickSound = document.getElementById('click-sound');
    const successSound = document.getElementById('success-sound');
    const errorSound = document.getElementById('error-sound');
    
    // Play sound function
    function playSound(sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed:", e));
    }
    
    // Add sound to all buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            playSound(clickSound);
        });
    });
    
    // Initialize tabs
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'dashboard') {
                renderProducts();
            }
        });
    });
    
    // Product form submission
    const productForm = document.getElementById('product-form');
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('product-name').value;
        const location = document.getElementById('product-location').value;
        const quantity = parseInt(document.getElementById('product-quantity').value);
        
        // Generate product code
        const code = generateProductCode(name);
        
        // Get existing products or initialize empty array
        let products = JSON.parse(localStorage.getItem('products')) || [];
        
        // Check if product already exists
        const existingProductIndex = products.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
        
        if (existingProductIndex !== -1) {
            // Update existing product
            products[existingProductIndex][location] += quantity;
            showNotification(`Updated ${name} quantity in ${location}!`);
            playSound(successSound);
        } else {
            // Add new product
            const newProduct = {
                id: Date.now(),
                name,
                code,
                warehouse: location === 'warehouse' ? quantity : 0,
                shop: location === 'shop' ? quantity : 0
            };
            
            products.push(newProduct);
            showNotification(`Added ${name} successfully!`);
            playSound(successSound);
        }
        
        // Save to localStorage
        localStorage.setItem('products', JSON.stringify(products));
        
        // Reset form
        productForm.reset();
    });
    
    // Product search
    const searchInput = document.getElementById('product-search');
    searchInput.addEventListener('input', function() {
        renderProducts(this.value);
    });
    
    // Generate product code
    function generateProductCode(name) {
        // Get first 3 letters of product name and convert to uppercase
        const prefix = name.substring(0, 3).toUpperCase();
        // Generate random number
        const suffix = Math.floor(Math.random() * 9000) + 1000;
        return `${prefix}-${suffix}`;
    }
    
    // Show notification
    function showNotification(message, isError = false) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.classList.add('show');
        
        if (isError) {
            notification.classList.add('error');
            playSound(errorSound);
        } else {
            notification.classList.remove('error');
            playSound(successSound);
        }
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Render products
    function renderProducts(searchTerm = '') {
        const productList = document.getElementById('product-list');
        let products = JSON.parse(localStorage.getItem('products')) || [];
        
        // Filter products based on search term
        if (searchTerm) {
            products = products.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Clear product list
        productList.innerHTML = '';
        
        if (products.length === 0) {
            productList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <p>${searchTerm ? 'No products match your search.' : 'No products found. Add some products to get started!'}</p>
                </div>
            `;
            return;
        }
        
        // Render each product
        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <div class="product-header">
                    <div class="product-name">${product.name}</div>
                    <div class="product-code">${product.code}</div>
                </div>
                <div class="location-info">
                    <div class="location-box warehouse">
                        <div class="location-label">Warehouse</div>
                        <div class="quantity" id="warehouse-${product.id}">${product.warehouse}</div>
                    </div>
                    <div class="location-box shop">
                        <div class="location-label">Shop</div>
                        <div class="quantity" id="shop-${product.id}">${product.shop}</div>
                    </div>
                </div>
                <div class="controls">
                    <div class="control-group">
                        <button class="control-btn btn-secondary" onclick="adjustQuantity(${product.id}, 'warehouse', -1)">-</button>
                        <button class="control-btn btn-secondary" onclick="adjustQuantity(${product.id}, 'warehouse', 1)">+</button>
                    </div>
                    <button class="transfer-btn btn-success" onclick="transferProduct(${product.id}, 'warehouse', 'shop')">→ Shop</button>
                    <button class="transfer-btn btn-success" onclick="transferProduct(${product.id}, 'shop', 'warehouse')">→ Warehouse</button>
                    <div class="control-group">
                        <button class="control-btn btn-secondary" onclick="adjustQuantity(${product.id}, 'shop', -1)">-</button>
                        <button class="control-btn btn-secondary" onclick="adjustQuantity(${product.id}, 'shop', 1)">+</button>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="action-btn btn-warning" onclick="openEditModal(${product.id})">Edit</button>
                    <button class="action-btn btn-danger" onclick="openDeleteModal(${product.id})">Delete</button>
                </div>
            `;
            productList.appendChild(productItem);
        });
    }
    
    // Adjust quantity
    window.adjustQuantity = function(productId, location, change) {
        let products = JSON.parse(localStorage.getItem('products')) || [];
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            const newQuantity = products[productIndex][location] + change;
            
            if (newQuantity >= 0) {
                products[productIndex][location] = newQuantity;
                localStorage.setItem('products', JSON.stringify(products));
                
                // Update UI
                const quantityElement = document.getElementById(`${location}-${productId}`);
                quantityElement.textContent = newQuantity;
                
                // Add animation
                quantityElement.style.animation = 'pulse 0.3s ease';
                setTimeout(() => {
                    quantityElement.style.animation = '';
                }, 300);
                
                // Show notification
                const action = change > 0 ? 'increased' : 'decreased';
                showNotification(`${products[productIndex].name} ${action} in ${location}!`);
            } else {
                showNotification('Quantity cannot be negative!', true);
            }
        }
    };
    
    // Transfer product
    window.transferProduct = function(productId, fromLocation, toLocation) {
        let products = JSON.parse(localStorage.getItem('products')) || [];
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            if (products[productIndex][fromLocation] > 0) {
                products[productIndex][fromLocation]--;
                products[productIndex][toLocation]++;
                
                localStorage.setItem('products', JSON.stringify(products));
                
                // Update UI
                const fromElement = document.getElementById(`${fromLocation}-${productId}`);
                const toElement = document.getElementById(`${toLocation}-${productId}`);
                
                fromElement.textContent = products[productIndex][fromLocation];
                toElement.textContent = products[productIndex][toLocation];
                
                // Add animation
                fromElement.style.animation = 'pulse 0.3s ease';
                toElement.style.animation = 'pulse 0.3s ease';
                setTimeout(() => {
                    fromElement.style.animation = '';
                    toElement.style.animation = '';
                }, 300);
                
                // Show notification
                showNotification(`Transferred 1 ${products[productIndex].name} from ${fromLocation} to ${toLocation}!`);
            } else {
                showNotification(`No ${products[productIndex].name} available in ${fromLocation}!`, true);
            }
        }
    };
    
    // Edit product modal
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const editCloseBtn = editModal.querySelector('.close');
    
    // Open edit modal
    window.openEditModal = function(productId) {
        let products = JSON.parse(localStorage.getItem('products')) || [];
        const product = products.find(p => p.id === productId);
        
        if (product) {
            document.getElementById('edit-product-name').value = product.name;
            document.getElementById('edit-product-code').value = product.code;
            document.getElementById('edit-warehouse-quantity').value = product.warehouse;
            document.getElementById('edit-shop-quantity').value = product.shop;
            
            editModal.dataset.productId = productId;
            editModal.style.display = 'block';
        }
    };
    
    // Close edit modal
    editCloseBtn.addEventListener('click', function() {
        editModal.style.display = 'none';
    });
    
    // Edit form submission
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productId = parseInt(editModal.dataset.productId);
        const name = document.getElementById('edit-product-name').value;
        const code = document.getElementById('edit-product-code').value;
        const warehouseQuantity = parseInt(document.getElementById('edit-warehouse-quantity').value);
        const shopQuantity = parseInt(document.getElementById('edit-shop-quantity').value);
        
        let products = JSON.parse(localStorage.getItem('products')) || [];
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            products[productIndex].name = name;
            products[productIndex].code = code;
            products[productIndex].warehouse = warehouseQuantity;
            products[productIndex].shop = shopQuantity;
            
            localStorage.setItem('products', JSON.stringify(products));
            
            // Close modal
            editModal.style.display = 'none';
            
            // Re-render products
            renderProducts();
            
            showNotification(`Product ${name} updated successfully!`);
        }
    });
    
    // Delete product modal
    const deleteModal = document.getElementById('delete-modal');
    const deleteCloseBtn = deleteModal.querySelector('.close');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    let productToDelete = null;
    
    // Open delete modal
    window.openDeleteModal = function(productId) {
        productToDelete = productId;
        deleteModal.style.display = 'block';
    };
    
    // Close delete modal
    deleteCloseBtn.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });
    
    cancelDeleteBtn.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });
    
    // Confirm delete
    confirmDeleteBtn.addEventListener('click', function() {
        if (productToDelete !== null) {
            let products = JSON.parse(localStorage.getItem('products')) || [];
            const productIndex = products.findIndex(p => p.id === productToDelete);
            
            if (productIndex !== -1) {
                const productName = products[productIndex].name;
                products.splice(productIndex, 1);
                
                localStorage.setItem('products', JSON.stringify(products));
                
                // Close modal
                deleteModal.style.display = 'none';
                
                // Re-render products
                renderProducts();
                
                showNotification(`Product ${productName} deleted successfully!`);
            }
        }
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
        if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
    
    // Initial render
    renderProducts();
});
