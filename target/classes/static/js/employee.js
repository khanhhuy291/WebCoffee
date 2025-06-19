document.addEventListener('DOMContentLoaded', function() {
    // Token CSRF
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    // Elements
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
    const paginationElement = document.getElementById('usersPagination');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // Lấy trang từ URL
    function getPageFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('pageNo');
        const pageNumber = page && !isNaN(parseInt(page)) ? parseInt(page) : 1;
        console.log("Lấy trang từ URL:", pageNumber);
        return pageNumber;
    }

    // Khởi tạo biến
    let currentPage = getPageFromUrl();
    console.log("Khởi tạo trang hiện tại:", currentPage);

    // Các biến khác
    let currentDeleteId = null;
    const itemsPerPage = 10;
    let userData = [];
    let totalServerPages = 1;

    // Flag để nhận biết trạng thái khởi tạo ban đầu
    let initializing = true;
    // Flag để theo dõi xem có đang lọc hay không
    let isFiltering = false;

    // Khởi tạo
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

    // Đóng modals
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

    // Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            if (tabId === 'userOrders' && userDetailsModal.style.display === 'block') {
                const userId = document.getElementById('detailsId').textContent;
                loadUserOrders(userId);
            }
        });
    });

    // Xử lý nút Edit
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

            // Set roles
            if (roles) {
                const rolesArray = roles.split(',');
                rolesArray.forEach(role => {
                    const checkbox = document.querySelector(`input[name="roles"][value="${role.trim()}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }

            document.getElementById('passwordRequired').textContent = '';
            document.getElementById('password').removeAttribute('required');

            userForm.setAttribute('action', '/admin/users/add');
            userModal.style.display = 'block';
        }
    });

    // Xử lý nút Delete
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-btn')) {
            const button = e.target.closest('.delete-btn');
            const userId = button.getAttribute('data-id');
            currentDeleteId = userId;
            deleteModal.style.display = 'block';
        }
    });

    // Xác nhận xóa
    confirmDeleteBtn.addEventListener('click', function() {
        if (currentDeleteId) {
            deleteUser(currentDeleteId);
            deleteModal.style.display = 'none';
        }
    });

    // Xử lý nút View
    document.addEventListener('click', function(e) {
        if (e.target.closest('.view-btn')) {
            const button = e.target.closest('.view-btn');
            const userId = button.getAttribute('data-id');
            showUserDetails(userId);
        }
    });

    // Lọc và tìm kiếm
    roleFilter.addEventListener('change', function() {
        // Cập nhật flag lọc
        isFiltering = this.value !== '';

        // Chỉ reset trang khi có giá trị lọc
        if (isFiltering) {
            currentPage = 1;
        }
        filterUsers();
    });

    searchInput.addEventListener('input', function() {
        // Cập nhật flag lọc
        isFiltering = this.value.trim() !== '';

        // Chỉ reset trang khi có giá trị tìm kiếm
        if (isFiltering) {
            currentPage = 1;
        }
        filterUsers();
    });

    // Khởi tạo dữ liệu
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

        // Lấy tổng số trang từ HTML
        const paginationInfo = paginationElement?.querySelector('.users-page-info .users-page-link');
        if (paginationInfo) {
            const pageInfoText = paginationInfo.textContent;
            const matches = pageInfoText.match(/Trang\s+(\d+)\s+\/\s+(\d+)/);
            if (matches && matches.length >= 3) {
                totalServerPages = parseInt(matches[2]) || 1;
                console.log(`Đã lấy từ HTML: totalPages=${totalServerPages}`);
            }
        }

        // Trong quá trình khởi tạo, không áp dụng lọc
        isFiltering = false;

        // Khi khởi tạo, chỉ hiển thị tất cả người dùng đã tải từ server
        showInitialServerData();

        // Đánh dấu hoàn thành khởi tạo
        initializing = false;
    }

    // Hàm mới: hiển thị dữ liệu ban đầu đã được tải từ server
    function showInitialServerData() {
        console.log("updateTable (initial): currentPage =", currentPage);

        // Khi trang web mới tải, người dùng đã được hiển thị theo phân trang từ server
        // Chỉ đảm bảo rằng các phần tử UI được cập nhật chính xác
        emptyState.style.display = 'none';

        // Đảm bảo tất cả các hàng đều được hiển thị (server đã xử lý phân trang)
        userData.forEach(user => {
            user.element.style.display = '';
        });

        // Cập nhật phân trang dựa trên giá trị từ server
        console.log("Trước updatePagination (initial): currentPage =", currentPage);
        updatePagination(totalServerPages, currentPage);
    }

    // Lọc người dùng
    function filterUsers() {
        const roleValue = roleFilter.value;
        const searchValue = searchInput.value.toLowerCase();

        const filteredUsers = userData.filter(user => {
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

            // Tính toán tổng số trang dựa trên dữ liệu đã lọc
            const totalFilteredPages = Math.ceil(filteredUsers.length / itemsPerPage);
            let effectiveTotalPages = totalFilteredPages;

            // Nếu không lọc và có giá trị tổng trang từ server, sử dụng giá trị từ server
            if (!isFiltering && totalServerPages > 0) {
                effectiveTotalPages = totalServerPages;
                console.log("Sử dụng tổng số trang từ server:", effectiveTotalPages);
            }

            // Kiểm tra giới hạn trang
            if (isFiltering && currentPage > totalFilteredPages) {
                currentPage = 1;
            }

            // Tính chỉ số bắt đầu và kết thúc cho dữ liệu đã lọc
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, filteredUsers.length);

            // Hiển thị rows của trang hiện tại
            if (isFiltering) {
                // Khi đang lọc, hiển thị theo phân trang client-side
                console.log(`Hiển thị dữ liệu đã lọc (trang ${currentPage}): ${startIndex} đến ${endIndex-1}`);
                for (let i = startIndex; i < endIndex; i++) {
                    filteredUsers[i].element.style.display = '';
                }
            } else {
                // Khi KHÔNG lọc, hiển thị TẤT CẢ dữ liệu đã được phân trang từ server
                console.log("Hiển thị dữ liệu từ server (không lọc)");
                filteredUsers.forEach(user => {
                    user.element.style.display = '';
                });
            }

            // Debug log
            console.log("Trước updatePagination: currentPage =", currentPage);

            // Cập nhật phân trang
            updatePagination(effectiveTotalPages, currentPage);
        } else {
            // Trạng thái trống
            emptyState.style.display = 'block';
            if (paginationElement) {
                paginationElement.innerHTML = '';
            }
        }
    }

    // Cập nhật bảng
    function updateTable() {
        console.log("updateTable: currentPage =", currentPage);
        // Khi gọi bằng lệnh mà không phải hàm khởi tạo ban đầu
        if (isFiltering) {
            // Nếu đang lọc, làm theo quy trình lọc
            filterUsers();
        } else {
            // Nếu không lọc, hiển thị tất cả người dùng hiện tại
            updateFilteredTable(userData);
        }
    }

    // Cập nhật UI phân trang
    function updatePagination(totalPages, currentPage) {
        if (!paginationElement) return;

        totalPages = Math.max(1, totalPages);
        console.log("Cập nhật phân trang với currentPage:", currentPage, "và totalPages:", totalPages);

        let paginationHTML = '';

        // Nút đầu trang
        paginationHTML += `
        <li class="users-page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="users-page-link" href="javascript:void(0);" data-page="1" aria-label="Đầu trang">
                <i class="fas fa-angle-double-left"></i>
            </a>
        </li>`;

        // Nút trang trước
        paginationHTML += `
        <li class="users-page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="users-page-link" href="javascript:void(0);" data-page="${currentPage - 1}" aria-label="Trang trước">
                <i class="fas fa-angle-left"></i>
            </a>
        </li>`;

        // Thông tin trang hiện tại
        paginationHTML += `
        <li class="users-page-item users-page-info">
            <span class="users-page-link">
                Trang <span>${currentPage}</span> / <span>${totalPages}</span>
            </span>
        </li>`;

        // Nút trang sau
        paginationHTML += `
        <li class="users-page-item ${currentPage >= totalPages ? 'disabled' : ''}">
            <a class="users-page-link" href="javascript:void(0);" data-page="${currentPage + 1}" aria-label="Trang sau">
                <i class="fas fa-angle-right"></i>
            </a>
        </li>`;

        // Nút cuối trang
        paginationHTML += `
        <li class="users-page-item ${currentPage >= totalPages ? 'disabled' : ''}">
            <a class="users-page-link" href="javascript:void(0);" data-page="${totalPages}" aria-label="Cuối trang">
                <i class="fas fa-angle-double-right"></i>
            </a>
        </li>`;

        // Gán HTML vào phần tử phân trang
        paginationElement.innerHTML = paginationHTML;

        // Sự kiện click cho nút phân trang
        document.querySelectorAll('#usersPagination .users-page-link[data-page]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = parseInt(this.getAttribute('data-page'));
                if (!isNaN(page) && page !== currentPage && page > 0 && page <= totalPages) {
                    if (isFiltering) {
                        // Xử lý phân trang client-side
                        currentPage = page;
                        console.log("Chuyển trang (client):", currentPage);
                        filterUsers();
                    } else {
                        // Chuyển trang server-side
                        console.log("Chuyển trang (server) đến:", page);
                        window.location.href = `/admin/employee?pageNo=${page}`;
                    }
                }
            });
        });
    }

    // Reset form
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

        document.querySelectorAll('input[name="roles"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        document.querySelector('input[name="roles"][value="ROLE_USER"]').checked = true;
    }

    // Hiển thị chi tiết người dùng
    function showUserDetails(userId) {
        const user = userData.find(u => u.id === userId);
        if (!user) return;

        const row = user.element;
        const editBtn = row.querySelector('.edit-btn');

        const name = editBtn.getAttribute('data-name') || '';
        const gender = editBtn.getAttribute('data-gender') || '';
        const address = editBtn.getAttribute('data-address') || '';
        const phone = editBtn.getAttribute('data-phone') || '';
        const email = editBtn.getAttribute('data-email') || '';
        const username = editBtn.getAttribute('data-username') || '';
        const points = editBtn.getAttribute('data-points') || '0';
        const roles = editBtn.getAttribute('data-roles') || '';

        document.getElementById('detailsId').textContent = userId;
        document.getElementById('detailsName').textContent = name;
        document.getElementById('detailsGender').textContent = gender || 'Không xác định';
        document.getElementById('detailsAddress').textContent = address || 'Chưa cập nhật';
        document.getElementById('detailsPhone').textContent = phone || 'Chưa cập nhật';
        document.getElementById('detailsEmail').textContent = email || 'Chưa cập nhật';
        document.getElementById('detailsUsername').textContent = username || 'Chưa cập nhật';
        document.getElementById('detailsPoints').textContent = points || '0';

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

        document.querySelector('.tab.active').classList.remove('active');
        document.querySelector('.tab-content.active').classList.remove('active');
        document.querySelector('.tab[data-tab="userInfo"]').classList.add('active');
        document.getElementById('userInfo').classList.add('active');

        userDetailsModal.style.display = 'block';
        loadUserOrders(userId);
    }

    // Load đơn hàng
    function loadUserOrders(userId) {
        const ordersContainer = document.getElementById('ordersList');
        ordersContainer.innerHTML = '<div class="loading-indicator">Đang tải dữ liệu...</div>';

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
                </div>`;
                    return;
                }

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
                </div>`;

                    ordersContainer.appendChild(orderElement);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                ordersContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Đã xảy ra lỗi khi tải dữ liệu đơn hàng</p>
            </div>`;
            });
    }

    // Xóa người dùng
    function deleteUser(userId) {
        fetch(`/admin/users/${userId}`, {
            method: 'Delete',
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
                const userIndex = userData.findIndex(user => user.id === userId);
                if (userIndex !== -1) {
                    userData.splice(userIndex, 1);
                }

                showNotification('Xóa người dùng thành công');
                updateTable();

                setTimeout(() => {
                    window.location.reload();
                }, 100);
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

        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 5000);
    }

    // Thêm hoặc update người dùng
    userForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const roleCheckboxes = document.querySelectorAll('input[name="roles"]:checked');
        if (roleCheckboxes.length === 0) {
            showNotification('Vui lòng chọn ít nhất một vai trò cho người dùng', 'error');
            return;
        }

        const isAdding = !document.getElementById('userId').value;
        const password = document.getElementById('password').value;
        if (isAdding && !password) {
            showNotification('Vui lòng nhập mật khẩu cho người dùng mới', 'error');
            return;
        }

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

        const url = userForm.getAttribute('action');

        console.log('Gửi dữ liệu đến:', url);
        console.log('Dữ liệu:', formData);

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [header]: token
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Lỗi khi gửi dữ liệu: ' + response.status);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Server response:', data);
                userModal.style.display = 'none';
                showNotification(data.message || 'Thao tác thành công!');

                setTimeout(() => {
                    window.location.reload();
                }, 100);
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
        if (e.target === userModal) userModal.style.display = 'none';
        if (e.target === userDetailsModal) userDetailsModal.style.display = 'none';
        if (e.target === deleteModal) deleteModal.style.display = 'none';
    });

    // Hiển thị thông báo nếu có
    if (notificationElement && notificationElement.textContent.trim() !== '') {
        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 5000);
    }
});