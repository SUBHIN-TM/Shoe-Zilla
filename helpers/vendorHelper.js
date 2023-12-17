const Vendor = require("../models/vendors");
const bcrypt=require('bcrypt')

//VENDOR SIGN UP SECTION
let signupHelper =  (recievedVendorData) => {
    const {shopName,ownerName,mail,password,phoneNumber} = recievedVendorData
        return new Promise ( async (resolve,reject) => {
            try{
                let existingVendor = await Vendor.findOne({mail:mail})
                if(!existingVendor){
                    let hashedPassword = await bcrypt.hash(password,10)
                    const vendor=new Vendor({
                        shopName: shopName,
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


module.exports={signupHelper,loginHelper}

