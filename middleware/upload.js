const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, `../public/uploads/${folder}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};

const issueUpload = multer({
  storage: createStorage('issues'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).array('images', 5);

const profileUpload = multer({
  storage: createStorage('profiles'),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
}).single('profileImage');

module.exports = { issueUpload, profileUpload };
