import express from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, userSchemas } from '../middleware/validation';

const router = express.Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticateToken);

// Profile management
router.get('/profile', userController.getProfile.bind(userController));
router.put('/profile', 
  validateRequest(userSchemas.updateProfile), 
  userController.updateProfile.bind(userController)
);

// Password management
router.put('/change-password', 
  validateRequest(userSchemas.changePassword), 
  userController.changePassword.bind(userController)
);

// User statistics
router.get('/stats', userController.getUserStats.bind(userController));

export default router;