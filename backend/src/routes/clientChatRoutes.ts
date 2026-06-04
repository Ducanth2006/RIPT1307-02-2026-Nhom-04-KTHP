import { Router } from 'express';
import {
    initClientRoom,
    getClientChatHistory,
    sendClientMessage,
    markClientMessagesRead
} from '../controllers/clientChatController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "Client Chat"
 *   description: API Hỗ trợ Trực tuyến (Chat với nhân viên)
 */

router.post('/room', initClientRoom);
router.get('/messages', getClientChatHistory);
router.post('/messages', sendClientMessage);
router.post('/read', markClientMessagesRead);

export default router;
