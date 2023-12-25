const helpers=require('../helpers/userHelper')
const {signUser, verifyUser} = require('../middleware/jwt')
const passport = require('passport')

//USER LOGIN PAGE DISPLAY
let loginGetPage=(req,res) => {
    if(req.cookies.jwt){
        return res.redirect('/')
      }
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
        console.log("CURRENTLY NO JWT ASSIGNED");
           if(req.cookies.jwt){
            let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
              return  res.render('user/home',{userId:tokenExracted.userId,userName:tokenExracted.userName})
        }
        res.render('user/home')
    }catch (error){
        res.render("error", { print: error });
    }
}


//USER LOGOUT SECTIO
let logoutPage = (req,res) => {
    res.clearCookie('jwt');
    req.session.destroy();
    console.log("session and cookies are cleared");
    res.redirect('/')
}

let googleAccountSelect = passport.authenticate('google', { scope:  [ 'email', 'profile' ] }
)

let googleCallback =  passport.authenticate( 'google', {
    successRedirect: '/user/google/signin',
    failureRedirect: '/userLogin'
})

let googleSign = async (req,res) => {
    try{
        console.log("google sign in verification");
        // console.log(req.user);
        let resolved = await helpers.googleHelper(req.user.email)
            if(resolved.found){
                console.log("resolved",resolved.existingUser);
                const token = await signUser(resolved.existingUser)
                console.log("got the created token from google",token);
                res.cookie('jwt',token, {httpOnly:true,maxAge:7200000}); //1= COOKIE NAME AND  2 =DATA 3=OPTIONAL
                return res.redirect('/')
            }else if(resolved.nonExistingUser){            
                 res.render('user/login',{isGoogleSigninRoute:true,mailError:'invalid user Mail'})              
            }
      
    }catch(error){
        res.render("error", { print: error });
    }

}



module.exports={loginGetPage,loginPostPage,signUpGetPage,signUpPostPage,homePage,logoutPage,googleAccountSelect,googleCallback,googleSign}