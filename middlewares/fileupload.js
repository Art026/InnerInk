const multer = require('multer');
const path = require('path');
const util = require('util')
const { S3Client } = require('@aws-sdk/client-s3')
require('dotenv').config();

const multerS3 = require('multer-s3')
 
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  region: process.env.AWS_REGION
})

console.log("inside middleware")
console.log(process.env.AWS_ACCESS_KEY_ID);

const storage = multerS3({
  s3: s3,
  bucket: 'innerink-s3-bucket',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    cb(null,file.originalname)
  }
})
  

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|png/;

    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    const mimetype = filetypes.test(file.mimetype);
    

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only (jpeg, jpg, png, gif, mp4, mov, png)!');
    }
}

const UploadMiddleWares = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
      checkFileType(file, cb);
    },
}); 
  
module.exports = {UploadMiddleWares, checkFileType}
 