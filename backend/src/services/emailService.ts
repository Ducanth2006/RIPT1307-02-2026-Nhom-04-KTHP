import supabaseClient from '../config/supabase';

// Brevo (Sendinblue) HTTP API - gửi email qua port 443 (không bị Render Free chặn)
// Chỉ cần xác minh Gmail, KHÔNG cần sở hữu domain riêng
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const isEmailConfigured = () => {
    return !!(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
};

const sendEmail = async (options: {
    to: string[];
    subject: string;
    html: string;
    senderName?: string;
}) => {
    const apiKey = process.env.BREVO_API_KEY!;
    const senderEmail = process.env.BREVO_SENDER_EMAIL!;

    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: options.senderName || 'SportStride', email: senderEmail },
            to: options.to.map(email => ({ email })),
            subject: options.subject,
            htmlContent: options.html
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
    }

    return true;
};

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Lấy danh sách email của toàn bộ Admin và Staff
const getAdminEmails = async (): Promise<string[]> => {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('email')
            .in('role', ['Admin', 'Staff']);
        
        if (error || !data) return [];
        return data.map((u: any) => u.email).filter(Boolean);
    } catch (err) {
        console.error('Lỗi khi lấy email admin:', err);
        return [];
    }
};

/**
 * 1. Gửi Gmail thông báo trạng thái đơn hàng cho Khách hàng (Client)
 */
export const sendOrderStatusEmailToClient = async (orderId: number, status: string) => {
    try {
        // Lấy chi tiết đơn hàng
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    quantity,
                    unit_price,
                    product_variants (
                        size,
                        color,
                        products (
                            name,
                            product_images (
                                image_url,
                                is_main
                            )
                        )
                    )
                )
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error(`❌ Không tìm thấy đơn hàng #${orderId} để gửi email.`);
            return;
        }

        // Lấy thông tin khách hàng
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('email, full_name')
            .eq('id', order.user_id)
            .single();

        if (userError || !user || !user.email) {
            console.error(`❌ Không tìm thấy email của khách hàng #${order.user_id}. Chi tiết:`, userError);
            return;
        }


        // Trạng thái tiếng Việt và lời nhắn tương ứng
        let statusTitle = '';
        let statusText = '';
        let statusColor = '#af101a';

        switch (status) {
            case 'Confirmed':
                statusTitle = 'Đơn hàng đã được xác nhận';
                statusText = 'Tuyệt vời! Đơn hàng của bạn đã được chúng tôi xác nhận và đang tiến hành đóng gói sản phẩm.';
                statusColor = '#1e88e5';
                break;
            case 'Shipping':
                statusTitle = 'Đơn hàng đang được giao';
                statusText = 'Đơn hàng của bạn đã được bàn giao cho đơn vị vận chuyển và đang trên đường giao tới bạn.';
                statusColor = '#8e24aa';
                break;
            case 'Completed':
                statusTitle = 'Giao hàng thành công';
                statusText = 'Cảm ơn bạn đã mua sắm tại SportStride! Đơn hàng của bạn đã được giao thành công. Hy vọng bạn hài lòng với sản phẩm.';
                statusColor = '#43a047';
                break;
            case 'Cancelled':
                statusTitle = 'Đơn hàng đã bị hủy';
                const isCancelledByAdmin = order.cancel_reason === 'Hủy bởi Admin / Đồng ý hủy' || !order.cancel_reason;
                if (isCancelledByAdmin) {
                    statusText = 'Chúng tôi rất tiếc khi phải thông báo rằng đơn hàng của bạn đã bị hủy bởi quản trị viên hệ thống.';
                } else {
                    statusText = 'Đơn hàng của bạn đã được hủy thành công theo yêu cầu hủy từ phía bạn.';
                }
                statusColor = '#d32f2f';
                break;
            default:
                return; // Chỉ gửi email cho các trạng thái này theo yêu cầu
        }

        // Xây dựng danh sách sản phẩm trong HTML
        let itemsHtml = '';
        const items = order.order_items || [];
        for (const item of items) {
            const variant = item.product_variants;
            const product = variant?.products;
            const images = product?.product_images || [];
            const mainImage = images.find((img: any) => img.is_main)?.image_url || images[0]?.image_url || 'https://roijqlkzkwezvkfckunm.supabase.co/storage/v1/object/public/products/default.png';

            itemsHtml += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 8px; vertical-align: middle;">
                        <img src="${mainImage}" alt="${product?.name}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;" />
                    </td>
                    <td style="padding: 12px 8px; vertical-align: middle;">
                        <div style="font-weight: bold; color: #333;">${product?.name || 'Sản phẩm thể thao'}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">Kích thước: ${variant?.size || '---'} | Màu sắc: ${variant?.color || '---'}</div>
                    </td>
                    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; color: #333;">x${item.quantity}</td>
                    <td style="padding: 12px 8px; text-align: right; vertical-align: middle; font-weight: bold; color: #191c1e;">${formatMoney(item.unit_price)}</td>
                </tr>
            `;
        }

        const emailHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #af101a; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">SportStride</h1>
                    <p style="color: #ffdad6; margin: 5px 0 0 0; font-size: 13px;">Premium Sportswear & Footwear</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: ${statusColor}; margin-top: 0; font-size: 20px;">${statusTitle}!</h2>
                    <p style="color: #555; font-size: 15px; line-height: 1.6;">Xin chào <strong>${user.full_name || 'Khách hàng'}</strong>,</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.6;">${statusText}</p>
                    
                    <div style="background-color: #f9f9f9; border-left: 4px solid #af101a; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #444;"><strong>Mã đơn hàng:</strong> #<span style="color:#af101a; font-weight:bold;">${order.id}</span></p>
                        <p style="margin: 0; font-size: 14px; color: #444;"><strong>Ngày đặt:</strong> ${new Date(order.created_at).toLocaleString('vi-VN')}</p>
                    </div>

                    <!-- Items Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-top: 25px;">
                        <thead>
                            <tr style="border-bottom: 2px solid #ddd; background-color: #f5f5f5;">
                                <th style="text-align: left; padding: 8px; font-size: 13px; color: #555;">Ảnh</th>
                                <th style="text-align: left; padding: 8px; font-size: 13px; color: #555;">Sản phẩm</th>
                                <th style="text-align: center; padding: 8px; font-size: 13px; color: #555;">SL</th>
                                <th style="text-align: right; padding: 8px; font-size: 13px; color: #555;">Đơn giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <!-- Pricing Summary -->
                    <div style="width: 100%; margin-top: 20px; text-align: right; font-size: 15px; color: #333;">
                        <p style="margin: 5px 0;">Giảm giá Voucher: <span style="color: #af101a;">-${formatMoney(order.discount_amount || 0)}</span></p>
                        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #15803d;">Tổng cộng: ${formatMoney(order.final_amount)}</p>
                    </div>

                    <!-- Button CTA -->
                    <div style="text-align: center; margin-top: 35px; margin-bottom: 10px;">
                        <a href="http://localhost:5173/orders?openOrderId=${order.id}" 
                           style="background-color: #af101a; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 15px; box-shadow: 0 4px 6px rgba(175, 16, 26, 0.2);">
                           Xem chi tiết đơn hàng
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #fafafa; border-top: 1px solid #eee; padding: 20px; text-align: center; font-size: 12px; color: #999;">
                    <p style="margin: 0 0 5px 0;">Cảm ơn bạn đã lựa chọn SportStride!</p>
                    <p style="margin: 0;">© ${new Date().getFullYear()} SportStride. All rights reserved.</p>
                </div>
            </div>
        `;

        if (isEmailConfigured()) {
            await sendEmail({
                to: [user.email],
                subject: `[SportStride] Cập nhật đơn hàng #${order.id} - ${statusTitle}`,
                html: emailHtml
            });
            console.log(`✉️ Đã gửi Email thông báo trạng thái "${statusTitle}" cho khách hàng ${user.email}`);
        } else {
            console.log(`[EMAIL LOG - MOCK] Gửi tới: ${user.email} | Tiêu đề: [SportStride] Cập nhật đơn hàng #${order.id} - ${statusTitle}`);
        }

    } catch (err) {
        console.error('❌ Lỗi khi gửi mail cập nhật trạng thái cho khách hàng:', err);
    }
};

/**
 * 2. Gửi Gmail thông báo có Đơn hàng mới cho Admin/Staff
 */
export const sendNewOrderEmailToAdmins = async (orderId: number) => {
    try {
        // Lấy thông tin đơn hàng
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    quantity,
                    unit_price,
                    product_variants (
                        size,
                        color,
                        products (
                            name,
                            product_images (
                                image_url,
                                is_main
                            )
                        )
                    )
                )
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) return;

        // Lấy thông tin người mua
        const { data: user } = await supabaseClient
            .from('users')
            .select('full_name, email')
            .eq('id', order.user_id)
            .single();

        const customerName = order.shipping_address?.nguoiNhan || user?.full_name || 'Khách hàng';
        const customerEmail = user?.email || 'Chưa cung cấp';
        const customerPhone = order.shipping_address?.soDienThoai || 'Chưa cung cấp';

        // Lấy danh sách admin
        const adminEmails = await getAdminEmails();
        if (adminEmails.length === 0) {
            console.warn('⚠️ Không tìm thấy email của Admin/Staff nào trong hệ thống.');
            return;
        }


        // Xây dựng danh sách sản phẩm trong HTML
        let itemsHtml = '';
        const items = order.order_items || [];
        for (const item of items) {
            const variant = item.product_variants;
            const product = variant?.products;
            const images = product?.product_images || [];
            const mainImage = images.find((img: any) => img.is_main)?.image_url || images[0]?.image_url || 'https://roijqlkzkwezvkfckunm.supabase.co/storage/v1/object/public/products/default.png';

            itemsHtml += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 5px; vertical-align: middle;">
                        <img src="${mainImage}" alt="${product?.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;" />
                    </td>
                    <td style="padding: 10px 5px; vertical-align: middle; font-size: 13px; color: #333;">
                        <strong>${product?.name}</strong><br/>
                        <span style="font-size:11px; color:#777;">Size: ${variant?.size} | Màu: ${variant?.color}</span>
                    </td>
                    <td style="padding: 10px 5px; text-align: center; vertical-align: middle; font-size: 13px;">x${item.quantity}</td>
                    <td style="padding: 10px 5px; text-align: right; vertical-align: middle; font-size: 13px; font-weight: bold;">${formatMoney(item.unit_price)}</td>
                </tr>
            `;
        }

        const emailHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #191c1e; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">SportStride ERP</h1>
                    <p style="color: #af101a; margin: 5px 0 0 0; font-size: 13px; font-weight: bold;">HỆ THỐNG THÔNG BÁO TỰ ĐỘNG</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: #af101a; margin-top: 0; font-size: 18px; border-bottom: 2px solid #f5f5f5; padding-bottom: 10px;">🔔 Có đơn hàng mới chờ duyệt!</h2>
                    
                    <p style="color: #555; font-size: 14px;">Hệ thống vừa ghi nhận đơn hàng mới <strong>#${order.id}</strong> cần được xử lý:</p>
                    
                    <!-- Customer Details -->
                    <h3 style="color: #333; font-size: 14px; margin-top: 20px;">Thông tin khách hàng:</h3>
                    <table style="width: 100%; font-size: 13px; color: #555; margin-bottom: 20px; background-color:#f9f9f9; padding: 12px; border-radius: 6px;">
                        <tr>
                            <td style="width: 120px; padding: 4px 0;"><strong>Họ tên nhận:</strong></td>
                            <td>${customerName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>Số điện thoại:</strong></td>
                            <td>${customerPhone}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>Email tài khoản:</strong></td>
                            <td>${customerEmail}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; vertical-align: top;"><strong>Địa chỉ giao:</strong></td>
                            <td>${order.shipping_address?.diaChiChiTiet || order.shipping_address || '---'}</td>
                        </tr>
                    </table>

                    <!-- Items Table -->
                    <h3 style="color: #333; font-size: 14px;">Chi tiết sản phẩm:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #ccc; background-color: #f0f0f0;">
                                <th style="text-align: left; padding: 6px; font-size: 12px;">Ảnh</th>
                                <th style="text-align: left; padding: 6px; font-size: 12px;">Sản phẩm</th>
                                <th style="text-align: center; padding: 6px; font-size: 12px;">SL</th>
                                <th style="text-align: right; padding: 6px; font-size: 12px;">Đơn giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div style="text-align: right; font-size: 15px; font-weight: bold; margin-top: 15px; color:#191c1e;">
                        Tổng giá trị đơn: <span style="color:#15803d; font-size:18px;">${formatMoney(order.final_amount)}</span>
                    </div>

                    <!-- Button CTA -->
                    <div style="text-align: center; margin-top: 35px; margin-bottom: 10px;">
                        <a href="http://localhost:5173/admin/orders?openOrderId=${order.id}" 
                           style="background-color: #191c1e; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 14px; border: 1px solid #af101a;">
                           Duyệt đơn hàng ngay
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #fafafa; border-top: 1px solid #eee; padding: 15px; text-align: center; font-size: 11px; color: #999;">
                    <p style="margin: 0;">Thông báo tự động từ SportStride ERP Console.</p>
                </div>
            </div>
        `;

        if (isEmailConfigured()) {
            await sendEmail({
                to: adminEmails,
                subject: `[SportStride ERP] Đơn hàng mới #${order.id} chờ duyệt`,
                html: emailHtml,
                senderName: 'SportStride System'
            });
            console.log(`✉️ Đã gửi Email báo đơn hàng mới #${order.id} tới: ${adminEmails.join(', ')}`);
        } else {
            console.log(`[EMAIL LOG - MOCK] Gửi tới Admins: ${adminEmails.join(', ')} | Tiêu đề: [SportStride ERP] Đơn hàng mới #${order.id} chờ duyệt`);
        }
    } catch (err) {
        console.error('❌ Lỗi khi gửi mail thông báo đơn hàng mới cho admin:', err);
    }
};

/**
 * 3. Gửi Gmail thông báo có Khiếu nại mới cho Admin/Staff
 */
export const sendNewComplaintEmailToAdmins = async (complaintId: number) => {
    try {
        // Lấy chi tiết khiếu nại
        const { data: complaint, error: compError } = await supabaseClient
            .from('complaints')
            .select('*')
            .eq('id', complaintId)
            .single();

        if (compError || !complaint) return;

        // Lấy thông tin khách hàng khiếu nại
        const { data: user } = await supabaseClient
            .from('users')
            .select('full_name, email')
            .eq('id', complaint.user_id)
            .single();

        // Lấy số điện thoại từ đơn hàng liên quan nếu có
        let customerPhone = '---';
        if (complaint.order_id) {
            try {
                const { data: order } = await supabaseClient
                    .from('orders')
                    .select('shipping_address')
                    .eq('id', complaint.order_id)
                    .single();
                if (order && order.shipping_address) {
                    const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
                    customerPhone = addr.soDienThoai || '---';
                }
            } catch (e) {
                console.error("Lỗi lấy SĐT cho khiếu nại:", e);
            }
        }

        // Lấy danh sách admin
        const adminEmails = await getAdminEmails();
        if (adminEmails.length === 0) return;


        const emailHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #191c1e; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">SportStride ERP</h1>
                    <p style="color: #af101a; margin: 5px 0 0 0; font-size: 13px; font-weight: bold;">HỆ THỐNG THÔNG BÁO TỰ ĐỘNG</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: #d32f2f; margin-top: 0; font-size: 18px; border-bottom: 2px solid #f5f5f5; padding-bottom: 10px;">⚠️ Có khiếu nại mới cần xử lý!</h2>
                    
                    <p style="color: #555; font-size: 14px;">Khách hàng vừa gửi một khiếu nại/góp ý mới trên hệ thống:</p>
                    
                    <!-- Complaint Details -->
                    <table style="width: 100%; font-size: 13px; color: #555; margin-top: 15px; margin-bottom: 25px; background-color:#fff8f8; border-left: 4px solid #d32f2f; padding: 12px; border-radius: 4px;">
                        <tr>
                            <td style="width: 120px; padding: 4px 0;"><strong>Khách hàng:</strong></td>
                            <td><strong>${user?.full_name || 'Ẩn danh'}</strong> (${user?.email || 'Không có email'})</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>Số điện thoại:</strong></td>
                            <td>${customerPhone}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>Chủ đề:</strong></td>
                            <td style="color:#d32f2f; font-weight:bold;">${complaint.subject || 'Khiếu nại sản phẩm/đơn hàng'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; vertical-align: top;"><strong>Nội dung:</strong></td>
                            <td style="line-height:1.5;">${complaint.content || '---'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>Ngày gửi:</strong></td>
                            <td>${new Date(complaint.created_at).toLocaleString('vi-VN')}</td>
                        </tr>
                    </table>

                    <!-- Button CTA -->
                    <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
                        <a href="http://localhost:5173/admin/complaints" 
                           style="background-color: #191c1e; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 14px; border: 1px solid #d32f2f;">
                           Đến trang xử lý khiếu nại
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #fafafa; border-top: 1px solid #eee; padding: 15px; text-align: center; font-size: 11px; color: #999;">
                    <p style="margin: 0;">Thông báo tự động từ SportStride ERP Console.</p>
                </div>
            </div>
        `;

        if (isEmailConfigured()) {
            await sendEmail({
                to: adminEmails,
                subject: `[SportStride ERP] Có khiếu nại mới từ khách hàng: ${complaint.subject}`,
                html: emailHtml,
                senderName: 'SportStride System'
            });
            console.log(`✉️ Đã gửi Email báo khiếu nại mới #${complaintId} tới: ${adminEmails.join(', ')}`);
        } else {
            console.log(`[EMAIL LOG - MOCK] Gửi tới Admins: ${adminEmails.join(', ')} | Tiêu đề: [SportStride ERP] Có khiếu nại mới: ${complaint.subject}`);
        }
    } catch (err) {
        console.error('❌ Lỗi khi gửi mail thông báo khiếu nại mới cho admin:', err);
    }
};

/**
 * 4. Gửi Gmail thông báo phản hồi khiếu nại cho Khách hàng (Client)
 */
export const sendComplaintReplyEmailToClient = async (complaintId: number) => {
    try {
        // Lấy chi tiết khiếu nại
        const { data: complaint, error: compError } = await supabaseClient
            .from('complaints')
            .select('*')
            .eq('id', complaintId)
            .single();

        if (compError || !complaint) {
            console.error(`❌ Không tìm thấy khiếu nại #${complaintId} để gửi email.`);
            return;
        }

        // Lấy thông tin khách hàng khiếu nại
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('full_name, email')
            .eq('id', complaint.user_id)
            .single();

        if (userError || !user || !user.email) {
            console.error(`❌ Không tìm thấy email của khách hàng #${complaint.user_id}. Chi tiết:`, userError);
            return;
        }


        const emailHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #af101a; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">SportStride</h1>
                    <p style="color: #ffdad6; margin: 5px 0 0 0; font-size: 13px;">Premium Sportswear & Footwear</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: #43a047; margin-top: 0; font-size: 20px;">Khiếu nại của bạn đã được hồi đáp!</h2>
                    <p style="color: #555; font-size: 15px; line-height: 1.6;">Xin chào <strong>${user.full_name || 'Khách hàng'}</strong>,</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.6;">Yêu cầu khiếu nại của bạn về đơn hàng đã được Ban quản trị SportStride xử lý và phản hồi chi tiết như sau:</p>
                    
                    <!-- Details Table -->
                    <div style="background-color: #f9f9f9; border-left: 4px solid #43a047; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: #444;">
                        <p style="margin: 0 0 8px 0;"><strong>Mã khiếu nại:</strong> #${complaint.id}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Chủ đề:</strong> ${complaint.subject || 'Khiếu nại đơn hàng'}</p>
                        <p style="margin: 0 0 8px 0; line-height: 1.5;"><strong>Nội dung của bạn:</strong> <em>"${complaint.content || ''}"</em></p>
                        <p style="margin: 8px 0 0 0; line-height: 1.5; color: #1e88e5; padding-top: 8px; border-top: 1px dashed #ddd;">
                            <strong>Phản hồi của Shop:</strong> <strong>${complaint.admin_response || ''}</strong>
                        </p>
                    </div>

                    <!-- Button CTA -->
                    <div style="text-align: center; margin-top: 35px; margin-bottom: 10px;">
                        <a href="http://localhost:5173/profile?tab=complaints" 
                           style="background-color: #af101a; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 15px; box-shadow: 0 4px 6px rgba(175, 16, 26, 0.2);">
                           Xem phản hồi trên trang cá nhân
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #fafafa; border-top: 1px solid #eee; padding: 20px; text-align: center; font-size: 12px; color: #999;">
                    <p style="margin: 0 0 5px 0;">Cảm ơn bạn đã lựa chọn SportStride!</p>
                    <p style="margin: 0;">© ${new Date().getFullYear()} SportStride. All rights reserved.</p>
                </div>
            </div>
        `;

        if (isEmailConfigured()) {
            await sendEmail({
                to: [user.email],
                subject: `[SportStride] Phản hồi về khiếu nại #${complaint.id} - ${complaint.subject || ''}`,
                html: emailHtml,
                senderName: 'SportStride Support'
            });
            console.log(`✉️ Đã gửi Email phản hồi khiếu nại #${complaint.id} cho khách hàng ${user.email}`);
        } else {
            console.log(`[EMAIL LOG - MOCK] Gửi tới: ${user.email} | Tiêu đề: [SportStride] Phản hồi khiếu nại #${complaint.id}`);
        }

    } catch (err) {
        console.error('❌ Lỗi khi gửi mail phản hồi khiếu nại cho khách hàng:', err);
    }
};

/**
 * 5. Gửi Gmail thông báo Yêu cầu hủy đơn hàng cho các Admin
 */
export const sendCancelRequestEmailToAdmins = async (orderId: number, cancelReason: string) => {
    try {
        // Lấy chi tiết đơn hàng
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    quantity,
                    unit_price,
                    product_variants (
                        size,
                        color,
                        products (
                            name,
                            product_images (
                                image_url,
                                is_main
                            )
                        )
                    )
                )
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error(`❌ Không tìm thấy đơn hàng #${orderId} để gửi email yêu cầu hủy.`);
            return;
        }

        // Lấy thông tin khách hàng
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('email, full_name')
            .eq('id', order.user_id)
            .single();

        if (userError || !user) {
            console.error(`❌ Không tìm thấy thông tin khách hàng #${order.user_id}. Chi tiết:`, userError);
            return;
        }

        // Lấy danh sách email của tất cả Admin/Staff
        const { data: staffList, error: staffError } = await supabaseClient
            .from('users')
            .select('email')
            .in('role', ['Admin', 'Staff']);

        if (staffError || !staffList || staffList.length === 0) {
            console.error('❌ Không lấy được danh sách email Admin/Staff.');
            return;
        }

        const adminEmails = staffList.map(u => u.email).filter(Boolean) as string[];
        if (adminEmails.length === 0) return;


        // Xây dựng danh sách sản phẩm trong HTML
        let itemsHtml = '';
        const items = order.order_items || [];
        for (const item of items) {
            const variant = item.product_variants;
            const product = variant?.products;
            const images = product?.product_images || [];
            const mainImage = images.find((img: any) => img.is_main)?.image_url || images[0]?.image_url || 'https://roijqlkzkwezvkfckunm.supabase.co/storage/v1/object/public/products/default.png';

            itemsHtml += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 8px; vertical-align: middle;">
                        <img src="${mainImage}" alt="${product?.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;" />
                    </td>
                    <td style="padding: 12px 8px; vertical-align: middle;">
                        <div style="font-weight: bold; color: #333;">${product?.name || 'Sản phẩm thể thao'}</div>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">Kích thước: ${variant?.size || '---'} | Màu sắc: ${variant?.color || '---'}</div>
                    </td>
                    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; color: #333;">x${item.quantity}</td>
                    <td style="padding: 12px 8px; text-align: right; vertical-align: middle; font-weight: bold; color: #191c1e;">${formatMoney(item.unit_price)}</td>
                </tr>
            `;
        }

        let plainReason = 'Khách hàng gửi yêu cầu hủy';
        if (cancelReason) {
            try {
                const parsed = JSON.parse(cancelReason);
                plainReason = parsed.reason || cancelReason;
            } catch (e) {
                plainReason = cancelReason;
            }
        }

        const emailHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #d32f2f; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">SportStride ERP</h1>
                    <p style="color: #ffdad6; margin: 5px 0 0 0; font-size: 13px;">Yêu cầu hủy đơn hàng từ khách hàng</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: #d32f2f; margin-top: 0; font-size: 18px; border-bottom: 2px solid #f5f5f5; padding-bottom: 10px;">⚠️ Yêu cầu hủy đơn hàng #${order.id}</h2>
                    
                    <!-- Customer Details -->
                    <table style="width: 100%; font-size: 13px; color: #555; margin-top: 15px; margin-bottom: 25px; background-color:#fff8f8; border-left: 4px solid #d32f2f; padding: 12px; border-radius: 4px;">
                        <tr>
                            <td style="width: 120px; padding: 4px 0;"><strong>Khách hàng:</strong></td>
                            <td><strong>${user.full_name || 'Khách hàng'}</strong> (${user.email || 'Không có email'})</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>Số điện thoại:</strong></td>
                            <td>${order.shipping_address?.soDienThoai || '---'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; vertical-align: top;"><strong>Lý do hủy:</strong></td>
                            <td style="color:#d32f2f; font-weight:bold; line-height:1.5;">${plainReason}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>Tổng tiền đơn:</strong></td>
                            <td style="color:#af101a; font-weight:bold;">${formatMoney(order.final_amount)}</td>
                        </tr>
                    </table>

                    <!-- Items Section -->
                    <h3 style="font-size: 15px; color: #191c1e; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Danh sách sản phẩm trong đơn</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 30px;">
                        <thead>
                            <tr style="background-color: #fcfcfc; border-bottom: 2px solid #eee; color: #666; text-align: left;">
                                <th style="padding: 8px; width: 60px;">Ảnh</th>
                                <th style="padding: 8px;">Sản phẩm</th>
                                <th style="padding: 8px; text-align: center; width: 60px;">SL</th>
                                <th style="padding: 8px; text-align: right; width: 100px;">Giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <!-- Button CTA -->
                    <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
                        <a href="http://localhost:5173/admin/orders" 
                           style="background-color: #191c1e; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 14px; border: 1px solid #d32f2f;">
                           Đến trang quản lý đơn hàng
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #fafafa; border-top: 1px solid #eee; padding: 15px; text-align: center; font-size: 11px; color: #999;">
                    <p style="margin: 0;">Thông báo tự động từ SportStride ERP Console.</p>
                </div>
            </div>
        `;

        if (isEmailConfigured()) {
            await sendEmail({
                to: adminEmails,
                subject: `[SportStride ERP] Yêu cầu hủy đơn hàng mới: #${order.id}`,
                html: emailHtml,
                senderName: 'SportStride System'
            });
            console.log(`✉️ Đã gửi Email báo yêu cầu hủy đơn hàng #${orderId} tới: ${adminEmails.join(', ')}`);
        } else {
            console.log(`[EMAIL LOG - MOCK] Gửi tới Admins: ${adminEmails.join(', ')} | Tiêu đề: [SportStride ERP] Yêu cầu hủy đơn hàng #${orderId}`);
        }

    } catch (err) {
        console.error('❌ Lỗi khi gửi mail thông báo yêu cầu hủy đơn cho admin:', err);
    }
};

/**
 * 6. Gửi Gmail thông báo từ chối hủy đơn hàng cho khách hàng
 */
export const sendCancelRejectionEmailToClient = async (orderId: number) => {
    try {
        // Lấy chi tiết đơn hàng
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    quantity,
                    unit_price,
                    product_variants (
                        size,
                        color,
                        products (
                            name,
                            product_images (
                                image_url,
                                is_main
                            )
                        )
                    )
                )
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error(`❌ Không tìm thấy đơn hàng #${orderId} để gửi email từ chối hủy.`);
            return;
        }

        // Lấy thông tin khách hàng
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('email, full_name')
            .eq('id', order.user_id)
            .single();

        if (userError || !user || !user.email) {
            console.error(`❌ Không tìm thấy email của khách hàng #${order.user_id} để từ chối hủy.`);
            return;
        }


        // Xây dựng danh sách sản phẩm trong HTML
        let itemsHtml = '';
        const items = order.order_items || [];
        for (const item of items) {
            const variant = item.product_variants;
            const product = variant?.products;
            const images = product?.product_images || [];
            const mainImage = images.find((img: any) => img.is_main)?.image_url || images[0]?.image_url || 'https://roijqlkzkwezvkfckunm.supabase.co/storage/v1/object/public/products/default.png';

            itemsHtml += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 8px; vertical-align: middle;">
                        <img src="${mainImage}" alt="${product?.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;" />
                    </td>
                    <td style="padding: 12px 8px; vertical-align: middle;">
                        <div style="font-weight: bold; color: #333;">${product?.name || 'Sản phẩm thể thao'}</div>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">Kích thước: ${variant?.size || '---'} | Màu sắc: ${variant?.color || '---'}</div>
                    </td>
                    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; color: #333;">x${item.quantity}</td>
                    <td style="padding: 12px 8px; text-align: right; vertical-align: middle; font-weight: bold; color: #191c1e;">${formatMoney(item.unit_price)}</td>
                </tr>
            `;
        }

        const emailHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #191c1e; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">SportStride</h1>
                    <p style="color: #a1a1a1; margin: 5px 0 0 0; font-size: 13px;">Thông báo từ chối yêu cầu hủy đơn hàng</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: #191c1e; margin-top: 0; font-size: 18px; border-bottom: 2px solid #f5f5f5; padding-bottom: 10px;">Cập nhật đơn hàng #${order.id}</h2>
                    
                    <p style="color: #333; font-size: 15px; font-weight: bold;">Xin chào ${user.full_name || 'Khách hàng'},</p>
                    <p style="color: #555; font-size: 14px; line-height: 1.6;">
                        Yêu cầu hủy đơn hàng <strong>#${order.id}</strong> của bạn đã bị từ chối bởi quản trị viên. Chúng tôi sẽ tiếp tục xử lý và giao hàng cho bạn trong thời gian sớm nhất.
                    </p>

                    <!-- Items Section -->
                    <h3 style="font-size: 15px; color: #191c1e; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Danh sách sản phẩm trong đơn</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 30px;">
                        <thead>
                            <tr style="background-color: #fcfcfc; border-bottom: 2px solid #eee; color: #666; text-align: left;">
                                <th style="padding: 8px; width: 60px;">Ảnh</th>
                                <th style="padding: 8px;">Sản phẩm</th>
                                <th style="padding: 8px; text-align: center; width: 60px;">SL</th>
                                <th style="padding: 8px; text-align: right; width: 100px;">Giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div style="text-align: right; font-size: 14px; color: #333; margin-bottom: 30px;">
                        <p style="margin: 5px 0;">Tổng cộng: <strong style="font-size: 18px; color: #af101a;">${formatMoney(order.final_amount)}</strong></p>
                    </div>

                    <!-- Button CTA -->
                    <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
                        <a href="http://localhost:5173/account/orders/${order.id}" 
                           style="background-color: #191c1e; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 14px;">
                           Xem chi tiết đơn hàng
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #fafafa; border-top: 1px solid #eee; padding: 15px; text-align: center; font-size: 11px; color: #999;">
                    <p style="margin: 0;">Nếu có bất kỳ thắc mắc nào, xin vui lòng liên hệ bộ phận hỗ trợ khách hàng của SportStride.</p>
                </div>
            </div>
        `;

        if (isEmailConfigured()) {
            await sendEmail({
                to: [user.email],
                subject: `[SportStride] Yêu cầu hủy đơn hàng #${order.id} đã bị từ chối`,
                html: emailHtml,
                senderName: 'SportStride Support'
            });
            console.log(`✉️ Đã gửi Email từ chối hủy đơn hàng #${orderId} cho khách hàng ${user.email}`);
        } else {
            console.log(`[EMAIL LOG - MOCK] Gửi tới: ${user.email} | Tiêu đề: [SportStride] Từ chối hủy đơn hàng #${order.id}`);
        }

    } catch (err) {
        console.error('❌ Lỗi khi gửi mail từ chối hủy đơn hàng cho khách hàng:', err);
    }
};
