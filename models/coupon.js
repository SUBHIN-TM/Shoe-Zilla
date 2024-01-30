const mongoose=require('../mongodb')

const couponSchema = new mongoose.Schema({
    name:{type:String,required:true},
    status:{type:String,required:true},
    value:{type:Number,required:true},
    expDate:{type:Date,required:true},
   
},{versionKey:false});

const Coupon=mongoose.model('coupon',couponSchema,'coupon');
module.exports=Coupon;

