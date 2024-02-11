const mongoose=require('../X- Features/mongodb')

const SubCategorySchema = new mongoose.Schema({
    subCategoryName:{type:String,required:true},
    subCategoryImage:{type:String,required:true},
    imageId:{type:String,required:true},
},{versionKey:false});

const SubCategory=mongoose.model('SubCategory',SubCategorySchema,'SubCategory');
module.exports=SubCategory;

