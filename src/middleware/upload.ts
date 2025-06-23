import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { UPLOAD_LIMITS } from '../config/constants';
import fs from 'fs';

// Ensure upload directories exist with absolute paths
const ensureUploadDirs = () => {
  const baseDir = path.join(__dirname, '../../uploads');
  const dirs = [
    path.join(baseDir, 'ktp'),
    path.join(baseDir, 'campaigns')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created upload directory: ${dir}`);
    }
  });
};

ensureUploadDirs();

// Storage for KTP photos
const ktpStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/ktp');
    console.log('KTP upload destination:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueName = `ktp_${uuidv4()}${path.extname(file.originalname)}`;
    console.log('KTP filename generated:', uniqueName);
    cb(null, uniqueName);
  }
});

// Storage for campaign images
const campaignStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/campaigns');
    console.log('Campaign upload destination:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueName = `campaign_${uuidv4()}${path.extname(file.originalname)}`;
    console.log('Campaign filename generated:', uniqueName);
    cb(null, uniqueName);
  }
});

// File filter for images
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('File filter checking:', file.originalname, file.mimetype);
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const uploadKTP = multer({
  storage: ktpStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: UPLOAD_LIMITS.FILE_SIZE
  }
});

export const uploadCampaignImages = multer({
  storage: campaignStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: UPLOAD_LIMITS.FILE_SIZE
  }
});