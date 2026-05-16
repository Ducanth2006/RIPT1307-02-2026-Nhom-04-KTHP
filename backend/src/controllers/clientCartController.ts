import type { Request, Response } from 'express';
import {
    validateAndApplyVoucher,
    getCartByUserId,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart
} from '../services/clientCartService';

export const applyVoucher = async (req: Request, res: Response): Promise<any> => {
    try {
        const { code, cartTotal } = req.body;

        if (!code) {
            return res.status(400).json({ message: "Vui lòng cung cấp mã voucher." });
        }

        if (cartTotal === undefined || cartTotal === null || isNaN(Number(cartTotal))) {
            return res.status(400).json({ message: "Vui lòng cung cấp tổng giá trị đơn hàng hợp lệ (cartTotal)." });
        }

        const result = await validateAndApplyVoucher(code, Number(cartTotal));

        return res.status(200).json({
            message: "Áp dụng voucher thành công.",
            data: result
        });
    } catch (error: any) {
        console.error("Lỗi applyVoucher:", error);
        return res.status(400).json({
            message: error.message || "Lỗi khi áp dụng voucher."
        });
    }
};

// CART CRUD CONTROLLERS


export const getCart = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(401).json({ message: "Vui lòng cung cấp userId để xem giỏ hàng." });
        }

        const cart = await getCartByUserId(Number(userId));
        return res.status(200).json({
            message: "Lấy giỏ hàng thành công",
            data: cart
        });
    } catch (error: any) {
        console.error("Lỗi getCart:", error);
        return res.status(500).json({ message: error.message || "Lỗi hệ thống khi lấy giỏ hàng." });
    }
};

export const addToCart = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, variantId, quantity } = req.body;

        if (!userId || !variantId || !quantity) {
            return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ userId, variantId và quantity." });
        }

        const newItem = await addItemToCart(Number(userId), Number(variantId), Number(quantity));
        return res.status(201).json({
            message: "Thêm vào giỏ hàng thành công",
            data: newItem
        });
    } catch (error: any) {
        console.error("Lỗi addToCart:", error);
        return res.status(400).json({ message: error.message || "Lỗi khi thêm vào giỏ hàng." });
    }
};

export const updateCartItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const itemId = req.params.itemId;
        const { quantity } = req.body;

        if (!itemId || quantity === undefined) {
            return res.status(400).json({ message: "Vui lòng cung cấp itemId và quantity." });
        }

        const updatedItem = await updateItemQuantity(Number(itemId), Number(quantity));
        return res.status(200).json({
            message: "Cập nhật số lượng thành công",
            data: updatedItem
        });
    } catch (error: any) {
        console.error("Lỗi updateCartItem:", error);
        return res.status(400).json({ message: error.message || "Lỗi khi cập nhật giỏ hàng." });
    }
};

export const removeFromCart = async (req: Request, res: Response): Promise<any> => {
    try {
        const itemId = req.params.itemId;
        if (!itemId) {
            return res.status(400).json({ message: "Vui lòng cung cấp itemId cần xóa." });
        }

        await removeItemFromCart(Number(itemId));
        return res.status(200).json({
            message: "Xóa sản phẩm khỏi giỏ hàng thành công"
        });
    } catch (error: any) {
        console.error("Lỗi removeFromCart:", error);
        return res.status(400).json({ message: error.message || "Lỗi khi xóa khỏi giỏ hàng." });
    }
};
