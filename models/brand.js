const mongoose=require('../mongodb')

const brandSchema = new mongoose.Schema({
    brandName:{type:String,required:true},
    brandImage:{type:String,required:true},
    imageId:{type:String,required:true},
},{versionKey:false});

const brand=mongoose.model('brand',brandSchema,'brand');
module.exports=brand;

