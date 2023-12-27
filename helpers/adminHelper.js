const Admin=require('../models/admin')
const bcrypt=require('bcrypt')



//ADMIN LOGIN SECTION
const loginHelper =async (recievedAdminData)=> {
        try{
            const {userName,password} = recievedAdminData
            const existingAdmin = await Admin.findOne({userName:userName})
            if(existingAdmin){
                const passwordMatch = await bcrypt.compare(password,existingAdmin.password)
                if(passwordMatch){
                    return {verified:true,existingAdmin}
                }else{
                    return {invalidPassword:true}
                }
            }else{
                return {invalidAdminDetails:true}
            }

        }catch(error){
            throw error;
        }
}




let passwordResetHelper = (mail) =>{
    return new Promise (async (resolve,reject) => {
  try{
    console.log("admin typed mail try to find in database",mail);
      let existingUser = await Admin.findOne({mail:mail})
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
        let userDatabase = await Admin.findOne({_id:id})
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
      
      let database = await Admin.findOne({mail:mail})
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
                  let database = await Admin.findOne({mail:mail})
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

module.exports={loginHelper,passwordResetHelper,otpHelper,passwordVerifyHelper,NewPasswordPostHelper}