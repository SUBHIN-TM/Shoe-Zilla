const User=require('../models/users')
const bcrypt=require('bcrypt')

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
                console.log(user,'writed in data base');
                resolve(user)
            }else{
                resolve({existingUser})
            }

        } catch(error){
            reject(error)
        }
    })
    
}


module.exports={signupHelper}