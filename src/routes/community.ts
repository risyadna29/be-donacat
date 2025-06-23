import express from 'express';
import { CommunityController } from '../controllers/communityController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, communitySchemas } from '../middleware/validation';
import { uploadKTP } from '../middleware/upload';
import multer from 'multer';

const router = express.Router();
const communityController = new CommunityController();

// All routes require authentication
router.use(authenticateToken);

// Error handling middleware for file upload
const handleUploadError = (error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.',
        error: error.message
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: error.message
    });
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed',
      error: error.message
    });
  }
  
  return next(error);
};

// Community membership
router.post('/join', 
  uploadKTP.single('ktp_photo'),
  handleUploadError,
  validateRequest(communitySchemas.joinCommunity), 
  communityController.joinCommunity.bind(communityController)
);

router.get('/status', communityController.getStatus.bind(communityController));
router.get('/my-request', communityController.getMyRequest.bind(communityController));

export default router;