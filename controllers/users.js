const helpers=require('../helpers/userHelper')
const {signUser, verifyUser} = require('../middleware/jwt')


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
                const token = await signUser(resolved.existingUser)
                  console.log("got the created token from auth",token);
                  res.cookie('jwt',token, {httpOnly:true,maxAge:7200000}); //1= COOKIE NAME AND  2 =DATA 3=OPTIONAL
                  return res.redirect('/')
                // return res.redirect(`/?token= ${token}`)           
                // return res.redirect('/?userName=' +resolved.existingUser.userName )
            }
        }
    }catch(error){
        res.render("error", { print: error });
    }
}


//USER DEFAULT HOME SCREEN
let homePage = async (req,res) => {
    try{
        if(req.cookies.jwt){
            let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
              return  res.render('home',{userId:tokenExracted.userId,userName:tokenExracted.userName})
        }
        res.render('home')
    }catch (error){
        res.render("error", { print: error });
    }
}

//USER LOGOUT SECTIO
let logoutPage = (req,res) => {
    res.clearCookie('jwt');
    res.redirect('/')
}


module.exports={loginGetPage,loginPostPage,signUpGetPage,signUpPostPage,homePage,logoutPage}