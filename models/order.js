const mongoose=require('../X- Features/mongodb')


const productArraySchema= new mongoose.Schema({
    productIdRef:{type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    status:{type:String,required:true},
    cancelReason:{type:String},
    size:{type:Number,required:true},
    qty:{type:Number,required:true},
    total:{type:Number,required:true}
},{_id:true})


const orderShema= new mongoose.Schema({
    userIdRef:{type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    addressId:{type:String,required:true},
    productsArray:[productArraySchema],
    couponApplied:{type:String,required:true},
    couponIdRef:{type: mongoose.Schema.Types.ObjectId, ref: 'coupon'},
    productPriceTotal:{type:Number,require:true},
    gst:{type:Number,require:true},
    couponDiscount:{type:Number,require:true},
    total:{type:Number,require:true},
    modeOfPayment:{type:String,required:true},
    razorPaymentId:{type:String},
    razorpayOrderId:{type:String},
    deliveryDate:{type:Date,required:true},

},{versionKey:false,timestamps:true})


const Order=mongoose.model('order',orderShema,'order')
module.exports=Order;