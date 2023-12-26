const helper=require('../helpers/vendorHelper')
const {signVendor, verifyVendor} = require('../middleware/jwt')
const nodemailer = require('nodemailer');

//VENDOR LOGIN PAGE DISPLAY
let loginGetPage = (req, res) => {
  if(req.cookies.jwt){
    return res.redirect('/vendor/dashboard')
  }
  res.render("vendor/login");
};

//VENDOR SIGNUP PAGE DISPLAY
let signupGetPage = (req, res) => {
  res.render("vendor/signup");
};

//VENDOR REGISTRATION PROCESS
let signupPostPage =async (req, res) => {
  try{
    console.log("Entered In vendors Registration section");
    console.log(req.body);
  
    let resolved = await helper.signupHelper(req.body)
    if(resolved.success){
      console.log(resolved.vendor,'vendor registration completed and stored in database');
      return res.redirect('/vendorLogin')
    }else if(resolved.mailExist){
      console.log("vendor mail already exist");
      return res.render('vendor/signup',{mailError:'Email Already Exists',vendorName:req.body.vendorName,ownerName:req.body.ownerName,mail:req.body.mail,phoneNumber:req.body.phoneNumber,password:req.body.password,confirmPassword:req.body.confirmPassword})
    }

  }catch(error){
    res.render('error',{print:error})
  }
};


//VENDOR LOGIN SECTION
let loginPostPage = async (req,res) => {
  try{
      console.log('entered in vendor login post section');
      console.log(req.body);

      let resolved = await helper.loginHelper(req.body)
      if(resolved.invalidUsername){
          console.log('invalid vendor name');
          return res.render('vendor/login',{mailError:'invalid vendor Mail',mail:req.body.mail,password:req.body.password})
      }
     else if(resolved.passwordMismatch){
          console.log("password not match");
          return res.render('vendor/login',{passwordError:'Wrong Password',password:req.body.password,mail:req.body.mail})
      }else{
          if(resolved.verified){
              console.log(resolved.existingUser,"user verified and login success");
              let token = await signVendor(resolved.existingUser)
              console.log("RECIEVED VENDOR TOKEN FROM JWT AUTH",token);
              res.cookie('jwt',token,{httpOnly:true,maxAge:7200000})
              return res.redirect('/vendor/dashboard')

              // return res.send(`Vendor login success <br> HELLO: ${resolved.existingUser.vendorName}`);

          }
      }

  }catch(error){
      res.render("error", { print: error });
  }
}


let dashboardGetPage = async (req,res) => {
  try{
      console.log("entered in vendor dashboard sample page after middleware vendor authaentication done");
       let tokenExracted = await verifyVendor(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
       console.log("extracted vendor deatils",tokenExracted);
       res.render('vendor/dashboard',{vendorId:tokenExracted.vendorId,vendorName:tokenExracted.vendorName})
  
    }catch(error){
      res.render("error", { print: error }); 
  }
}


let vendorLogout = (req,res) => {
  res.clearCookie('jwt');
  res.redirect('/vendorLogin')
}

const passwordReset =(req,res) => {
  res.render('password')

}

const passwordResetPost = async (req,res) => {
  try{
    let {mail} = req.body
    let resolved = await helper.passwordResetHelper(mail)
    if(resolved.invalidEmail){
       return res.status(200).json({invalidEmail:true})
    }

    otpGeneration(resolved.id,resolved.mail)

    req.session.mail =resolved.mail
    req.session.role ='vendor'
    return res.status(200).json({invalidEmail:false,id:resolved.id})

  }catch(error){
    return res.render("error", { print: error })
  }
}



let otpGeneration =async (id,mail) =>{
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
  console.log(`message Sent Successfully to ${recieverMail}`);

  let resolved = await helper.otpHelper(recieverId,OTP)
  if(resolved){
    console.log("OTP ADDED AND  Modified in DataBase");
  }

  
  }catch(error){
    console.error("ERROR WITH OTP",error);
    return res.render("error", { print: error })
  }
}


let passwordVerifyPost = async (req,res) =>{
  try {
    // console.log('passwordVerifySection');
//  console.log(req.body);
 const {otp} =req.body
 const mail =req.session.mail

  
 let resolved = await helper.passwordVerifyHelper(mail,otp)
 if(resolved.passwordVerified){
  console.log("OTP VERIFIED");
  return res.status(200).json({verified:true,id:resolved.id})
 }else if(resolved.passwordNotVerified){
  console.log("OTP MISS MATCH");
  return res.status(200).json({verified:false})
 }
    
  } catch (error) {
    console.error("ERROR WITH VERIFY OTP",error);
    return res.render("error", { print: error })
  }
}


let NewPassword = (req,res) => {
  if(req.session.mail && req.session.role=='vendor'){
    return res.render('vendor/newPassword')
  }else{
    console.log("Mail And Role Not added in Session ");
    return res.send('You Are Not Authorized')
  }
  
}


module.exports = { loginGetPage, signupGetPage, signupPostPage,loginPostPage,dashboardGetPage,vendorLogout,passwordReset,passwordResetPost,passwordVerifyPost,NewPassword};
