const mongoose=require('../X- Features/mongodb')

const vendorLoginSchema = new mongoose.Schema({
    vendorName: { type: String, required: true },
    ownerName: { type: String, required: true },
    mail:{type:String,unique:true,required:true},
    password: { type: String, required: true },
    phoneNumber:{type:String,required:true},
    status:{type:String},
    otp:{type:String},
},{timestamps: true,versionKey:false});
const vendor=mongoose.model('vendor',vendorLoginSchema);
module.exports=vendor;


