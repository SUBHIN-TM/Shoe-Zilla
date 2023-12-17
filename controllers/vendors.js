const helper=require('../helpers/vendorHelper')

//VENDOR LOGIN PAGE DISPLAY
let loginGetPage = (req, res) => {
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
      return res.render('vendor/signup',{mailError:'Email Already Exists',shopName:req.body.shopName,ownerName:req.body.ownerName,mail:req.body.mail,phoneNumber:req.body.phoneNumber,password:req.body.password,confirmPassword:req.body.confirmPassword})
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
              return res.send(`Vendor login success <br> HELLO: ${resolved.existingUser.shopName}`);

          }
      }

  }catch(error){
      res.render("error", { print: error });
  }
}




module.exports = { loginGetPage, signupGetPage, signupPostPage,loginPostPage };
