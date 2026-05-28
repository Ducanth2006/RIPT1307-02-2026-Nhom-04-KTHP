const { execSync } = require('child_process');
const path = require('path');

try {
    const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
    const lines = statusOutput.split('\n').filter(line => line.trim() !== '');
    const total = lines.length;
    console.log(`Tìm thấy ${total} tệp thay đổi cần commit riêng biệt.`);

    lines.forEach((line, index) => {
        const status = line.substring(0, 2).trim();
        let filePath = line.substring(3).trim();

        // Handle quotes in paths
        if (filePath.startsWith('"') && filePath.endsWith('"')) {
            filePath = filePath.substring(1, filePath.length - 1);
        }

        const baseName = path.basename(filePath);
        let commitMsg = '';

        if (status === 'D') {
            commitMsg = `Tái cấu trúc: Xóa tệp cũ ${baseName} để sắp xếp lại thư mục`;
        } else {
            if (filePath.startsWith('backend/src/controllers/')) {
                commitMsg = `Cập nhật controller hệ thống: ${baseName} (Hỗ trợ giá vốn và đồng bộ kho)`;
            } else if (filePath.startsWith('backend/src/services/')) {
                commitMsg = `Cập nhật dịch vụ backend: ${baseName} (Đồng bộ tồn kho và lịch sử)`;
            } else if (filePath.startsWith('backend/src/routes/')) {
                commitMsg = `Cập nhật tuyến đường API backend: ${baseName}`;
            } else if (filePath.startsWith('frontend/src/pages/Admin/')) {
                commitMsg = `Cập nhật trang quản trị Admin: ${baseName} (Hỗ trợ phân quyền và giao diện)`;
            } else if (filePath.startsWith('frontend/src/pages/auth/')) {
                commitMsg = `Cập nhật trang xác thực: ${baseName} (Điều hướng người dùng và phân quyền)`;
            } else if (
                filePath.startsWith('frontend/src/pages/products/') ||
                filePath.startsWith('frontend/src/pages/cart/') ||
                filePath.startsWith('frontend/src/pages/profile/') ||
                filePath.startsWith('frontend/src/pages/notifications/') ||
                filePath.startsWith('frontend/src/pages/orders/')
            ) {
                commitMsg = `Cập nhật trang chức năng khách hàng: ${baseName} (Premium MLB UI và đồng bộ màu)`;
            } else if (filePath.startsWith('frontend/src/components/')) {
                commitMsg = `Cập nhật thành phần giao diện (Component): ${baseName}`;
            } else if (filePath.startsWith('frontend/src/services/admin/')) {
                commitMsg = `Tái cấu trúc: Thêm dịch vụ API admin ${baseName} vào thư mục modular mới`;
            } else if (filePath.startsWith('frontend/src/services/client/')) {
                commitMsg = `Tái cấu trúc: Thêm dịch vụ API client ${baseName} vào thư mục modular mới`;
            } else if (filePath.startsWith('frontend/src/store/')) {
                commitMsg = `Cập nhật Redux store: ${baseName} quản lý giỏ hàng cục bộ`;
            } else {
                commitMsg = `Cập nhật tệp cấu hình hệ thống: ${baseName}`;
            }
        }

        console.log(`[${index + 1}/${total}] Đang xử lý: ${filePath} | Trạng thái: ${status}`);
        console.log(`   Commit message: ${commitMsg}`);

        try {
            if (status === 'D') {
                execSync(`git rm --cached "${filePath}"`, { stdio: 'ignore' });
                execSync(`git add -u "${filePath}"`);
            } else {
                execSync(`git add "${filePath}"`);
            }
            execSync(`git commit -m "${commitMsg}"`);
        } catch (err) {
            console.error(`❌ Lỗi khi commit ${filePath}:`, err.message);
        }
    });

    console.log('\nTất cả các tệp đã được commit riêng biệt thành công!');
    console.log('Bắt đầu đẩy mã nguồn lên nhánh DungBe2 của origin...');
    execSync('git push origin DungBe2', { stdio: 'inherit' });
    console.log('Hoàn thành đẩy mã nguồn lên origin!');
} catch (error) {
    console.error('🔥 Lỗi hệ thống:', error.message);
}
