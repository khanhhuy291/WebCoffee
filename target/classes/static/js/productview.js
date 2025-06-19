document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const productModal = document.getElementById('productModal');
    const viewProductModal = document.getElementById('viewProductModal');
    const deleteModal = document.getElementById('deleteModal');
    const productForm = document.getElementById('productForm');
    const productTable = document.getElementById('productTable');
    const searchInput = document.getElementById('searchProduct');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const emptyState = document.getElementById('emptyState');
    const modalTitle = document.getElementById('modalTitle');

    // CSRF Token
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    // Variables
    let currentProductId = null;
    let deleteProductId = null;

    // Event Listeners
    document.getElementById('openAddProductModal').addEventListener('click', openAddProductModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.querySelector('#productModal .close-btn').addEventListener('click', closeModal);
    document.querySelector('#viewProductModal .close-btn').addEventListener('click', () => closeModal('view'));
    document.getElementById('closeViewModalBtn').addEventListener('click', () => closeModal('view'));
    document.getElementById('editFromViewBtn').addEventListener('click', editFromViewModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => closeModal('delete'));
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

    // Image preview
    document.getElementById('productImage').addEventListener('change', previewImage);

    // Search
    searchInput.addEventListener('input', filterProducts);

    // Category filter
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterProducts();
        });
    });

    // Form submission
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitProductForm();
    });

    // Export to Excel
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);

    // Table action buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            viewProduct(productId);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            editProduct(productId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            openDeleteModal(productId);
        });
    });

    // Functions
    function openAddProductModal() {
        modalTitle.textContent = 'Thêm Sản Phẩm';
        productForm.reset();
        document.getElementById('productId').value = '';
        document.getElementById('previewImg').style.display = 'none';
        document.getElementById('previewText').style.display = 'block';
        productModal.style.display = 'block';
        currentProductId = null;
    }

    function closeModal(type = 'add') {
        if (type === 'view') {
            viewProductModal.style.display = 'none';
        } else if (type === 'delete') {
            deleteModal.style.display = 'none';
        } else {
            productModal.style.display = 'none';
        }
    }

    function previewImage() {
        const fileInput = document.getElementById('productImage');
        const previewImg = document.getElementById('previewImg');
        const previewText = document.getElementById('previewText');

        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();

            reader.onload = function(e) {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
                previewText.style.display = 'none';
            };

            reader.readAsDataURL(fileInput.files[0]);
        }
    }

    function submitProductForm() {
        const formData = new FormData(productForm);
        const productId = document.getElementById('productId').value;
        const isUpdate = productId && productId !== '';
        const url = isUpdate ? '/products/update' : '/products/add';
        const method = isUpdate ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                [header]: token
            },
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                showNotification(isUpdate ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!', 'success');
                closeModal();
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            })
            .catch(error => {
                showNotification('Có lỗi xảy ra: ' + error.message, 'error');
            });
    }

    function viewProduct(productId) {
        fetch(`/products/${productId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(product => {
                document.getElementById('detailName').textContent = product.tenMon;
                document.getElementById('detailCategory').textContent = product.loaiMon;
                document.getElementById('detailDescription').textContent = product.moTa || 'Không có mô tả';
                document.getElementById('detailImage').src = product.path;

                // Format prices
                const formatPrice = (price) => price ? new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ' : 'N/A';

                // Populate prices for each size
                let priceS = 'N/A', priceM = 'N/A', priceL = 'N/A';

                if (product.giaMonSizeResponses && product.giaMonSizeResponses.length > 0) {
                    product.giaMonSizeResponses.forEach(price => {
                        if (price.idSize === 1) priceS = formatPrice(price.giaBan);
                        if (price.idSize === 2) priceM = formatPrice(price.giaBan);
                        if (price.idSize === 3) priceL = formatPrice(price.giaBan);
                    });
                }

                document.getElementById('detailPriceS').textContent = priceS;
                document.getElementById('detailPriceM').textContent = priceM;
                document.getElementById('detailPriceL').textContent = priceL;

                // Store product ID for edit button
                document.getElementById('editFromViewBtn').setAttribute('data-id', productId);

                viewProductModal.style.display = 'block';
            })
            .catch(error => {
                showNotification('Không thể tải thông tin sản phẩm: ' + error.message, 'error');
            });
    }

    function editProduct(productId) {
        fetch(`/products/${productId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(product => {
                modalTitle.textContent = 'Cập Nhật Sản Phẩm';

                // Populate form fields
                document.getElementById('productId').value = product.idMon;
                document.getElementById('productName').value = product.tenMon;
                document.getElementById('productCategory').value = product.loaiMon;
                document.getElementById('productDescription').value = product.moTa || '';

                // Reset prices
                document.getElementById('priceS').value = '';
                document.getElementById('priceM').value = '';
                document.getElementById('priceL').value = '';

                // Set prices if available
                if (product.giaMonSizeResponses && product.giaMonSizeResponses.length > 0) {
                    product.giaMonSizeResponses.forEach(price => {
                        if (price.idSize === 1) document.getElementById('priceS').value = price.giaBan;
                        if (price.idSize === 2) document.getElementById('priceM').value = price.giaBan;
                        if (price.idSize === 3) document.getElementById('priceL').value = price.giaBan;
                    });
                }

                // Show image preview if available
                if (product.path) {
                    document.getElementById('previewImg').src = product.path;
                    document.getElementById('previewImg').style.display = 'block';
                    document.getElementById('previewText').style.display = 'none';
                } else {
                    document.getElementById('previewImg').style.display = 'none';
                    document.getElementById('previewText').style.display = 'block';
                }

                currentProductId = product.idMon;
                productModal.style.display = 'block';
            })
            .catch(error => {
                showNotification('Không thể tải thông tin sản phẩm: ' + error.message, 'error');
            });
    }

    function editFromViewModal() {
        const productId = document.getElementById('editFromViewBtn').getAttribute('data-id');
        closeModal('view');
        editProduct(productId);
    }

    function openDeleteModal(productId) {
        deleteProductId = productId;
        deleteModal.style.display = 'block';
    }

    function confirmDelete() {
        if (!deleteProductId) return;

        fetch(`/products/delete/${deleteProductId}`, {
            method: 'DELETE',
            headers: {
                [header]: token,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                showNotification('Xóa sản phẩm thành công!', 'success');
                closeModal('delete');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            })
            .catch(error => {
                showNotification('Không thể xóa sản phẩm: ' + error.message, 'error');
            });
    }

    function filterProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = document.querySelector('.category-tab.active').getAttribute('data-category');
        const rows = productTable.querySelectorAll('tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const productName = row.querySelector('td[data-label="Tên Sản Phẩm"]').textContent.toLowerCase();
            const category = row.getAttribute('data-category');

            const matchesSearch = productName.includes(searchTerm);
            const matchesCategory = selectedCategory === 'all' || category === selectedCategory;

            if (matchesSearch && matchesCategory) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Show empty state if no results
        if (visibleCount === 0) {
            emptyState.style.display = 'block';
            productTable.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            productTable.style.display = 'table';
        }
    }

    function exportToExcel() {
        // This is just a placeholder - in a real implementation, you would
        // make an AJAX call to a server endpoint that generates an Excel file
        const selectedCategory = document.querySelector('.category-tab.active').getAttribute('data-category');

        fetch(`/admin/products/export?category=${selectedCategory}`, {
            method: 'GET',
            headers: {
                [header]: token
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Export failed');
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `products_${selectedCategory === 'all' ? 'all' : selectedCategory}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                showNotification('Xuất Excel thất bại: ' + error.message, 'error');
            });
    }

    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = 'notification ' + type;
        notification.style.display = 'block';

        // Auto hide after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
});