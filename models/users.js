const mongoose=require('../X- Features/mongodb')
const addressSchema=new mongoose.Schema({
    name:{ type: String },
    address:{ type: String },
    district: { type: String },
    state: { type: String },
    zip: { type: Number },
    number: { type: Number },
    mail: { type: String },
},{_id:true});

const userLoginSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    mail:{type:String,unique:true,required:true},
    password: { type: String, required: true },
    phoneNumber:{type:String,},
    profilePicture:{type:String},
    status:{type:String},
    otp:{type:String},
    address:[addressSchema],
},{timestamps: true,versionKey:false});
const user=mongoose.model('user',userLoginSchema);
module.exports=user;


