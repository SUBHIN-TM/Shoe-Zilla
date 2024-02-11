const mongoose=require('../X- Features/mongodb')

const adminLoginSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    password: { type: String, required: true },
    mail:{type:String,unique:true,required:true},
    otp:{type:String},
},{versionKey:false});
const admin=mongoose.model('admin',adminLoginSchema,'admin');
module.exports=admin;

