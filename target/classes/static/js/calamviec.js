/**
 * DND Coffee - Ca làm việc (Work Shift) Management
 * Handles all functionality for the work shift management page
 */

// Global variables
let currentShiftId = null;

/**
 * Initialize the page when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

/**
 * Initialize the page and attach event listeners
 */
function initializePage() {
    console.log("Initializing work shift management page...");

    // Check if table has data
    checkEmptyState();

    // Initialize event listeners
    initializeEventListeners();

    // Initialize time inputs to calculate duration
    initializeTimeInputs();
}

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Action buttons in table
    initializeTableActionButtons();

    // Add shift buttons
    document.getElementById('addShiftBtn').addEventListener('click', openAddShiftModal);
    document.getElementById('addShiftEmptyBtn')?.addEventListener('click', openAddShiftModal);

    // Modal close buttons
    document.getElementById('closeShiftModalBtn').addEventListener('click', () => closeModal('shiftModal'));
    document.getElementById('cancelShiftBtn').addEventListener('click', () => closeModal('shiftModal'));
    document.getElementById('closeViewModalBtn').addEventListener('click', () => closeModal('viewShiftModal'));
    document.getElementById('closeDetailBtn').addEventListener('click', () => closeModal('viewShiftModal'));
    document.getElementById('closeDeleteModalBtn').addEventListener('click', () => closeModal('deleteConfirmModal'));
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => closeModal('deleteConfirmModal'));

    // Save button
    document.getElementById('saveShiftBtn').addEventListener('click', saveShift);

    // Edit from view modal
    document.getElementById('editFromViewBtn').addEventListener('click', function() {
        closeModal('viewShiftModal');
        editShift(currentShiftId);
    });

    // Confirm delete
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteShift);

    // Search functionality
    document.querySelector('.search-input').addEventListener('input', handleSearch);

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
}

/**
 * Initialize table action buttons
 */
function initializeTableActionButtons() {
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const shiftId = row.querySelector('.shift-id').textContent;
            viewShift(shiftId);
        });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const shiftId = row.querySelector('.shift-id').textContent;
            editShift(shiftId);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const shiftId = row.querySelector('.shift-id').textContent;
            showDeleteConfirmation(shiftId);
        });
    });
}

/**
 * Initialize time inputs to calculate duration
 */
function initializeTimeInputs() {
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const durationElement = document.getElementById('shiftDuration').querySelector('span');

    function updateDuration() {
        if (startTimeInput.value && endTimeInput.value) {
            const start = parseTimeInput(startTimeInput.value);
            const end = parseTimeInput(endTimeInput.value);

            if (start && end) {
                let durationMinutes;
                if (end < start) {
                    // Assume end time is next day
                    durationMinutes = (24 * 60) - (start - end);
                } else {
                    durationMinutes = end - start;
                }

                const hours = Math.floor(durationMinutes / 60);
                const minutes = durationMinutes % 60;

                durationElement.textContent = `${hours} giờ ${minutes} phút`;

                // Add validation class
                if (durationMinutes <= 0) {
                    durationElement.parentElement.classList.add('invalid');
                } else {
                    durationElement.parentElement.classList.remove('invalid');
                }
            }
        } else {
            durationElement.textContent = '-';
            durationElement.parentElement.classList.remove('invalid');
        }
    }

    startTimeInput.addEventListener('input', updateDuration);
    endTimeInput.addEventListener('input', updateDuration);
}

/**
 * Open modal for adding a new work shift
 */
function openAddShiftModal() {
    currentShiftId = null;

    // Update modal title
    document.querySelector('.modal-title').textContent = 'Thêm ca làm việc mới';

    // Reset form
    document.getElementById('shiftForm').reset();
    document.getElementById('shiftId').value = '';
    document.getElementById('shiftDuration').querySelector('span').textContent = '-';

    // Show modal
    document.getElementById('shiftModal').style.display = 'block';
}

/**
 * Close modal by ID
 */
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

/**
 * Check if table has data and show empty state if needed
 */
function checkEmptyState() {
    const tableRows = document.querySelector('.shift-table tbody').querySelectorAll('tr');
    const emptyState = document.getElementById('emptyState');

    if (tableRows.length === 0) {
        document.querySelector('.table-responsive').style.display = 'none';
        emptyState.style.display = 'flex';
    } else {
        document.querySelector('.table-responsive').style.display = 'block';
        emptyState.style.display = 'none';
    }
}

/**
 * Handle search functionality
 */
function handleSearch() {
    const searchTerm = this.value.toLowerCase();
    const tableRows = document.querySelectorAll('.shift-table tbody tr');
    let hasVisibleRows = false;

    tableRows.forEach(row => {
        const shiftId = row.querySelector('.shift-id').textContent.toLowerCase();
        const startTime = row.querySelectorAll('.shift-time-cell')[0].textContent.trim().toLowerCase();
        const endTime = row.querySelectorAll('.shift-time-cell')[1].textContent.trim().toLowerCase();
        const duration = row.cells[3].textContent.toLowerCase();
        const status = row.querySelector('.shift-status')?.textContent.trim().toLowerCase();

        const matches = shiftId.includes(searchTerm) ||
            startTime.includes(searchTerm) ||
            endTime.includes(searchTerm) ||
            duration.includes(searchTerm) ||
            status.includes(searchTerm);

        row.style.display = matches ? '' : 'none';

        if (matches) {
            hasVisibleRows = true;
        }
    });

    // Show/hide empty state based on search results
    const emptyState = document.getElementById('emptyState');
    if (!hasVisibleRows) {
        document.querySelector('.table-responsive').style.display = 'none';
        emptyState.style.display = 'flex';
        emptyState.querySelector('h3').textContent = 'Không tìm thấy kết quả';
        emptyState.querySelector('p').textContent = 'Thử tìm kiếm với từ khóa khác';
    } else {
        document.querySelector('.table-responsive').style.display = 'block';
        emptyState.style.display = 'none';
    }
}

/**
 * View shift details
 */
function viewShift(shiftId) {
    currentShiftId = shiftId;

    fetch(`/admin/calamviec/${shiftId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải thông tin ca làm việc');
            }
            return response.json();
        })
        .then(data => {
            const detailsContainer = document.getElementById('shiftDetails');

            // Parse times
            const startTime = new Date(data.gioVao);
            const endTime = data.gioRa ? new Date(data.gioRa) : new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

            // Calculate duration
            const durationMs = endTime.getTime() - startTime.getTime();
            const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
            const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

            // Determine shift type
            const startHour = startTime.getHours();
            let shiftType, shiftIcon;

            if (startHour < 12) {
                shiftType = 'Ca sáng';
                shiftIcon = 'fa-sun';
            } else if (startHour < 18) {
                shiftType = 'Ca chiều';
                shiftIcon = 'fa-cloud-sun';
            } else {
                shiftType = 'Ca tối';
                shiftIcon = 'fa-moon';
            }

            // Update details
            detailsContainer.innerHTML = `
                <div class="shift-detail-header">
                    <div class="shift-badge">
                        <i class="fas ${shiftIcon}"></i>
                        <span>${shiftType}</span>
                    </div>
                    <h2>Ca làm việc #${data.idCa}</h2>
                </div>
                
                <div class="shift-detail-body">
                    <div class="detail-item">
                        <div class="detail-label">
                            <i class="fas fa-play-circle"></i> Giờ bắt đầu
                        </div>
                        <div class="detail-value">${formatTime(startTime)}</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-label">
                            <i class="fas fa-stop-circle"></i> Giờ kết thúc
                        </div>
                        <div class="detail-value">${formatTime(endTime)}</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-label">
                            <i class="fas fa-clock"></i> Thời lượng
                        </div>
                        <div class="detail-value">${durationHours} giờ ${durationMinutes} phút</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-label">
                            <i class="fas fa-calendar-check"></i> Ngày tạo
                        </div>
                        <div class="detail-value">06/07/2023</div>
                    </div>
                </div>
            `;

            // Show modal
            document.getElementById('viewShiftModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching shift details:', error);
            showNotification(error.message, 'error');
        });
}

/**
 * Edit shift
 */
function editShift(shiftId) {
    currentShiftId = shiftId;

    fetch(`/admin/calamviec/${shiftId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải thông tin ca làm việc');
            }
            return response.json();
        })
        .then(data => {
            // Update modal title
            document.querySelector('.modal-title').textContent = `Chỉnh sửa ca làm việc #${data.idCa}`;

            // Set form values
            document.getElementById('shiftId').value = data.idCa;

            const startTime = new Date(data.gioVao);
            const endTime = data.gioRa ? new Date(data.gioRa) : new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

            document.getElementById('startTime').value = formatTimeForInput(startTime);
            document.getElementById('endTime').value = formatTimeForInput(endTime);

            // Trigger duration calculation
            document.getElementById('endTime').dispatchEvent(new Event('input'));

            // Show modal
            document.getElementById('shiftModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching shift data:', error);
            showNotification(error.message, 'error');
        });
}

/**
 * Show delete confirmation modal
 */
function showDeleteConfirmation(shiftId) {
    currentShiftId = shiftId;
    document.getElementById('deleteConfirmModal').style.display = 'block';
}

/**
 * Delete shift
 */
function deleteShift() {
    if (!currentShiftId) {
        showNotification('Không tìm thấy ca làm việc để xóa', 'error');
        return;
    }

    fetch(`/admin/calamviec/${currentShiftId}`, {
        method: 'DELETE',
        headers: {
            [csrfHeader]: csrfToken
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể xóa ca làm việc');
            }
            return response.json();
        })
        .then(data => {
            showNotification(data.message || 'Xóa ca làm việc thành công', 'success');

            // Close modal and reload
            closeModal('deleteConfirmModal');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        })
        .catch(error => {
            console.error('Error deleting shift:', error);
            showNotification(error.message, 'error');
        });
}

/**
 * Save shift data
 */
function saveShift() {
    // Get form data
    const shiftId = document.getElementById('shiftId').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    // Validate form
    if (!validateShiftForm(startTime, endTime)) {
        return;
    }

    // Create request data
    const requestBody = {
        idCa: shiftId || null,
        gioVao: formatTimeToDate(startTime),
        gioRa: formatTimeToDate(endTime)
    };

    // Determine API endpoint
    const url = shiftId ? '/admin/calamviec/update' : '/admin/calamviec/add';

    // Send request
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            [csrfHeader]: csrfToken
        },
        body: JSON.stringify(requestBody)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi khi lưu ca làm việc');
            }
            return response.json();
        })
        .then(data => {
            const action = shiftId ? 'cập nhật' : 'thêm mới';
            showNotification(data.message || `Ca làm việc đã được ${action} thành công`, 'success');

            // Close modal and reload
            closeModal('shiftModal');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        })
        .catch(error => {
            console.error('Error saving shift:', error);
            showNotification(error.message, 'error');
        });
}

/**
 * Validate shift form
 */
function validateShiftForm(startTime, endTime) {
    if (!startTime) {
        showNotification('Vui lòng nhập giờ bắt đầu', 'error');
        return false;
    }

    if (!endTime) {
        showNotification('Vui lòng nhập giờ kết thúc', 'error');
        return false;
    }

    // Check if times create a valid duration
    const start = parseTimeInput(startTime);
    const end = parseTimeInput(endTime);

    if (start === end) {
        showNotification('Giờ bắt đầu và giờ kết thúc không thể giống nhau', 'error');
        return false;
    }

    // If end time is earlier, it's assumed to be next day, which is valid

    return true;
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Check if notification container exists
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';

    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="notification-content">${message}</div>
        <div class="notification-close">
            <i class="fas fa-times"></i>
        </div>
    `;

    // Add close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        container.removeChild(notification);
    });

    // Add to container with animation
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(50px)';
    container.appendChild(notification);

    // Apply animation
    setTimeout(() => {
        notification.style.transition = 'opacity 0.3s, transform 0.3s';
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(50px)';

        setTimeout(() => {
            if (notification.parentNode === container) {
                container.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Hàm hiển thị thông báo
function showNotification(message, type = 'success') {
    const notificationElement = document.getElementById('notification') || createNotificationElement();

    // Set message and class
    notificationElement.textContent = message;
    notificationElement.className = `notification ${type}`;

    // Show notification
    notificationElement.style.display = 'block';

    // Hide after 3 seconds
    setTimeout(() => {
        notificationElement.style.display = 'none';
    }, 3000);
}

// Tạo phần tử thông báo nếu chưa tồn tại
function createNotificationElement() {
    const notificationElement = document.createElement('div');
    notificationElement.id = 'notification';
    notificationElement.className = 'notification';
    document.body.appendChild(notificationElement);
    return notificationElement;
}

/**
 * Format time for display (HH:MM)
 */
function formatTime(date) {
    if (!date) return 'N/A';

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}

/**
 * Format time for input element
 */
function formatTimeForInput(date) {
    if (!date) return '';

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}

/**
 * Format time string to Date object
 */
function formatTimeToDate(timeStr) {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':');

    now.setHours(parseInt(hours, 10));
    now.setMinutes(parseInt(minutes, 10));
    now.setSeconds(0);

    return now.toISOString();
}

/**
 * Parse time input to minutes since midnight
 * Returns total minutes from midnight (e.g., "13:30" => 810 minutes)
 */
function parseTimeInput(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
}