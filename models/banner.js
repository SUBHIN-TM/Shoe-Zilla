const mongoose=require('../mongodb')

const bannerSchema = new mongoose.Schema({
    bannerName:{type:String,required:true},
    bannerImage:{type:String,required:true},
    imageId:{type:String,required:true},
},{versionKey:false});

const banner=mongoose.model('banner',bannerSchema,'banner');
module.exports=banner;

