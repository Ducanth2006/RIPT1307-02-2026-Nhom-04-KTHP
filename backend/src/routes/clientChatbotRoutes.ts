import { Router } from 'express';
import { handleChatbotMessage } from '../controllers/clientChatbotController';

const router = Router();

// Endpoint gửi tin nhắn cho AI Chatbot: POST /api/chatbot
router.post('/', handleChatbotMessage);

export default router;
