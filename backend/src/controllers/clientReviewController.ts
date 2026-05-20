import type { Request, Response } from 'express';
import { createReview, getProductReviews, getUserReviews } from '../services/clientReviewService';

export const postReview = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, productId, orderId, rating, comment } = req.body;

        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });
        if (!productId || !orderId || !rating) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ productId, orderId và rating.' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating phải từ 1 đến 5.' });
        }

        const data = await createReview({
            userId: Number(userId),
            productId: Number(productId),
            orderId: Number(orderId),
            rating: Number(rating),
            comment
        });

        return res.status(201).json({ message: 'Đánh giá sản phẩm thành công', data });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getReviewsByProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        const productId = Number(req.params.productId);
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        if (isNaN(productId)) return res.status(400).json({ message: 'ID sản phẩm không hợp lệ.' });

        const data = await getProductReviews(productId, page, limit);
        return res.status(200).json({ message: 'Lấy đánh giá thành công', ...data });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const getMyReviews = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });

        const data = await getUserReviews(Number(userId));
        return res.status(200).json({ message: 'Lấy lịch sử đánh giá thành công', data });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};
