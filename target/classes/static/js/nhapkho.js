// Hàm hiển thị thông báo - định nghĩa ở đầu file
function showNotification(message, type = 'success') {
    // Kiểm tra nếu đã có phần tử thông báo
    let notificationElement = document.getElementById('notification');

    // Nếu chưa có, tạo mới
    if (!notificationElement) {
        notificationElement = document.createElement('div');
        notificationElement.id = 'notification';
        notificationElement.className = 'notification';
        document.body.appendChild(notificationElement);
    }

    // Đặt nội dung và lớp CSS
    notificationElement.textContent = message;
    notificationElement.className = `notification ${type}`;

    // Hiển thị thông báo
    notificationElement.style.display = 'block';

    // Ẩn sau 3 giây
    setTimeout(() => {
        notificationElement.style.display = 'none';
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const modal = document.getElementById('phieuNhapKhoModal');
    const viewModal = document.getElementById('viewPhieuModal');
    const deleteModal = document.getElementById('deleteModal');
    const searchInput = document.querySelector('.search-input');
    const openAddModalBtn = document.getElementById('openAddModal');
    const closeModalBtn = document.querySelector('.close-btn');
    const closeViewBtn = document.getElementById('closeViewBtn');
    const closeViewModalBtn = document.getElementById('closeViewModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const addItemBtn = document.getElementById('addItemBtn');
    const phieuNhapKhoForm = document.getElementById('phieuNhapKhoForm');
    const chiTietTableBody = document.getElementById('chiTietTableBody');
    const phieuNhapKhoTable = document.getElementById('phieuNhapKhoTable');
    const tongTienElement = document.getElementById('tongTien');
    const modalTitle = document.getElementById('modalTitle');
    const notification = document.getElementById('notification');
    const emptyState = document.getElementById('emptyState');

    // For handling CSRF token
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    // Global variables
    let currentDeleteId = null;
    let nhaCungCapList = [];
    let nhanVienList = [];
    let nguyenLieuList = [];
    let isEditMode = false;
    let rowCounter = 0;

    // Initialize data
    initializeData();
    initializeEventListeners();
    validateTableEmpty();

    // Hide notification after 3 seconds if it exists
    if (notification) {
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    // Initialize necessary data for selects and form
    function initializeData() {
        // Fetch Nhà cung cấp data
        fetch('/admin/nhacungcap')
            .then(response => response.json())
            .then(data => {
                nhaCungCapList = data;
                const nhaCungCapSelect = document.getElementById('nhaCungCap');
                nhaCungCapSelect.innerHTML = '<option value="">-- Chọn nhà cung cấp --</option>';

                data.forEach(ncc => {
                    const option = document.createElement('option');
                    option.value = ncc.idNhaCungCap;
                    option.textContent = ncc.tenNhaCungCap;
                    nhaCungCapSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error loading nhà cung cấp:', error));

        // Fetch Nhân viên data
        fetch('/admin/employee/all')
            .then(response => response.json())
            .then(data => {
                nhanVienList = data;
                const nhanVienSelect = document.getElementById('nhanVien');
                nhanVienSelect.innerHTML = '<option value="">-- Chọn nhân viên --</option>';

                data.forEach(nv => {
                    const option = document.createElement('option');
                    option.value = nv.id;
                    option.textContent = nv.hoTen;
                    nhanVienSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error loading nhân viên:', error));

        // Fetch Nguyên liệu data
        fetch('/admin/nguyenlieu/all')
            .then(response => response.json())
            .then(data => {
                nguyenLieuList = data;
            })
            .catch(error => console.error('Error loading nguyên liệu:', error));
    }

    // Set up all event listeners
    function initializeEventListeners() {
        // Open add modal
        openAddModalBtn.addEventListener('click', function() {
            resetForm();
            isEditMode = false;
            modalTitle.textContent = 'Thêm Phiếu Nhập Kho';
            modal.style.display = 'block';
            // Set default date to today
            document.getElementById('ngayNhap').valueAsDate = new Date();
        });

        // Close modals with various buttons
        closeModalBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        closeViewBtn.addEventListener('click', closeViewModal);
        closeViewModalBtn.addEventListener('click', closeViewModal);
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);

        // Add new item row to form
        addItemBtn.addEventListener('click', addNewItemRow);

        // Handle form submission
        phieuNhapKhoForm.addEventListener('submit', submitForm);

        // Confirm delete
        confirmDeleteBtn.addEventListener('click', confirmDelete);

        // Search functionality
        searchInput.addEventListener('input', searchPhieuNhapKho);

        // Close modals when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
            if (event.target === viewModal) {
                closeViewModal();
            }
            if (event.target === deleteModal) {
                closeDeleteModal();
            }
        });

        // Set up view, edit, delete buttons for each row
        setupRowButtons();
    }

    // Reset form fields
    function resetForm() {
        document.getElementById('phieuNhapKhoId').value = '';
        document.getElementById('ngayNhap').value = '';
        document.getElementById('nhaCungCap').value = '';
        document.getElementById('nhanVien').value = '';
        document.getElementById('ghiChu').value = '';
        chiTietTableBody.innerHTML = '';
        rowCounter = 0;
        updateTotalAmount();
    }

    // Close modal
    function closeModal() {
        modal.style.display = 'none';
        resetForm();
    }

    // Close view modal
    function closeViewModal() {
        viewModal.style.display = 'none';
    }

    // Close delete modal
    function closeDeleteModal() {
        deleteModal.style.display = 'none';
        currentDeleteId = null;
    }

    // Add new item row to form
    function addNewItemRow() {
        rowCounter++;
        const newRow = document.createElement('tr');
        newRow.dataset.row = rowCounter;

        const nguyenLieuOptions = nguyenLieuList.map(nl =>
            `<option value="${nl.idNguyenLieu}" data-donvi="${nl.donViTinh}">${nl.tenNguyenLieu}</option>`
        ).join('');

        newRow.innerHTML = `
            <td data-label="STT">${rowCounter}</td>
            <td data-label="Nguyên Liệu">
                <select name="chiTietNhapKhoList[${rowCounter-1}].idNguyenLieu" class="nguyen-lieu-select" required>
                    <option value="">-- Chọn nguyên liệu --</option>
                    ${nguyenLieuOptions}
                </select>
            </td>
            <td data-label="Số Lượng">
                <input type="number" name="chiTietNhapKhoList[${rowCounter-1}].soLuong" class="so-luong" min="1" required>
            </td>
            <td data-label="Đơn Vị">
                <input type="text" name="chiTietNhapKhoList[${rowCounter-1}].donViTinh" class="don-vi" readonly>
            </td>
            <td data-label="Đơn Giá">
                <input type="number" name="chiTietNhapKhoList[${rowCounter-1}].giaTien" class="don-gia" min="0" required>
            </td>
            <td data-label="Thành Tiền" class="thanh-tien">0 VNĐ</td>
            <td data-label="Thao Tác">
                <button type="button" class="btn btn-danger remove-row"><i class="fas fa-trash"></i></button>
            </td>
        `;

        chiTietTableBody.appendChild(newRow);

        // Add event listeners to the new row
        const nguyenLieuSelect = newRow.querySelector('.nguyen-lieu-select');
        const soLuongInput = newRow.querySelector('.so-luong');
        const donGiaInput = newRow.querySelector('.don-gia');
        const removeRowBtn = newRow.querySelector('.remove-row');

        // Handle nguyên liệu selection
        nguyenLieuSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const donVi = selectedOption.getAttribute('data-donvi');
            newRow.querySelector('.don-vi').value = donVi || '';
            calculateRowTotal(newRow);
        });

        // Handle số lượng change
        soLuongInput.addEventListener('input', function() {
            calculateRowTotal(newRow);
        });

        // Handle đơn giá change
        donGiaInput.addEventListener('input', function() {
            calculateRowTotal(newRow);
        });

        // Handle remove row
        removeRowBtn.addEventListener('click', function() {
            chiTietTableBody.removeChild(newRow);
            updateRowNumbers();
            updateTotalAmount();
            validateTableEmpty();
        });
    }

    // Calculate row total
    function calculateRowTotal(row) {
        const soLuong = parseFloat(row.querySelector('.so-luong').value) || 0;
        const donGia = parseFloat(row.querySelector('.don-gia').value) || 0;
        const thanhTien = soLuong * donGia;

        row.querySelector('.thanh-tien').textContent = formatCurrency(thanhTien);
        updateTotalAmount();
    }

    // Update row numbers after removal
    function updateRowNumbers() {
        const rows = chiTietTableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.querySelector('td:first-child').textContent = index + 1;

            // Update the input names
            const inputs = row.querySelectorAll('input, select');
            inputs.forEach(input => {
                const name = input.getAttribute('name');
                if (name) {
                    const updatedName = name.replace(/\[\d+\]/, `[${index}]`);
                    input.setAttribute('name', updatedName);
                }
            });
        });
    }

    // Update total amount
    function updateTotalAmount() {
        let total = 0;
        const thanhTienElements = document.querySelectorAll('.thanh-tien');

        thanhTienElements.forEach(element => {
            const value = parseFloat(element.textContent.replace(/[^\d]/g, '')) || 0;
            total += value;
        });

        tongTienElement.textContent = formatCurrency(total);
    }

    // Submit form
    function submitForm(event) {
        event.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Get form data
        const formData = {
            idPhieuNhapKho: document.getElementById('phieuNhapKhoId').value || null,
            ngayNhap: document.getElementById('ngayNhap').value,
            idNhanVien: document.getElementById('nhanVien').value,
            idNhaCungCap: document.getElementById('nhaCungCap').value,
            ghiChu: document.getElementById('ghiChu').value,
            chiTietNhapKhoList: []
        };

        // Get detail rows
        const rows = chiTietTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const idNguyenLieu = row.querySelector('.nguyen-lieu-select').value;
            const soLuong = row.querySelector('.so-luong').value;
            const donViTinh = row.querySelector('.don-vi').value;
            const giaTien = row.querySelector('.don-gia').value;

            formData.chiTietNhapKhoList.push({
                idNguyenLieu: idNguyenLieu,
                soLuong: soLuong,
                donViTinh: donViTinh,
                giaTien: giaTien
            });
        });

        // Send request
        const url = isEditMode ? '/admin/nhapkho/update' : '/admin/nhapkho/add';

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
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Hiển thị thông báo thành công
                showNotification(data.message || (isEditMode ? 'Cập nhật phiếu nhập kho thành công' : 'Thêm phiếu nhập kho thành công'));

                // Đóng modal
                closeModal();

                // Đợi 1 giây rồi tải lại trang để hiển thị dữ liệu mới
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Đã xảy ra lỗi khi xử lý yêu cầu: ' + error.message, 'error');
            });
    }

    // Validate form
    function validateForm() {
        // Check basic fields
        if (!document.getElementById('ngayNhap').value) {
            alert('Vui lòng chọn ngày nhập');
            return false;
        }

        if (!document.getElementById('nhaCungCap').value) {
            alert('Vui lòng chọn nhà cung cấp');
            return false;
        }

        if (!document.getElementById('nhanVien').value) {
            alert('Vui lòng chọn nhân viên');
            return false;
        }

        // Check if there's at least one item
        if (chiTietTableBody.querySelectorAll('tr').length === 0) {
            alert('Vui lòng thêm ít nhất một nguyên liệu');
            return false;
        }

        return true;
    }

    // Validate if table is empty
    function validateTableEmpty() {
        if (phieuNhapKhoTable.querySelector('tbody').children.length === 0) {
            emptyState.style.display = 'block';
            document.querySelector('.users-pagination-container').style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            document.querySelector('.users-pagination-container').style.display = 'block';
        }
    }

    // Format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    // Set up view, edit, delete buttons
    function setupRowButtons() {
        // View button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const phieuId = this.getAttribute('data-id');
                loadPhieuDetail(phieuId, 'view');
            });
        });

        // Edit button
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const phieuId = this.getAttribute('data-id');
                loadPhieuDetail(phieuId, 'edit');
            });
        });

        // Delete button
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const phieuId = this.getAttribute('data-id');
                showDeleteConfirmation(phieuId);
            });
        });
    }

    // Load phiếu detail
    function loadPhieuDetail(phieuId, mode) {
        fetch(`/admin/nhapkho/${phieuId}`)
            .then(response => response.json())
            .then(data => {
                if (mode === 'view') {
                    displayViewDetail(data);
                } else if (mode === 'edit') {
                    displayEditForm(data);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Đã xảy ra lỗi khi tải thông tin phiếu nhập kho.');
            });
    }

    // Display view detail
    function displayViewDetail(phieu) {
        document.getElementById('detailsId').textContent = phieu.idPhieuNhapKho;

        // Format date
        const date = new Date(phieu.ngayNhap);
        document.getElementById('detailsNgayNhap').textContent = date.toLocaleDateString('vi-VN');

        document.getElementById('detailsNhaCungCap').textContent = phieu.tenNhaCungCap;
        document.getElementById('detailsNhanVien').textContent = phieu.tenNhanVien;
        document.getElementById('detailsGhiChu').textContent = phieu.ghiChu || '(Không có ghi chú)';

        // Clear and fill detail table
        const viewTableBody = document.getElementById('viewChiTietTableBody');
        viewTableBody.innerHTML = '';

        let tongTien = 0;

        phieu.chiTietNhapKhoList.forEach((item, index) => {
            const thanhTien = item.soLuong * item.giaTien;
            tongTien += thanhTien;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.tenNguyenLieu}</td>
                <td>${item.soLuong}</td>
                <td>${item.donViTinh}</td>
                <td>${formatCurrency(item.giaTien)}</td>
                <td>${formatCurrency(thanhTien)}</td>
            `;
            viewTableBody.appendChild(row);
        });

        document.getElementById('viewTongTien').textContent = formatCurrency(tongTien);
        viewModal.style.display = 'block';
    }

    // Display edit form
    function displayEditForm(phieu) {
        isEditMode = true;
        modalTitle.textContent = 'Sửa Phiếu Nhập Kho';

        document.getElementById('phieuNhapKhoId').value = phieu.idPhieuNhapKho;

        // Set date
        const date = new Date(phieu.ngayNhap);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('ngayNhap').value = formattedDate;

        document.getElementById('nhaCungCap').value = phieu.idNhaCungCap;
        document.getElementById('nhanVien').value = phieu.idNhanVien;
        document.getElementById('ghiChu').value = phieu.ghiChu || '';

        // Clear existing rows
        chiTietTableBody.innerHTML = '';
        rowCounter = 0;

        // Add detail rows
        phieu.chiTietNhapKhoList.forEach(item => {
            rowCounter++;
            const newRow = document.createElement('tr');
            newRow.dataset.row = rowCounter;

            const nguyenLieuOptions = nguyenLieuList.map(nl =>
                `<option value="${nl.idNguyenLieu}" data-donvi="${nl.donViTinh}" ${nl.idNguyenLieu == item.idNguyenLieu ? 'selected' : ''}>${nl.tenNguyenLieu}</option>`
            ).join('');

            newRow.innerHTML = `
                <td data-label="STT">${rowCounter}</td>
                <td data-label="Nguyên Liệu">
                    <select name="chiTietNhapKhoList[${rowCounter-1}].idNguyenLieu" class="nguyen-lieu-select" required>
                        <option value="">-- Chọn nguyên liệu --</option>
                        ${nguyenLieuOptions}
                    </select>
                </td>
                <td data-label="Số Lượng">
                    <input type="number" name="chiTietNhapKhoList[${rowCounter-1}].soLuong" class="so-luong" min="1" value="${item.soLuong}" required>
                </td>
                <td data-label="Đơn Vị">
                    <input type="text" name="chiTietNhapKhoList[${rowCounter-1}].donViTinh" class="don-vi" value="${item.donViTinh}" readonly>
                </td>
                <td data-label="Đơn Giá">
                    <input type="number" name="chiTietNhapKhoList[${rowCounter-1}].giaTien" class="don-gia" min="0" value="${item.giaTien}" required>
                </td>
                <td data-label="Thành Tiền" class="thanh-tien">${formatCurrency(item.soLuong * item.giaTien)}</td>
                <td data-label="Thao Tác">
                    <button type="button" class="btn btn-danger remove-row"><i class="fas fa-trash"></i></button>
                </td>
            `;

            chiTietTableBody.appendChild(newRow);

            // Add event listeners to the new row
            setupRowEventListeners(newRow);
        });

        updateTotalAmount();
        modal.style.display = 'block';
    }

    // Set up event listeners for a single row
    function setupRowEventListeners(row) {
        const nguyenLieuSelect = row.querySelector('.nguyen-lieu-select');
        const soLuongInput = row.querySelector('.so-luong');
        const donGiaInput = row.querySelector('.don-gia');
        const removeRowBtn = row.querySelector('.remove-row');

        // Handle nguyên liệu selection
        nguyenLieuSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const donVi = selectedOption.getAttribute('data-donvi');
            row.querySelector('.don-vi').value = donVi || '';
            calculateRowTotal(row);
        });

        // Handle số lượng change
        soLuongInput.addEventListener('input', function() {
            calculateRowTotal(row);
        });

        // Handle đơn giá change
        donGiaInput.addEventListener('input', function() {
            calculateRowTotal(row);
        });

        // Handle remove row
        removeRowBtn.addEventListener('click', function() {
            chiTietTableBody.removeChild(row);
            updateRowNumbers();
            updateTotalAmount();
            validateTableEmpty();
        });
    }

    // Show delete confirmation
    function showDeleteConfirmation(phieuId) {
        currentDeleteId = phieuId;
        deleteModal.style.display = 'block';
    }

    // Confirm delete
    function confirmDelete() {
        if (!currentDeleteId) return;

        fetch(`/admin/nhapkho/${currentDeleteId}`, {
            method: 'DELETE',
            headers: {
                [header]: token
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Hiển thị thông báo thành công
                showNotification(data.message || 'Xóa phiếu nhập kho thành công');

                // Đóng modal xác nhận xóa
                closeDeleteModal();

                // Đợi 1 giây rồi tải lại trang để cập nhật dữ liệu
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Đã xảy ra lỗi khi xóa phiếu nhập kho: ' + error.message, 'error');
                closeDeleteModal();
            });
    }

    // Search functionality
    function searchPhieuNhapKho() {
        const searchValue = searchInput.value.toLowerCase().trim();
        const rows = phieuNhapKhoTable.querySelectorAll('tbody tr');

        let hasVisibleRows = false;

        rows.forEach(row => {
            const id = row.querySelector('td[data-label="ID"]').textContent.toLowerCase();
            const nhaCungCap = row.querySelector('td[data-label="Nhà Cung Cấp"]').textContent.toLowerCase();
            const nhanVien = row.querySelector('td[data-label="Nhân Viên"]').textContent.toLowerCase();
            const ngayNhap = row.querySelector('td[data-label="Ngày Nhập"]').textContent.toLowerCase();

            if (id.includes(searchValue) ||
                nhaCungCap.includes(searchValue) ||
                nhanVien.includes(searchValue) ||
                ngayNhap.includes(searchValue)) {
                row.style.display = '';
                hasVisibleRows = true;
            } else {
                row.style.display = 'none';
            }
        });

        // Show/hide empty state
        if (hasVisibleRows) {
            emptyState.style.display = 'none';
        } else {
            emptyState.style.display = 'block';
        }
    }
});