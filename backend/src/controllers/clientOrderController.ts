import type { Request, Response } from 'express';
import { checkoutOrder } from '../services/clientOrderService';

export const createOrder = async (req: Request, res: Response): Promise<any> => {
    // Bắt đầu đếm thời gian thực thi (Performance tracking)
    const startTime = performance.now();

    try {
        const { userId, shippingAddress, paymentMethod, voucherCode } = req.body;

        // 1. Validate đầu vào cơ bản
        if (!userId) {
            return res.status(401).json({ message: "Vui lòng cung cấp userId để đặt hàng." });
        }
        if (!shippingAddress) {
            return res.status(400).json({ message: "Vui lòng cung cấp địa chỉ giao hàng (shippingAddress)." });
        }
        if (!paymentMethod) {
            return res.status(400).json({ message: "Vui lòng chọn phương thức thanh toán (paymentMethod)." });
        }

        // 2. Gọi Service xử lý logic phức tạp
        const order = await checkoutOrder({
            userId: Number(userId),
            shippingAddress,
            paymentMethod,
            voucherCode
        });

        // Kết thúc đếm thời gian
        const endTime = performance.now();
        const executionTimeMs = (endTime - startTime).toFixed(2);

        // 3. Trả về kết quả
        return res.status(201).json({
            message: "Đặt hàng thành công!",
            executionTime: `${executionTimeMs} ms`, // Trả về thời gian thực thi để FE/Tester thấy
            data: order
        });

    } catch (error: any) {
        // Kết thúc đếm thời gian (cho cả trường hợp lỗi)
        const endTime = performance.now();
        const executionTimeMs = (endTime - startTime).toFixed(2);

        console.error(`[Checkout Error - ${executionTimeMs}ms]:`, error);
        
        return res.status(400).json({ 
            message: error.message || "Đã xảy ra lỗi trong quá trình đặt hàng.",
            executionTime: `${executionTimeMs} ms`
        });
    }
};
