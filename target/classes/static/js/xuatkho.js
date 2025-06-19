document.addEventListener('DOMContentLoaded', function() {
    // Lấy token CSRF từ meta tag
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    // DOM Elements
    const openAddModalBtn = document.getElementById('openAddModal');
    const xuatKhoModal = document.getElementById('xuatKhoModal');
    const xuatKhoDetailsModal = document.getElementById('xuatKhoDetailsModal');
    const deleteModal = document.getElementById('deleteModal');
    const closeButtons = document.querySelectorAll('.close-btn');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeViewBtn = document.getElementById('closeViewBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const addItemBtn = document.getElementById('addItemBtn');
    const itemsContainer = document.getElementById('itemsContainer');
    const xuatKhoForm = document.getElementById('xuatKhoForm');
    const modalTitle = document.getElementById('modalTitle');
    const phieuXuatKhoId = document.getElementById('phieuXuatKhoId');
    const searchInput = document.querySelector('.search-input');
    const emptyState = document.getElementById('emptyState');
    const xuatKhoTable = document.getElementById('xuatKhoTable');

    // Biến toàn cục để lưu ID phiếu xuất kho cần xóa
    let deleteId = null;

    // Khởi tạo ngày mặc định là ngày hiện tại
    document.getElementById('ngayXuat').valueAsDate = new Date();

    // Load danh sách nhân viên khi trang được tải
    loadNhanVien();

    // Load danh sách nguyên liệu
    loadNguyenLieu();

    // Event Listeners
    openAddModalBtn.addEventListener('click', openAddModal);

    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    cancelBtn.addEventListener('click', closeModal);
    closeViewBtn.addEventListener('click', () => xuatKhoDetailsModal.style.display = 'none');
    cancelDeleteBtn.addEventListener('click', () => deleteModal.style.display = 'none');
    confirmDeleteBtn.addEventListener('click', deletePhieuXuatKho);

    addItemBtn.addEventListener('click', addNewItem);

    xuatKhoForm.addEventListener('submit', savePhieuXuatKho);

    // Add event listeners for view, edit, delete buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const phieuId = this.getAttribute('data-id');
            viewPhieuXuatKho(phieuId);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const phieuId = this.getAttribute('data-id');
            editPhieuXuatKho(phieuId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const phieuId = this.getAttribute('data-id');
            openDeleteModal(phieuId);
        });
    });

    // Search functionality
    searchInput.addEventListener('input', function() {
        filterTable(this.value.toLowerCase());
    });

    // Functions

    // Lọc bảng theo từ khóa tìm kiếm
    function filterTable(keyword) {
        const rows = xuatKhoTable.querySelector('tbody').querySelectorAll('tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const id = row.querySelector('td[data-label="ID Phiếu"]').textContent;
            const nhanVien = row.querySelector('td[data-label="Nhân viên"]').textContent;
            const ngayXuat = row.querySelector('td[data-label="Ngày xuất"]').textContent;

            if (id.includes(keyword) || nhanVien.toLowerCase().includes(keyword) || ngayXuat.includes(keyword)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Hiển thị trạng thái rỗng nếu không có kết quả
        if (visibleCount === 0) {
            emptyState.style.display = 'block';
            xuatKhoTable.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            xuatKhoTable.style.display = 'table';
        }
    }

    // Mở modal thêm phiếu xuất kho
    function openAddModal() {
        // Reset form
        xuatKhoForm.reset();
        phieuXuatKhoId.value = '';
        modalTitle.textContent = 'Thêm Phiếu Xuất Kho';

        // Xóa tất cả các dòng nguyên liệu trừ template
        const itemRows = itemsContainer.querySelectorAll('.item-row:not(.template)');
        itemRows.forEach(row => row.remove());

        // Thêm một dòng mới ban đầu
        addNewItem();

        // Set ngày mặc định là ngày hiện tại
        document.getElementById('ngayXuat').valueAsDate = new Date();

        // Hiển thị modal
        xuatKhoModal.style.display = 'block';
    }

    // Đóng modal
    function closeModal() {
        xuatKhoModal.style.display = 'none';
        xuatKhoDetailsModal.style.display = 'none';
        deleteModal.style.display = 'none';
    }

    // Thêm dòng nguyên liệu mới
    function addNewItem() {
        const template = itemsContainer.querySelector('.template');
        const newItem = template.cloneNode(true);

        newItem.classList.remove('template');
        newItem.style.display = 'block';

        // Add event listener for remove button
        newItem.querySelector('.remove-item').addEventListener('click', function() {
            if (itemsContainer.querySelectorAll('.item-row:not(.template)').length > 1) {
                this.closest('.item-row').remove();
            } else {
                alert('Phải có ít nhất một nguyên liệu!');
            }
        });

        // Populate select options
        populateNguyenLieuOptions(newItem.querySelector('.nguyen-lieu-select'));

        itemsContainer.appendChild(newItem);
    }

    // Lưu phiếu xuất kho
    function savePhieuXuatKho(e) {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Collect data
        const isUpdate = phieuXuatKhoId.value !== '';
        const formData = {
            idPhieuXuatKho: phieuXuatKhoId.value || null,
            ngayXuat: document.getElementById('ngayXuat').value,
            idNhanVien: document.getElementById('nhanVien').value,
            chiTietXuatKhoList: []
        };

        // Collect items data
        const itemRows = itemsContainer.querySelectorAll('.item-row:not(.template)');
        itemRows.forEach(row => {
            const nguyenLieuSelect = row.querySelector('.nguyen-lieu-select');
            const soLuongInput = row.querySelector('.soLuong');

            formData.chiTietXuatKhoList.push({
                idNguyenLieu: nguyenLieuSelect.value,
                soLuong: soLuongInput.value
            });
        });

        // Send API request
        const url = isUpdate ? '/admin/xuatkho/update' : '/admin/xuatkho/add';
        const method = isUpdate ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                [header]: token
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success === false) {
                    alert('Lỗi: ' + data.message);
                    return;
                }

                alert(data.message);
                closeModal();
                // Reload page to show updated data
                window.location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Đã xảy ra lỗi khi lưu phiếu xuất kho!');
            });
    }

    // Xem chi tiết phiếu xuất kho
    function viewPhieuXuatKho(phieuId) {
        fetch(`/admin/xuatkho/${phieuId}`, {
            headers: {
                [header]: token
            }
        })
            .then(response => response.json())
            .then(data => {
                document.getElementById('detailsId').textContent = data.idPhieuXuatKho;
                document.getElementById('detailsNgayXuat').textContent = formatDate(new Date(data.ngayXuat));
                document.getElementById('detailsIdNhanVien').textContent = data.idNhanVien;
                document.getElementById('detailsTenNhanVien').textContent = data.tenNhanVien || 'N/A';

                // Populate chi tiết table
                const tableBody = document.getElementById('chiTietTableBody');
                tableBody.innerHTML = '';

                if (data.chiTietXuatKhoList && data.chiTietXuatKhoList.length > 0) {
                    data.chiTietXuatKhoList.forEach(item => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                        <td>${item.idNguyenLieu}</td>
                        <td>${item.tenNguyenLieu}</td>
                        <td>${item.soLuong}</td>
                    `;
                        tableBody.appendChild(row);
                    });
                } else {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="3" style="text-align: center;">Không có dữ liệu</td>';
                    tableBody.appendChild(row);
                }

                xuatKhoDetailsModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Đã xảy ra lỗi khi tải dữ liệu phiếu xuất kho!');
            });
    }

    // Sửa phiếu xuất kho
    function editPhieuXuatKho(phieuId) {
        fetch(`/admin/xuatkho/${phieuId}`, {
            headers: {
                [header]: token
            }
        })
            .then(response => response.json())
            .then(data => {
                // Set form data
                modalTitle.textContent = 'Sửa Phiếu Xuất Kho';
                phieuXuatKhoId.value = data.idPhieuXuatKho;

                // Format date to YYYY-MM-DD for input type date
                const date = new Date(data.ngayXuat);
                const formattedDate = date.toISOString().split('T')[0];
                document.getElementById('ngayXuat').value = formattedDate;

                document.getElementById('nhanVien').value = data.idNhanVien;

                // Xóa tất cả các dòng nguyên liệu trừ template
                const itemRows = itemsContainer.querySelectorAll('.item-row:not(.template)');
                itemRows.forEach(row => row.remove());

                // Thêm dòng nguyên liệu từ dữ liệu
                if (data.chiTietXuatKhoList && data.chiTietXuatKhoList.length > 0) {
                    data.chiTietXuatKhoList.forEach(item => {
                        addNewItemWithData(item.idNguyenLieu, item.soLuong);
                    });
                } else {
                    // Thêm một dòng trống nếu không có dữ liệu
                    addNewItem();
                }

                // Hiển thị modal
                xuatKhoModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Đã xảy ra lỗi khi tải dữ liệu phiếu xuất kho!');
            });
    }

    // Thêm dòng nguyên liệu với dữ liệu có sẵn
    function addNewItemWithData(idNguyenLieu, soLuong) {
        const template = itemsContainer.querySelector('.template');
        const newItem = template.cloneNode(true);

        newItem.classList.remove('template');
        newItem.style.display = 'block';

        // Add event listener for remove button
        newItem.querySelector('.remove-item').addEventListener('click', function() {
            if (itemsContainer.querySelectorAll('.item-row:not(.template)').length > 1) {
                this.closest('.item-row').remove();
            } else {
                alert('Phải có ít nhất một nguyên liệu!');
            }
        });

        // Populate select options and set values
        const nguyenLieuSelect = newItem.querySelector('.nguyen-lieu-select');
        populateNguyenLieuOptions(nguyenLieuSelect);

        // Set values after populating options
        setTimeout(() => {
            nguyenLieuSelect.value = idNguyenLieu;
            newItem.querySelector('.soLuong').value = soLuong;
        }, 100);

        itemsContainer.appendChild(newItem);
    }

    // Mở modal xác nhận xóa
    function openDeleteModal(phieuId) {
        deleteId = phieuId;
        deleteModal.style.display = 'block';
    }

    // Xóa phiếu xuất kho
    function deletePhieuXuatKho() {
        if (!deleteId) return;

        fetch(`/admin/xuatkho/${deleteId}`, {
            method: 'DELETE',
            headers: {
                [header]: token
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + data.message);
                }
                deleteModal.style.display = 'none';
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Đã xảy ra lỗi khi xóa phiếu xuất kho!');
                deleteModal.style.display = 'none';
            });
    }

    // Load danh sách nhân viên
    function loadNhanVien() {
        fetch('/admin/employee/all', {
            headers: {
                [header]: token
            }
        })
            .then(response => response.json())
            .then(data => {
                const selectElement = document.getElementById('nhanVien');
                selectElement.innerHTML = '<option value="">-- Chọn nhân viên --</option>';

                data.forEach(nhanVien => {
                    const option = document.createElement('option');
                    option.value = nhanVien.id;
                    option.textContent = nhanVien.hoTen;
                    selectElement.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error loading staff:', error);
            });
    }

    // Load danh sách nguyên liệu
    function loadNguyenLieu() {
        fetch('/admin/nguyenlieu/all', {
            headers: {
                [header]: token
            }
        })
            .then(response => response.json())
            .then(data => {
                window.nguyenLieuList = data; // Lưu vào biến toàn cục để sử dụng sau này
            })
            .catch(error => {
                console.error('Error loading nguyen lieu:', error);
            });
    }

    // Populate nguyên liệu options for select element
    function populateNguyenLieuOptions(selectElement) {
        if (!window.nguyenLieuList) return;

        selectElement.innerHTML = '<option value="">-- Chọn nguyên liệu --</option>';

        window.nguyenLieuList.forEach(nguyenLieu => {
            const option = document.createElement('option');
            option.value = nguyenLieu.idNguyenLieu;
            option.textContent = `${nguyenLieu.tenNguyenLieu} (SL: ${nguyenLieu.soLuong})`;
            selectElement.appendChild(option);
        });
    }

    // Validate form before submit
    function validateForm() {
        const ngayXuat = document.getElementById('ngayXuat').value;
        const nhanVien = document.getElementById('nhanVien').value;

        if (!ngayXuat) {
            alert('Vui lòng chọn ngày xuất!');
            return false;
        }

        if (!nhanVien) {
            alert('Vui lòng chọn nhân viên!');
            return false;
        }

        // Validate items
        const itemRows = itemsContainer.querySelectorAll('.item-row:not(.template)');
        for (let i = 0; i < itemRows.length; i++) {
            const row = itemRows[i];
            const nguyenLieu = row.querySelector('.nguyen-lieu-select').value;
            const soLuong = row.querySelector('.soLuong').value;

            if (!nguyenLieu) {
                alert(`Vui lòng chọn nguyên liệu ở dòng ${i + 1}!`);
                return false;
            }

            if (!soLuong || soLuong <= 0) {
                alert(`Vui lòng nhập số lượng hợp lệ ở dòng ${i + 1}!`);
                return false;
            }
        }

        // Check for duplicate items
        const nguyenLieuIds = [];
        for (let i = 0; i < itemRows.length; i++) {
            const nguyenLieuId = itemRows[i].querySelector('.nguyen-lieu-select').value;
            if (nguyenLieuIds.includes(nguyenLieuId)) {
                alert(`Nguyên liệu trùng lặp ở dòng ${i + 1}! Vui lòng chọn nguyên liệu khác.`);
                return false;
            }
            nguyenLieuIds.push(nguyenLieuId);
        }

        return true;
    }

    // Helper function to format date
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Hiển thị thông báo nếu có
    const notification = document.getElementById('notification');
    if (notification && notification.textContent.trim() !== '') {
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
});