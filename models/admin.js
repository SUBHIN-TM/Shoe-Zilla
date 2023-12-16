const mongoose=require('../mongodb')

const adminLoginSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    password: { type: String, required: true }
});
const admin=mongoose.model('admin',adminLoginSchema,'admin');
module.exports=admin;


