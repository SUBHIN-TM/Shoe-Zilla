const helpers=require('../helpers/userHelper')
const jwt = require('jsonwebtoken')

//USER LOGIN PAGE DISPLAY
let loginGetPage=(req,res) => {
    res.render('user/login')
}

//USER SIGNUP PAGE DISPLAY
let signUpGetPage=(req,res) => {
    res.render('user/signup')
}

//USER REGISTRATION
let signUpPostPage= async (req,res) => {
try{
    console.log("entered user registration section");
    console.log(req.body);

    let resolved = await helpers.signupHelper(req.body);
        if(resolved.mailExist){
          console.log("mail already exist");
           res.status(200).render('user/signup',{mailError:'Email Already Exists',firstName:req.body.firstName,lastName:req.body.lastName,mail:req.body.mail,phoneNumber:req.body.phoneNumber,password:req.body.password,confirmPassword:req.body.confirmPassword})
        }else{
        
           console.log(resolved.user,'user registration completed and stored in database');
            res.redirect('/userLogin')
        }

}catch(error){
    res.render('error',{print:error})
}
}

//USER LOGIN SECTION
let loginPostPage= async (req,res) => {
    try{
        console.log('entered in login post section');
        console.log(req.body);

        let resolved = await helpers.loginHelper(req.body)
        if(resolved.invalidUsername){
            console.log('invalid user name');
            return res.render('user/login',{mailError:'invalid user Mail',mail:req.body.mail,password:req.body.password})
        }
       else if(resolved.passwordMismatch){
            console.log("password not match");
            return res.render('user/login',{passwordError:'Wrong Password',password:req.body.password,mail:req.body.mail})
        }else{
            if(resolved.verified){
                console.log(resolved.existingUser,"user verified and login success");
                return res.send(`user login success <br> HELLO : ${resolved.existingUser.userName}`)
            }
        }

    }catch(error){
        res.render("error", { print: error });
    }
}


module.exports={loginGetPage,loginPostPage,signUpGetPage,signUpPostPage}