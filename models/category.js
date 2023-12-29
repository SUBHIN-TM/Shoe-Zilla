const mongoose=require('../mongodb')

const categorySchema = new mongoose.Schema({
    categoryName:{type:String,required:true},
    categoryImage:{type:String,required:true}
},{versionKey:false});

const category=mongoose.model('category',categorySchema,'category');
module.exports=category;

