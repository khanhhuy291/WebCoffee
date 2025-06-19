document.addEventListener('DOMContentLoaded', function() {
    // Lấy token CSRF từ meta tags
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    // Các elements cần thiết
    const userModal = document.getElementById('userModal');
    const userDetailsModal = document.getElementById('userDetailsModal');
    const deleteModal = document.getElementById('deleteModal');
    const userForm = document.getElementById('userForm');
    const openAddModalBtn = document.getElementById('openAddModal');
    const closeButtons = document.querySelectorAll('.close-btn');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeViewBtn = document.getElementById('closeViewBtn');
    const roleFilter = document.getElementById('roleFilter');
    const searchInput = document.getElementById('searchInput');
    const usersTable = document.getElementById('usersTable');
    const emptyState = document.getElementById('emptyState');
    const notificationElement = document.getElementById('notification');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const paginationElement = document.getElementById('pagination');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // Biến lưu trữ
    let currentPage = 1;
    let currentDeleteId = null;
    const itemsPerPage = 10;
    let userData = [];

    // Khởi tạo dữ liệu người dùng từ bảng hiện tại
    initializeUserData();

    // Xử lý sự kiện khi mở modal thêm người dùng
    openAddModalBtn.addEventListener('click', function() {
        resetForm();
        document.getElementById('modalTitle').textContent = 'Thêm Người Dùng';
        document.getElementById('passwordRequired').textContent = '*';
        document.getElementById('password').setAttribute('required', 'required');
        userForm.setAttribute('action', '/admin/users/add');
        userModal.style.display = 'block';
    });

    // Xử lý sự kiện đóng các modal
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            userModal.style.display = 'none';
            userDetailsModal.style.display = 'none';
            deleteModal.style.display = 'none';
        });
    });

    cancelBtn.addEventListener('click', function() {
        userModal.style.display = 'none';
    });

    closeViewBtn.addEventListener('click', function() {
        userDetailsModal.style.display = 'none';
    });

    cancelDeleteBtn.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });

    // Sự kiện Tabs trong modal xem chi tiết
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');

            // Gỡ bỏ class active từ tất cả tabs và tab contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Thêm class active cho tab và tab content được chọn
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Nếu tab là lịch sử đơn hàng và đang mở chi tiết người dùng
            if (tabId === 'userOrders' && userDetailsModal.style.display === 'block') {
                const userId = document.getElementById('detailsId').textContent;
                loadUserOrders(userId);
            }
        });
    });

    // Xử lý sự kiện nút Edit
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-btn')) {
            const button = e.target.closest('.edit-btn');
            const userId = button.getAttribute('data-id');
            const name = button.getAttribute('data-name');
            const gender = button.getAttribute('data-gender');
            const address = button.getAttribute('data-address');
            const phone = button.getAttribute('data-phone');
            const email = button.getAttribute('data-email');
            const username = button.getAttribute('data-username');
            const points = button.getAttribute('data-points');
            const roles = button.getAttribute('data-roles');

            document.getElementById('modalTitle').textContent = 'Chỉnh Sửa Người Dùng';
            document.getElementById('userId').value = userId;
            document.getElementById('hoTen').value = name;
            document.getElementById('gioiTinh').value = gender || 'Nam';
            document.getElementById('diaChi').value = address || '';
            document.getElementById('sdt').value = phone || '';
            document.getElementById('email').value = email || '';
            document.getElementById('username').value = username || '';
            document.getElementById('diemTichLuy').value = points || '0';

            // Reset roles
            document.querySelectorAll('input[name="roles"]').forEach(checkbox => {
                checkbox.checked = false;
            });

            // Set roles từ data attribute
            if (roles) {
                const rolesArray = roles.split(',');
                rolesArray.forEach(role => {
                    const checkbox = document.querySelector(`input[name="roles"][value="${role.trim()}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }

            // Mật khẩu không bắt buộc khi chỉnh sửa
            document.getElementById('passwordRequired').textContent = '';
            document.getElementById('password').removeAttribute('required');

            // Đổi action của form
            userForm.setAttribute('action', '/admin/users/update');
            userModal.style.display = 'block';
        }
    });

    // Xử lý sự kiện nút Delete
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-btn')) {
            const button = e.target.closest('.delete-btn');
            const userId = button.getAttribute('data-id');
            currentDeleteId = userId;
            deleteModal.style.display = 'block';
        }
    });

    // Xử lý sự kiện khi xác nhận xoá
    confirmDeleteBtn.addEventListener('click', function() {
        if (currentDeleteId) {
            deleteUser(currentDeleteId);
            deleteModal.style.display = 'none';
        }
    });

    // Xử lý sự kiện nút View
    document.addEventListener('click', function(e) {
        if (e.target.closest('.view-btn')) {
            const button = e.target.closest('.view-btn');
            const userId = button.getAttribute('data-id');
            showUserDetails(userId);
        }
    });

    // Xử lý sự kiện bộ lọc và tìm kiếm
    roleFilter.addEventListener('change', filterUsers);
    searchInput.addEventListener('input', filterUsers);

    // Khởi tạo data từ bảng
    function initializeUserData() {
        userData = [];
        const rows = usersTable.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const id = row.querySelector('td[data-label="ID"]').textContent;
            const name = row.querySelector('td[data-label="Họ Tên"]').textContent;
            const username = row.querySelector('td[data-label="Username"]').textContent;
            const email = row.querySelector('td[data-label="Email"]').textContent;
            const phone = row.querySelector('td[data-label="Số điện thoại"]').textContent;
            const points = row.querySelector('td[data-label="Điểm tích lũy"]').textContent;
            const roles = row.getAttribute('data-roles');

            userData.push({
                id, name, username, email, phone, points, roles,
                element: row
            });
        });

        updateTable();
    }

    // Lọc người dùng
    function filterUsers() {
        const roleValue = roleFilter.value;
        const searchValue = searchInput.value.toLowerCase();

        const filteredUsers = userData.filter(user => {
            // Kiểm tra xem vai trò có khớp không, bỏ qua tiền tố "ROLE_" nếu có
            const matchesRole = !roleValue || (user.roles && (
                user.roles.includes(roleValue) ||
                user.roles.includes(roleValue.replace('ROLE_', '')) ||
                user.roles.includes('ROLE_' + roleValue.replace('ROLE_', ''))
            ));

            const matchesSearch = !searchValue ||
                user.name.toLowerCase().includes(searchValue) ||
                user.email.toLowerCase().includes(searchValue) ||
                user.username.toLowerCase().includes(searchValue) ||
                user.phone.toLowerCase().includes(searchValue);

            return matchesRole && matchesSearch;
        });

        // Cập nhật hiển thị
        currentPage = 1;
        updateFilteredTable(filteredUsers);
    }


    // Cập nhật bảng sau khi lọc
    function updateFilteredTable(filteredUsers) {
        // Ẩn tất cả rows
        userData.forEach(user => {
            user.element.style.display = 'none';
        });

        // Hiển thị rows đã lọc
        if (filteredUsers.length > 0) {
            emptyState.style.display = 'none';

            // Tính toán phân trang
            const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, filteredUsers.length);

            // Hiển thị rows của trang hiện tại
            for (let i = startIndex; i < endIndex; i++) {
                filteredUsers[i].element.style.display = '';
            }

            // Cập nhật phân trang
            updatePagination(totalPages);
        } else {
            // Hiển thị trạng thái trống
            emptyState.style.display = 'block';
            paginationElement.innerHTML = '';
        }
    }

    // Cập nhật bảng
    function updateTable() {
        updateFilteredTable(userData);
    }

    // Tạo UI phân trang
    function updatePagination(totalPages) {
        paginationElement.innerHTML = '';

        if (totalPages <= 1) return;

        // Nút trang trước
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.classList.add('pagination-btn');
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateTable();
            }
        });
        paginationElement.appendChild(prevButton);

        // Các nút số trang
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.add('pagination-btn');
            if (i === currentPage) pageButton.classList.add('active');

            pageButton.addEventListener('click', () => {
                currentPage = i;
                updateTable();
            });

            paginationElement.appendChild(pageButton);
        }

        // Nút trang sau
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.classList.add('pagination-btn');
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                updateTable();
            }
        });
        paginationElement.appendChild(nextButton);
    }

    // Reset form khi thêm mới
    function resetForm() {
        userForm.reset();
        document.getElementById('userId').value = '';
        document.getElementById('hoTen').value = '';
        document.getElementById('email').value = '';
        document.getElementById('sdt').value = '';
        document.getElementById('diaChi').value = '';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('diemTichLuy').value = '0';

        // Reset checkboxes
        document.querySelectorAll('input[name="roles"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Default role là USER
        document.querySelector('input[name="roles"][value="ROLE_USER"]').checked = true;
    }

    // Hiển thị chi tiết người dùng
    function showUserDetails(userId) {
        // Tìm user trong data
        const user = userData.find(u => u.id === userId);
        if (!user) return;

        const row = user.element;
        const editBtn = row.querySelector('.edit-btn');

        // Lấy thông tin từ data attributes của nút edit
        const name = editBtn.getAttribute('data-name') || '';
        const gender = editBtn.getAttribute('data-gender') || '';
        const address = editBtn.getAttribute('data-address') || '';
        const phone = editBtn.getAttribute('data-phone') || '';
        const email = editBtn.getAttribute('data-email') || '';
        const username = editBtn.getAttribute('data-username') || '';
        const points = editBtn.getAttribute('data-points') || '0';
        const roles = editBtn.getAttribute('data-roles') || '';

        // Điền thông tin vào modal
        document.getElementById('detailsId').textContent = userId;
        document.getElementById('detailsName').textContent = name;
        document.getElementById('detailsGender').textContent = gender || 'Không xác định';
        document.getElementById('detailsAddress').textContent = address || 'Chưa cập nhật';
        document.getElementById('detailsPhone').textContent = phone || 'Chưa cập nhật';
        document.getElementById('detailsEmail').textContent = email || 'Chưa cập nhật';
        document.getElementById('detailsUsername').textContent = username || 'Chưa cập nhật';
        document.getElementById('detailsPoints').textContent = points || '0';

        // Hiển thị vai trò
        const rolesContainer = document.getElementById('detailsRoles');
        rolesContainer.innerHTML = '';

        if (roles) {
            const rolesArray = roles.split(',');
            rolesArray.forEach(role => {
                const roleSpan = document.createElement('span');
                const roleName = role.trim().replace('ROLE_', '');
                roleSpan.textContent = roleName;
                roleSpan.classList.add('badge');

                if (role.includes('ADMIN')) {
                    roleSpan.classList.add('badge-admin');
                } else if (role.includes('STAFF')) {
                    roleSpan.classList.add('badge-staff');
                } else {
                    roleSpan.classList.add('badge-user');
                }

                rolesContainer.appendChild(roleSpan);
                rolesContainer.appendChild(document.createTextNode(' '));
            });
        } else {
            rolesContainer.textContent = 'Không có vai trò';
        }

        // Reset tab
        document.querySelector('.tab.active').classList.remove('active');
        document.querySelector('.tab-content.active').classList.remove('active');
        document.querySelector('.tab[data-tab="userInfo"]').classList.add('active');
        document.getElementById('userInfo').classList.add('active');

        // Hiển thị modal
        userDetailsModal.style.display = 'block';

        // Load đơn hàng nếu cần
        loadUserOrders(userId);
    }

    // Load lịch sử đơn hàng của người dùng
    function loadUserOrders(userId) {
        const ordersContainer = document.getElementById('ordersList');

        // Hiển thị loading
        ordersContainer.innerHTML = '<div class="loading-indicator">Đang tải dữ liệu...</div>';

        // Gọi API để lấy đơn hàng của người dùng
        fetch(`/api/users/${userId}/orders`, {
            headers: {
                [header]: token
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể tải dữ liệu đơn hàng');
                }
                return response.json();
            })
            .then(orders => {
                if (orders.length === 0) {
                    ordersContainer.innerHTML = `
                    <div class="empty-orders">
                        <i class="fas fa-shopping-cart"></i>
                        <p>Người dùng chưa có đơn hàng nào</p>
                    </div>
                `;
                    return;
                }

                // Hiển thị danh sách đơn hàng
                ordersContainer.innerHTML = '';
                orders.forEach(order => {
                    const orderElement = document.createElement('div');
                    orderElement.classList.add('order-item');

                    orderElement.innerHTML = `
                    <div class="order-header">
                        <div>
                            <span class="order-id">Đơn hàng #${order.id}</span>
                            <span class="order-date">${formatDate(order.ngayDatHang)}</span>
                        </div>
                        <div>
                            <span class="order-status ${getStatusClass(order.trangThai)}">${order.trangThai}</span>
                            <span class="order-total">${formatCurrency(order.tongTien)}</span>
                        </div>
                    </div>
                    <div class="order-details">
                        <div class="order-address">
                            <strong>Địa chỉ nhận hàng:</strong> ${order.diaChiGiaoHang || 'Không có'}
                        </div>
                        <div class="order-products">
                            <strong>Sản phẩm:</strong> 
                            ${order.chiTietDonHang.map(item => `
                                ${item.sanPham.tenSanPham} x${item.soLuong} (${formatCurrency(item.giaBan)})
                            `).join(', ')}
                        </div>
                    </div>
                `;

                    ordersContainer.appendChild(orderElement);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                ordersContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Đã xảy ra lỗi khi tải dữ liệu đơn hàng</p>
                </div>
            `;
            });
    }

    // Xóa người dùng
    function deleteUser(userId) {
        fetch(`/admin/users/delete/${userId}`, {
            method: 'POST',
            headers: {
                [header]: token
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể xóa người dùng');
                }
                return response.text();
            })
            .then(() => {
                // Xóa người dùng khỏi DOM
                const userIndex = userData.findIndex(user => user.id === userId);
                if (userIndex !== -1) {
                    userData.splice(userIndex, 1);
                }

                // Hiển thị thông báo thành công
                showNotification('Xóa người dùng thành công');

                // Cập nhật bảng
                updateTable();
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Đã xảy ra lỗi khi xóa người dùng', 'error');
            });
    }

    // Hiển thị thông báo
    function showNotification(message, type = 'success') {
        if (!notificationElement) return;

        notificationElement.textContent = message;
        notificationElement.className = 'notification ' + type;
        notificationElement.style.display = 'block';

        // Tự động ẩn sau 5 giây
        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 5000);
    }

    // Thay đổi: Không dùng form submission nữa, sử dụng AJAX thay thế
    userForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Ngăn form submit thông thường

        // Kiểm tra vai trò
        const roleCheckboxes = document.querySelectorAll('input[name="roles"]:checked');
        if (roleCheckboxes.length === 0) {
            showNotification('Vui lòng chọn ít nhất một vai trò cho người dùng', 'error');
            return;
        }

        // Kiểm tra mật khẩu nếu đang thêm mới
        const isAdding = !document.getElementById('userId').value;
        const password = document.getElementById('password').value;
        if (isAdding && !password) {
            showNotification('Vui lòng nhập mật khẩu cho người dùng mới', 'error');
            return;
        }

        // Tạo đối tượng dữ liệu
        const formData = {
            id: document.getElementById('userId').value || null,
            hoTen: document.getElementById('hoTen').value,
            gioiTinh: document.getElementById('gioiTinh').value,
            email: document.getElementById('email').value,
            sdt: document.getElementById('sdt').value,
            diaChi: document.getElementById('diaChi').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            diemTichLuy: document.getElementById('diemTichLuy').value,
            roles: Array.from(roleCheckboxes).map(cb => cb.value)
        };

        // Kiểm tra xem đang thêm mới hay cập nhật
        const url = userForm.getAttribute('action');

        console.log('Gửi dữ liệu đến:', url);
        console.log('Dữ liệu:', formData);

        // Gửi request
        // Thay thế đoạn code fetch request trong file JavaScript
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [header]: token
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                // Kiểm tra nếu response không OK
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Lỗi khi gửi dữ liệu: ' + response.status);
                    });
                }
                // Nếu ok, parse response dưới dạng JSON
                return response.json();
            })
            .then(data => {
                console.log('Server response:', data);

                // Đóng modal
                userModal.style.display = 'none';

                // Hiển thị thông báo thành công
                showNotification(data.message || 'Thao tác thành công!');

                // Tải lại trang sau 1 giây
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu', 'error');
            });
    });

    // Hàm hỗ trợ
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    function getStatusClass(status) {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'PROCESSING': return 'status-processing';
            case 'SHIPPED': return 'status-shipped';
            case 'DELIVERED': return 'status-delivered';
            case 'CANCELLED': return 'status-cancelled';
            default: return '';
        }
    }

    // Đóng modals khi click bên ngoài
    window.addEventListener('click', function(e) {
        if (e.target === userModal) {
            userModal.style.display = 'none';
        }
        if (e.target === userDetailsModal) {
            userDetailsModal.style.display = 'none';
        }
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });

    // Hiển thị thông báo nếu có
    if (notificationElement && notificationElement.textContent.trim() !== '') {
        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 5000);
    }
});