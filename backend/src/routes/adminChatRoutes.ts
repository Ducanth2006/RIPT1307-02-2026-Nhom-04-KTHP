import { Router } from 'express';
import {
    getAdminChatRooms,
    getAdminChatHistory,
    sendAdminMessage,
    assignRoom,
    closeRoom,
    markAdminMessagesRead
} from '../controllers/adminChatController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "[Admin] Chat"
 *   description: API Quản trị kênh chat hỗ trợ khách hàng (Dành cho Admin & Staff)
 */

router.get('/rooms', getAdminChatRooms);
router.get('/rooms/:roomId/messages', getAdminChatHistory);
router.post('/messages', sendAdminMessage);
router.put('/rooms/assign', assignRoom);
router.delete('/rooms/:roomId', closeRoom);
router.post('/read', markAdminMessagesRead);

export default router;
