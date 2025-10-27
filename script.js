document.addEventListener('DOMContentLoaded', function() {
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
        } else {
            notification.classList.remove('error');
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
                document.getElementById(`${location}-${productId}`).textContent = newQuantity;
                
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
                document.getElementById(`${fromLocation}-${productId}`).textContent = products[productIndex][fromLocation];
                document.getElementById(`${toLocation}-${productId}`).textContent = products[productIndex][toLocation];
                
                // Show notification
                showNotification(`Transferred 1 ${products[productIndex].name} from ${fromLocation} to ${toLocation}!`);
            } else {
                showNotification(`No ${products[productIndex].name} available in ${fromLocation}!`, true);
            }
        }
    };
    
    // Initial render
    renderProducts();
});
