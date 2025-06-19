document.addEventListener('DOMContentLoaded', function() {
    // CSRF token setup for AJAX requests
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    // Set up AJAX headers for CSRF protection
    function setupAjaxCsrf() {
        $.ajaxSetup({
            beforeSend: function(xhr) {
                xhr.setRequestHeader(header, token);
            }
        });
    }

    // Call the setup function
    setupAjaxCsrf();

    // ==================== ORDER STATISTICS ====================

    // Load order statistics
    function loadOrderStats() {
        // Get filter values
        const statusFilter = document.getElementById('statusFilter').value;
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;
        const paymentMethodFilter = document.getElementById('paymentMethodFilter').value;

        $.ajax({
            url: '/admin/donhang/stats',
            method: 'GET',
            data: {
                status: statusFilter,
                fromDate: fromDate,
                toDate: toDate,
                paymentMethod: paymentMethodFilter
            },
            success: function(data) {
                // Update statistics
                document.getElementById('completedOrders').textContent = data.completed || 0;
                document.getElementById('pendingOrders').textContent = data.pending || 0;
                document.getElementById('cancelledOrders').textContent = data.cancelled || 0;
            },
            error: function(err) {
                console.error('Error loading order statistics:', err);
            }
        });
    }

    // Initial load of statistics
    loadOrderStats();

    // ==================== ORDER FILTERING ====================

    // Apply filters when button is clicked
    document.getElementById('applyFilterBtn').addEventListener('click', function() {
        filterOrders(1); // Filter and go to first page
    });

    // Reset filters
    document.getElementById('resetFilterBtn').addEventListener('click', function() {
        // Clear all filter inputs
        document.getElementById('statusFilter').value = '';
        document.getElementById('fromDate').value = '';
        document.getElementById('toDate').value = '';
        document.getElementById('paymentMethodFilter').value = '';
        document.getElementById('searchOrder').value = '';

        // Apply the reset filters
        filterOrders(1);
    });

    // Search input event handler (with debounce)
    let searchTimeout;
    document.getElementById('searchOrder').addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterOrders(1);
        }, 500);
    });

    // Filter orders function
    function filterOrders(pageNo) {
        // Get filter values
        const search = document.getElementById('searchOrder').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;
        const paymentMethodFilter = document.getElementById('paymentMethodFilter').value;

        // Show loading indicator
        showLoadingIndicator();

        $.ajax({
            url: '/admin/donhang/filter',
            method: 'GET',
            data: {
                pageNo: pageNo,
                search: search,
                status: statusFilter,
                fromDate: fromDate,
                toDate: toDate,
                paymentMethod: paymentMethodFilter
            },
            success: function(data) {
                updateOrdersTable(data.content);
                updatePagination(data.totalPages, data.number + 1);
                loadOrderStats(); // Refresh stats with the filtered data

                // Hide loading indicator
                hideLoadingIndicator();

                // Show/hide empty state
                const emptyState = document.getElementById('emptyState');
                if (data.content.length === 0) {
                    emptyState.style.display = 'block';
                } else {
                    emptyState.style.display = 'none';
                }
            },
            error: function(err) {
                console.error('Error filtering orders:', err);
                hideLoadingIndicator();
            }
        });
    }

    // Update orders table with data
    function updateOrdersTable(orders) {
        const tableBody = document.querySelector('#ordersTable tbody');
        tableBody.innerHTML = '';

        orders.forEach(order => {
            const row = document.createElement('tr');

            const statusClass = getStatusClass(order.trangThai);

            // Format date
            const orderDate = new Date(order.ngayGioLapHoaDon);
            const formattedDate = orderDate.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Format currency
            const formattedTotal = new Intl.NumberFormat('vi-VN').format(order.tongTien) + ' VNĐ';

            row.innerHTML = `
                <td data-label="Mã đơn">${order.idHoaDon}</td>
                <td data-label="Khách hàng">${order.tenUser}</td>
                <td data-label="Ngày đặt">${formattedDate}</td>
                <td data-label="Tổng tiền">${formattedTotal}</td>
                <td data-label="Phương thức">${order.phuongThucThanhToan}</td>
                <td data-label="Hình thức">${order.hinhThuc}</td>
                <td data-label="Trạng thái">
                    <span class="order-status ${statusClass}">${order.trangThai}</span>
                </td>
                <td data-label="Thao tác" class="user-actions">
                    <button class="btn btn-info view-btn" data-id="${order.idHoaDon}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning edit-btn" data-id="${order.idHoaDon}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger delete-btn" data-id="${order.idHoaDon}" ${order.trangThai === 'HOÀN THÀNH' ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        // Re-attach event listeners for buttons
        attachButtonEventListeners();
    }

    // Helper function to get status CSS class
    function getStatusClass(status) {
        switch (status) {
            case 'CHỜ XÁC NHẬN': return 'status-pending';
            case 'ĐÃ XÁC NHẬN': return 'status-confirmed';
            case 'ĐANG GIAO': return 'status-delivering';
            case 'HOÀN THÀNH': return 'status-completed';
            case 'ĐÃ HỦY': return 'status-cancelled';
            default: return '';
        }
    }

    // Update pagination controls
    function updatePagination(totalPages, currentPage) {
        const pagination = document.getElementById('ordersPagination');

        // Update page info
        const pageInfo = pagination.querySelector('.users-page-info .users-page-link');
        pageInfo.innerHTML = `Trang <span>${currentPage}</span> / <span>${totalPages}</span>`;

        // Update first page button
        const firstPageBtn = pagination.querySelector('li:first-child a');
        firstPageBtn.href = `javascript:goToPage(1)`;
        firstPageBtn.parentElement.classList.toggle('disabled', currentPage === 1);

        // Update previous page button
        const prevPageBtn = pagination.querySelector('li:nth-child(2) a');
        prevPageBtn.href = `javascript:goToPage(${currentPage - 1})`;
        prevPageBtn.parentElement.classList.toggle('disabled', currentPage === 1);

        // Update next page button
        const nextPageBtn = pagination.querySelector('li:nth-child(4) a');
        nextPageBtn.href = `javascript:goToPage(${currentPage + 1})`;
        nextPageBtn.parentElement.classList.toggle('disabled', currentPage === totalPages);

        // Update last page button
        const lastPageBtn = pagination.querySelector('li:last-child a');
        lastPageBtn.href = `javascript:goToPage(${totalPages})`;
        lastPageBtn.parentElement.classList.toggle('disabled', currentPage === totalPages);
    }

    // Global function for pagination
    window.goToPage = function(pageNo) {
        filterOrders(pageNo);
    };

    // Loading indicator functions
    function showLoadingIndicator() {
        // Create loading overlay if it doesn't exist
        if (!document.getElementById('loadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(255, 255, 255, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;

            const spinner = document.createElement('div');
            spinner.style.cssText = `
                border: 5px solid #f3f3f3;
                border-top: 5px solid #4a6cf7;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
            `;

            // Add keyframes for spinner animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);

            overlay.appendChild(spinner);
            document.body.appendChild(overlay);
        } else {
            document.getElementById('loadingOverlay').style.display = 'flex';
        }
    }

    function hideLoadingIndicator() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // ==================== VIEW ORDER DETAILS ====================

    // View order modal
    const viewOrderModal = document.getElementById('viewOrderModal');

    // Open view order modal
    function openViewOrderModal(orderId) {
        showLoadingIndicator();
        console.log("Fetching order details for ID:", orderId);

        // Fetch order details
        $.ajax({
            url: `/admin/donhang/${orderId}`,
            method: 'GET',
            success: function(order) {
                console.log("Order data received:", order);
                populateOrderDetails(order);
                viewOrderModal.style.display = 'block';
                hideLoadingIndicator();
            },
            error: function(err) {
                console.error('Error fetching order details:', err);
                alert('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.');
                hideLoadingIndicator();
            }
        });
    }

    // Populate order details in the modal
    function populateOrderDetails(order) {
        // Basic order info
        document.getElementById('detailOrderId').textContent = order.idHoaDon;

        // Format date
        const orderDate = new Date(order.ngayGioLapHoaDon);
        document.getElementById('detailOrderDate').textContent = orderDate.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Status with appropriate class
        const statusElement = document.getElementById('detailOrderStatus');
        statusElement.textContent = order.trangThai;
        statusElement.className = 'order-status ' + getStatusClass(order.trangThai);

        // Customer and payment info
        document.getElementById('detailCustomerName').textContent = order.tenUser;
        document.getElementById('detailPaymentMethod').textContent = order.phuongThucThanhToan;
        document.getElementById('detailOrderType').textContent = order.hinhThuc;

        // Order items
        const itemsTableBody = document.getElementById('orderItemsTableBody');
        itemsTableBody.innerHTML = '';

        let subtotal = 0;

        // Kiểm tra và sử dụng thuộc tính đúng (products thay vì orderItems)
        const orderItems = order.products;

        orderItems.forEach((item, index) => {
            const row = document.createElement('tr');
            const itemTotal = item.giaBan * item.soLuong;
            subtotal += itemTotal;

            row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.tenMon}</td>
            <td>${item.size || '-'}</td>
            <td>${new Intl.NumberFormat('vi-VN').format(item.giaBan)} VNĐ</td>
            <td>${item.soLuong}</td>
            <td>${item.ghiChu || '-'}</td>
            <td>${new Intl.NumberFormat('vi-VN').format(itemTotal)} VNĐ</td>
        `;

            itemsTableBody.appendChild(row);
        });

        // Payment summary
        document.getElementById('detailSubtotal').textContent = new Intl.NumberFormat('vi-VN').format(subtotal) + ' VNĐ';
        document.getElementById('detailShippingFee').textContent = new Intl.NumberFormat('vi-VN').format(order.phiShip || 0) + ' VNĐ';
        document.getElementById('detailDiscount').textContent = new Intl.NumberFormat('vi-VN').format(order.giamGia || 0) + ' VNĐ';
        document.getElementById('detailPointsUsed').textContent = (order.diemSuDung || order.diemDaDung || 0) + ' điểm';
        document.getElementById('detailTotal').textContent = new Intl.NumberFormat('vi-VN').format(order.tongTien) + ' VNĐ';

        // Log xem có lỗi ở đâu
        console.log("Order details populated:", order);
    }

    // Close view order modal
    document.getElementById('closeViewBtn').addEventListener('click', function() {
        viewOrderModal.style.display = 'none';
    });

    document.getElementById('closeViewModalBtn').addEventListener('click', function() {
        viewOrderModal.style.display = 'none';
    });

    // ==================== EDIT ORDER STATUS ====================

    // Edit order modal
    const editOrderModal = document.getElementById('editOrderModal');
    let currentEditOrderId = null;

    // Open edit order modal
    function openEditOrderModal(orderId) {
        currentEditOrderId = orderId;

        // Fetch current order status
        $.ajax({
            url: `/admin/donhang/${orderId}`,
            method: 'GET',
            success: function(order) {
                document.getElementById('editOrderId').value = orderId;
                document.getElementById('editOrderStatus').value = order.trangThai;
                editOrderModal.style.display = 'block';
            },
            error: function(err) {
                console.error('Error fetching order for editing:', err);
                alert('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
            }
        });
    }

    // Close edit order modal
    document.querySelector('#editOrderModal .close-btn').addEventListener('click', function() {
        editOrderModal.style.display = 'none';
    });

    document.getElementById('cancelEditBtn').addEventListener('click', function() {
        editOrderModal.style.display = 'none';
    });

    // Submit edit order form
    document.getElementById('editOrderForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const orderId = document.getElementById('editOrderId').value;
        const newStatus = document.getElementById('editOrderStatus').value;

        // Show loading indicator
        showLoadingIndicator();

        $.ajax({
            url: `/admin/donhang/update-status`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                idHoaDon: orderId,
                trangThai: newStatus
            }),
            success: function(response) {
                hideLoadingIndicator();
                editOrderModal.style.display = 'none';
                console.log('Order status updated:', response);
                window.location.reload();
                // Show success notification
                showNotification('Cập nhật trạng thái đơn hàng thành công!', 'success');
                // Refresh orders list
                filterOrders(document.querySelector('.users-page-info .users-page-link span').textContent);
            },
            error: function(err) {
                hideLoadingIndicator();
                console.error('Error updating order status:', err);
                alert('Cập nhật trạng thái thất bại. Vui lòng thử lại sau.');
            }
        });
    });

    // ==================== DELETE ORDER ====================

    // Delete order modal
    const deleteModal = document.getElementById('deleteModal');
    let orderToDelete = null;

    // Open delete confirmation modal
    function openDeleteModal(orderId) {
        orderToDelete = orderId;
        deleteModal.style.display = 'block';
    }

    // Close delete modal
    document.getElementById('cancelDeleteBtn').addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });

    // Confirm delete
    document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
        if (!orderToDelete) return;

        // Show loading indicator
        showLoadingIndicator();

        $.ajax({
            url: `/admin/donhang/${orderToDelete}`,
            method: 'DELETE',
            success: function(response) {
                hideLoadingIndicator();
                deleteModal.style.display = 'none';
                window.location.reload();

                // Show success notification
                showNotification('Xóa đơn hàng thành công!', 'success');
                // Refresh orders list
                filterOrders(document.querySelector('.users-page-info .users-page-link span').textContent);

            },
            error: function(err) {
                hideLoadingIndicator();
                console.error('Error deleting order:', err);
                alert('Xóa đơn hàng thất bại. Vui lòng thử lại sau.');
            }
        });
    });

    // ==================== EXPORT EXCEL ====================

    // Export to Excel button
    document.getElementById('exportExcelBtn').addEventListener('click', function() {
        // Get current filter values
        const search = document.getElementById('searchOrder').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;
        const paymentMethodFilter = document.getElementById('paymentMethodFilter').value;

        // Build query string
        const queryParams = new URLSearchParams({
            search: search,
            status: statusFilter,
            fromDate: fromDate,
            toDate: toDate,
            paymentMethod: paymentMethodFilter
        }).toString();

        // Redirect to export endpoint
        window.location.href = `/admin/donhang/export?${queryParams}`;
    });

    // ==================== UTILITIES ====================

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.querySelector('.notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 1);
    }

    // Attach event listeners to action buttons
    function attachButtonEventListeners() {
        // Sử dụng event delegation cho nút xem
        $(document).on('click', '.view-btn', function() {
            const orderId = $(this).data('id');
            console.log('View button clicked for order:', orderId); // Thêm log để debug
            openViewOrderModal(orderId);
        });

        // Sử dụng event delegation cho nút sửa
        $(document).on('click', '.edit-btn', function() {
            const orderId = $(this).data('id');
            console.log('Edit button clicked for order:', orderId); // Thêm log để debug
            openEditOrderModal(orderId);
        });

        // Sử dụng event delegation cho nút xóa
        $(document).on('click', '.delete-btn', function() {
            if ($(this).prop('disabled')) return;

            const orderId = $(this).data('id');
            console.log('Delete button clicked for order:', orderId); // Thêm log để debug
            openDeleteModal(orderId);
        });
    }
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('JavaScript Error:', message, 'at', source, 'line', lineno);
        return false;
    };

    // Initial setup
    attachButtonEventListeners();

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === viewOrderModal) {
            viewOrderModal.style.display = 'none';
        } else if (event.target === editOrderModal) {
            editOrderModal.style.display = 'none';
        } else if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });

    // Initialize date pickers with today's date and 30 days before
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Format date to YYYY-MM-DD for input[type="date"]
    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    document.getElementById('fromDate').value = formatDateForInput(thirtyDaysAgo);
    document.getElementById('toDate').value = formatDateForInput(today);

    // Initial load with default filters
    filterOrders(1);
});