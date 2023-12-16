const Admin=require('../models/admin')

const loginHelper =async (recievedAdminData)=> {
    
        try{
            const {userName,password} = recievedAdminData
            const existingAdmin = await Admin.findOne({userName:userName})
            if(existingAdmin){
                if(existingAdmin.password === password){
                    return {verified:true}
                }else{
                    return {invalidPassword:true}
                }
            }else{
                return {invalidAdminDetails:true}
            }

        }catch(error){
            reject(error)
        }
}


module.exports={loginHelper}