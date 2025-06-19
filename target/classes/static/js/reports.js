// Biến lưu trữ các đối tượng biểu đồ
let salesChart, categoryChart, comparisonChart, paymentMethodChart;

// Token CSRF
const csrfToken = document.querySelector('meta[name="_csrf"]').content;
const csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;

// Format tiền tệ VND
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Format phần trăm
function formatPercent(value) {
    return value.toFixed(2) + '%';
}

// Hiển thị thông báo
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Lấy dữ liệu tổng quan
async function loadSummaryData(startDate, endDate) {
    try {
        let url = '/admin/api/reports/summary';
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Không thể tải dữ liệu tổng quan');

        const data = await response.json();

        // Hiển thị dữ liệu trên các thẻ thống kê
        document.getElementById('totalOrders').textContent = data.totalOrders;
        document.getElementById('totalRevenue').textContent = formatCurrency(data.totalRevenue);
        document.getElementById('totalCustomers').textContent = data.totalCustomers;
        document.getElementById('growthRate').textContent = data.growthRate + '%';
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu tổng quan:', error);
        showNotification('Không thể tải dữ liệu tổng quan', 'error');
    }
}

// Tải dữ liệu doanh thu theo thời gian
async function loadSalesData(startDate, endDate, groupBy) {
    try {
        let url = `/admin/api/reports/sales?groupBy=${groupBy}`;
        if (startDate && endDate) {
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Không thể tải dữ liệu doanh thu');

        const data = await response.json();

        // Chuẩn bị dữ liệu cho biểu đồ
        const labels = data.map(item => item.date);
        const revenues = data.map(item => item.revenue);
        const orders = data.map(item => item.orders);

        // Cập nhật biểu đồ doanh thu
        updateSalesChart(labels, revenues, orders);
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu doanh thu:', error);
        showNotification('Không thể tải dữ liệu doanh thu', 'error');
    }
}

// Cập nhật biểu đồ doanh thu
function updateSalesChart(labels, revenues, orders) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    const chartType = document.getElementById('salesChartType').value;

    // Hủy biểu đồ cũ nếu tồn tại
    if (salesChart) {
        salesChart.destroy();
    }

    salesChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Doanh thu (VNĐ)',
                    data: revenues,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Số đơn hàng',
                    data: orders,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Doanh thu (VNĐ)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Số đơn hàng'
                    }
                }
            },
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.yAxisID === 'y') {
                                label += formatCurrency(context.raw);
                            } else {
                                label += context.raw;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Tải dữ liệu sản phẩm bán chạy
async function loadTopProducts(startDate, endDate, limit) {
    try {
        let url = `/admin/api/reports/top-products?limit=${limit}`;
        if (startDate && endDate) {
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Không thể tải dữ liệu sản phẩm');

        const data = await response.json();

        // Cập nhật bảng sản phẩm bán chạy
        const tableBody = document.querySelector('#topProductsTable tbody');
        tableBody.innerHTML = '';

        data.forEach(product => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.quantity}</td>
                <td>${formatCurrency(product.revenue)}</td>
                <td>${formatPercent(product.percentage)}</td>
            `;
        });
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
        showNotification('Không thể tải dữ liệu sản phẩm', 'error');
    }
}

// Tải dữ liệu doanh thu theo danh mục
async function loadCategoryData(startDate, endDate) {
    try {
        let url = '/admin/api/reports/categories';
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Không thể tải dữ liệu danh mục');

        const data = await response.json();

        // Cập nhật bảng doanh thu theo danh mục
        const tableBody = document.querySelector('#categoryTable tbody');
        tableBody.innerHTML = '';

        data.forEach(category => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${category.category}</td>
                <td>${category.quantity}</td>
                <td>${formatCurrency(category.revenue)}</td>
                <td>${formatPercent(category.percentage)}</td>
            `;
        });

        // Cập nhật biểu đồ danh mục
        updateCategoryChart(data);
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu danh mục:', error);
        showNotification('Không thể tải dữ liệu danh mục', 'error');
    }
}

// Cập nhật biểu đồ danh mục
function updateCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    // Chuẩn bị dữ liệu cho biểu đồ
    const labels = data.map(item => item.category);
    const values = data.map(item => item.revenue);
    const backgroundColors = generateColors(data.length);

    // Hủy biểu đồ cũ nếu tồn tại
    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.raw);
                            const percentage = formatPercent(data[context.dataIndex].percentage);
                            return `${label}: ${value} (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

// Tạo mảng màu cho biểu đồ
function generateColors(count) {
    const baseColors = [
        'rgba(255, 87, 51, 0.9)',     // đỏ cam sáng
        'rgba(0, 128, 255, 0.9)',     // xanh nước biển tươi
        'rgba(255, 221, 0, 0.9)',     // vàng chanh
        'rgba(0, 204, 102, 0.9)',     // xanh lá sáng
        'rgba(153, 51, 255, 0.9)',    // tím neon
        'rgba(255, 102, 255, 0.9)',   // hồng cánh sen
        'rgba(255, 153, 0, 0.9)',     // cam đậm
        'rgba(51, 255, 255, 0.9)',    // xanh ngọc sáng
        'rgba(0, 0, 153, 0.9)',       // xanh dương đậm
        'rgba(102, 102, 102, 0.9)'    // xám trung tính
    ];

    let colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

// Tải dữ liệu so sánh theo thời gian
async function loadComparisonData(period) {
    try {
        const response = await fetch(`/admin/api/reports/comparison?period=${period}`);
        if (!response.ok) throw new Error('Không thể tải dữ liệu so sánh');

        const data = await response.json();

        // Cập nhật biểu đồ so sánh
        updateComparisonChart(data, period);
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu so sánh:', error);
        showNotification('Không thể tải dữ liệu so sánh', 'error');
    }
}

// Cập nhật biểu đồ so sánh
function updateComparisonChart(data, period) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');

    // Chuẩn bị dữ liệu cho biểu đồ
    const currentData = data.current;
    const previousData = data.previous;

    const labels = currentData.map(item => item.date);
    const currentRevenues = currentData.map(item => item.revenue);
    const previousRevenues = previousData.map(item => item.revenue);

    // Xác định nhãn cho giai đoạn
    let periodLabel;
    switch (period) {
        case 'week': periodLabel = 'tuần'; break;
        case 'month': periodLabel = 'tháng'; break;
        case 'quarter': periodLabel = 'quý'; break;
        case 'year': periodLabel = 'năm'; break;
        default: periodLabel = 'giai đoạn';
    }

    // Hủy biểu đồ cũ nếu tồn tại
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `${periodLabel} hiện tại`,
                    data: currentRevenues,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: `${periodLabel} trước`,
                    data: previousRevenues,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Doanh thu (VNĐ)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatCurrency(context.raw);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Tải dữ liệu phương thức thanh toán
async function loadPaymentMethodsData(startDate, endDate) {
    try {
        let url = '/admin/api/reports/payment-methods';
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Không thể tải dữ liệu phương thức thanh toán');

        const data = await response.json();

        // Cập nhật bảng phương thức thanh toán
        const tableBody = document.querySelector('#paymentMethodTable tbody');
        tableBody.innerHTML = '';

        data.forEach(method => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${method.method}</td>
                <td>${method.orders}</td>
                <td>${formatCurrency(method.revenue)}</td>
                <td>${formatPercent(method.percentage)}</td>
            `;
        });

        // Cập nhật biểu đồ phương thức thanh toán
        updatePaymentMethodChart(data);
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu phương thức thanh toán:', error);
        showNotification('Không thể tải dữ liệu phương thức thanh toán', 'error');
    }
}

// Cập nhật biểu đồ phương thức thanh toán
function updatePaymentMethodChart(data) {
    const ctx = document.getElementById('paymentMethodChart').getContext('2d');

    // Chuẩn bị dữ liệu cho biểu đồ
    const labels = data.map(item => item.method);
    const values = data.map(item => item.revenue);
    const backgroundColors = generateColors(data.length);

    // Hủy biểu đồ cũ nếu tồn tại
    if (paymentMethodChart) {
        paymentMethodChart.destroy();
    }

    paymentMethodChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.raw);
                            const percentage = formatPercent(data[context.dataIndex].percentage);
                            return `${label}: ${value} (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

// Tải dữ liệu biến động kho
async function loadInventoryData(startDate, endDate) {
    try {
        let url = '/admin/api/reports/inventory';
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Không thể tải dữ liệu kho');

        const data = await response.json();

        // Cập nhật bảng biến động kho
        const tableBody = document.querySelector('#inventoryMovementTable tbody');
        tableBody.innerHTML = '';

        data.forEach(item => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.initialStock}</td>
                <td>${item.import}</td>
                <td>${item.export}</td>
                <td>${item.finalStock}</td>
                <td>${item.unit}</td>
            `;
        });
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu kho:', error);
        showNotification('Không thể tải dữ liệu kho', 'error');
    }
}

// Thêm các nút xuất cho từng phần
function addExportButtonsToSections() {
    const sections = document.querySelectorAll('.report-section');
    sections.forEach(section => {
        const header = section.querySelector('.section-header');
        const title = header.querySelector('h2').textContent;

        const exportDiv = document.createElement('div');
        exportDiv.className = 'section-exports';
        exportDiv.innerHTML = `
            <button class="btn btn-sm btn-outline export-section-excel" title="Xuất Excel">
                <i class="fas fa-file-excel"></i>
            </button>
            <button class="btn btn-sm btn-outline export-section-pdf" title="Xuất PDF">
                <i class="fas fa-file-pdf"></i>
            </button>
        `;

        header.appendChild(exportDiv);

        // Thêm sự kiện cho nút xuất Excel
        exportDiv.querySelector('.export-section-excel').addEventListener('click', () => {
            const sectionId = section.querySelector('.chart-container canvas')?.id ||
                section.querySelector('table')?.id;
            exportSectionToExcel(sectionId, title);
        });

        // Thêm sự kiện cho nút xuất PDF
        exportDiv.querySelector('.export-section-pdf').addEventListener('click', () => {
            const sectionId = section.querySelector('.chart-container canvas')?.id ||
                section.querySelector('table')?.id;
            exportSectionToPdf(sectionId, title);
        });
    });
}

// Xuất phần cụ thể sang Excel với biểu đồ
async function exportSectionToExcel(sectionId, title) {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    try {
        showNotification(`Đang xuất ${title} sang Excel...`);

        // Tạo workbook mới
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(title);

        // Thêm tiêu đề và ngày tháng
        worksheet.mergeCells('A1:D1');
        worksheet.getCell('A1').value = `BÁO CÁO ${title.toUpperCase()}`;
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        worksheet.mergeCells('A2:B2');
        worksheet.getCell('A2').value = `Từ ngày: ${startDate}`;
        worksheet.mergeCells('C2:D2');
        worksheet.getCell('C2').value = `Đến ngày: ${endDate}`;

        // Khai báo biến row và lastRow ở đầu hàm để tránh lỗi
        let row = 5; // Bắt đầu dữ liệu từ hàng 5 (sau header)
        let lastRow = 3;

        // Xử lý dữ liệu tùy theo loại báo cáo
        switch(sectionId) {
            case 'salesChart':
                // Lấy dữ liệu doanh thu theo thời gian
                const salesData = await fetchData(`/admin/api/reports/sales?startDate=${startDate}&endDate=${endDate}&groupBy=daily`);

                // Tạo bảng dữ liệu
                worksheet.getCell('A4').value = 'Ngày';
                worksheet.getCell('B4').value = 'Doanh thu (VNĐ)';
                worksheet.getCell('C4').value = 'Số đơn hàng';

                // Định dạng header
                ['A4', 'B4', 'C4'].forEach(cell => {
                    worksheet.getCell(cell).font = { bold: true };
                    worksheet.getCell(cell).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE0E0E0' }
                    };
                    worksheet.getCell(cell).border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Thêm dữ liệu - đã khai báo row ở trên
                row = 5; // Reset lại row để đảm bảo
                salesData.forEach(item => {
                    worksheet.getCell(`A${row}`).value = item.date;
                    worksheet.getCell(`B${row}`).value = item.revenue;
                    worksheet.getCell(`B${row}`).numFmt = '#,##0 ₫';
                    worksheet.getCell(`C${row}`).value = item.orders;
                    row++;
                });

                // Điều chỉnh độ rộng cột
                worksheet.getColumn('A').width = 15;
                worksheet.getColumn('B').width = 20;
                worksheet.getColumn('C').width = 15;

                lastRow = row + 1;
                break;

            case 'categoryChart':
                // Lấy dữ liệu danh mục
                const categories = await fetchData(`/admin/api/reports/categories?startDate=${startDate}&endDate=${endDate}`);

                // Tạo bảng dữ liệu
                worksheet.getCell('A4').value = 'Danh mục';
                worksheet.getCell('B4').value = 'Số lượng';
                worksheet.getCell('C4').value = 'Doanh thu (VNĐ)';
                worksheet.getCell('D4').value = 'Tỷ trọng (%)';

                // Định dạng header
                ['A4', 'B4', 'C4', 'D4'].forEach(cell => {
                    worksheet.getCell(cell).font = { bold: true };
                    worksheet.getCell(cell).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE0E0E0' }
                    };
                    worksheet.getCell(cell).border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Thêm dữ liệu
                row = 5; // Reset lại row
                categories.forEach(item => {
                    worksheet.getCell(`A${row}`).value = item.category;
                    worksheet.getCell(`B${row}`).value = item.quantity;
                    worksheet.getCell(`C${row}`).value = item.revenue;
                    worksheet.getCell(`C${row}`).numFmt = '#,##0 ₫';
                    worksheet.getCell(`D${row}`).value = item.percentage;
                    worksheet.getCell(`D${row}`).numFmt = '0.00%';
                    row++;
                });

                // Điều chỉnh độ rộng cột
                worksheet.getColumn('A').width = 25;
                worksheet.getColumn('B').width = 12;
                worksheet.getColumn('C').width = 18;
                worksheet.getColumn('D').width = 12;

                lastRow = row + 1;
                break;

            case 'comparisonChart':
                // Lấy dữ liệu so sánh
                const comparisonPeriod = document.getElementById('comparisonPeriod').value;
                const comparisonData = await fetchData(`/admin/api/reports/comparison?period=${comparisonPeriod}`);

                // Xác định nhãn cho giai đoạn
                let periodLabel;
                switch (comparisonPeriod) {
                    case 'week': periodLabel = 'Tuần'; break;
                    case 'month': periodLabel = 'Tháng'; break;
                    case 'quarter': periodLabel = 'Quý'; break;
                    case 'year': periodLabel = 'Năm'; break;
                    default: periodLabel = 'Giai đoạn';
                }

                // Tạo bảng dữ liệu
                worksheet.getCell('A4').value = 'Ngày';
                worksheet.getCell('B4').value = `${periodLabel} hiện tại (VNĐ)`;
                worksheet.getCell('C4').value = `${periodLabel} trước (VNĐ)`;

                // Định dạng header
                ['A4', 'B4', 'C4'].forEach(cell => {
                    worksheet.getCell(cell).font = { bold: true };
                    worksheet.getCell(cell).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE0E0E0' }
                    };
                    worksheet.getCell(cell).border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Thêm dữ liệu
                row = 5; // Reset lại row
                for (let i = 0; i < comparisonData.current.length; i++) {
                    worksheet.getCell(`A${row}`).value = comparisonData.current[i].date;
                    worksheet.getCell(`B${row}`).value = comparisonData.current[i].revenue;
                    worksheet.getCell(`B${row}`).numFmt = '#,##0 ₫';
                    worksheet.getCell(`C${row}`).value = comparisonData.previous[i].revenue;
                    worksheet.getCell(`C${row}`).numFmt = '#,##0 ₫';
                    row++;
                }

                // Điều chỉnh độ rộng cột
                worksheet.getColumn('A').width = 15;
                worksheet.getColumn('B').width = 20;
                worksheet.getColumn('C').width = 20;

                lastRow = row + 1;
                break;

            case 'paymentMethodChart':
                // Lấy dữ liệu phương thức thanh toán
                const paymentMethods = await fetchData(`/admin/api/reports/payment-methods?startDate=${startDate}&endDate=${endDate}`);

                // Tạo bảng dữ liệu
                worksheet.getCell('A4').value = 'Phương thức';
                worksheet.getCell('B4').value = 'Số đơn hàng';
                worksheet.getCell('C4').value = 'Doanh thu (VNĐ)';
                worksheet.getCell('D4').value = 'Tỷ trọng (%)';

                // Định dạng header
                ['A4', 'B4', 'C4', 'D4'].forEach(cell => {
                    worksheet.getCell(cell).font = { bold: true };
                    worksheet.getCell(cell).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE0E0E0' }
                    };
                    worksheet.getCell(cell).border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Thêm dữ liệu
                row = 5; // Reset lại row
                paymentMethods.forEach(item => {
                    worksheet.getCell(`A${row}`).value = item.method;
                    worksheet.getCell(`B${row}`).value = item.orders;
                    worksheet.getCell(`C${row}`).value = item.revenue;
                    worksheet.getCell(`C${row}`).numFmt = '#,##0 ₫';
                    worksheet.getCell(`D${row}`).value = item.percentage;
                    worksheet.getCell(`D${row}`).numFmt = '0.00%';
                    row++;
                });

                // Điều chỉnh độ rộng cột
                worksheet.getColumn('A').width = 25;
                worksheet.getColumn('B').width = 15;
                worksheet.getColumn('C').width = 18;
                worksheet.getColumn('D').width = 12;

                lastRow = row + 1;
                break;

            case 'topProductsTable':
                // Lấy dữ liệu sản phẩm bán chạy
                const limit = document.getElementById('topProductsLimit').value;
                const topProducts = await fetchData(`/admin/api/reports/top-products?startDate=${startDate}&endDate=${endDate}&limit=${limit}`);

                // Tạo bảng dữ liệu
                worksheet.getCell('A4').value = 'Mã SP';
                worksheet.getCell('B4').value = 'Tên sản phẩm';
                worksheet.getCell('C4').value = 'Danh mục';
                worksheet.getCell('D4').value = 'Số lượng';
                worksheet.getCell('E4').value = 'Doanh thu';
                worksheet.getCell('F4').value = 'Tỷ trọng';

                // Định dạng header
                ['A4', 'B4', 'C4', 'D4', 'E4', 'F4'].forEach(cell => {
                    worksheet.getCell(cell).font = { bold: true };
                    worksheet.getCell(cell).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' }
                    };
                    worksheet.getCell(cell).border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Thêm dữ liệu
                row = 5; // Reset lại row
                topProducts.forEach(product => {
                    worksheet.getCell(`A${row}`).value = product.id;
                    worksheet.getCell(`B${row}`).value = product.name;
                    worksheet.getCell(`C${row}`).value = product.category;
                    worksheet.getCell(`D${row}`).value = product.quantity;
                    worksheet.getCell(`E${row}`).value = product.revenue;
                    worksheet.getCell(`E${row}`).numFmt = '#,##0 ₫';
                    worksheet.getCell(`F${row}`).value = product.percentage / 100; // Chuyển đổi để định dạng phần trăm hoạt động đúng
                    worksheet.getCell(`F${row}`).numFmt = '0.00%';
                    row++;
                });

                // Điều chỉnh độ rộng cột
                worksheet.getColumn('A').width = 10;
                worksheet.getColumn('B').width = 30;
                worksheet.getColumn('C').width = 15;
                worksheet.getColumn('D').width = 10;
                worksheet.getColumn('E').width = 15;
                worksheet.getColumn('F').width = 10;

                lastRow = row + 1;
                break;

            case 'inventoryMovementTable':
                // Lấy dữ liệu biến động kho hàng
                const inventory = await fetchData(`/admin/api/reports/inventory?startDate=${startDate}&endDate=${endDate}`);

                // Tạo bảng dữ liệu
                worksheet.getCell('A4').value = 'Nguyên liệu';
                worksheet.getCell('B4').value = 'Tồn đầu kỳ';
                worksheet.getCell('C4').value = 'Nhập kho';
                worksheet.getCell('D4').value = 'Xuất kho';
                worksheet.getCell('E4').value = 'Tồn cuối kỳ';
                worksheet.getCell('F4').value = 'Đơn vị';

                // Định dạng header
                ['A4', 'B4', 'C4', 'D4', 'E4', 'F4'].forEach(cell => {
                    worksheet.getCell(cell).font = { bold: true };
                    worksheet.getCell(cell).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' }
                    };
                    worksheet.getCell(cell).border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Thêm dữ liệu
                row = 5; // Reset lại row
                inventory.forEach(item => {
                    worksheet.getCell(`A${row}`).value = item.name;
                    worksheet.getCell(`B${row}`).value = item.initialStock;
                    worksheet.getCell(`C${row}`).value = item.import;
                    worksheet.getCell(`D${row}`).value = item.export;
                    worksheet.getCell(`E${row}`).value = item.finalStock;
                    worksheet.getCell(`F${row}`).value = item.unit;
                    row++;
                });

                // Điều chỉnh độ rộng cột
                worksheet.getColumn('A').width = 30;
                worksheet.getColumn('B').width = 12;
                worksheet.getColumn('C').width = 12;
                worksheet.getColumn('D').width = 12;
                worksheet.getColumn('E').width = 12;
                worksheet.getColumn('F').width = 10;

                lastRow = row + 1;
                break;
        }

        // Thêm biểu đồ (nếu là section có biểu đồ)
        if (sectionId.includes('Chart')) {
            try {
                const chartCanvas = document.getElementById(sectionId);
                if (chartCanvas) {
                    const chartImageBase64 = chartCanvas.toDataURL('image/png');

                    // Thêm biểu đồ vào Excel
                    const imageId = workbook.addImage({
                        base64: chartImageBase64,
                        extension: 'png',
                    });

                    worksheet.addImage(imageId, {
                        tl: { col: 0, row: lastRow },
                        ext: { width: 500, height: 300 }
                    });
                }
            } catch (imgError) {
                console.error('Không thể thêm biểu đồ vào Excel:', imgError);
                // Vẫn tiếp tục xuất file Excel ngay cả khi không thêm được ảnh
            }
        }

        // Xuất file Excel
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const fileName = `bao-cao-${title.toLowerCase().replace(/\s+/g, '-')}-${startDate}-${endDate}.xlsx`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);  // Giải phóng bộ nhớ

        showNotification(`Xuất ${title} sang Excel thành công`);
    } catch (error) {
        console.error('Lỗi khi xuất Excel:', error);
        showNotification(`Không thể xuất ${title} sang Excel: ${error.message}`, 'error');
    }
}

// Hàm hỗ trợ lấy dữ liệu từ API
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
}

// Hàm lấy ảnh biểu đồ dưới dạng base64
function getChartImageBase64(chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return null;

    // Đảm bảo rằng đây là canvas (Chart.js sử dụng canvas)
    if (canvas.tagName.toLowerCase() === 'canvas') {
        return canvas.toDataURL('image/png');
    }
    return null;
}

// Xuất phần cụ thể sang PDF
async function exportSectionToPdf(sectionId, title) {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    try {
        showNotification(`Đang xuất dữ liệu ${title} sang PDF...`);

        // Khởi tạo nội dung PDF
        const docContent = [];
        let chartImg = null;

        // Thêm tiêu đề
        docContent.push(
            { text: `BÁO CÁO ${title.toUpperCase()}`, style: 'header', alignment: 'center' },
            { text: `Thời gian: Từ ${startDate} đến ${endDate}`, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] }
        );

        switch(sectionId) {
            case 'salesChart':
                // Lấy ảnh biểu đồ doanh thu
                chartImg = getChartImageBase64('salesChart');

                // Lấy dữ liệu doanh thu theo thời gian
                const salesData = await fetchData(`/admin/api/reports/sales?startDate=${startDate}&endDate=${endDate}&groupBy=daily`);

                // Thêm biểu đồ
                if (chartImg) {
                    docContent.push(
                        { text: 'Biểu đồ doanh thu theo thời gian:', style: 'chartLabel' },
                        {
                            image: chartImg,
                            width: 500,
                            alignment: 'center',
                            margin: [0, 5, 0, 15]
                        }
                    );
                }

                // Thêm bảng dữ liệu
                docContent.push(
                    { text: 'Bảng doanh thu theo thời gian:', style: 'sectionHeader', margin: [0, 10, 0, 5] },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', 'auto', 'auto'],
                            body: [
                                [
                                    { text: 'Ngày', style: 'tableHeader' },
                                    { text: 'Doanh thu', style: 'tableHeader' },
                                    { text: 'Số đơn hàng', style: 'tableHeader' }
                                ],
                                ...salesData.map(item => [
                                    item.date,
                                    formatCurrency(item.revenue),
                                    item.orders.toString()
                                ]),
                                [
                                    { text: 'Tổng cộng', style: 'tableHeader' },
                                    {
                                        text: formatCurrency(salesData.reduce((sum, item) => sum + item.revenue, 0)),
                                        style: 'tableHeader'
                                    },
                                    {
                                        text: salesData.reduce((sum, item) => sum + item.orders, 0).toString(),
                                        style: 'tableHeader'
                                    }
                                ]
                            ]
                        },
                        margin: [0, 0, 0, 15]
                    }
                );
                break;

            case 'topProductsTable':
                // Lấy dữ liệu sản phẩm bán chạy
                const topProducts = await fetchData(`/admin/api/reports/top-products?startDate=${startDate}&endDate=${endDate}&limit=10`);

                // Thêm bảng dữ liệu
                docContent.push(
                    {
                        table: {
                            headerRows: 1,
                            widths: [40, '*', 70, 50, 70, 50],
                            body: [
                                [
                                    { text: 'Mã SP', style: 'tableHeader' },
                                    { text: 'Tên sản phẩm', style: 'tableHeader' },
                                    { text: 'Danh mục', style: 'tableHeader' },
                                    { text: 'Số lượng', style: 'tableHeader' },
                                    { text: 'Doanh thu', style: 'tableHeader' },
                                    { text: 'Tỷ trọng', style: 'tableHeader' }
                                ],
                                ...topProducts.map(product => [
                                    product.id,
                                    product.name,
                                    product.category,
                                    product.quantity,
                                    formatCurrency(product.revenue),
                                    product.percentage + '%'
                                ])
                            ]
                        },
                        margin: [0, 10, 0, 15]
                    }
                );
                break;

            case 'categoryChart':
            case 'categoryTable':
                // Lấy ảnh biểu đồ danh mục
                chartImg = getChartImageBase64('categoryChart');

                // Lấy dữ liệu danh mục
                const categories = await fetchData(`/admin/api/reports/categories?startDate=${startDate}&endDate=${endDate}`);

                // Thêm bảng dữ liệu
                docContent.push(
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', 'auto', 'auto', 'auto'],
                            body: [
                                [
                                    { text: 'Danh mục', style: 'tableHeader' },
                                    { text: 'Số lượng', style: 'tableHeader' },
                                    { text: 'Doanh thu', style: 'tableHeader' },
                                    { text: 'Tỷ trọng', style: 'tableHeader' }
                                ],
                                ...categories.map(category => [
                                    category.category,
                                    category.quantity,
                                    formatCurrency(category.revenue),
                                    category.percentage + '%'
                                ])
                            ]
                        },
                        margin: [0, 5, 0, 15]
                    }
                );

                // Thêm biểu đồ
                if (chartImg) {
                    docContent.push(
                        { text: 'Biểu đồ doanh thu theo danh mục:', style: 'chartLabel', margin: [0, 10, 0, 5] },
                        {
                            image: chartImg,
                            width: 450,
                            alignment: 'center',
                            margin: [0, 5, 0, 15]
                        }
                    );
                }
                break;

            case 'comparisonChart':
                // Lấy ảnh biểu đồ so sánh
                chartImg = getChartImageBase64('comparisonChart');

                // Lấy dữ liệu so sánh
                const comparisonPeriod = document.getElementById('comparisonPeriod').value;
                const comparisonData = await fetchData(`/admin/api/reports/comparison?period=${comparisonPeriod}`);
                const periodLabel = getComparisonLabel(comparisonPeriod);

                // Thêm biểu đồ
                if (chartImg) {
                    docContent.push(
                        { text: `Biểu đồ so sánh ${periodLabel}:`, style: 'chartLabel' },
                        {
                            image: chartImg,
                            width: 500,
                            alignment: 'center',
                            margin: [0, 5, 0, 15]
                        }
                    );
                }

                // Thêm bảng dữ liệu
                docContent.push(
                    { text: `Bảng so sánh ${periodLabel}:`, style: 'sectionHeader', margin: [0, 10, 0, 5] },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', '*', '*'],
                            body: [
                                [
                                    { text: 'Ngày', style: 'tableHeader' },
                                    { text: 'Kỳ hiện tại', style: 'tableHeader' },
                                    { text: 'Kỳ trước', style: 'tableHeader' }
                                ],
                                ...comparisonData.current.map((item, index) => [
                                    item.date,
                                    formatCurrency(item.revenue),
                                    formatCurrency(comparisonData.previous[index].revenue)
                                ])
                            ]
                        },
                        margin: [0, 0, 0, 15]
                    }
                );
                break;

            case 'paymentMethodChart':
            case 'paymentMethodTable':
                // Lấy ảnh biểu đồ phương thức thanh toán
                chartImg = getChartImageBase64('paymentMethodChart');

                // Lấy dữ liệu phương thức thanh toán
                const paymentMethods = await fetchData(`/admin/api/reports/payment-methods?startDate=${startDate}&endDate=${endDate}`);

                // Thêm bảng dữ liệu
                docContent.push(
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', 'auto', 'auto', 'auto'],
                            body: [
                                [
                                    { text: 'Phương thức', style: 'tableHeader' },
                                    { text: 'Số đơn hàng', style: 'tableHeader' },
                                    { text: 'Doanh thu', style: 'tableHeader' },
                                    { text: 'Tỷ trọng', style: 'tableHeader' }
                                ],
                                ...paymentMethods.map(method => [
                                    method.method,
                                    method.orders,
                                    formatCurrency(method.revenue),
                                    method.percentage + '%'
                                ])
                            ]
                        },
                        margin: [0, 5, 0, 15]
                    }
                );

                // Thêm biểu đồ
                if (chartImg) {
                    docContent.push(
                        { text: 'Biểu đồ phương thức thanh toán:', style: 'chartLabel', margin: [0, 10, 0, 5] },
                        {
                            image: chartImg,
                            width: 400,
                            alignment: 'center',
                            margin: [0, 5, 0, 15]
                        }
                    );
                }
                break;

            case 'inventoryMovementTable':
                // Lấy dữ liệu biến động kho
                const inventory = await fetchData(`/admin/api/reports/inventory?startDate=${startDate}&endDate=${endDate}`);

                // Thêm bảng dữ liệu
                docContent.push(
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                            body: [
                                [
                                    { text: 'Nguyên liệu', style: 'tableHeader' },
                                    { text: 'Tồn đầu kỳ', style: 'tableHeader' },
                                    { text: 'Nhập kho', style: 'tableHeader' },
                                    { text: 'Xuất kho', style: 'tableHeader' },
                                    { text: 'Tồn cuối kỳ', style: 'tableHeader' },
                                    { text: 'Đơn vị', style: 'tableHeader' }
                                ],
                                ...inventory.map(item => [
                                    item.name,
                                    item.initialStock,
                                    item.import,
                                    item.export,
                                    item.finalStock,
                                    item.unit
                                ])
                            ]
                        },
                        margin: [0, 5, 0, 15]
                    }
                );
                break;
        }

        // Tạo PDF với nội dung đã tạo
        const docDefinition = {
            content: docContent,
            styles: {
                header: {
                    fontSize: 20,
                    bold: true,
                    margin: [0, 0, 0, 10]
                },
                subheader: {
                    fontSize: 14,
                    margin: [0, 0, 0, 5]
                },
                sectionHeader: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 10, 0, 10],
                    color: '#1e88e5'
                },
                tableHeader: {
                    bold: true,
                    fontSize: 12,
                    fillColor: '#f5f5f5'
                },
                chartLabel: {
                    bold: true,
                    fontSize: 12,
                    margin: [0, 15, 0, 5]
                }
            },
            defaultStyle: {
                font: 'Roboto'
            },
            info: {
                title: `Báo cáo ${title} ${startDate} đến ${endDate}`,
                author: 'DND Coffee Admin',
                subject: `Báo cáo ${title}`
            }
        };

        // Tạo và tải xuống PDF
        pdfMake.createPdf(docDefinition).download(`bao-cao-${title.toLowerCase().replace(/\s+/g, '-')}-${startDate}-${endDate}.pdf`);
        showNotification(`Xuất ${title} sang PDF thành công`);
    } catch (error) {
        console.error(`Lỗi khi xuất ${title} sang PDF:`, error);
        showNotification(`Không thể xuất ${title} sang PDF: ${error.message}`, 'error');
    }
}

// Thêm vào phần khởi tạo trang
document.addEventListener('DOMContentLoaded', function() {
    // Các hàm khởi tạo hiện tại...

    // Thêm các nút xuất cho từng phần
    addExportButtonsToSections();

    // CSS cho các nút xuất trong từng phần
    const style = document.createElement('style');
    style.textContent = `
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .section-exports {
            display: flex;
            gap: 5px;
        }
        .btn-sm {
            padding: 4px 8px;
            font-size: 12px;
        }
    `;
    document.head.appendChild(style);
});


// // Xuất báo cáo Excel
// function exportExcelReport() {
//     const startDate = document.getElementById('startDate').value;
//     const endDate = document.getElementById('endDate').value;
//
//     let url = '/admin/api/reports/export/excel';
//     if (startDate && endDate) {
//         url += `?startDate=${startDate}&endDate=${endDate}`;
//     }
//
//     window.location.href = url;
//     showNotification('Đang xuất báo cáo Excel...');
// }
//
// // Xuất báo cáo PDF
// function exportPdfReport() {
//     const startDate = document.getElementById('startDate').value;
//     const endDate = document.getElementById('endDate').value;
//
//     let url = '/admin/api/reports/export/pdf';
//     if (startDate && endDate) {
//         url += `?startDate=${startDate}&endDate=${endDate}`;
//     }
//
//     window.location.href = url;
//     showNotification('Đang xuất báo cáo PDF...');
// }

// Hàm lấy ảnh base64 từ canvas
function getChartImageBase64(chartId) {
    const canvas = document.getElementById(chartId);
    return canvas ? canvas.toDataURL('image/png') : null;
}
// Lưu ảnh base64 ra file tạm và trả về đường dẫn
// Lưu ảnh base64 và chuyển đổi thành định dạng phù hợp cho ExcelJS
async function saveBase64ImageToTemp(base64Data, chartName) {
    try {
        // Loại bỏ phần khai báo data URL nếu có
        const base64Image = base64Data.split(';base64,').pop();

        // Chuyển đổi base64 thành mảng byte
        const binaryString = window.atob(base64Image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Tạo Blob từ mảng byte
        const blob = new Blob([bytes], { type: 'image/png' });

        // Tạo đường dẫn tạm thời từ blob
        const tempUrl = URL.createObjectURL(blob);

        return {
            imageId: `chart_${chartName}_${new Date().getTime()}`,
            blob: blob,
            url: tempUrl,
            extension: 'png'
        };
    } catch (error) {
        console.error('Lỗi khi xử lý ảnh:', error);
        return null;
    }
}

// Cấu hình cho sheet tổng quan
function configureSummarySheet(sheet, summary, startDate, endDate) {
    // Tiêu đề và thông tin chung
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'BÁO CÁO DOANH THU';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:B2');
    sheet.getCell('A2').value = `Từ ngày: ${startDate}`;
    sheet.mergeCells('C2:D2');
    sheet.getCell('C2').value = `Đến ngày: ${endDate}`;

    // Tạo bảng dữ liệu
    sheet.getCell('A4').value = 'Chỉ tiêu';
    sheet.getCell('B4').value = 'Giá trị';

    sheet.getCell('A5').value = 'Tổng số đơn hàng';
    sheet.getCell('B5').value = summary.totalOrders;

    sheet.getCell('A6').value = 'Tổng doanh thu';
    sheet.getCell('B6').value = summary.totalRevenue;
    sheet.getCell('B6').numFmt = '#,##0 ₫';

    sheet.getCell('A7').value = 'Số lượng khách hàng mới';
    sheet.getCell('B7').value = summary.totalCustomers;

    sheet.getCell('A8').value = 'Tăng trưởng';
    sheet.getCell('B8').value = summary.growthRate + '%';

    // Định dạng header
    ['A4', 'B4'].forEach(cell => {
        sheet.getCell(cell).font = { bold: true };
        sheet.getCell(cell).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
        };
    });

    // Điều chỉnh độ rộng cột
    sheet.getColumn('A').width = 25;
    sheet.getColumn('B').width = 20;
}

// Cấu hình cho sheet doanh thu theo thời gian
async function configureSalesSheet(sheet, salesData, startDate, endDate, chartImg) {
    // Tiêu đề và thông tin chung
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'BÁO CÁO DOANH THU THEO THỜI GIAN';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:B2');
    sheet.getCell('A2').value = `Từ ngày: ${startDate}`;
    sheet.mergeCells('C2:D2');
    sheet.getCell('C2').value = `Đến ngày: ${endDate}`;

    // Tạo bảng dữ liệu
    sheet.getCell('A4').value = 'Ngày';
    sheet.getCell('B4').value = 'Doanh thu (VNĐ)';
    sheet.getCell('C4').value = 'Số đơn hàng';

    let row = 5;
    let totalRevenue = 0;
    let totalOrders = 0;

    salesData.forEach(item => {
        sheet.getCell(`A${row}`).value = item.date;
        sheet.getCell(`B${row}`).value = item.revenue;
        sheet.getCell(`B${row}`).numFmt = '#,##0 ₫';
        sheet.getCell(`C${row}`).value = item.orders;

        totalRevenue += item.revenue;
        totalOrders += item.orders;
        row++;
    });

    // Thêm dòng tổng
    sheet.getCell(`A${row}`).value = 'Tổng cộng';
    sheet.getCell(`A${row}`).font = { bold: true };

    sheet.getCell(`B${row}`).value = totalRevenue;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).numFmt = '#,##0 ₫';

    sheet.getCell(`C${row}`).value = totalOrders;
    sheet.getCell(`C${row}`).font = { bold: true };

    // Định dạng header
    ['A4', 'B4', 'C4'].forEach(cell => {
        sheet.getCell(cell).font = { bold: true };
        sheet.getCell(cell).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
        };
    });

    // Điều chỉnh độ rộng cột
    sheet.getColumn('A').width = 15;
    sheet.getColumn('B').width = 20;
    sheet.getColumn('C').width = 15;

    // Thêm biểu đồ nếu có
    if (chartImg) {
        try {
            // Xử lý ảnh
            const imageInfo = await saveBase64ImageToTemp(chartImg, 'sales');
            if (imageInfo) {
                // Tính vị trí để chèn biểu đồ (dưới bảng dữ liệu)
                const lastRow = sheet.lastRow.number + 2;

                // Lấy ảnh trực tiếp từ blob
                const imageId = workbook.addImage({
                    base64: chartImg,
                    extension: 'png',
                });

                // Chèn ảnh vào sheet
                sheet.addImage(imageId, {
                    tl: { col: 0, row: lastRow },
                    ext: { width: 500, height: 300 }
                });

                // Giải phóng bộ nhớ
                URL.revokeObjectURL(imageInfo.url);
            }
        } catch (err) {
            console.error('Lỗi khi thêm biểu đồ vào sheet:', err);
        }
    }
}

// Cấu hình cho sheet so sánh theo thời gian
async function configureComparisonSheet(sheet, comparisonData, startDate, endDate, comparisonPeriod, chartImg) {
    // Xác định nhãn cho giai đoạn
    let periodLabel;
    switch (comparisonPeriod) {
        case 'week': periodLabel = 'tuần'; break;
        case 'month': periodLabel = 'tháng'; break;
        case 'quarter': periodLabel = 'quý'; break;
        case 'year': periodLabel = 'năm'; break;
        default: periodLabel = 'giai đoạn';
    }

    // Tiêu đề và thông tin chung
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = `SO SÁNH DOANH THU THEO ${periodLabel.toUpperCase()}`;
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:B2');
    sheet.getCell('A2').value = `Từ ngày: ${startDate}`;
    sheet.mergeCells('C2:D2');
    sheet.getCell('C2').value = `Đến ngày: ${endDate}`;

    // Tạo bảng dữ liệu
    sheet.getCell('A4').value = 'Ngày';
    sheet.getCell('B4').value = `${periodLabel} hiện tại`;
    sheet.getCell('C4').value = `${periodLabel} trước`;

    let row = 5;
    const currentData = comparisonData.current;
    const previousData = comparisonData.previous;

    for (let i = 0; i < currentData.length; i++) {
        sheet.getCell(`A${row}`).value = currentData[i].date;
        sheet.getCell(`B${row}`).value = currentData[i].revenue;
        sheet.getCell(`B${row}`).numFmt = '#,##0 ₫';
        sheet.getCell(`C${row}`).value = previousData[i].revenue;
        sheet.getCell(`C${row}`).numFmt = '#,##0 ₫';
        row++;
    }

    // Thêm dòng tổng
    const totalCurrentRevenue = currentData.reduce((sum, item) => sum + item.revenue, 0);
    const totalPreviousRevenue = previousData.reduce((sum, item) => sum + item.revenue, 0);
    const growthRate = ((totalCurrentRevenue - totalPreviousRevenue) / totalPreviousRevenue * 100).toFixed(2);

    sheet.getCell(`A${row}`).value = 'Tổng cộng';
    sheet.getCell(`A${row}`).font = { bold: true };

    sheet.getCell(`B${row}`).value = totalCurrentRevenue;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).numFmt = '#,##0 ₫';

    sheet.getCell(`C${row}`).value = totalPreviousRevenue;
    sheet.getCell(`C${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).numFmt = '#,##0 ₫';

    // Thêm dòng tăng trưởng
    sheet.getCell(`A${row+1}`).value = 'Tăng trưởng';
    sheet.getCell(`A${row+1}`).font = { bold: true };
    sheet.getCell(`B${row+1}`).value = `${growthRate}%`;
    sheet.getCell(`B${row+1}`).font = { bold: true };

    // Định dạng header
    ['A4', 'B4', 'C4'].forEach(cell => {
        sheet.getCell(cell).font = { bold: true };
        sheet.getCell(cell).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
        };
    });

    // Điều chỉnh độ rộng cột
    sheet.getColumn('A').width = 15;
    sheet.getColumn('B').width = 20;
    sheet.getColumn('C').width = 20;

    // Thêm biểu đồ nếu có
    if (chartImg) {
        try {
            // Xử lý ảnh
            const imageInfo = await saveBase64ImageToTemp(chartImg, 'comparison');
            if (imageInfo) {
                // Tính vị trí để chèn biểu đồ (dưới bảng dữ liệu và dòng tăng trưởng)
                const lastRow = sheet.lastRow.number + 2;

                // Lấy ảnh trực tiếp từ blob
                const imageId = workbook.addImage({
                    base64: chartImg,
                    extension: 'png',
                });

                // Chèn ảnh vào sheet
                sheet.addImage(imageId, {
                    tl: { col: 0, row: lastRow },
                    ext: { width: 500, height: 300 }
                });

                // Giải phóng bộ nhớ
                URL.revokeObjectURL(imageInfo.url);
            }
        } catch (err) {
            console.error('Lỗi khi thêm biểu đồ vào sheet:', err);
        }
    }
}

// Cấu hình cho sheet sản phẩm bán chạy
function configureProductsSheet(sheet, topProducts, startDate, endDate) {
    // Tiêu đề và thông tin chung
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'BÁO CÁO SẢN PHẨM BÁN CHẠY';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:C2');
    sheet.getCell('A2').value = `Từ ngày: ${startDate}`;
    sheet.mergeCells('D2:F2');
    sheet.getCell('D2').value = `Đến ngày: ${endDate}`;

    // Tạo bảng dữ liệu
    sheet.getCell('A4').value = 'Mã SP';
    sheet.getCell('B4').value = 'Tên sản phẩm';
    sheet.getCell('C4').value = 'Danh mục';
    sheet.getCell('D4').value = 'Số lượng';
    sheet.getCell('E4').value = 'Doanh thu';
    sheet.getCell('F4').value = 'Tỷ trọng';

    let row = 5;
    topProducts.forEach(product => {
        sheet.getCell(`A${row}`).value = product.id;
        sheet.getCell(`B${row}`).value = product.name;
        sheet.getCell(`C${row}`).value = product.category;
        sheet.getCell(`D${row}`).value = product.quantity;
        sheet.getCell(`E${row}`).value = product.revenue;
        sheet.getCell(`E${row}`).numFmt = '#,##0 ₫';
        sheet.getCell(`F${row}`).value = product.percentage + '%';
        row++;
    });

    // Định dạng header
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4'].forEach(cell => {
        sheet.getCell(cell).font = { bold: true };
        sheet.getCell(cell).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
        };
    });

    // Điều chỉnh độ rộng cột
    sheet.getColumn('A').width = 10;
    sheet.getColumn('B').width = 30;
    sheet.getColumn('C').width = 15;
    sheet.getColumn('D').width = 10;
    sheet.getColumn('E').width = 15;
    sheet.getColumn('F').width = 10;
}

// Cấu hình cho sheet doanh thu theo danh mục
async function configureCategoriesSheet(sheet, categories, startDate, endDate, chartImg) {
    // Tiêu đề và thông tin chung
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'BÁO CÁO DOANH THU THEO DANH MỤC';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:B2');
    sheet.getCell('A2').value = `Từ ngày: ${startDate}`;
    sheet.mergeCells('C2:D2');
    sheet.getCell('C2').value = `Đến ngày: ${endDate}`;

    // Tạo bảng dữ liệu
    sheet.getCell('A4').value = 'Danh mục';
    sheet.getCell('B4').value = 'Số lượng';
    sheet.getCell('C4').value = 'Doanh thu';
    sheet.getCell('D4').value = 'Tỷ trọng';

    let row = 5;
    categories.forEach(category => {
        sheet.getCell(`A${row}`).value = category.category;
        sheet.getCell(`B${row}`).value = category.quantity;
        sheet.getCell(`C${row}`).value = category.revenue;
        sheet.getCell(`C${row}`).numFmt = '#,##0 ₫';
        sheet.getCell(`D${row}`).value = category.percentage + '%';
        row++;
    });

    // Định dạng header
    ['A4', 'B4', 'C4', 'D4'].forEach(cell => {
        sheet.getCell(cell).font = { bold: true };
        sheet.getCell(cell).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
        };
    });

    // Điều chỉnh độ rộng cột
    sheet.getColumn('A').width = 25;
    sheet.getColumn('B').width = 12;
    sheet.getColumn('C').width = 18;
    sheet.getColumn('D').width = 12;

    // Thêm biểu đồ nếu có
    if (chartImg) {
        try {
            // Xử lý ảnh
            const imageInfo = await saveBase64ImageToTemp(chartImg, 'category');
            if (imageInfo) {
                // Tính vị trí để chèn biểu đồ (dưới bảng dữ liệu)
                const lastRow = sheet.lastRow.number + 2;

                // Lấy ảnh trực tiếp từ blob
                const imageId = workbook.addImage({
                    base64: chartImg,
                    extension: 'png',
                });

                // Chèn ảnh vào sheet
                sheet.addImage(imageId, {
                    tl: { col: 0, row: lastRow },
                    ext: { width: 500, height: 300 }
                });

                // Giải phóng bộ nhớ
                URL.revokeObjectURL(imageInfo.url);
            }
        } catch (err) {
            console.error('Lỗi khi thêm biểu đồ vào sheet:', err);
        }
    }
}

// Cấu hình cho sheet phương thức thanh toán
async function configurePaymentsSheet(sheet, paymentMethods, startDate, endDate, chartImg) {
    // Tiêu đề và thông tin chung
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'BÁO CÁO PHƯƠNG THỨC THANH TOÁN';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:B2');
    sheet.getCell('A2').value = `Từ ngày: ${startDate}`;
    sheet.mergeCells('C2:D2');
    sheet.getCell('C2').value = `Đến ngày: ${endDate}`;

    // Tạo bảng dữ liệu
    sheet.getCell('A4').value = 'Phương thức';
    sheet.getCell('B4').value = 'Số đơn hàng';
    sheet.getCell('C4').value = 'Doanh thu';
    sheet.getCell('D4').value = 'Tỷ trọng';

    let row = 5;
    paymentMethods.forEach(method => {
        sheet.getCell(`A${row}`).value = method.method;
        sheet.getCell(`B${row}`).value = method.orders;
        sheet.getCell(`C${row}`).value = method.revenue;
        sheet.getCell(`C${row}`).numFmt = '#,##0 ₫';
        sheet.getCell(`D${row}`).value = method.percentage + '%';
        row++;
    });

    // Định dạng header
    ['A4', 'B4', 'C4', 'D4'].forEach(cell => {
        sheet.getCell(cell).font = { bold: true };
        sheet.getCell(cell).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
        };
    });

    // Điều chỉnh độ rộng cột
    sheet.getColumn('A').width = 25;
    sheet.getColumn('B').width = 15;
    sheet.getColumn('C').width = 18;
    sheet.getColumn('D').width = 12;

    // Thêm biểu đồ nếu có
    if (chartImg) {
        try {
            // Xử lý ảnh
            const imageInfo = await saveBase64ImageToTemp(chartImg, 'payment');
            if (imageInfo) {
                // Tính vị trí để chèn biểu đồ (dưới bảng dữ liệu)
                const lastRow = sheet.lastRow.number + 2;

                // Lấy ảnh trực tiếp từ blob
                const imageId = workbook.addImage({
                    base64: chartImg,
                    extension: 'png',
                });

                // Chèn ảnh vào sheet
                sheet.addImage(imageId, {
                    tl: { col: 0, row: lastRow },
                    ext: { width: 500, height: 300 }
                });

                // Giải phóng bộ nhớ
                URL.revokeObjectURL(imageInfo.url);
            }
        } catch (err) {
            console.error('Lỗi khi thêm biểu đồ vào sheet:', err);
        }
    }
}

// Cấu hình cho sheet biến động kho hàng
function configureInventorySheet(sheet, inventory, startDate, endDate) {
    // Tiêu đề và thông tin chung
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'BÁO CÁO BIẾN ĐỘNG KHO HÀNG';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:C2');
    sheet.getCell('A2').value = `Từ ngày: ${startDate}`;
    sheet.mergeCells('D2:F2');
    sheet.getCell('D2').value = `Đến ngày: ${endDate}`;

    // Tạo bảng dữ liệu
    sheet.getCell('A4').value = 'Nguyên liệu';
    sheet.getCell('B4').value = 'Tồn đầu kỳ';
    sheet.getCell('C4').value = 'Nhập kho';
    sheet.getCell('D4').value = 'Xuất kho';
    sheet.getCell('E4').value = 'Tồn cuối kỳ';
    sheet.getCell('F4').value = 'Đơn vị';

    let row = 5;
    inventory.forEach(item => {
        sheet.getCell(`A${row}`).value = item.name;
        sheet.getCell(`B${row}`).value = item.initialStock;
        sheet.getCell(`C${row}`).value = item.import;
        sheet.getCell(`D${row}`).value = item.export;
        sheet.getCell(`E${row}`).value = item.finalStock;
        sheet.getCell(`F${row}`).value = item.unit;
        row++;
    });

    // Định dạng header
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4'].forEach(cell => {
        sheet.getCell(cell).font = { bold: true };
        sheet.getCell(cell).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
        };
    });

    // Điều chỉnh độ rộng cột
    sheet.getColumn('A').width = 30;
    sheet.getColumn('B').width = 12;
    sheet.getColumn('C').width = 12;
    sheet.getColumn('D').width = 12;
    sheet.getColumn('E').width = 12;
    sheet.getColumn('F').width = 10;
}

// Xuất Excel với đầy đủ dữ liệu và biểu đồ
async function exportExcelReport() {
    showLoading(); // Hiển thị overlay loading
    showNotification('Đang tạo báo cáo Excel...');

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const comparisonPeriod = document.getElementById('comparisonPeriod').value;

    try {
        // Lấy dữ liệu từ các API
        const summary = await fetchData(`/admin/api/reports/summary?startDate=${startDate}&endDate=${endDate}`);
        const topProducts = await fetchData(`/admin/api/reports/top-products?startDate=${startDate}&endDate=${endDate}&limit=10`);
        const categories = await fetchData(`/admin/api/reports/categories?startDate=${startDate}&endDate=${endDate}`);
        const paymentMethods = await fetchData(`/admin/api/reports/payment-methods?startDate=${startDate}&endDate=${endDate}`);
        const inventory = await fetchData(`/admin/api/reports/inventory?startDate=${startDate}&endDate=${endDate}`);
        const salesData = await fetchData(`/admin/api/reports/sales?startDate=${startDate}&endDate=${endDate}&groupBy=daily`);
        const comparisonData = await fetchData(`/admin/api/reports/comparison?period=${comparisonPeriod}`);

        // Lấy hình ảnh từ các biểu đồ
        showNotification('Đang chuẩn bị biểu đồ...', 'info');

        // Lấy hình ảnh biểu đồ
        const salesChartImg = getChartImageBase64('salesChart');
        const categoryChartImg = getChartImageBase64('categoryChart');
        const paymentMethodChartImg = getChartImageBase64('paymentMethodChart');
        const comparisonChartImg = getChartImageBase64('comparisonChart');

        // Tạo workbook mới
        const workbook = new ExcelJS.Workbook();

        // Tạo và cấu hình các sheets
        showNotification('Đang tạo các bảng dữ liệu...', 'info');

        // Sheet Tổng quan
        const summarySheet = workbook.addWorksheet('Tổng quan');
        configureSummarySheet(summarySheet, summary, startDate, endDate);

        // Sheet Doanh thu theo thời gian
        const salesSheet = workbook.addWorksheet('Doanh thu theo thời gian');
        configureSalesSheet(salesSheet, salesData, startDate, endDate);

        // Sheet So sánh theo thời gian
        const comparisonSheet = workbook.addWorksheet('So sánh theo thời gian');
        configureComparisonSheet(comparisonSheet, comparisonData, startDate, endDate, comparisonPeriod);

        // Sheet Sản phẩm bán chạy
        const productsSheet = workbook.addWorksheet('Sản phẩm bán chạy');
        configureProductsSheet(productsSheet, topProducts, startDate, endDate);

        // Sheet Doanh thu theo danh mục
        const categoriesSheet = workbook.addWorksheet('Doanh thu theo danh mục');
        configureCategoriesSheet(categoriesSheet, categories, startDate, endDate);

        // Sheet Phương thức thanh toán
        const paymentsSheet = workbook.addWorksheet('Phương thức thanh toán');
        configurePaymentsSheet(paymentsSheet, paymentMethods, startDate, endDate);

        // Sheet Biến động kho hàng
        const inventorySheet = workbook.addWorksheet('Biến động kho hàng');
        configureInventorySheet(inventorySheet, inventory, startDate, endDate);

        // Xử lý biểu đồ riêng sau khi đã tạo các sheet thành công
        try {
            if (salesChartImg) {
                const imageId1 = workbook.addImage({
                    base64: salesChartImg,
                    extension: 'png',
                });
                const lastRowSales = salesSheet.lastRow ? salesSheet.lastRow.number + 2 : 5;
                salesSheet.addImage(imageId1, {
                    tl: { col: 0, row: lastRowSales },
                    ext: { width: 500, height: 300 }
                });
            }

            if (categoryChartImg) {
                const imageId2 = workbook.addImage({
                    base64: categoryChartImg,
                    extension: 'png',
                });
                const lastRowCategory = categoriesSheet.lastRow ? categoriesSheet.lastRow.number + 2 : 5;
                categoriesSheet.addImage(imageId2, {
                    tl: { col: 0, row: lastRowCategory },
                    ext: { width: 500, height: 300 }
                });
            }

            if (paymentMethodChartImg) {
                const imageId3 = workbook.addImage({
                    base64: paymentMethodChartImg,
                    extension: 'png',
                });
                const lastRowPayment = paymentsSheet.lastRow ? paymentsSheet.lastRow.number + 2 : 5;
                paymentsSheet.addImage(imageId3, {
                    tl: { col: 0, row: lastRowPayment },
                    ext: { width: 500, height: 300 }
                });
            }

            if (comparisonChartImg) {
                const imageId4 = workbook.addImage({
                    base64: comparisonChartImg,
                    extension: 'png',
                });
                const lastRowComparison = comparisonSheet.lastRow ? comparisonSheet.lastRow.number + 2 : 5;
                comparisonSheet.addImage(imageId4, {
                    tl: { col: 0, row: lastRowComparison },
                    ext: { width: 500, height: 300 }
                });
            }
        } catch (imgError) {
            console.error('Không thể thêm hình ảnh biểu đồ:', imgError);
            // Vẫn tiếp tục xuất file Excel ngay cả khi không thêm được ảnh
        }

        // Xuất file
        showNotification('Đang hoàn thiện báo cáo Excel...', 'info');

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const fileName = `bao-cao-doanh-thu-${startDate}-${endDate}.xlsx`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Giải phóng bộ nhớ
        URL.revokeObjectURL(link.href);

        showNotification('Xuất báo cáo Excel thành công');
    } catch (error) {
        console.error('Lỗi khi tạo báo cáo Excel:', error);
        showNotification('Không thể tạo báo cáo Excel: ' + error.message, 'error');
    } finally {
        hideLoading(); // Ẩn overlay loading
    }
}

// Hàm lấy nhãn kỳ so sánh
function getComparisonLabel(period) {
    switch (period) {
        case 'week': return 'tuần này/tuần trước';
        case 'month': return 'tháng này/tháng trước';
        case 'quarter': return 'quý này/quý trước';
        case 'year': return 'năm này/năm trước';
        default: return 'kỳ này/kỳ trước';
    }
}

// Xuất PDF đầy đủ với biểu đồ
async function exportPdfReport() {
    showLoading(); // Hiển thị overlay loading
    showNotification('Đang tạo báo cáo PDF...');

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const comparisonPeriod = document.getElementById('comparisonPeriod').value;

    try {
        // Lấy dữ liệu từ API
        showNotification('Đang thu thập dữ liệu báo cáo...', 'info');

        // Lấy dữ liệu
        const summary = await fetchData(`/admin/api/reports/summary?startDate=${startDate}&endDate=${endDate}`);
        const topProducts = await fetchData(`/admin/api/reports/top-products?startDate=${startDate}&endDate=${endDate}&limit=10`);
        const categories = await fetchData(`/admin/api/reports/categories?startDate=${startDate}&endDate=${endDate}`);
        const paymentMethods = await fetchData(`/admin/api/reports/payment-methods?startDate=${startDate}&endDate=${endDate}`);
        const inventory = await fetchData(`/admin/api/reports/inventory?startDate=${startDate}&endDate=${endDate}`);
        const salesData = await fetchData(`/admin/api/reports/sales?startDate=${startDate}&endDate=${endDate}&groupBy=daily`);
        const comparisonData = await fetchData(`/admin/api/reports/comparison?period=${comparisonPeriod}`);

        showNotification('Đang tạo báo cáo PDF...', 'info');

        // Lấy hình ảnh từ các biểu đồ
        showNotification('Đang chuẩn bị biểu đồ...', 'info');

        // Lấy ảnh biểu đồ
        const salesChartImg = getChartImageBase64('salesChart');
        const categoryChartImg = getChartImageBase64('categoryChart');
        const paymentChartImg = getChartImageBase64('paymentMethodChart');
        const comparisonChartImg = getChartImageBase64('comparisonChart');

        // Tạo tài liệu PDF
        showNotification('Đang tạo tài liệu PDF...', 'info');

        // Định nghĩa font và styles
        const docDefinition = {
            content: [
                // Tiêu đề báo cáo
                { text: 'BÁO CÁO DOANH THU', style: 'header', alignment: 'center' },
                { text: `Thời gian: Từ ${startDate} đến ${endDate}`, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] },

                // Phần tổng quan
                { text: 'TỔNG QUAN', style: 'sectionHeader' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', '*'],
                        body: [
                            [{ text: 'Chỉ tiêu', style: 'tableHeader' }, { text: 'Giá trị', style: 'tableHeader' }],
                            ['Tổng số đơn hàng', summary.totalOrders.toString()],
                            ['Tổng doanh thu', formatCurrency(summary.totalRevenue)],
                            ['Số lượng khách hàng mới', summary.totalCustomers.toString()],
                            ['Tăng trưởng', summary.growthRate + '%']
                        ]
                    },
                    margin: [0, 10, 0, 15]
                },

                // Biểu đồ doanh thu
                { text: 'DOANH THU THEO THỜI GIAN', style: 'sectionHeader' },
                salesChartImg ? { text: 'Biểu đồ doanh thu theo thời gian:', style: 'chartLabel' } : {},
                salesChartImg ? {
                    image: salesChartImg,
                    width: 500,
                    alignment: 'center',
                    margin: [0, 5, 0, 10]
                } : {},

                // Thêm bảng doanh thu theo thời gian
                { text: 'Bảng doanh thu theo thời gian:', style: 'chartLabel', margin: [0, 10, 0, 5] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Ngày', style: 'tableHeader' },
                                { text: 'Doanh thu', style: 'tableHeader' },
                                { text: 'Số đơn hàng', style: 'tableHeader' }
                            ],
                            ...salesData.map(item => [
                                item.date,
                                formatCurrency(item.revenue),
                                item.orders.toString()
                            ]),
                            [
                                { text: 'Tổng cộng', style: 'tableHeader' },
                                {
                                    text: formatCurrency(salesData.reduce((sum, item) => sum + item.revenue, 0)),
                                    style: 'tableHeader'
                                },
                                {
                                    text: salesData.reduce((sum, item) => sum + item.orders, 0).toString(),
                                    style: 'tableHeader'
                                }
                            ]
                        ]
                    },
                    margin: [0, 0, 0, 15]
                },

                // Biểu đồ so sánh doanh thu
                { text: `SO SÁNH DOANH THU ${getComparisonLabel(comparisonPeriod).toUpperCase()}`, style: 'sectionHeader', pageBreak: 'before' },
                comparisonChartImg ? {
                    image: comparisonChartImg,
                    width: 500,
                    alignment: 'center',
                    margin: [0, 5, 0, 20]
                } : {},

                {
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', '*'],
                        body: [
                            [
                                { text: 'Ngày', style: 'tableHeader' },
                                { text: 'Kỳ hiện tại', style: 'tableHeader' },
                                { text: 'Kỳ trước', style: 'tableHeader' }
                            ],
                            ...comparisonData.current.map((item, index) => [
                                item.date,
                                formatCurrency(item.revenue),
                                formatCurrency(comparisonData.previous[index].revenue)
                            ])
                        ]
                    },
                    margin: [0, 10, 0, 15]
                },

                // Phần sản phẩm bán chạy
                { text: 'SẢN PHẨM BÁN CHẠY', style: 'sectionHeader', pageBreak: 'before' },
                {
                    table: {
                        headerRows: 1,
                        widths: [40, '*', 70, 50, 70, 50],
                        body: [
                            [
                                { text: 'Mã SP', style: 'tableHeader' },
                                { text: 'Tên sản phẩm', style: 'tableHeader' },
                                { text: 'Danh mục', style: 'tableHeader' },
                                { text: 'Số lượng', style: 'tableHeader' },
                                { text: 'Doanh thu', style: 'tableHeader' },
                                { text: 'Tỷ trọng', style: 'tableHeader' }
                            ],
                            ...topProducts.map(product => [
                                product.id,
                                product.name,
                                product.category,
                                product.quantity,
                                formatCurrency(product.revenue),
                                product.percentage + '%'
                            ])
                        ]
                    },
                    margin: [0, 10, 0, 15]
                },

                // Phần doanh thu theo danh mục
                { text: 'DOANH THU THEO DANH MỤC', style: 'sectionHeader', margin: [0, 15, 0, 10] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Danh mục', style: 'tableHeader' },
                                { text: 'Số lượng', style: 'tableHeader' },
                                { text: 'Doanh thu', style: 'tableHeader' },
                                { text: 'Tỷ trọng', style: 'tableHeader' }
                            ],
                            ...categories.map(category => [
                                category.category,
                                category.quantity,
                                formatCurrency(category.revenue),
                                category.percentage + '%'
                            ])
                        ]
                    },
                    margin: [0, 5, 0, 15]
                },

                // Biểu đồ danh mục
                categoryChartImg ? { text: 'Biểu đồ doanh thu theo danh mục:', style: 'chartLabel' } : {},
                categoryChartImg ? {
                    image: categoryChartImg,
                    width: 450,
                    alignment: 'center',
                    margin: [0, 5, 0, 20]
                } : {},

                // Phần phương thức thanh toán
                { text: 'THỐNG KÊ PHƯƠNG THỨC THANH TOÁN', style: 'sectionHeader', pageBreak: 'before' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Phương thức', style: 'tableHeader' },
                                { text: 'Số đơn hàng', style: 'tableHeader' },
                                { text: 'Doanh thu', style: 'tableHeader' },
                                { text: 'Tỷ trọng', style: 'tableHeader' }
                            ],
                            ...paymentMethods.map(method => [
                                method.method,
                                method.orders,
                                formatCurrency(method.revenue),
                                method.percentage + '%'
                            ])
                        ]
                    },
                    margin: [0, 5, 0, 15]
                },

                // Biểu đồ phương thức thanh toán
                paymentChartImg ? { text: 'Biểu đồ phương thức thanh toán:', style: 'chartLabel' } : {},
                paymentChartImg ? {
                    image: paymentChartImg,
                    width: 400,
                    alignment: 'center',
                    margin: [0, 5, 0, 20]
                } : {},

                // Phần biến động kho hàng
                { text: 'BIẾN ĐỘNG KHO HÀNG', style: 'sectionHeader', margin: [0, 15, 0, 10] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Nguyên liệu', style: 'tableHeader' },
                                { text: 'Tồn đầu kỳ', style: 'tableHeader' },
                                { text: 'Nhập kho', style: 'tableHeader' },
                                { text: 'Xuất kho', style: 'tableHeader' },
                                { text: 'Tồn cuối kỳ', style: 'tableHeader' },
                                { text: 'Đơn vị', style: 'tableHeader' }
                            ],
                            ...inventory.map(item => [
                                item.name,
                                item.initialStock,
                                item.import,
                                item.export,
                                item.finalStock,
                                item.unit
                            ])
                        ]
                    },
                    margin: [0, 5, 0, 15]
                }
            ],

            // Định nghĩa styles
            styles: {
                header: {
                    fontSize: 20,
                    bold: true,
                    margin: [0, 0, 0, 10]
                },
                subheader: {
                    fontSize: 14,
                    margin: [0, 0, 0, 5]
                },
                sectionHeader: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 10, 0, 10],
                    color: '#1e88e5'
                },
                tableHeader: {
                    bold: true,
                    fontSize: 12,
                    fillColor: '#f5f5f5'
                },
                chartLabel: {
                    bold: true,
                    fontSize: 12,
                    margin: [0, 15, 0, 5]
                }
            },

            // Đặt font Roboto cho toàn bộ tài liệu
            defaultStyle: {
                font: 'Roboto'
            },

            // Thông tin tài liệu
            info: {
                title: `Báo cáo doanh thu ${startDate} đến ${endDate}`,
                author: 'DND Coffee Admin',
                subject: 'Báo cáo thống kê doanh thu'
            }
        };

        // Lưu file PDF
        showNotification('Đang hoàn thiện báo cáo PDF...', 'info');

        // Tạo và tải xuống PDF
        pdfMake.createPdf(docDefinition).download(`bao-cao-doanh-thu-${startDate}-${endDate}.pdf`);
        showNotification('Xuất báo cáo PDF thành công');
    } catch (error) {
        console.error('Lỗi khi tạo báo cáo PDF:', error);
        showNotification('Không thể tạo báo cáo PDF: ' + error.message, 'error');
    } finally {
        hideLoading(); // Ẩn overlay loading
    }
}

// Hàm hỗ trợ để lấy dữ liệu từ API
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
}


// Hiển thị loading khi tải dữ liệu
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
    document.getElementById('reloadDataBtn').classList.add('loading');
}

// Ẩn loading sau khi tải xong
function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
    document.getElementById('reloadDataBtn').classList.remove('loading');
}

// Cập nhật hàm showNotification để sử dụng hiệu ứng mới
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.className = 'notification ' + type;
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Cập nhật hàm loadAllReportData để sử dụng hiệu ứng loading
function loadAllReportData() {
    showLoading(); // Hiển thị loading trước khi tải dữ liệu

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reportType = document.getElementById('reportType').value;
    const topProductsLimit = document.getElementById('topProductsLimit').value;
    const comparisonPeriod = document.getElementById('comparisonPeriod').value;

    // Tạo một mảng các promise để theo dõi tất cả các yêu cầu
    const promises = [
        loadSummaryData(startDate, endDate),
        loadSalesData(startDate, endDate, reportType),
        loadTopProducts(startDate, endDate, topProductsLimit),
        loadCategoryData(startDate, endDate),
        loadComparisonData(comparisonPeriod),
        loadPaymentMethodsData(startDate, endDate),
        loadInventoryData(startDate, endDate)
    ];

    // Khi tất cả các yêu cầu hoàn tất, ẩn loading
    Promise.all(promises)
        .catch(error => {
            console.error("Lỗi khi tải dữ liệu:", error);
            showNotification('Có lỗi xảy ra khi tải dữ liệu', 'error');
        })
        .finally(() => {
            hideLoading(); // Ẩn loading sau khi tất cả dữ liệu được tải
        });
}

// Khởi tạo trang
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo giá trị mặc định cho các trường ngày
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const formatDateForInput = date => {
        return date.toISOString().split('T')[0];
    };

    document.getElementById('startDate').value = formatDateForInput(firstDayOfMonth);
    document.getElementById('endDate').value = formatDateForInput(today);

    // Tải dữ liệu ban đầu
    loadAllReportData();

    // Xử lý sự kiện nút "Áp dụng" bộ lọc
    document.getElementById('applyFilter').addEventListener('click', loadAllReportData);

    // Xử lý sự kiện thay đổi loại báo cáo
    document.getElementById('reportType').addEventListener('change', function() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        loadSalesData(startDate, endDate, this.value);
    });

    // Xử lý sự kiện thay đổi loại biểu đồ doanh thu
    document.getElementById('salesChartType').addEventListener('change', function() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        loadSalesData(startDate, endDate, document.getElementById('reportType').value);
    });

    // Xử lý sự kiện thay đổi số lượng sản phẩm bán chạy
    document.getElementById('topProductsLimit').addEventListener('change', function() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        loadTopProducts(startDate, endDate, this.value);
    });

    // Xử lý sự kiện thay đổi kỳ so sánh
    document.getElementById('comparisonPeriod').addEventListener('change', function() {
        loadComparisonData(this.value);
    });

    // Xử lý sự kiện xuất báo cáo
    document.getElementById('exportExcelBtn').addEventListener('click', exportExcelReport);
    document.getElementById('exportPdfBtn').addEventListener('click', exportPdfReport);

    // Xử lý sự kiện thay đổi thời gian tự động tải lại
    document.getElementById('autoReloadTime').addEventListener('change', function() {
        const seconds = parseInt(this.value);
        if (seconds > 0) {
            startAutoReload(seconds);
            showNotification(`Đã bật tự động tải lại sau ${seconds} giây`);
        } else {
            stopAutoReload();
            showNotification('Đã tắt tự động tải lại');
        }
    });

    // Xử lý sự kiện nút tải lại thủ công
    document.getElementById('reloadDataBtn').addEventListener('click', reloadDataNow);

    // Đảm bảo dừng auto reload khi chuyển tab
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            if (tabId === 'powerbi') {
                // Dừng tự động tải lại khi chuyển sang tab Power BI
                stopAutoReload();
                document.getElementById('autoReloadTime').value = '0';
            }
        });
    });
});

// Load lại dữ liệu
// Biến quản lý tự động tải lại
let autoReloadTimer = null;
let remainingTime = 0;
let reloadInterval = 0;

// Hàm khởi tạo timer tự động tải lại
function startAutoReload(seconds) {
    // Dừng timer hiện tại nếu có
    stopAutoReload();

    if (seconds <= 0) return;

    reloadInterval = seconds;
    remainingTime = seconds;

    // Cập nhật đồng hồ đếm ngược
    updateReloadTimer();

    // Khởi tạo timer mới
    autoReloadTimer = setInterval(() => {
        remainingTime--;

        // Cập nhật đồng hồ đếm ngược
        updateReloadTimer();

        // Khi đếm ngược về 0, tải lại dữ liệu và reset đếm ngược
        if (remainingTime <= 0) {
            loadAllReportData();
            remainingTime = reloadInterval;
        }
    }, 1000);
}

// Hàm dừng timer tự động tải lại
function stopAutoReload() {
    if (autoReloadTimer) {
        clearInterval(autoReloadTimer);
        autoReloadTimer = null;
    }

    // Cập nhật giao diện nếu không còn tự động tải lại
    remainingTime = 0;
    updateReloadTimer();
}

// Hàm cập nhật hiển thị đồng hồ đếm ngược
function updateReloadTimer() {
    const timerElement = document.getElementById('reloadTimer');

    if (remainingTime > 0) {
        timerElement.textContent = `${remainingTime}s`;
        timerElement.style.display = 'block';
    } else {
        timerElement.style.display = 'none';
    }
}

// Hàm thủ công để tải lại dữ liệu ngay lập tức
function reloadDataNow() {
    // Đặt lại timer nếu đang sử dụng
    if (autoReloadTimer) {
        remainingTime = reloadInterval;
        updateReloadTimer();
    }

    // Tải lại tất cả dữ liệu báo cáo
    loadAllReportData();

    // Hiển thị thông báo
    showNotification('Đã tải lại dữ liệu báo cáo');
}