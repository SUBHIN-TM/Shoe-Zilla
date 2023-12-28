const Vendor = require("../models/vendors");
const bcrypt=require('bcrypt')

//VENDOR SIGN UP SECTION
let signupHelper =  (recievedVendorData) => {
    const {vendorName,ownerName,mail,password,phoneNumber} = recievedVendorData
        return new Promise ( async (resolve,reject) => {
            try{
                // if (!ownerName || !mail || !phoneNumber|| !vendorName ||!password) {
                //     throw new Error('Required fields are missing');}
                
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


let otpHelper = (id,otp)=> {
return new Promise(async (resolve,reject) => {
    try {
      let userDatabase = await Vendor.findOne({_id:id})
      userDatabase.otp=otp;

    let saveResponse = await userDatabase.save()
    resolve(saveResponse)

    } catch (error) {
        console.error("OTP HELPER ERROR DUE TO",error);
        reject(error)
    }
})
}


let passwordVerifyHelper = (mail,otp)=> {
    return new Promise(async (resolve,reject) => {
try {
    
    let database = await Vendor.findOne({mail:mail})
    if(database){
        if(database.otp == otp){
            resolve({passwordVerified:true,id:database._id})
        }else{
            resolve({passwordNotVerified:true})
        }
    }else{
        throw new Error('cant get the user from database')
    }
    
} catch (error) {
    reject(error)
}
    })

}

let NewPasswordPostHelper = (mail,password) => {
          return new Promise(async (resolve,reject) => {
            try {
                let database = await Vendor.findOne({mail:mail})
                if(!database){
                    throw new Error('cant get the user from database')
                }else{
                    let hashedPassword = await bcrypt.hash(password,10)
                    database.password=hashedPassword
                    let saveResponse=await database.save()
                    if(saveResponse){
                        // console.log("resolved",saveResponse);
                        resolve({success:true,saveResponse})
                    }
                   else{
                    reject("Cant updated the new password to database")
                   }
                }
           
            } catch (error) {
                reject(error)
            }
        })
    }


module.exports={signupHelper,loginHelper,passwordResetHelper,otpHelper,passwordVerifyHelper,NewPasswordPostHelper}

