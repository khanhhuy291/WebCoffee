// File: roboto-normal.js
// Đăng ký font Roboto cho jsPDF (hỗ trợ tiếng Việt)
import normalBase64 from 'roboto-base64/normal';
(function(jsPDFAPI) {
    var font = 'Roboto';
    var fontStyle = 'normal';

    // Dữ liệu font Roboto dạng base64 (chỉ là ví dụ, bạn nên dùng file base64 đầy đủ)
    var robotoNormal = normalBase64
    if (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF) {
        window.jspdf.jsPDF.API.addFileToVFS('Roboto-normal.ttf', robotoNormal);
        window.jspdf.jsPDF.API.addFont('Roboto-normal.ttf', font, fontStyle);
    } else if (jsPDFAPI) {
        jsPDFAPI.addFileToVFS('Roboto-normal.ttf', robotoNormal);
        jsPDFAPI.addFont('Roboto-normal.ttf', font, fontStyle);
    }
})(typeof window !== 'undefined' ? window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API : undefined);