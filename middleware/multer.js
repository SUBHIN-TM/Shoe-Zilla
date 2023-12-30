
// const multer = require('multer');

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     console.log(__dirname);
//     cb(null, "D:\\Task 7\\Start\\uploads"); // Specify the desired upload directory
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname); // Preserve the original filename
//   }
// });

// const upload = multer({ storage: storage });

// module.exports = upload;



// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const multer = require('multer');
// const cloudinary=require('cloudinary').v2;


// const storage = new CloudinaryStorage({
//     cloudinary,
//     params: {
//       folder: 'profile-pictures',
//       allowed_formats: ['jpg', 'jpeg', 'png'],
//       transformation: [{ width: 150, height: 150, crop: 'limit' }],
//     },
//   });

// const upload = multer({ storage });
// module.exports = upload;



const multer = require('multer');
const path = require('path');

module.exports = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {
        let ext = path.extname(file.originalname);
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png' && ext !== '.webp') {
            cb(new Error('Unsupported file type!'), false);
            return;
        }
        cb(null, true);
    },
});

//it wiil  retun image path ,actualy it stored in c file inside tempeporary file 