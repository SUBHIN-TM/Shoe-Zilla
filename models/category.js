const mongoose=require('../X- Features/mongodb')

const categorySchema = new mongoose.Schema({
    categoryName:{type:String,required:true},
    categoryImage:{type:String,required:true},
    imageId:{type:String,required:true},
},{versionKey:false});

const category=mongoose.model('category',categorySchema,'category');
module.exports=category;

