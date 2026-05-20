import type { Request, Response } from 'express';
import {
    getAddressesByUserId,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} from '../services/clientAddressService';

export const getAddresses = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });

        const data = await getAddressesByUserId(Number(userId));
        return res.status(200).json({ message: 'Lấy danh sách địa chỉ thành công', data });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const addAddress = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, recipient_name, phone, address_line, city, is_default } = req.body;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });
        if (!recipient_name || !phone || !address_line || !city) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin địa chỉ.' });
        }

        const data = await createAddress(Number(userId), { recipient_name, phone, address_line, city, is_default });
        return res.status(201).json({ message: 'Thêm địa chỉ thành công', data });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const editAddress = async (req: Request, res: Response): Promise<any> => {
    try {
        const addressId = Number(req.params.id);
        const { userId, recipient_name, phone, address_line, city, is_default } = req.body;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });

        const data = await updateAddress(addressId, Number(userId), { recipient_name, phone, address_line, city, is_default });
        return res.status(200).json({ message: 'Cập nhật địa chỉ thành công', data });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const removeAddress = async (req: Request, res: Response): Promise<any> => {
    try {
        const addressId = Number(req.params.id);
        const userId = req.query.userId || req.body.userId;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });

        await deleteAddress(addressId, Number(userId));
        return res.status(200).json({ message: 'Xóa địa chỉ thành công' });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const makeDefault = async (req: Request, res: Response): Promise<any> => {
    try {
        const addressId = Number(req.params.id);
        const { userId } = req.body;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });

        const data = await setDefaultAddress(addressId, Number(userId));
        return res.status(200).json({ message: 'Đặt địa chỉ mặc định thành công', data });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
