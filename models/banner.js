const mongoose=require('../mongodb')
const bannerImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    originalName: { type: String, required: true },
  }, { _id: false });

  const imageIdSchema = new mongoose.Schema({
    publicId:{type:String,required:true}
  },{ _id: false })
  
const bannerSchema = new mongoose.Schema({
    bannerName:{type:String,required:true},
    bannerImage:[bannerImageSchema],
    imageId:[imageIdSchema],
},{versionKey:false});

const banner=mongoose.model('banner',bannerSchema,'banner');
module.exports=banner;

