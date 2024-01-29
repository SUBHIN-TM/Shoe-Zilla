const mongoose=require('../mongodb')

const cartSchema = new mongoose.Schema({
    userId:{type:String,required:true},
    productRef: {type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    productInnerId:{type:String,required:true},
    productSize:{type:Number,required:true},
    productQty:{type:Number,required:true},
    total:{type:Number},
    vendorRef:{ type: mongoose.Schema.Types.ObjectId, ref: 'vendor', required: true },
    
},{versionKey:false,timestamps: true});

const cart=mongoose.model('cart',cartSchema,'cart');
module.exports=cart;

