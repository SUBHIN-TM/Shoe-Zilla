const helpers=require('../helpers/userHelper')
const {signUser, verifyUser} = require('../middleware/jwt')
const passport = require('passport')
const nodemailer = require('nodemailer');

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
           return res.redirect('/userLogin?registered=true')
        }

}catch(error){
    res.render('error',{print:error})
}
}

//USER LOGIN SECTION
let loginPostPage= async (req,res) => {
    try{
        console.log('entered in login post section');
    
   
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
                console.log("user verified and login success");
                const token = await signUser(resolved.existingUser)
                  console.log("got the created token from auth and added this token on user rqst");
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
      console.log("Home page");
      let response= await helpers.homePageHelper()
      if(response.success){
        if(req.cookies.jwt){    
          let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
          console.log(tokenExracted.userId);//
            return  res.render('user/Nhome',{userId:tokenExracted.userId,userName:tokenExracted.userName,banner:response.banner,category:response.category,brands:response.brand,allProducts:response.allProducts,latestProducts:response.latestProduct,MenProducts:response.MenProducts,WomenProducts:response.WomenProducts})
      }else{
        //  console.log(response.banner);
        //  console.log("ALL \n",response.allProducts);   
        return res.render('user/Nhome',{banner:response.banner,category:response.category,brands:response.brand,allProducts:response.allProducts,latestProducts:response.latestProduct,MenProducts:response.MenProducts,WomenProducts:response.WomenProducts})
      }    
      }else{
        console.log("cant get the details to display home page");
        throw new Error("cant get the details to display home page")
      }     
    }catch (error){
        res.render("error", { print: error });
    }
}





let menPage = async (req,res) => {
  try {
    console.log("MEN Page");
    let response = await helpers.menPageHelper()
    if(response.success){
      // console.log(" \n all collections",response.Allcollections);
      return res.render('user/menHome',{brands:response.brands,banner:response.banner,Allcollections:response.Allcollections,subCategory:response.subCategory,colors:response.colors})
    }else{
      console.log("cant get the details to display Men page");
      throw new Error("cant get the details to display Men page")
    }
  } catch (error) {
    console.error("ERROR FROM  [menPage] dueto => ", error);
    return res.status(404).render("error", { print: error,status:404 })
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
                // console.log("resolved",resolved.existingUser);
                const token = await signUser(resolved.existingUser)
                console.log("got the created token from google and attached to this rqst");
                res.cookie('jwt',token, {httpOnly:true,maxAge:7200000}); //1= COOKIE NAME AND  2 =DATA 3=OPTIONAL
                return res.redirect('/')
            }else if(resolved.nonExistingUser){            
                 res.render('user/login',{isGoogleSigninRoute:true,mailError:'invalid user Mail'})              
            }
      
    }catch(error){
        res.render("error", { print: error });
    }

}




const passwordReset =(req,res) => {
    res.render('user/forgotPassword')
  }
  
  
  const passwordResetPost = async (req,res) => {
    try{
      let {mail} = req.body
    //   console.log("User typed Email",mail);
      let resolved = await helpers.passwordResetHelper(mail)
      if(resolved.invalidEmail){
         return res.status(200).json({invalidEmail:true})
      }
      
      //USER FOUND AND BEGINS OTP GENERATI0N FUNCTION AND CALLING IT
   
      otpGeneration(resolved.id,resolved.mail)
  
      //MAKE AN AUTHORIZATION TO RESOLVE UNWANTED LOGIN API
      req.session.mail =resolved.mail
      req.session.role ='user'
      return res.status(200).json({invalidEmail:false}) //
  
    }catch(error){
      return res.render("error", { print: error })
    }
  }
  
  
  
  //FUNCTION CALLED AND GOT THE ID AND MAIL HERE.PROCEEDING OTP GENERTION,OTP MAIL SEND,OTP WRITES IN MONGO DB ALL FUNCTIONS ARE DONE IN HERE
  let otpGeneration =async (id,mail) =>{
    console.log("OTP GENERTION PROCESSED");
    try{
      let  recieverMail=mail
      let recieverId=id
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: 'chithuworks@gmail.com', // Your Gmail email address
          pass: 'wopkuvauxajvwdol', // Your Gmail password or an App Password
      },
    });
    
    //RANDOM OTP CREATING
    const generateOTP =()=>{
      return Math.floor(100000 + Math.random() * 900000).toString()
    }
    let OTP=generateOTP()
    
    let message = {
      from: '"ShoeZilla 👻" <chithuworks@gmail.com>', // Sender's email address
      to: recieverMail, // Receiver's email address
      subject: 'Password RESET',
      text:` Your OTP for ShoeZilla Password Reset is: ${OTP}`,
      html: `<p>Your OTP for ShoeZilla Password Reset is:<br><strong><h1> ${OTP} </h1></strong></p>`,
    };
    
    const info = await transporter.sendMail(message);
    console.log(`message Sent Successfully to ${recieverMail}`); //MESSAGE SEND TO USER EMAIL SUCCESSFULLY
  
    let resolved = await helpers.otpHelper(recieverId,OTP) //CALLED HELPER TO SAVE THE OTP IN USER MONGODB DATABASE
    if(resolved){
      console.log("OTP ADDED AND  Modified in DataBase");//WRITED IN MONG0DB AND MODIIFIED
    }
  
    }catch(error){
      console.error("ERROR WITH OTP",error);
      return res.render("error", { print: error })
    }
  }
  
  
  //OTP VERIFYING SECTION
  let passwordVerifyPost = async (req,res) =>{
    try {
   const {otp} =req.body
   const mail =req.session.mail
  
   let resolved = await helpers.passwordVerifyHelper(mail,otp)//CALLED THE HELPER TO VERIFY THE RECIEVED OTP AND DATABASE OTP ARE SAME 
   if(resolved.passwordVerified){
    console.log("OTP VERIFIED");
    return res.status(200).json({verified:true})
   }else if(resolved.passwordNotVerified){
    console.log("OTP MISS MATCH");
    return res.status(200).json({verified:false})
   }
      
    } catch (error) {
      console.error("ERROR WITH VERIFY OTP",error);
      return res.render("error", { print: error })
    }
  }
  
  
  //AFTER VERIFIED EMAIL OTP VERIFICATION NOW CAN CREATE NEW PASSWORD
  let NewPassword = async (req,res) => {
    try {
    
       if(req.session.mail && req.session.role=='user'){
        return res.render('user/newPassword')
      }else{
        console.log("Mail And Role Not added in Session  REDIRECTED TO FORGOT PASSWORD PAGE");
        res.redirect('/user/passwordReset')
      }
    } catch (error) {
        console.error("ERROR WITH NEW PASSWORD SETTING GET",error);
      return res.render("error", { print: error })
    }
  }
  
  let NewPasswordPost = async (req,res) => {
    try {
      const password =req.body.password
      const mail =req.session.mail
      // console.log(password,mail);
      let response =await helpers.NewPasswordPostHelper(mail,password)
      if(response.success){
        console.log("successfully password changed and writed in database ");
        req.session.role='none' //SESSION ROLE CHAGED TO NONE  TO AVOID REENTER PASSWORD PAGE 
        return res.status(200).json({success:true})
      }else{
        throw new Error ('problem with write new password in database')
      }
    } catch (error) {
      console.error("ERROR WITH NEW PASSWORD SETTING POST",error);
      return res.render("error", { print: error })
    }
   
  }
  

  let trail = (req,res) => {
    console.log("trial");
    res.render('trial/trial',{admin:true})
  }



module.exports={loginGetPage,loginPostPage,signUpGetPage,signUpPostPage,homePage,googleAccountSelect,googleCallback,googleSign,logoutPage,passwordReset,passwordResetPost,passwordVerifyPost,NewPassword,NewPasswordPost,
  menPage,trail}