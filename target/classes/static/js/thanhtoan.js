// Dữ liệu mẫu CartResponse
let cartItems = [];

// Hàm định dạng số tiền
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

// Hàm tính tổng tiền
function calculateTotal() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.giaBan * item.soLuong), 0);
    const shippingFee = 20000; // Phí vận chuyển cố định
    const discount = document.getElementById('discount-row').style.display === 'none' ? 0 : parseInt(document.getElementById('discount').textContent.replace(/\D/g, ''));
    const total = subtotal + shippingFee - discount;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('total-amount').textContent = formatCurrency(total);

    return {
        subtotal: subtotal,
        shippingFee: shippingFee,
        discount: discount,
        total: total
    };
}

// Render các món hàng
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<p>Giỏ hàng của bạn đang trống.</p>';
        return;
    }

    cartItems.forEach(item => {
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';

        cartItemElement.innerHTML = `
                <img src="${item.hinhAnh}" alt="${item.tenMon}">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.tenMon}</div>
                    <div class="cart-item-size">Size: ${item.tenSize}</div>
                    <div class="cart-item-quantity">Số lượng: ${item.soLuong}</div>
                    ${item.ghiChu ? `<div class="cart-item-note">Ghi chú: ${item.ghiChu}</div>` : ''}
                </div>
                <div class="cart-item-price">${formatCurrency(item.giaBan * item.soLuong)}</div>
            `;

        cartItemsContainer.appendChild(cartItemElement);
    });

    calculateTotal();
}

// Xử lý sự kiện khi chọn phương thức thanh toán
function setupPaymentOptions() {
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.payment-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            this.querySelector('input').checked = true;
        });
    });
}

// Xử lý sự kiện áp dụng mã giảm giá
function setupCouponHandler() {
    document.getElementById('applyCoupon').addEventListener('click', function() {
        const couponCode = document.getElementById('couponCode').value.trim();

        if (!couponCode) {
            alert('Vui lòng nhập mã giảm giá');
            return;
        }

        // Giả lập kiểm tra mã giảm giá
        if (couponCode === 'DISCOUNT10') {
            const subtotal = cartItems.reduce((sum, item) => sum + (item.giaBan * item.soLuong), 0);
            const discount = Math.floor(subtotal * 0.1); // Giảm 10%

            document.getElementById('discount-row').style.display = 'flex';
            document.getElementById('discount').textContent = formatCurrency(discount);
            calculateTotal();

            alert('Đã áp dụng mã giảm giá thành công!');
        } else {
            alert('Mã giảm giá không hợp lệ!');
        }
    });
}

// Xử lý sự kiện đặt hàng
function setupOrderHandler() {
    document.getElementById('place-order').addEventListener('click', function() {
        const customerForm = document.getElementById('customer-form');

        // Kiểm tra form
        if (!customerForm.checkValidity()) {
            customerForm.reportValidity();
            return;
        }

        // Lấy thông tin từ form
        const customerInfo = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            city: document.getElementById('city').value,
            district: document.getElementById('district').value,
            ward: document.getElementById('ward').value,
            address: document.getElementById('address').value,
            note: document.getElementById('note').value
        };

        // Lấy phương thức thanh toán
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        // Tính toán và lấy thông tin đơn hàng
        const orderTotals = calculateTotal();

        // Chuẩn bị dữ liệu theo định dạng InvoiceRequest
        const items = cartItems.map(item => ({
            id: item.idMon.toString(),
            name: item.tenMon,
            quantity: item.soLuong.toString(),
            price: item.giaBan.toString(),
            totalPrice: (item.giaBan * item.soLuong).toString(),
            discount: "0"
        }));

        const invoiceRequest = {
            orderDetails: {
                items: items,
                subtotal: orderTotals.subtotal.toString(),
                shippingFee: orderTotals.shippingFee.toString(),
                totalAmount: orderTotals.total.toString(),
                couponCode: document.getElementById('couponCode').value.trim()
            },
            customerInfo: {
                email: customerInfo.email,
                fullName: customerInfo.fullName,
                phone: customerInfo.phone,
                address: customerInfo.address,
                city: customerInfo.city,
                district: customerInfo.district,
                ward: customerInfo.ward,
                note: customerInfo.note
            },
            paymentMethod: paymentMethod
        };

        console.log("Đã gửi đơn hàng:", invoiceRequest);

        // Gửi đơn hàng lên server
        sendOrder(invoiceRequest);
    });
}

// Hàm gửi đơn hàng lên server
function sendOrder(invoiceRequest) {
    // Giả lập trong trường hợp không có kết nối API thực
    setTimeout(() => {
        alert("Đặt hàng thành công! Cảm ơn bạn đã mua hàng.");
        // Redirect về trang chủ hoặc trang xác nhận đơn hàng
        // window.location.href = '/order-confirmation';
    }, 1000);

    // Trong thực tế sẽ gọi API để gửi đơn hàng
    fetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceRequest)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/order-confirmation/' + data.orderId;
            } else {
                alert('Có lỗi xảy ra: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại sau!');
        });
}

// Giả lập việc lấy dữ liệu giỏ hàng từ API
function fetchCartItems() {
    // Dữ liệu mẫu cho trường hợp không có API thực
    cartItems = [
        {
            idMon: 1,
            tenMon: "Cà phê sữa đá",
            hinhAnh: "https://example.com/coffee.jpg",
            giaBan: 29000,
            soLuong: 2,
            tenSize: "M",
            ghiChu: "Ít đá, ít đường"
        },
        {
            idMon: 2,
            tenMon: "Trà đào cam sả",
            hinhAnh: "https://example.com/tea.jpg",
            giaBan: 35000,
            soLuong: 1,
            tenSize: "L",
            ghiChu: ""
        }
    ];

    // Sử dụng API thực trong môi trường production
    fetch('/api/cart')
        .then(response => response.json())
        .then(data => {
            cartItems = data;
            renderCartItems();
        })
        .catch(error => {
            console.log("Sử dụng dữ liệu mẫu do không thể kết nối API", error);
            renderCartItems();
        });
}

// Lấy thông tin hồ sơ người dùng
function fetchUserProfile() {
    fetch('/ho-so')
        .then(response => response.json())
        .then(data => {
            if (data) {
                document.getElementById('fullName').value = data.hoTen;
                document.getElementById('email').value = data.email;
                document.getElementById('phone').value = data.sdt;
                document.getElementById('address').value = data.diaChi;
            }
        })
        .catch(error => {
            console.log("Không thể lấy thông tin hồ sơ", error);
        });
}

// Hàm khởi tạo
function initCheckout() {
    fetchCartItems();
    fetchUserProfile();
    setupPaymentOptions();
    setupCouponHandler();
    setupOrderHandler();
}

// Chạy khi trang được tải
document.addEventListener('DOMContentLoaded', initCheckout);