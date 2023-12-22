const User=require('../models/users')
const bcrypt=require('bcrypt')

//USER SIGN UP SECTION
function signupHelper(recievedUserData) {
    const {firstName,lastName,mail,phoneNumber,password} = recievedUserData
    return new Promise (async (resolve,reject) => {
        try{
            const existingUser= await User.findOne({mail:mail})
            if(!existingUser){
                const hashedPassword= await bcrypt.hash(password,10)
                const user = new User({
                    userName:`${firstName} ${lastName}`,
                    mail:mail,
                    password:hashedPassword,
                    phoneNumber:phoneNumber
                });
                user.save();
                resolve({success:true,user})
            }else{
                resolve({mailExist:true})
            }

        } catch(error){
            reject(error)
        }
    })
}


//USER LOGIN SECTION
let loginHelper =async (recievedUserData) => {
    try{
    const {mail,password} = recievedUserData
    let existingUser = await User.findOne({mail:mail})
    if(existingUser){
        const passwordMatch= await bcrypt.compare(password,existingUser.password)
        if(!passwordMatch){
            return {passwordMismatch:true}
        }else{
            return{verified:true,existingUser}
        }
    }else{
        return {invalidUsername:true}
    }

    }catch(error){
        throw error;
    } 
}


let googleHelper = async (recievedGoogleMail) => {
    try{
        let existingUser=  await User.findOne({mail:recievedGoogleMail})
        if(existingUser){
         return {found:true,existingUser}
        }else{
            return {nonExistingUser:true}
        }
    }catch(error){
        throw error;
    }
   

}

module.exports={signupHelper,loginHelper,googleHelper}