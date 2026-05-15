import { Router } from 'express';
import { getProducts, addProduct, editProduct, removeProduct } from '../controllers/productController';

const router = Router();

router.get('/', getProducts);
router.post('/', addProduct);
router.patch('/:id', editProduct); // Route để cập nhật thông tin sản phẩm
router.delete('/:id', removeProduct);

export default router;