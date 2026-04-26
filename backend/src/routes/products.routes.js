import { Router } from 'express';
import { authRequired } from '../middlewares/auth.middleware.js';
import * as productsCtrl from '../controllers/products.controller.js';

const router = Router();

router.post('/', authRequired, productsCtrl.createProduct);
router.get('/', authRequired, productsCtrl.listProducts);
router.get('/ranked', authRequired, productsCtrl.rankedProducts);
router.post('/generate-description', authRequired, productsCtrl.generateDescription);
router.get('/:productId', authRequired, productsCtrl.getProduct);
router.patch('/:productId', authRequired, productsCtrl.updateProduct);
router.delete('/:productId', authRequired, productsCtrl.deleteProduct);

export default router;
