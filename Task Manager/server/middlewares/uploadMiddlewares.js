import multer, { memoryStorage } from 'multer';

const storage = memoryStorage();

const uploadAssets = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only support image and PDF!'), false);
    }
  },
}).array('assets');

export default uploadAssets;
