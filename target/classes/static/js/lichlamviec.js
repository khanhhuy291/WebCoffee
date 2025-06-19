/**
 * Quản lý lịch làm việc
 * DND Coffee Admin
 */

// Khởi tạo các biến toàn cục
const token = document.querySelector('meta[name="_csrf"]').content;
const header = document.querySelector('meta[name="_csrf_header"]').content;
let currentAction = 'add';
let currentScheduleId = null;
let employees = [];
let shifts = [];

// Khởi tạo ứng dụng khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Khởi tạo ứng dụng và các thành phần giao diện
function initializeApp() {
    // Tải dữ liệu ban đầu
    loadEmployees();
    loadShifts();
    checkEmptyState();

    // Khởi tạo các sự kiện
    initializeEventListeners();
}

// Khởi tạo các sự kiện trong ứng dụng
function initializeEventListeners() {
    // Nút thêm lịch làm việc
    document.getElementById('openAddModal').addEventListener('click', () => {
        openModal('add');
    });

    // Đóng modal khi nhấn vào nút đóng
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);

    // Đóng modal khi nhấn ra ngoài
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('scheduleModal');
        const deleteModal = document.getElementById('deleteModal');
        if (event.target === modal) {
            closeModal();
        }
        if (event.target === deleteModal) {
            document.getElementById('deleteModal').style.display = 'none';
        }
    });

    // Xử lý form submit
    document.getElementById('scheduleForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSchedule();
    });

    // Xử lý tìm kiếm
    document.getElementById('searchInput').addEventListener('input', searchSchedules);

    // Xử lý lọc theo nhân viên
    document.getElementById('employeeFilter').addEventListener('change', filterByEmployee);

    // Xử lý nút hủy xóa
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        document.getElementById('deleteModal').style.display = 'none';
    });

    // Xử lý nút xác nhận xóa
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

    // Xử lý các nút action trong bảng
    initializeTableActionButtons();
}

// Khởi tạo các nút hành động trong bảng
function initializeTableActionButtons() {
    // Nút xem chi tiết
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const scheduleId = this.getAttribute('data-id');
            viewSchedule(scheduleId);
        });
    });

    // Nút chỉnh sửa
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const scheduleId = this.getAttribute('data-id');
            editSchedule(scheduleId);
        });
    });

    // Nút xóa
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const scheduleId = this.getAttribute('data-id');
            showDeleteConfirmation(scheduleId);
        });
    });
}

// Tải danh sách nhân viên
function loadEmployees() {
    fetch('/admin/employee/all')
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải danh sách nhân viên');
            }
            return response.json();
        })
        .then(data => {
            employees = data;

            // Cập nhật select trong form
            const selectElement = document.getElementById('userId');
            selectElement.innerHTML = '<option value="">-- Chọn nhân viên --</option>';

            // Cập nhật select bộ lọc
            const filterElement = document.getElementById('employeeFilter');
            filterElement.innerHTML = '<option value="">Tất cả nhân viên</option>';

            // Thêm nhân viên vào các select
            data.forEach(employee => {
                // Thêm vào form select
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = employee.hoTen;
                selectElement.appendChild(option);

                // Thêm vào filter select
                const filterOption = document.createElement('option');
                filterOption.value = employee.id;
                filterOption.textContent = employee.hoTen;
                filterElement.appendChild(filterOption);
            });
        })
        .catch(error => {
            console.error('Lỗi khi tải nhân viên:', error);
            showNotification('Không thể tải danh sách nhân viên', 'error');
        });
}

// Tải danh sách ca làm việc
function loadShifts() {
    fetch('/admin/calamviec/all')
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải danh sách ca làm việc');
            }
            return response.json();
        })
        .then(data => {
            shifts = data;

            const selectElement = document.getElementById('shiftId');
            selectElement.innerHTML = '<option value="">-- Chọn ca làm việc --</option>';

            data.forEach(shift => {
                const option = document.createElement('option');
                option.value = shift.idCa;

                const startTime = new Date(shift.gioVao);
                const endTime = new Date(shift.gioRa);

                const startTimeStr = formatTime(startTime);
                const endTimeStr = formatTime(endTime);

                option.textContent = `Ca ${shift.idCa}: ${startTimeStr} - ${endTimeStr}`;

                selectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Lỗi khi tải ca làm việc:', error);
            showNotification('Không thể tải danh sách ca làm việc', 'error');
        });
}

// Mở modal thêm/sửa/xem lịch làm việc
function openModal(action, id = null) {
    currentAction = action;
    currentScheduleId = id;

    const modal = document.getElementById('scheduleModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('scheduleForm');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Reset form
    form.reset();
    document.getElementById('scheduleId').value = '';

    // Thiết lập các trường form theo action
    switch(action) {
        case 'add':
            modalTitle.textContent = 'Thêm Lịch Làm Việc';
            submitBtn.style.display = 'block';
            enableFormFields(true);

            // Set ngày mặc định là hôm nay
            const today = new Date();
            document.getElementById('workDate').value = formatDate(today);
            break;

        case 'edit':
            modalTitle.textContent = 'Cập Nhật Lịch Làm Việc';
            submitBtn.style.display = 'block';
            enableFormFields(true);

            if (id) {
                document.getElementById('scheduleId').value = id;
                fetchScheduleDetails(id);
            }
            break;

        case 'view':
            modalTitle.textContent = 'Chi Tiết Lịch Làm Việc';
            submitBtn.style.display = 'none';
            enableFormFields(false);

            if (id) {
                fetchScheduleDetails(id);
            }
            break;
    }

    modal.style.display = 'block';
}

// Bật/tắt các trường trong form
function enableFormFields(enabled) {
    const formElements = document.querySelectorAll('#scheduleForm select, #scheduleForm input');
    formElements.forEach(el => {
        el.disabled = !enabled;
    });
}

// Đóng modal
function closeModal() {
    document.getElementById('scheduleModal').style.display = 'none';
}

// Lấy thông tin chi tiết của lịch làm việc
function fetchScheduleDetails(scheduleId) {
    fetch(`/admin/lichlamviec/${scheduleId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải thông tin lịch làm việc');
            }
            return response.json();
        })
        .then(data => {
            // Điền dữ liệu vào form
            document.getElementById('userId').value = data.idUser;
            document.getElementById('shiftId').value = data.idCa;

            // Format ngày làm việc để hiển thị trong input date
            const workDate = new Date(data.ngayLam);
            document.getElementById('workDate').value = formatDate(workDate);
        })
        .catch(error => {
            console.error('Lỗi khi tải thông tin lịch làm việc:', error);
            showNotification('Không thể tải thông tin lịch làm việc', 'error');
            closeModal();
        });
}

// Lưu lịch làm việc
function saveSchedule() {
    // Lấy dữ liệu từ form
    const scheduleId = document.getElementById('scheduleId').value;
    const userId = document.getElementById('userId').value;
    const workDate = document.getElementById('workDate').value;
    const shiftId = document.getElementById('shiftId').value;

    // Validate dữ liệu
    if (!userId || !workDate || !shiftId) {
        showNotification('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }

    // Tạo đối tượng dữ liệu
    const scheduleData = {
        idLichLam: scheduleId || null,
        idUser: userId,
        ngayLam: workDate,
        idCa: shiftId
    };

    // Xác định endpoint API
    const url = scheduleId ? '/admin/lichlamviec/update' : '/admin/lichlamviec/add';

    // Gửi request lưu dữ liệu
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            [header]: token
        },
        body: JSON.stringify(scheduleData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể lưu lịch làm việc');
            }
            return response.json();
        })
        .then(data => {
            if (data.success || data.message) {
                // Hiển thị thông báo thành công
                const message = scheduleId ? 'Cập nhật lịch làm việc thành công' : 'Thêm lịch làm việc thành công';
                showNotification(message, 'success');

                // Đóng modal và tải lại trang
                closeModal();
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showNotification('Có lỗi xảy ra', 'error');
            }
        })
        .catch(error => {
            console.error('Lỗi khi lưu lịch làm việc:', error);
            showNotification('Không thể lưu lịch làm việc', 'error');
        });
}

// Xem chi tiết lịch làm việc
function viewSchedule(scheduleId) {
    openModal('view', scheduleId);
}

// Chỉnh sửa lịch làm việc
function editSchedule(scheduleId) {
    openModal('edit', scheduleId);
}

// Hiển thị xác nhận xóa
function showDeleteConfirmation(scheduleId) {
    currentScheduleId = scheduleId;
    document.getElementById('deleteModal').style.display = 'block';
}

// Xác nhận xóa lịch làm việc
function confirmDelete() {
    if (!currentScheduleId) return;

    fetch(`/admin/lichlamviec/${currentScheduleId}`, {
        method: 'DELETE',
        headers: {
            [header]: token
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể xóa lịch làm việc');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showNotification('Xóa lịch làm việc thành công', 'success');

                // Đóng modal và tải lại trang
                document.getElementById('deleteModal').style.display = 'none';
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showNotification(data.message || 'Có lỗi xảy ra khi xóa', 'error');
            }
        })
        .catch(error => {
            console.error('Lỗi khi xóa lịch làm việc:', error);
            showNotification('Không thể xóa lịch làm việc', 'error');
            document.getElementById('deleteModal').style.display = 'none';
        });
}

// Tìm kiếm lịch làm việc
function searchSchedules() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    let hasVisibleRows = false;

    // Tìm kiếm trong bảng
    const rows = document.querySelectorAll('#scheduleTable tbody tr');

    rows.forEach(row => {
        const employeeName = row.cells[1].textContent.toLowerCase();
        const date = row.cells[2].textContent.toLowerCase();
        const shift = row.cells[3].textContent.toLowerCase();

        // Kiểm tra giá trị tìm kiếm
        const matchesSearch = employeeName.includes(searchTerm) ||
            date.includes(searchTerm) ||
            shift.includes(searchTerm);

        row.style.display = matchesSearch ? '' : 'none';

        if (matchesSearch) {
            hasVisibleRows = true;
        }
    });

    // Hiển thị trạng thái trống nếu không có kết quả
    document.getElementById('emptyState').style.display = hasVisibleRows ? 'none' : 'flex';
}

// Lọc theo nhân viên
function filterByEmployee() {
    const employeeId = document.getElementById('employeeFilter').value;
    let hasVisibleRows = false;

    // Lọc trong bảng
    const rows = document.querySelectorAll('#scheduleTable tbody tr');

    rows.forEach(row => {
        const rowEmployeeId = getEmployeeIdByName(row.cells[1].textContent);

        // Hiển thị tất cả nếu không chọn nhân viên nào
        const shouldDisplay = !employeeId || rowEmployeeId == employeeId;

        row.style.display = shouldDisplay ? '' : 'none';

        if (shouldDisplay) {
            hasVisibleRows = true;
        }
    });

    // Hiển thị trạng thái trống nếu không có kết quả
    document.getElementById('emptyState').style.display = hasVisibleRows ? 'none' : 'flex';
}

// Kiểm tra và hiển thị trạng thái trống nếu không có dữ liệu
function checkEmptyState() {
    const rows = document.querySelectorAll('#scheduleTable tbody tr');

    if (rows.length === 0) {
        document.getElementById('emptyState').style.display = 'flex';
    } else {
        document.getElementById('emptyState').style.display = 'none';
    }
}

// Lấy ID nhân viên từ tên
function getEmployeeIdByName(name) {
    const employee = employees.find(emp => emp.hoTen === name);
    return employee ? employee.id : null;
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    // Kiểm tra container thông báo
    let container = document.getElementById('notification-container');

    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    // Tạo thông báo mới
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Thiết lập biểu tượng theo loại thông báo
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';

    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="notification-content">
            ${message}
        </div>
        <div class="notification-close">
            <i class="fas fa-times"></i>
        </div>
    `;

    // Thêm sự kiện đóng thông báo
    notification.querySelector('.notification-close').addEventListener('click', () => {
        container.removeChild(notification);
    });

    // Thêm thông báo vào container
    container.appendChild(notification);

    // Tự động ẩn thông báo sau 5 giây
    setTimeout(() => {
        if (notification.parentNode === container) {
            container.removeChild(notification);
        }
    }, 5000);
}

// Hàm tiện ích format thời gian
function formatTime(date) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// Hàm tiện ích format ngày tháng cho input date
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}