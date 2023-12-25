const helper=require('../helpers/vendorHelper')
const {signVendor, verifyVendor} = require('../middleware/jwt')

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
    console.log(req.body);
    let {mail} = req.body
    let resolved = await helper.passwordResetHelper(mail)
    if(resolved.invalidEmail){
       return res.status(200).json({invalidEmail:true})
    }
    otpGeneration(resolved.id,resolved.mail)
    return res.status(200).json({invalidEmail:false,id:resolved.id})

  }catch(error){
    return res.render("error", { print: error })
  }
}

let otpGeneration =(id,mail) =>{
  console.log(id,mail);

  
  console.log("otp generted in email");

}




module.exports = { loginGetPage, signupGetPage, signupPostPage,loginPostPage,dashboardGetPage,vendorLogout,passwordReset,passwordResetPost};
