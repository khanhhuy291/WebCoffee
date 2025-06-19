document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    let ordersData = [];
    let filteredData = [];
    let currentOrderId = null;
    let pendingStatusChange = null;

    // CSRF protection (if using Spring Security)
    const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

    // DOM Elements
    const ordersTable = document.getElementById('ordersTable');
    const ordersList = document.getElementById('ordersList');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const refreshBtn = document.getElementById('refreshBtn');

    // Modals
    const orderDetailModal = document.getElementById('orderDetailModal');
    const confirmModal = document.getElementById('confirmModal');

    // Toast
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const closeToast = document.getElementById('close-toast');

    // ===== Initialize =====
    fetchOrders();
    setupEventListeners();

    // ===== API Functions =====

    // Fetch all orders
    function fetchOrders() {
        showLoadingState();

        // This would be an API call in a real application
        // For demo purposes, we'll generate sample data
        setTimeout(() => {
            // Generate sample data
            ordersData = generateSampleOrders(25);
            filteredData = [...ordersData];

            renderOrders();
            setupPagination();
            hideLoadingState();
        }, 500);

        // In a real application, you would fetch from your API:
        /*
        fetch('/api/orders', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                [csrfHeader]: csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            ordersData = data;
            filteredData = [...ordersData];
            renderOrders();
            setupPagination();
            hideLoadingState();
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            showNotification('Lỗi khi tải dữ liệu hóa đơn', 'error');
            hideLoadingState();
        });
        */
    }

    // Get order details
    function getOrderDetails(orderId) {
        showLoadingState();

        // Find order in existing data
        const order = ordersData.find(o => o.id === orderId);

        if (order) {
            displayOrderDetails(order);
            hideLoadingState();
        } else {
            showNotification('Không tìm thấy thông tin hóa đơn', 'error');
            hideLoadingState();
        }

        // In a real application, you might fetch more detailed data:
        /*
        fetch(`/api/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                [csrfHeader]: csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayOrderDetails(data);
            hideLoadingState();
        })
        .catch(error => {
            console.error('Error fetching order details:', error);
            showNotification('Lỗi khi tải chi tiết hóa đơn', 'error');
            hideLoadingState();
        });
        */
    }

    // Update order status
    function updateOrderStatus(orderId, newStatus) {
        showLoadingState();

        // In a demo, just update the local data
        const orderIndex = ordersData.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            // Update the order status
            ordersData[orderIndex].trangThai = newStatus;

            // Also update in filtered data if it exists there
            const filteredIndex = filteredData.findIndex(o => o.id === orderId);
            if (filteredIndex !== -1) {
                filteredData[filteredIndex].trangThai = newStatus;
            }

            renderOrders();
            displayOrderDetails(ordersData[orderIndex]);
            hideLoadingState();
            showNotification(`Đã cập nhật trạng thái đơn hàng thành ${newStatus}`, 'success');
        } else {
            showNotification('Không tìm thấy đơn hàng để cập nhật', 'error');
            hideLoadingState();
        }

        // In a real application, you would update via API:
        /*
        fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                [csrfHeader]: csrfToken
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update local data
            const orderIndex = ordersData.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                ordersData[orderIndex] = data;
            }

            // Update filtered data
            const filteredIndex = filteredData.findIndex(o => o.id === orderId);
            if (filteredIndex !== -1) {
                filteredData[filteredIndex] = data;
            }

            renderOrders();
            if (orderDetailModal.style.display === 'block') {
                displayOrderDetails(data);
            }

            hideLoadingState();
            showNotification(`Đã cập nhật trạng thái đơn hàng thành ${newStatus}`, 'success');
        })
        .catch(error => {
            console.error('Error updating order status:', error);
            showNotification('Lỗi khi cập nhật trạng thái đơn hàng', 'error');
            hideLoadingState();
        });
        */
    }

    // ===== UI Functions =====

    // Apply filters
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedStatus = statusFilter.value;
        const selectedDate = dateFilter.value;

        filteredData = ordersData.filter(order => {
            // Filter by search term (ID, payment method)
            const matchesSearch = searchTerm === '' ||
                order.id.toString().includes(searchTerm) ||
                (order.phuongThucThanhToan && order.phuongThucThanhToan.toLowerCase().includes(searchTerm));

            // Filter by status
            const matchesStatus = selectedStatus === '' || order.trangThai === selectedStatus;

            // Filter by date
            let matchesDate = true;
            if (selectedDate) {
                const orderDate = new Date(order.ngayGioLapHoaDon);
                const filterDate = new Date(selectedDate);

                matchesDate = orderDate.getFullYear() === filterDate.getFullYear() &&
                    orderDate.getMonth() === filterDate.getMonth() &&
                    orderDate.getDate() === filterDate.getDate();
            }

            return matchesSearch && matchesStatus && matchesDate;
        });

        currentPage = 1;
        renderOrders();
        setupPagination();
    }

    // Render orders table
    function renderOrders() {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        // Clear orders list
        ordersList.innerHTML = '';

        // Show empty state if no data
        if (paginatedData.length === 0) {
            ordersTable.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        ordersTable.style.display = 'table';
        emptyState.style.display = 'none';

        // Generate rows for each order
        paginatedData.forEach(order => {
            const row = document.createElement('tr');

            // Create status badge
            const statusClass = getStatusClass(order.trangThai);

            // Format date
            const orderDate = new Date(order.ngayGioLapHoaDon);
            const formattedDate = formatDate(orderDate);

            // Count products
            const productCount = order.products ? order.products.length : 0;

            row.innerHTML = `
                <td>${order.id}</td>
                <td>${formattedDate}</td>
                <td>${formatCurrency(order.giamGia || 0)}</td>
                <td>${order.phuongThucThanhToan || 'Chưa có thông tin'}</td>
                <td>
                    <span class="status-badge ${statusClass}">${order.trangThai}</span>
                </td>
                <td>${productCount}</td>
                <td>
                    <button class="action-btn btn-view view-order" data-id="${order.id}">
                        <i class="fas fa-eye"></i> Xem
                    </button>
                </td>
            `;

            ordersList.appendChild(row);
        });

        // Add event listeners for view buttons
        document.querySelectorAll('.view-order').forEach(button => {
            button.addEventListener('click', () => {
                const orderId = button.getAttribute('data-id');
                currentOrderId = orderId;
                getOrderDetails(orderId);
            });
        });
    }

    // Display order details in modal
    function displayOrderDetails(order) {
        // Set order details
        document.getElementById('orderIdDetail').textContent = order.id;
        document.getElementById('orderDate').textContent = formatDate(new Date(order.ngayGioLapHoaDon));
        document.getElementById('orderPaymentMethod').textContent = order.phuongThucThanhToan || 'Chưa có thông tin';

        const statusBadge = document.getElementById('orderStatus');
        statusBadge.textContent = order.trangThai;
        statusBadge.className = 'status-badge ' + getStatusClass(order.trangThai);

        document.getElementById('orderDiscount').textContent = formatCurrency(order.giamGia || 0);

        // Populate products table
        const productsList = document.getElementById('productsList');
        productsList.innerHTML = '';

        let subtotal = 0;

        if (order.products && order.products.length > 0) {
            order.products.forEach(item => {
                const product = item.product;
                const quantity = item.soLuong;
                const price = product.giaBan;
                const total = price * quantity;
                subtotal += total;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.tenMon}</td>
                                        <td>${product.loaiMon || 'Chưa phân loại'}</td>
                    <td>${formatCurrency(price)}</td>
                    <td>${quantity}</td>
                    <td class="text-right">${formatCurrency(total)}</td>
                `;
                productsList.appendChild(row);
            });
        } else {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="5" style="text-align: center;">Không có sản phẩm</td>';
            productsList.appendChild(emptyRow);
        }

        // Calculate and display totals
        const discount = order.giamGia || 0;
        const finalTotal = subtotal - discount;

        document.getElementById('orderTotal').textContent = formatCurrency(subtotal);
        document.getElementById('totalDiscount').textContent = formatCurrency(discount);
        document.getElementById('finalTotal').textContent = formatCurrency(finalTotal);

        // Show modal
        orderDetailModal.style.display = 'block';

        // Update status button states
        updateStatusButtons(order.trangThai);
    }

    // Show loading state for table
    function showLoadingState() {
        ordersList.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #007bff;"></i>
                    <p style="margin-top: 10px;">Đang tải dữ liệu...</p>
                </td>
            </tr>
        `;
    }

    // Hide loading state
    function hideLoadingState() {
        // Loading is handled by renderOrders
    }

    // Setup pagination
    function setupPagination() {
        const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
        pagination.innerHTML = '';

        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';

        // Previous button
        if (currentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.innerHTML = '&laquo;';
            prevButton.addEventListener('click', () => {
                currentPage--;
                renderOrders();
                setupPagination();
            });
            pagination.appendChild(prevButton);
        }

        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;

            if (i === currentPage) {
                pageButton.classList.add('active');
            }

            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderOrders();
                setupPagination();
            });

            pagination.appendChild(pageButton);
        }

        // Next button
        if (currentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.innerHTML = '&raquo;';
            nextButton.addEventListener('click', () => {
                currentPage++;
                renderOrders();
                setupPagination();
            });
            pagination.appendChild(nextButton);
        }
    }

    // Update status buttons based on current status
    function updateStatusButtons(status) {
        const btnPending = document.getElementById('btnPendingConfirmation');
        const btnConfirmed = document.getElementById('btnConfirmed');
        const btnDelivered = document.getElementById('btnDelivered');
        const btnCancel = document.getElementById('btnCancel');

        // Reset all buttons
        [btnPending, btnConfirmed, btnDelivered, btnCancel].forEach(btn => {
            btn.disabled = false;
        });

        // Disable the button for current status
        switch (status) {
            case 'Đang đợi xác nhận':
                btnPending.disabled = true;
                break;
            case 'Đã xác nhận':
                btnConfirmed.disabled = true;
                break;
            case 'Đã giao hàng':
                btnDelivered.disabled = true;
                // Cannot change status after delivery
                btnPending.disabled = true;
                btnConfirmed.disabled = true;
                break;
            case 'Đã hủy':
                // Cannot change status after cancellation
                btnPending.disabled = true;
                btnConfirmed.disabled = true;
                btnDelivered.disabled = true;
                btnCancel.disabled = true;
                break;
        }
    }

    // Show notification toast
    function showNotification(message, type = 'info') {
        toastMessage.textContent = message;
        toast.className = `toast ${type} show`;

        // Auto hide after 5 seconds
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 5000);
    }

    // Show confirmation modal
    function showConfirmModal(message, callback) {
        document.getElementById('confirmMessage').textContent = message;
        confirmModal.style.display = 'block';

        // Store callback
        pendingStatusChange = callback;
    }

    // Format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    // Format date
    function formatDate(date) {
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    // Get status badge class
    function getStatusClass(status) {
        switch (status) {
            case 'Đang đợi xác nhận':
                return 'status-pending';
            case 'Đã xác nhận':
                return 'status-confirmed';
            case 'Đã giao hàng':
                return 'status-delivered';
            case 'Đã hủy':
                return 'status-cancelled';
            default:
                return '';
        }
    }

    // Generate sample data for demo
    function generateSampleOrders(count) {
        const statuses = ['Đang đợi xác nhận', 'Đã xác nhận', 'Đã giao hàng', 'Đã hủy'];
        const paymentMethods = ['Tiền mặt', 'Chuyển khoản', 'Ví điện tử', 'Thẻ tín dụng'];

        const sampleOrders = [];

        for (let i = 1; i <= count; i++) {
            // Generate a random date within the last 30 days
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));

            // Random products
            const productCount = Math.floor(Math.random() * 5) + 1;
            const products = [];

            for (let j = 1; j <= productCount; j++) {
                const price = Math.floor(Math.random() * 100000) + 20000;
                const quantity = Math.floor(Math.random() * 5) + 1;

                products.push({
                    product: {
                        id: j,
                        tenMon: `Món ăn mẫu ${j}`,
                        loaiMon: j % 2 === 0 ? 'Món chính' : 'Món phụ',
                        giaBan: price,
                        moTa: 'Mô tả món ăn mẫu',
                        path: `/images/sample-${j}.jpg`
                    },
                    soLuong: quantity,
                    ghiChu: null
                });
            }

            // Create order
            sampleOrders.push({
                id: 1000 + i,
                ngayGioLapHoaDon: date,
                giamGia: Math.floor(Math.random() * 50000),
                phuongThucThanhToan: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                trangThai: statuses[Math.floor(Math.random() * statuses.length)],
                products: products
            });
        }

        return sampleOrders;
    }

    // ===== Event Listeners =====
    function setupEventListeners() {
        // Filter events
        searchInput.addEventListener('input', applyFilters);
        statusFilter.addEventListener('change', applyFilters);
        dateFilter.addEventListener('change', applyFilters);

        // Refresh button
        refreshBtn.addEventListener('click', () => {
            // Reset filters
            searchInput.value = '';
            statusFilter.value = '';
            dateFilter.value = '';

            // Fetch orders again
            fetchOrders();
            showNotification('Dữ liệu đã được làm mới');
        });

        // Close order detail modal
        document.querySelector('#orderDetailModal .close-btn').addEventListener('click', () => {
            orderDetailModal.style.display = 'none';
        });

        document.getElementById('closeOrderDetailBtn').addEventListener('click', () => {
            orderDetailModal.style.display = 'none';
        });

        // Close toast
        closeToast.addEventListener('click', () => {
            toast.className = toast.className.replace('show', '');
        });

        // Status change buttons
        document.getElementById('btnPendingConfirmation').addEventListener('click', () => {
            if (currentOrderId) {
                showConfirmModal('Bạn có chắc chắn muốn chuyển trạng thái đơn hàng này thành "Đang đợi xác nhận"?',
                    () => updateOrderStatus(currentOrderId, 'Đang đợi xác nhận'));
            }
        });

        document.getElementById('btnConfirmed').addEventListener('click', () => {
            if (currentOrderId) {
                showConfirmModal('Bạn có chắc chắn muốn xác nhận đơn hàng này?',
                    () => updateOrderStatus(currentOrderId, 'Đã xác nhận'));
            }
        });

        document.getElementById('btnDelivered').addEventListener('click', () => {
            if (currentOrderId) {
                showConfirmModal('Bạn có chắc chắn muốn chuyển trạng thái đơn hàng này thành "Đã giao hàng"?',
                    () => updateOrderStatus(currentOrderId, 'Đã giao hàng'));
            }
        });

        document.getElementById('btnCancel').addEventListener('click', () => {
            if (currentOrderId) {
                showConfirmModal('Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.',
                    () => updateOrderStatus(currentOrderId, 'Đã hủy'));
            }
        });

        // Confirmation modal events
        document.getElementById('cancelConfirmBtn').addEventListener('click', () => {
            confirmModal.style.display = 'none';
            pendingStatusChange = null;
        });

        document.getElementById('confirmActionBtn').addEventListener('click', () => {
            confirmModal.style.display = 'none';
            if (pendingStatusChange) {
                pendingStatusChange();
                pendingStatusChange = null;
            }
        });

        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === orderDetailModal) {
                orderDetailModal.style.display = 'none';
            }
            if (event.target === confirmModal) {
                confirmModal.style.display = 'none';
                pendingStatusChange = null;
            }
        });

        // Toggle submenu on orders menu item
        document.getElementById('orders-menu').addEventListener('click', function(event) {
            event.preventDefault();
            const submenu = document.getElementById('orders-submenu');
            if (submenu.style.display === 'block') {
                submenu.style.display = 'none';
            } else {
                submenu.style.display = 'block';
            }
        });
    }
});