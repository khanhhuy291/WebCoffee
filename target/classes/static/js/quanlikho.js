document.addEventListener('DOMContentLoaded', function() {
    // Modal elements
    const nguyenLieuModal = document.getElementById('nguyenLieuModal');
    const nguyenLieuDetailsModal = document.getElementById('nguyenLieuDetailsModal');
    const deleteModal = document.getElementById('deleteModal');
    const closeButtons = document.querySelectorAll('.close-btn');
    const modalTitle = document.getElementById('modalTitle');
    const nguyenLieuForm = document.getElementById('nguyenLieuForm');
    const nguyenLieuId = document.getElementById('nguyenLieuId');
    const tenNguyenLieu = document.getElementById('tenNguyenLieu');
    const soLuong = document.getElementById('soLuong');
    const donVi = document.getElementById('donVi');

    // Notification
    const notification = document.getElementById('notification');

    // Table and search elements
    const nguyenLieuTable = document.getElementById('nguyenLieuTable');
    const searchInput = document.querySelector('.search-input');
    const emptyState = document.getElementById('emptyState');

    // Button elements
    const openAddModalBtn = document.getElementById('openAddModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // Pagination elements
    const nguyenLieuPagination = document.getElementById('nguyenLieuPagination');

    // Variable to store the ID of the nguyenLieu to be deleted
    let deleteNguyenLieuId = null;

    // History pagination state
    let currentHistoryPage = 1;
    const itemsPerPage = 5; // Số lượng mục mỗi trang
    let historyData = []; // Lưu trữ dữ liệu lịch sử đầy đủ

    // CSRF token for POST requests
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');

    // Helper function for making API calls
    async function fetchApi(url, options = {}) {
        // Add CSRF token to headers if present
        if (csrfToken && csrfHeader) {
            options.headers = {
                ...options.headers,
                [csrfHeader]: csrfToken,
                'Content-Type': 'application/json'
            };
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'API request failed');
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            showNotification('Đã xảy ra lỗi: ' + error.message, 'error');
            throw error;
        }
    }

    // Function to show a notification
    function showNotification(message, type = 'success') {
        if (notification) {
            notification.textContent = message;
            notification.className = 'notification';
            notification.classList.add(type === 'error' ? 'error' : 'success');
            notification.style.display = 'block';

            // Hide notification after 3 seconds
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
    }

    // Function to toggle modal visibility
    function toggleModal(modal, show = true) {
        if (modal) {
            modal.style.display = show ? 'flex' : 'none';
        }
    }

    // Function to reset form
    function resetForm() {
        if (nguyenLieuForm) {
            nguyenLieuForm.reset();
            nguyenLieuId.value = '';
            modalTitle.textContent = 'Thêm Nguyên Liệu';
        }
    }

    // Event handler for modal close buttons
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            toggleModal(nguyenLieuModal, false);
            toggleModal(nguyenLieuDetailsModal, false);
            toggleModal(deleteModal, false);
            resetForm();
        });
    });

    // Event handler for opening the add modal
    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', function() {
            resetForm();
            toggleModal(nguyenLieuModal, true);
        });
    }

    // Event handler for the cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            toggleModal(nguyenLieuModal, false);
            resetForm();
        });
    }

    // Event handler for the cancel delete button
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            toggleModal(deleteModal, false);
            deleteNguyenLieuId = null;
        });
    }

    // Event handler for form submission
    if (nguyenLieuForm) {
        nguyenLieuForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const nguyenLieuData = {
                tenNguyenLieu: tenNguyenLieu.value,
                soLuong: parseInt(soLuong.value),
                donVi: donVi.value
            };

            try {
                const response = await fetchApi('/admin/quanlikho/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(nguyenLieuData)
                });

                showNotification(response.message || 'Thao tác thành công');
                toggleModal(nguyenLieuModal, false);
                resetForm();

                // Reload the page to see changes
                setTimeout(() => {
                    window.location.reload();
                }, 1000);

            } catch (error) {
                console.error('Error submitting form:', error);
                showNotification('Đã xảy ra lỗi khi lưu nguyên liệu', 'error');
            }
        });
    }

    // Function to handle view button click
    async function handleViewButtonClick(id) {
        try {
            // Reset history pagination state
            currentHistoryPage = 1;

            // Fetch nguyên liệu details
            const nguyenLieu = await fetchApi(`/admin/quanlikho/${id}`);

            // Update modal with details
            document.getElementById('detailsId').textContent = nguyenLieu.idNguyenLieu;
            document.getElementById('detailsName').textContent = nguyenLieu.tenNguyenLieu;
            document.getElementById('detailsQuantity').textContent = nguyenLieu.soLuong;
            document.getElementById('detailsUnit').textContent = nguyenLieu.donViTinh;

            // Set status badge
            const statusElement = document.getElementById('detailsStatus');
            if (nguyenLieu.soLuong > 10) {
                statusElement.textContent = 'Đủ';
                statusElement.className = 'badge badge-success';
            } else if (nguyenLieu.soLuong > 0) {
                statusElement.textContent = 'Sắp hết';
                statusElement.className = 'badge badge-warning';
            } else {
                statusElement.textContent = 'Hết hàng';
                statusElement.className = 'badge badge-danger';
            }

            // Fetch history
            const history = await fetchApi(`/admin/quanlikho/history/${id}`);
            historyData = history || []; // Lưu lại toàn bộ dữ liệu

            // Hiển thị trang đầu tiên
            displayHistoryPage(1);

            // Show modal
            toggleModal(nguyenLieuDetailsModal, true);

        } catch (error) {
            console.error('Error fetching details:', error);
            showNotification('Không thể tải thông tin chi tiết', 'error');
        }
    }

    // Function to display a specific page of history data
    function displayHistoryPage(pageNumber) {
        const historyTableBody = document.getElementById('historyTableBody');
        const historyPagination = document.getElementById('historyPagination');
        historyTableBody.innerHTML = '';

        if (historyData && historyData.length > 0) {
            // Calculate pagination info
            const totalPages = Math.ceil(historyData.length / itemsPerPage);
            const startIndex = (pageNumber - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, historyData.length);
            currentHistoryPage = pageNumber;

            // Display current page items
            for (let i = startIndex; i < endIndex; i++) {
                const item = historyData[i];
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.idMaPhieu || '-'}</td>
                    <td>${formatDate(item.ngayNhapXuat)}</td>
                    <td>${item.hinhThuc}</td>
                    <td>${item.soLuong}</td>
                    <td>${item.donViTinh}</td>
                    <td>${formatCurrency(item.giaTien)}</td>
                    <td>${item.idUser}</td>
                    <td>${item.tenUser}</td>
                `;
                historyTableBody.appendChild(row);
            }

            // Update pagination UI
            updateHistoryPagination(pageNumber, totalPages);
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="8" class="text-center">Không có dữ liệu lịch sử</td>';
            historyTableBody.appendChild(row);

            // Hide pagination if no data
            if (historyPagination) {
                historyPagination.style.display = 'none';
            }
        }
    }

    // Function to update the history pagination UI
    function updateHistoryPagination(currentPage, totalPages) {
        const historyPagination = document.getElementById('historyPagination');
        if (!historyPagination) return;

        historyPagination.style.display = totalPages > 1 ? 'flex' : 'none';
        if (totalPages <= 1) return;

        const pageInfoElement = historyPagination.querySelector('.users-page-info span:nth-child(1)');
        const totalPagesElement = historyPagination.querySelector('.users-page-info span:nth-child(3)');

        if (pageInfoElement) pageInfoElement.textContent = currentPage;
        if (totalPagesElement) totalPagesElement.textContent = totalPages;

        // Update first page button
        const firstPageBtn = historyPagination.querySelector('.first-page');
        if (firstPageBtn) {
            firstPageBtn.classList.toggle('disabled', currentPage === 1);
        }

        // Update previous page button
        const prevPageBtn = historyPagination.querySelector('.prev-page');
        if (prevPageBtn) {
            prevPageBtn.classList.toggle('disabled', currentPage === 1);
        }

        // Update next page button
        const nextPageBtn = historyPagination.querySelector('.next-page');
        if (nextPageBtn) {
            nextPageBtn.classList.toggle('disabled', currentPage === totalPages);
        }

        // Update last page button
        const lastPageBtn = historyPagination.querySelector('.last-page');
        if (lastPageBtn) {
            lastPageBtn.classList.toggle('disabled', currentPage === totalPages);
        }
    }

    // Event handler for history pagination buttons
    function addHistoryPaginationListeners() {
        const historyPagination = document.getElementById('historyPagination');
        if (!historyPagination) return;

        // First page button
        const firstPageBtn = historyPagination.querySelector('.first-page');
        if (firstPageBtn) {
            firstPageBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (!this.classList.contains('disabled')) {
                    displayHistoryPage(1);
                }
            });
        }

        // Previous page button
        const prevPageBtn = historyPagination.querySelector('.prev-page');
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (!this.classList.contains('disabled')) {
                    displayHistoryPage(currentHistoryPage - 1);
                }
            });
        }

        // Next page button
        const nextPageBtn = historyPagination.querySelector('.next-page');
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (!this.classList.contains('disabled')) {
                    displayHistoryPage(currentHistoryPage + 1);
                }
            });
        }

        // Last page button
        const lastPageBtn = historyPagination.querySelector('.last-page');
        if (lastPageBtn) {
            lastPageBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (!this.classList.contains('disabled')) {
                    const totalPages = Math.ceil(historyData.length / itemsPerPage);
                    displayHistoryPage(totalPages);
                }
            });
        }
    }

    // Function to handle edit button click
    function handleEditButtonClick(id, name, quantity, unit) {
        // Set form values
        nguyenLieuId.value = id;
        tenNguyenLieu.value = name;
        soLuong.value = quantity;
        donVi.value = unit;

        // Update modal title
        modalTitle.textContent = 'Cập Nhật Nguyên Liệu';

        // Show modal
        toggleModal(nguyenLieuModal, true);
    }

    // Function to handle delete button click
    function handleDeleteButtonClick(id) {
        deleteNguyenLieuId = id;
        toggleModal(deleteModal, true);
    }

    // Event handler for confirming delete
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async function() {
            if (deleteNguyenLieuId) {
                try {
                    const response = await fetchApi(`/admin/nguyenlieu/${deleteNguyenLieuId}`, {
                        method: 'DELETE'
                    });

                    showNotification(response.message || 'Xóa nguyên liệu thành công');
                    toggleModal(deleteModal, false);

                    // Reload the page to see changes
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);

                } catch (error) {
                    console.error('Error deleting:', error);
                    showNotification('Đã xảy ra lỗi khi xóa nguyên liệu', 'error');
                    toggleModal(deleteModal, false);
                }
            }
        });
    }

    // Add event listeners to view, edit, and delete buttons
    function addTableButtonListeners() {
        const viewButtons = document.querySelectorAll('.view-btn');
        const editButtons = document.querySelectorAll('.edit-btn');
        const deleteButtons = document.querySelectorAll('.delete-btn');

        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                handleViewButtonClick(id);
            });
        });

        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const name = this.getAttribute('data-name');
                const quantity = this.getAttribute('data-quantity');
                const unit = this.getAttribute('data-unit');
                handleEditButtonClick(id, name, quantity, unit);
            });
        });

        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                handleDeleteButtonClick(id);
            });
        });
    }

    // Call the function to add event listeners when the page loads
    addTableButtonListeners();
    addHistoryPaginationListeners();

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const tableRows = nguyenLieuTable.querySelectorAll('tbody tr');
            let hasVisibleRows = false;

            tableRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                    hasVisibleRows = true;
                } else {
                    row.style.display = 'none';
                }
            });

            // Show or hide empty state
            if (emptyState) {
                emptyState.style.display = hasVisibleRows ? 'none' : 'block';
            }

            // Hide pagination if no rows are visible
            if (nguyenLieuPagination) {
                nguyenLieuPagination.style.display = hasVisibleRows ? '' : 'none';
            }
        });
    }

    // Helper functions
    function formatDate(dateString) {
        if (!dateString) return '-';
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
        if (amount === undefined || amount === null) return '-';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    // Export functionality
    const exportButton = document.querySelector('.btn-outline');
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            exportToExcel();
        });
    }

    function exportToExcel() {
        // Get table data
        const table = document.getElementById('nguyenLieuTable');
        const rows = table.querySelectorAll('tbody tr');
        const data = [];

        // Add header row
        const headers = ['ID', 'Tên Nguyên Liệu', 'Số lượng', 'Đơn vị', 'Trạng thái'];
        data.push(headers);

        // Add data rows
        rows.forEach(row => {
            // Only export visible rows if filtering
            if (row.style.display !== 'none') {
                const rowData = [];
                const cells = row.querySelectorAll('td');

                // Get text content of first 5 columns (excluding Actions column)
                for (let i = 0; i < 5; i++) {
                    rowData.push(cells[i].textContent.trim());
                }

                data.push(rowData);
            }
        });

        // Create CSV content
        let csvContent = '';
        data.forEach(rowArray => {
            const row = rowArray.join(',');
            csvContent += row + '\r\n';
        });

        // Create a download link
        const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'nguyenlieu_' + new Date().toISOString().split('T')[0] + '.csv');
        document.body.appendChild(link);

        // Trigger download
        link.click();
        document.body.removeChild(link);
    }

    // Function to export history data to Excel
    function exportHistoryToExcel() {
        // Get all history data
        const data = [];

        // Add header row
        const headers = ['Mã phiếu', 'Ngày', 'Loại', 'Số lượng', 'Đơn vị tính', 'Giá tiền', 'ID Người thực hiện', 'Tên Người thực hiện'];
        data.push(headers);

        // Add all history data rows
        historyData.forEach(item => {
            const rowData = [
                item.idMaPhieu || '-',
                formatDate(item.ngayNhapXuat),
                item.hinhThuc,
                item.soLuong,
                item.donViTinh,
                item.giaTien,
                item.idUser,
                item.tenUser
            ];
            data.push(rowData);
        });

        // Create CSV content
        let csvContent = '';
        data.forEach(rowArray => {
            const row = rowArray.join(',');
            csvContent += row + '\r\n';
        });

        // Create a download link
        const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'lichsu_nguyenlieu_' + document.getElementById('detailsId').textContent + '_' + new Date().toISOString().split('T')[0] + '.csv');
        document.body.appendChild(link);

        // Trigger download
        link.click();
        document.body.removeChild(link);
    }

    // Add export history button event listener
    const exportHistoryBtn = document.getElementById('exportHistoryBtn');
    if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', function() {
            exportHistoryToExcel();
        });
    }
});