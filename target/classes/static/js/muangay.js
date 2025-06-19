console.log("muangay.js is loaded");

document.addEventListener("DOMContentLoaded", function () {




    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");
    const closeMenu = document.getElementById("close-menu"); // Đóng menu
    const menuCart = document.getElementById("menu-cart");
    const cartbar = document.getElementById("cartbar");
    const closeCart = document.getElementById("close-cart"); // Đóng giỏ hàng

    // Mở thanh menu khi nhấn vào menu toggle
    menuToggle.addEventListener("click", function () {
        sidebar.classList.add("active");
    });

    // Đóng thanh menu khi nhấn vào nút đóng
    closeMenu.addEventListener("click", function () {
        sidebar.classList.remove("active");
    });

    // Mở thanh giỏ hàng khi nhấn vào menu cart
    menuCart.addEventListener("click", function () {
        cartbar.classList.add("active");
    });

    // Đóng thanh giỏ hàng khi nhấn vào nút đóng giỏ hàng
    closeCart.addEventListener("click", function () {
        cartbar.classList.remove("active");
    });

    // Xử lý các menu có submenu
    document.querySelectorAll(".has-submenu > a").forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            this.parentElement.classList.toggle("active");
        });
    });

    // Chức năng các nút tăng/giảm số lượng
    const decreaseBtns = document.querySelectorAll('.decrease');
    const increaseBtns = document.querySelectorAll('.increase');
    const removeItemBtns = document.querySelectorAll('.cart-item-remove');
    const quantityInputs = document.querySelectorAll('.quantity-input');

    decreaseBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.nextElementSibling;
            let value = parseInt(input.value);
            if (value > 1) {
                input.value = value - 1;
                capNhatTongTien();
                capNhatLocalStorage(); // Đã sửa để lưu đúng vào localStorage
            }
        });
    });

    increaseBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.previousElementSibling;
            let value = parseInt(input.value);
            input.value = value + 1;
            capNhatTongTien();
            capNhatLocalStorage(); // Đã sửa để lưu đúng vào localStorage
        });
    });

    // Thêm chức năng nhập số lượng trực tiếp
    quantityInputs.forEach(input => {
        // Xử lý khi người dùng nhập số lượng
        input.addEventListener('input', function () {
            // Đảm bảo giá trị nhập vào là số nguyên dương
            let value = parseInt(this.value);

            // Nếu người dùng xóa hết số hoặc nhập một giá trị không phải số
            if (isNaN(value) || value <= 0) {
                this.value = 1;
            }

            // Cập nhật tổng tiền và localStorage sau mỗi thay đổi
            capNhatTongTien();
            capNhatLocalStorage(); // Đã sửa để lưu đúng vào localStorage
        });

        // Xử lý khi người dùng rời khỏi ô nhập
        input.addEventListener('blur', function () {
            // Đảm bảo giá trị tối thiểu là 1
            if (this.value === '' || parseInt(this.value) < 1) {
                this.value = 1;
            }
            // Cập nhật tổng tiền và localStorage
            capNhatTongTien();
            capNhatLocalStorage(); // Đã sửa để lưu đúng vào localStorage
        });

        // Xử lý khi người dùng nhấn Enter
        input.addEventListener('keyup', function (e) {
            if (e.key === 'Enter') {
                this.blur(); // Loại bỏ focus khỏi input
                capNhatTongTien();
                capNhatLocalStorage(); // Đã sửa để lưu đúng vào localStorage
            }
        });

        // Ngăn chặn các ký tự không phải số
        input.addEventListener('keypress', function (e) {
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
    });

    removeItemBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.cart-item').remove();
            capNhatTongTien();
            capNhatSoLuongGioHang();
            capNhatLocalStorage(); // Đã sửa để lưu đúng vào localStorage
            kiemTraGioHangTrong(); // Kiểm tra xem giỏ hàng có trống không sau khi xóa
        });
    });

    // Hàm cập nhật tổng tiền
    function capNhatTongTien() {
        const cartItems = document.querySelectorAll('.cart-item');
        let total = 0;

        cartItems.forEach(item => {
            const quantityInput = item.querySelector('.quantity-input');
            const priceElement = item.querySelector('.cart-item-price');

            if (quantityInput && priceElement) {
                const quantity = parseInt(quantityInput.value) || 1; // Mặc định là 1 nếu không hợp lệ
                const priceText = priceElement.textContent;
                const price = parseInt(priceText.replace(/\D/g, ''));
                total += quantity * price;
            }
        });

        document.querySelector('.cart-total-price').textContent = dinhDangTien(total) + 'đ';
        ganSuKienChoGioHang();
    }

    // Hàm cập nhật số lượng sản phẩm trong giỏ hàng
    function capNhatSoLuongGioHang() {
        let tongSoLuong = 0;
        const quantityInputs = document.querySelectorAll('.cart-item .quantity-input');

        quantityInputs.forEach(input => {
            const soLuong = parseInt(input.value) || 0;
            tongSoLuong += soLuong;
        });

        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = tongSoLuong;
        }

    }

    // Hàm định dạng tiền tệ
    function dinhDangTien(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Khởi tạo giỏ hàng
    capNhatTongTien();
    capNhatSoLuongGioHang();
});
// Hàm cập nhật giỏ hàng qua AJAX
function ajaxAddToCart(idMon, tenSize, soLuong, ghiChu) {
    // Lấy CSRF token từ meta tags
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    // Tạo dữ liệu gửi đi
    const data = {
        idMon: idMon,
        tenSize: tenSize,
        soLuong: soLuong,
        ghiChu: ghiChu || ""
    };

    // Gửi request AJAX để thêm vào giỏ hàng
    fetch('/api/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            [header]: token
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('Không thể thêm vào giỏ hàng');
        })
        .then(message => {
            console.log(message);
            // Sau khi thêm thành công, tải lại thông tin giỏ hàng
            loadCartItems();

            // Hiển thị thông báo thành công
            showNotification("Đã thêm sản phẩm vào giỏ hàng!", "success");

            // Tự động mở giỏ hàng
            document.getElementById("cartbar").classList.add("active");
        })
        .catch(error => {
            console.error('Lỗi:', error);
            showNotification("Có lỗi xảy ra khi thêm sản phẩm!", "error");
        });
}

// Hàm tải thông tin giỏ hàng
function loadCartItems() {
    // Lấy CSRF token từ meta tags
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    fetch('/api/cart/items', {
        method: 'GET',
        headers: {
            [header]: token
        }
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Không thể tải giỏ hàng');
        })
        .then(cartItems => {
            updateCartUI(cartItems);
        })
        .catch(error => {
            console.error('Lỗi khi tải giỏ hàng:', error);
        });
}

// Hàm cập nhật giao diện giỏ hàng
function updateCartUI(cartItems) {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountElement = document.querySelector('.cart-count');

    // Cập nhật số lượng sản phẩm trong giỏ hàng
    cartCountElement.textContent = cartItems.length;

    // Nếu giỏ hàng trống
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <p>Giỏ hàng của bạn đang trống</p>
                <a href="/menu" class="continue-shopping">Tiếp tục mua sắm</a>
            </div>
        `;
        return;
    }

    // Tạo HTML cho các sản phẩm trong giỏ hàng
    let cartItemsHtml = '';
    let totalPrice = 0;

    cartItems.forEach(item => {
        const itemTotal = item.giaBan * item.soLuong;
        totalPrice += itemTotal;

        cartItemsHtml += `
            <div class="cart-item" data-mon-id="${item.idMon}" data-size-id="${item.idSize}">
                <div class="cart-item-image">
                    <img src="${item.hinhAnh}" alt="${item.tenMon}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.tenMon}</div>
                    <div class="cart-item-size">Size: ${item.tenSize}</div>
                    <div class="cart-item-price">${formatCurrency(item.giaBan)}</div>
                    <div class="cart-item-quantity">
                        <button class="decrease" onclick="updateCartItemQuantity(${item.idMon}, '${item.tenSize}', -1)">-</button>
                        <input type="number" class="quantity-input" value="${item.soLuong}" min="1" 
                               onchange="updateCartInputQuantity(${item.idMon}, '${item.tenSize}', this.value)">
                        <button class="increase" onclick="updateCartItemQuantity(${item.idMon}, '${item.tenSize}', 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeCartItem(${item.idMon}, '${item.tenSize}')">✖</button>
            </div>
        `;
    });

    // Cập nhật HTML của giỏ hàng
    cartItemsContainer.innerHTML = cartItemsHtml + `
        <div class="cart-summary">
            <div class="cart-total">
                <span>Tổng cộng:</span>
                <span>${formatCurrency(totalPrice)}</span>
            </div>
            <a href="/thanh-toan" class="checkout-button">Thanh toán</a>
        </div>
    `;
}

// Hàm cập nhật số lượng sản phẩm
function updateCartItemQuantity(idMon, tenSize, soLuongThayDoi) {
    // Lấy CSRF token từ meta tags
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    // Tạo dữ liệu gửi đi
    const data = {
        idMon: idMon,
        tenSize: tenSize,
        soLuongThayDoi: soLuongThayDoi
    };

    fetch('/api/cart/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            [header]: token
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('Không thể cập nhật giỏ hàng');
        })
        .then(message => {
            console.log(message);
            // Sau khi cập nhật thành công, tải lại thông tin giỏ hàng
            loadCartItems();
        })
        .catch(error => {
            console.error('Lỗi:', error);
            showNotification("Có lỗi xảy ra khi cập nhật giỏ hàng!", "error");
        });
}

// Hàm cập nhật số lượng từ ô input
function updateCartInputQuantity(idMon, tenSize, soLuongMoi) {
    // Lấy số lượng cũ để tính số lượng thay đổi
    const cartItems = document.querySelectorAll('.cart-item');
    let soLuongCu = 1;

    cartItems.forEach(item => {
        if (item.dataset.monId == idMon && item.dataset.sizeId == tenSize) {
            const input = item.querySelector('.quantity-input');
            soLuongCu = parseInt(input.getAttribute('value'));
        }
    });

    const soLuongThayDoi = parseInt(soLuongMoi) - soLuongCu;

    // Nếu có sự thay đổi, gửi yêu cầu cập nhật
    if (soLuongThayDoi !== 0) {
        updateCartItemQuantity(idMon, tenSize, soLuongThayDoi);
    }
}

// Hàm xóa sản phẩm khỏi giỏ hàng
function removeCartItem(idMon, tenSize) {
    // Lấy CSRF token từ meta tags
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    // Tạo dữ liệu gửi đi
    const data = {
        idMon: idMon,
        tenSize: tenSize
    };

    fetch('/api/cart/remove', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            [header]: token
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('Không thể xóa sản phẩm khỏi giỏ hàng');
        })
        .then(message => {
            console.log(message);
            // Sau khi xóa thành công, tải lại thông tin giỏ hàng
            loadCartItems();
            showNotification("Đã xóa sản phẩm khỏi giỏ hàng!", "success");
        })
        .catch(error => {
            console.error('Lỗi:', error);
            showNotification("Có lỗi xảy ra khi xóa sản phẩm!", "error");
        });
}

// Hàm hiển thị thông báo
function showNotification(message, type) {
    // Kiểm tra xem đã có phần tử notification chưa
    let notification = document.querySelector('.notification');

    // Nếu chưa có, tạo mới
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }

    // Thêm class cho loại thông báo (success/error)
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';

    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Hàm định dạng tiền tệ
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Tải giỏ hàng khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    loadCartItems();

    // Tìm nút "Thêm vào giỏ hàng" và gắn sự kiện
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Lấy thông tin sản phẩm từ form
            const idMon = this.dataset.idMon;
            const tenSize = document.querySelector('input[name="size"]:checked').value;
            const soLuong = parseInt(document.querySelector('.quantity-input').value);
            const ghiChu = document.querySelector('textarea[name="ghiChu"]')?.value || "";

            // Thêm vào giỏ hàng qua AJAX
            ajaxAddToCart(idMon, tenSize, soLuong, ghiChu);
        });
    }
});

window.addEventListener("pageshow", function (event) {
    if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
        hienThiGioHang();
    }
});