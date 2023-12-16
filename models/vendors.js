const mongoose=require('../mongodb')

const vendorLoginSchema = new mongoose.Schema({
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    mail:{type:String,unique:true,required:true},
    password: { type: String, required: true },
    phoneNumber:{type:String,required:true},
});
const vendor=mongoose.model('vendor',vendorLoginSchema);
module.exports=vendor;


