const mongoose=require('../mongodb')


const productArraySchema= new mongoose.Schema({
    productId:{type:String,required:true},
    size:{type:Number,required:true},
    qty:{type:Number,required:true}
},{_id:true})


const orderShema= new mongoose.Schema({
    userId:{type:String,required:true},
    products:[productArraySchema],
    modeOfPayment:{type:String,required:true},
    address:{type:String,required:true},
    total:{type:Number,requi:true}
},{versionKey:false,timestamps:true})


const Order=mongoose.model('order',orderShema,'order')
module.exports=Order;