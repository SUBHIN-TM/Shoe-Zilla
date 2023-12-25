const Vendor = require("../models/vendors");
const bcrypt=require('bcrypt')

//VENDOR SIGN UP SECTION
let signupHelper =  (recievedVendorData) => {
    const {vendorName,ownerName,mail,password,phoneNumber} = recievedVendorData
        return new Promise ( async (resolve,reject) => {
            try{
                let existingVendor = await Vendor.findOne({mail:mail})
                if(!existingVendor){
                    let hashedPassword = await bcrypt.hash(password,10)
                    const vendor=new Vendor({
                        vendorName: vendorName,
                        ownerName: ownerName,
                        mail:mail,
                        password: hashedPassword,
                        phoneNumber:phoneNumber,
                      })
                      vendor.save();
                      resolve({success:true,vendor})          
                }else{
                    resolve({mailExist:true})
                }

            }catch(error){
                reject(error)
            }
        })
}

//VENDOR LOGIN SECTION
let loginHelper =async (recievedVendorData) => {
    try{
    const {mail,password} = recievedVendorData
    let existingUser = await Vendor.findOne({mail:mail})
    if(existingUser){
        const passwordMatch = await bcrypt.compare(password,existingUser.password)
        if(!passwordMatch){
            return {passwordMismatch:true}
        }else{
            return {verified:true,existingUser}
        }
    }else{ 
        return {invalidUsername:true}
    }

    }catch(error){
        throw error;
    } 
}


let passwordResetHelper = (mail) =>{
  return new Promise (async (resolve,reject) => {
try{
    let existingUser = await Vendor.findOne({mail:mail})
    if(!existingUser){
        console.log("User Not Found in mongoDb");
        resolve({invalidEmail:true})
    }
    resolve({id:existingUser._id,mail:existingUser.mail})
   
}catch(error){
    reject(error)
}
  })
}


module.exports={signupHelper,loginHelper,passwordResetHelper}

