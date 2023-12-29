//  import {v2 as cloudinary} from 'cloudinary';
// const { v2: cloudinary } = require('cloudinary');
const cloudinary=require('cloudinary').v2;

          
cloudinary.config({ 
  cloud_name: 'du5c9fsno', 
  api_key: '524846843756522', 
  api_secret: 'ticqMrUTI74JLOhIkll-cXpq7sA' 
});


module.exports= cloudinary;

// cloudinary.v2.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" }, 
//   function(error, result) {console.log(result); });