const Admin=require('../models/admin')

//ADMIN LOGIN SECTION
const loginHelper =async (recievedAdminData)=> {
        try{
            const {userName,password} = recievedAdminData
            const existingAdmin = await Admin.findOne({userName:userName})
            if(existingAdmin){
                if(existingAdmin.password === password){
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


module.exports={loginHelper}