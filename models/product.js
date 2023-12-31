const mongoose=require('../mongodb')

const productImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  originalname: { type: String, required: true },
}, { _id: true });

const imageIdSchema = new mongoose.Schema({
  publicId:{type:String,required:true}
},{ _id: false })

const productSchema = new mongoose.Schema({
  productName:{type:String,required:true},
  productCategory:{type:String,required:true},
  productSubCategory:{type:String,required:true},
  productBrand:{type:String,required:true},
  productColor:{type:String,required:true},
  productSize:{type:Number,required:true},
  productQty:{type:Number,required:true},
  productPrice:{type:Number,required:true},
  productMRP:{type:Number,required:true},
  productDiscount:{type:Number,required:true},
  productImages:[productImageSchema],
  imageId:[imageIdSchema],
  vendorId:{type:String,required:true},
  vendorName:{type:String,required:true},
},{timestamps: true,versionKey:false});

const Product=mongoose.model('product',productSchema,'product');
module.exports=Product;

