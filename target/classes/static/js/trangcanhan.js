// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Menu & Cart Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeMenu = document.getElementById('close-menu');
    const menuCart = document.getElementById('menu-cart');
    const cartbar = document.getElementById('cartbar');
    const closeCart = document.getElementById('close-cart');
    const body = document.body;

    // Tab Navigation
    const menuItems = document.querySelectorAll('.menu-item');
    const contentTabs = document.querySelectorAll('.content-tabs');

    // Avatar Upload
    const avatarContainer = document.getElementById('avatar-container');
    const avatarModal = document.getElementById('avatar-modal');
    const closeModal = document.getElementById('close-modal');
    const avatarInput = document.getElementById('avatar-input');
    const triggerUpload = document.getElementById('trigger-upload');
    const previewImage = document.getElementById('preview-image');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarForm = document.getElementById('avatar-form');

    // Forms
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');

    // Menu & Cart Toggle Functions
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.add('open');
            body.classList.add('no-scroll');
        });
    }

    if (closeMenu) {
        closeMenu.addEventListener('click', function() {
            sidebar.classList.remove('open');
            body.classList.remove('no-scroll');
        });
    }

    if (menuCart) {
        menuCart.addEventListener('click', function() {
            cartbar.classList.add('open');
            body.classList.add('no-scroll');
        });
    }

    if (closeCart) {
        closeCart.addEventListener('click', function() {
            cartbar.classList.remove('open');
            body.classList.remove('no-scroll');
        });
    }

    // Click outside to close sidebar and cart
    document.addEventListener('click', function(event) {
        if (sidebar && sidebar.classList.contains('open') &&
            !sidebar.contains(event.target) &&
            !menuToggle.contains(event.target)) {
            sidebar.classList.remove('open');
            body.classList.remove('no-scroll');
        }

        if (cartbar && cartbar.classList.contains('open') &&
            !cartbar.contains(event.target) &&
            !menuCart.contains(event.target)) {
            cartbar.classList.remove('open');
            body.classList.remove('no-scroll');
        }
    });

    // Tab Navigation
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');

            // Remove active class from all tabs and content
            menuItems.forEach(i => i.classList.remove('active'));
            contentTabs.forEach(tab => tab.classList.remove('active'));

            // Add active class to selected tab and content
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Avatar Upload Functionality
    if (avatarContainer) {
        avatarContainer.addEventListener('click', function() {
            avatarModal.style.display = 'block';
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', function() {
            avatarModal.style.display = 'none';
        });
    }

    if (triggerUpload) {
        triggerUpload.addEventListener('click', function() {
            avatarInput.click();
        });
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];

                // Check if file is an image
                if (!file.type.match('image.*')) {
                    alert('Vui lòng chọn một file hình ảnh.');
                    return;
                }

                // Check file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Kích thước file không được vượt quá 5MB.');
                    return;
                }

                const reader = new FileReader();

                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    previewImage.style.display = 'block';
                    uploadPlaceholder.style.display = 'none';
                    avatarPreview.classList.add('has-image');
                };

                reader.readAsDataURL(file);
            }
        });
    }

    // Drag and drop functionality for avatar upload
    if (avatarPreview) {
        avatarPreview.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });

        avatarPreview.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });

        avatarPreview.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');

            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];

                // Check if file is an image
                if (!file.type.match('image.*')) {
                    alert('Vui lòng chọn một file hình ảnh.');
                    return;
                }

                // Check file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Kích thước file không được vượt quá 5MB.');
                    return;
                }

                // Update file input
                avatarInput.files = e.dataTransfer.files;

                const reader = new FileReader();

                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    previewImage.style.display = 'block';
                    uploadPlaceholder.style.display = 'none';
                    avatarPreview.classList.add('has-image');
                };

                reader.readAsDataURL(file);
            }
        });

        avatarPreview.addEventListener('click', function() {
            avatarInput.click();
        });
    }

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === avatarModal) {
            avatarModal.style.display = 'none';
        }
    });

    // Form validation for profile form
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            const hoTen = this.querySelector('input[name="hoTen"]').value;
            const email = this.querySelector('input[name="email"]').value;
            const sdt = this.querySelector('input[name="sdt"]').value;

            if (!hoTen || hoTen.trim() === '') {
                e.preventDefault();
                alert('Vui lòng nhập họ tên.');
                return;
            }

            if (!email || email.trim() === '') {
                e.preventDefault();
                alert('Vui lòng nhập email.');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                e.preventDefault();
                alert('Vui lòng nhập đúng định dạng email.');
                return;
            }

            if (!sdt || sdt.trim() === '') {
                e.preventDefault();
                alert('Vui lòng nhập số điện thoại.');
                return;
            }

            // Phone number validation (Vietnam)
            const phoneRegex = /^(0|\+84)(\d{9,10})$/;
            if (!phoneRegex.test(sdt)) {
                e.preventDefault();
                alert('Vui lòng nhập đúng định dạng số điện thoại.');
                return;
            }
        });
    }

    // Form validation for password form
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            const currentPassword = this.querySelector('input[name="currentPassword"]').value;
            const newPassword = this.querySelector('input[name="newPassword"]').value;
            const confirmPassword = this.querySelector('input[name="confirmPassword"]').value;

            if (!currentPassword || currentPassword.trim() === '') {
                e.preventDefault();
                alert('Vui lòng nhập mật khẩu hiện tại.');
                return;
            }

            if (!newPassword || newPassword.trim() === '') {
                e.preventDefault();
                alert('Vui lòng nhập mật khẩu mới.');
                return;
            }

            if (newPassword.length < 8) {
                e.preventDefault();
                alert('Mật khẩu mới phải có ít nhất 8 ký tự.');
                return;
            }

            if (!confirmPassword || confirmPassword.trim() === '') {
                e.preventDefault();
                alert('Vui lòng xác nhận mật khẩu mới.');
                return;
            }

            if (newPassword !== confirmPassword) {
                e.preventDefault();
                alert('Xác nhận mật khẩu không khớp với mật khẩu mới.');
                return;
            }
        });
    }

    // Success message handling
    const urlParams = new URLSearchParams(window.location.search);
    const successMessage = urlParams.get('success');
    const errorMessage = urlParams.get('error');

    if (successMessage) {
        showNotification(decodeURIComponent(successMessage), 'success');
    }

    if (errorMessage) {
        showNotification(decodeURIComponent(errorMessage), 'error');
    }

    // Notification function
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Hide and remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Handle edit profile button
    const editProfileBtn = document.querySelector('.edit-profile');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            // Switch to profile tab
            menuItems.forEach(i => i.classList.remove('active'));
            contentTabs.forEach(tab => tab.classList.remove('active'));

            document.querySelector('[data-tab="profile"]').classList.add('active');
            document.getElementById('profile-tab').classList.add('active');
        });
    }

    // Add CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            max-width: 300px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transform: translateY(-20px);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .notification.success {
            background-color: #4CAF50;
        }
        
        .notification.error {
            background-color: #F44336;
        }
        
        .avatar-preview {
            cursor: pointer;
            position: relative;
            width: 150px;
            height: 150px;
            border-radius: 4px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            border: 2px dashed #ddd;
            margin: 0 auto;
            transition: all 0.3s ease;
        }
        
        .avatar-preview.drag-over {
            border-color: #bd9d3b;
            background-color: rgba(189, 157, 59, 0.1);
        }
        
        .avatar-preview.has-image {
            border-style: solid;
        }
        
        #preview-image {
            max-width: 100%;
            max-height: 100%;
            display: none;
        }
        
        .upload-placeholder {
            text-align: center;
            color: #666;
            font-size: 14px;
            padding: 10px;
        }
        
        .upload-btn, .confirm-btn {
            display: block;
            width: 80%;
            max-width: 200px;
            margin: 15px auto;
            padding: 10px;
            background-color: #bd9d3b;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.3s ease;
        }
        
        .upload-btn:hover, .confirm-btn:hover {
            background-color: #a58a33;
        }
        
        .avatar-input {
            display: none;
        }
    `;
    document.head.appendChild(style);
});