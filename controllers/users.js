const helpers = require('../helpers/userHelper')
const { signUser, verifyUser } = require('../middleware/jwt')
const passport = require('passport')
const nodemailer = require('nodemailer');

//USER LOGIN PAGE DISPLAY
let loginGetPage =async (req, res) => {
  console.log("User login page");
  if (req.cookies.jwt) {
    let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
    if(tokenExracted.role==='user'){
        // console.log(tokenExracted);
        return res.redirect('/')
    }
  }
  res.render('user/login')
}

//USER SIGNUP PAGE DISPLAY
let signUpGetPage = (req, res) => {
  res.render('user/signup')
}

//USER REGISTRATION
let signUpPostPage = async (req, res) => {
  try {
    console.log("entered user registration section");
   // console.log(req.body);

    let resolved = await helpers.signupHelper(req.body);
    if (resolved.mailExist) {
      console.log("mail already exist");
      res.status(200).render('user/signup', { mailError: 'Email Already Exists', firstName: req.body.firstName, lastName: req.body.lastName, mail: req.body.mail, phoneNumber: req.body.phoneNumber, password: req.body.password, confirmPassword: req.body.confirmPassword })
    } else {
      console.log(resolved.user, 'user registration completed and stored in database');
      return res.redirect('/userLogin?registered=true')
    }

  } catch (error) {
    res.render('error', { print: error })
  }
}

//USER LOGIN SECTION
let loginPostPage = async (req, res) => {
  try {
    console.log('entered in login post section');


    let resolved = await helpers.loginHelper(req.body)
    if (resolved.invalidUsername) {
      console.log('invalid user name');
      return res.render('user/login', { mailError: 'invalid user Mail', mail: req.body.mail, password: req.body.password })
    }
    else if (resolved.passwordMismatch) {
      console.log("password not match");
      return res.render('user/login', { passwordError: 'Wrong Password', password: req.body.password, mail: req.body.mail })
    }else if(resolved.blockedUser){
      return res.render('user/login', { mailError: 'This user has been temporarily BLOCKED', password: req.body.password, mail: req.body.mail })
    }else {
      if (resolved.verified) {
        console.log("user verified and login success");
        const token = await signUser(resolved.existingUser)
      //  console.log("got the created token from auth and added this token on user rqst");
        res.cookie('jwt', token, { httpOnly: true, maxAge: 7200000 }); //1= COOKIE NAME AND  2 =DATA 3=OPTIONAL
        return res.redirect('/')
        // return res.redirect(`/?token= ${token}`)           
        // return res.redirect('/?userName=' +resolved.existingUser.userName )
      }
    }
  } catch (error) {
    res.render("error", { print: error });
  }
}



//USER LOGOUT SECTIO
let logoutPage = (req, res) => {
  res.clearCookie('jwt');
  req.session.destroy();
  console.log("session and cookies are cleared");
  res.redirect('/')
}



//GOOGLE SIGN IN
let googleAccountSelect = passport.authenticate('google', { scope: ['email', 'profile'] }
)

let googleCallback = passport.authenticate('google', {
  successRedirect: '/user/google/signin',
  failureRedirect: '/userLogin'
})

let googleSign = async (req, res) => {
  try {
    console.log("google sign in verification");
    // console.log(req.user);
    let resolved = await helpers.googleHelper(req.user.email)
    if (resolved.found) {
      // console.log("resolved",resolved.existingUser);
      const token = await signUser(resolved.existingUser)
      console.log("got the created token from google and attached to this rqst");
      res.cookie('jwt', token, { httpOnly: true, maxAge: 7200000 }); //1= COOKIE NAME AND  2 =DATA 3=OPTIONAL
      return res.redirect('/')
    } else if (resolved.nonExistingUser) {
      res.render('user/login', { isGoogleSigninRoute: true, mailError: 'invalid user Mail' })
    }

  } catch (error) {
    res.render("error", { print: error });
  }
}

//GOOGLE SIGN END





//FORGOT PASSWORD  MAIL AND OTP TYPING FORM GET SECTION 
const passwordReset = (req, res) => {
  res.render('user/forgotPassword')
}

//AFTER MAIL SUBMITTING , OTP CREATION AND SEND TO MAIL
const passwordResetPost = async (req, res) => {
  try {
    let { mail } = req.body
    //   console.log("User typed Email",mail);
    let resolved = await helpers.passwordResetHelper(mail)
    if (resolved.invalidEmail) {
      return res.status(200).json({ invalidEmail: true })
    }

    //USER FOUND AND BEGINS OTP GENERATI0N FUNCTION AND CALLING IT
    otpGeneration(resolved.id, resolved.mail)

    //MAKE AN AUTHORIZATION TO RESOLVE UNWANTED LOGIN API
    req.session.mail = resolved.mail
    req.session.role = 'user'
    return res.status(200).json({ invalidEmail: false }) //

  } catch (error) {
    return res.render("error", { print: error })
  }
}



//FUNCTION CALLED AND GOT THE ID AND MAIL HERE.PROCEEDING OTP GENERTION,OTP MAIL SEND,OTP WRITES IN MONGO DB ALL FUNCTIONS ARE DONE IN HERE
let otpGeneration = async (id, mail) => {
  console.log("OTP GENERTION PROCESSED");
  try {
    let recieverMail = mail
    let recieverId = id
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'chithuworks@gmail.com', // Your Gmail email address
        pass: 'wopkuvauxajvwdol', // Your Gmail password or an App Password
      },
    });

    //RANDOM OTP CREATING
    const generateOTP = () => {
      return Math.floor(100000 + Math.random() * 900000).toString()
    }
    let OTP = generateOTP()

    let message = {
      from: '"ShoeZilla 👻" <chithuworks@gmail.com>', // Sender's email address
      to: recieverMail, // Receiver's email address
      subject: 'Password RESET',
      text: ` Your OTP for ShoeZilla Password Reset is: ${OTP}`,
      html: `<p>Your OTP for ShoeZilla Password Reset is:<br><strong><h1> ${OTP} </h1></strong></p>`,
    };

    const info = await transporter.sendMail(message);
    console.log(`message Sent Successfully to ${recieverMail}`); //MESSAGE SEND TO USER EMAIL SUCCESSFULLY

    let resolved = await helpers.otpHelper(recieverId, OTP) //CALLED HELPER TO SAVE THE OTP IN USER MONGODB DATABASE
    if (resolved) {
      console.log("OTP ADDED AND  Modified in DataBase");//WRITED IN MONG0DB AND MODIIFIED
    }

  } catch (error) {
    console.error("ERROR WITH OTP", error);
    return res.render("error", { print: error })
  }
}


//MAIL OTP RECIEVED AND OTP POST AND VERIFYING SECTION
let passwordVerifyPost = async (req, res) => {
  try {
    const { otp } = req.body
    const mail = req.session.mail

    let resolved = await helpers.passwordVerifyHelper(mail, otp)//CALLED THE HELPER TO VERIFY THE RECIEVED OTP AND DATABASE OTP ARE SAME 
    if (resolved.passwordVerified) {
      console.log("OTP VERIFIED");
      return res.status(200).json({ verified: true })
    } else if (resolved.passwordNotVerified) {
      console.log("OTP MISS MATCH");
      return res.status(200).json({ verified: false })
    }

  } catch (error) {
    console.error("ERROR WITH VERIFY OTP", error);
    return res.render("error", { print: error })
  }
}


//AFTER VERIFIED EMAIL OTP VERIFICATION NOW CAN CREATE NEW PASSWORD FORM GET SECTION
let NewPassword = async (req, res) => {
  try {

    if (req.session.mail && req.session.role == 'user') {
      return res.render('user/newPassword')
    } else {
      console.log("Mail And Role Not added in Session  REDIRECTED TO FORGOT PASSWORD PAGE");
      res.redirect('/user/passwordReset')
    }
  } catch (error) {
    console.error("ERROR WITH NEW PASSWORD SETTING GET", error);
    return res.render("error", { print: error })
  }
}


//NEW PASSWORD ENTER AND POST SECTION
let NewPasswordPost = async (req, res) => {
  try {
    const password = req.body.password
    const mail = req.session.mail
    // console.log(password,mail);
    let response = await helpers.NewPasswordPostHelper(mail, password)
    if (response.success) {
      console.log("successfully password changed and writed in database ");
      req.session.role = 'none' //SESSION ROLE CHAGED TO NONE  TO AVOID REENTER PASSWORD PAGE 
      return res.status(200).json({ success: true })
    } else {
      throw new Error('problem with write new password in database')
    }
  } catch (error) {
    console.error("ERROR WITH NEW PASSWORD SETTING POST", error);
    return res.render("error", { print: error })
  }

}


//USER DEFAULT HOME SCREEN
let homePage = async (req, res) => {
  try {
    console.log("Home page");
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      var userName = tokenExracted.userName
    }
    let response = await helpers.homePageHelper()
    if (response.success) {
      //  console.log(response.banner);
      //  console.log("ALL \n",response.allProducts);   
      return res.render('user/home', { userName, banner: response.banner, category: response.plainCategory, brands: response.brand, allProducts: response.allProducts, latestProducts: response.latestProduct, MenProducts: response.MenProducts, WomenProducts: response.WomenProducts, user: true, home: true })
    } else {
      console.log("cant get the details to display home page");
      throw new Error("cant get the details to display home page")
    }
  } catch (error) {
    res.render("error", { print: error });
  }
}






//MEN PAGE GET SECTION RENDR ALL AVAILABLE MEN PRODUCTS IN PAGE
let menPage = async (req, res) => {
  try {
    console.log("MEN Page");
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      var userName = tokenExracted.userName
    }
    let response = await helpers.menPageHelper()
    if (response.success) {
      // console.log(" \n all collections",response.Allcollections);
      return res.render('user/menHome', { userName, brands: response.brands, banner: response.banner, Allcollections: response.Allcollections, subCategory: response.subCategory, colors: response.colors, user: true, men: true }) //USER TRUE HBS PARTIAL ACCESS, MEN TRUE FOR NAV BAR PAGE BLUE LINK COLOR
    } else {
      console.log("cant get the details to display Men page");
      throw new Error("cant get the details to display Men page")
    }
  } catch (error) {
    console.error("ERROR FROM  [menPage] dueto => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}



//WOMEN PAGE GET SECTION RENDR ALL AVAILABLE MEN PRODUCTS IN PAGE
let women = async (req, res) => {
  try {
    console.log("WOMEN Page");
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      var userName = tokenExracted.userName
    }
    let response = await helpers.womenHelper()
    if (response.success) {
      // console.log(" \n all collections",response.Allcollections);
      return res.render('user/women', { userName, brands: response.brands, banner: response.banner, Allcollections: response.Allcollections, subCategory: response.subCategory, colors: response.colors, user: true, women: true }) //USER TRUE HBS PARTIAL ACCESS, MEN TRUE FOR NAV BAR PAGE BLUE LINK COLOR
    } else {
      console.log("cant get the details to display women page");
      throw new Error("cant get the details to display women page")
    }
  } catch (error) {
    console.error("ERROR FROM  [women] dueto => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}


//MEN FILTER POSTED SECTION FROM AXIOS .RESPONSE SHOULD GO TO AXIOS 
let menFilter = async (req, res) => {
  try {
    console.log("filter post method");
    // console.log(req.body);
    const { brand, subCategory, color, size, sortOrder } = req.body
    let Allcollections = await helpers.menFilterHelper(brand, subCategory, color, size, sortOrder)
    console.log("Response", Allcollections.map((data) => data));
    return res.status(200).json({ success: true, Allcollections })

  } catch (error) {
    console.error("ERROR FROM [menFilter]", error);
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
}



let searchFilter = async (req, res) => {
  try {
    console.log(" Search filter post method");
    // console.log(req.body);
    const { brand, subCategory, color, size, sortOrder } = req.body
    let Allcollections = await helpers.searchFilterHelper(brand, subCategory, color, size, sortOrder)
  //  console.log("Response", Allcollections.map((data) => data));
    return res.status(200).json({ success: true, Allcollections })

  } catch (error) {
    console.error("ERROR FROM [searchFilter]", error);
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
}

//WOMEN FILTER POSTED SECTION FROM AXIOS .RESPONSE SHOULD GO TO AXIOS 
let womenFilter = async (req, res) => {
  try {
    console.log("filter post method");
    // console.log(req.body);
    const { brand, subCategory, color, size, sortOrder } = req.body
    let Allcollections = await helpers.womenFilterHelper(brand, subCategory, color, size, sortOrder)
  //  console.log("Res", Allcollections.map((data) => data.productSizeAndQty));
    return res.status(200).json({ success: true, Allcollections })

  } catch (error) {
    console.error("ERROR FROM [womenFilter]", error);
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
}




let search = async (req, res) => {
  try {
    console.log("search section");
  //  console.log(req.body);
    const { searchThings } = req.body
   // console.log("search value is =",searchThings);
    let response = await helpers.searchHelper(searchThings)
    if (response.success) {
      const { searchResults, colors, brands, subCategory } = response;
      console.log(searchResults);
      if(searchResults.length == 0){
        return res.render('user/search', { user: true, colors, brands, subCategory,noProducts:true,searchedValue:searchThings})
      }
      return res.render('user/search', { user: true, searchResults, colors, brands, subCategory,searchedValue:searchThings})
    }


  } catch (error) {
    console.error("ERROR FROM [search] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })

  }
}



//INDUVIDUL PRODUCT SHOWING SECTION
let productDetails = async (req, res) => {
  try {
    console.log("induvidual product displaying section");
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      var userName = tokenExracted.userName
    }
   // console.log(req.body);
    const { productId } = req.body
    let response = await helpers.productDetailsHelper(productId)
    if (response) {
      console.log(response.currentProduct);
      return res.render('user/productView', { userName,user: true, product: response.currentProduct, productColors: response.relatedColors })
    } else {
      throw new Error("cant get details from helper")
    }

  } catch (error) {
    console.error("ERROR FROM [womenFilter] Due To => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}



let cart=async (req,res) => {
  try {
    console.log("add to cart section");
    if(!req.cookies.jwt){
      return res.status(200).json({ loginRequired: true })
      return res.redirect('/userLogin')
     }
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      var userId = tokenExracted.userId
    }
   // console.log(req.body);
    const{ProductId,size,InnerId,quantity,vendorId,price}=req.body
    console.log(ProductId,size,InnerId,quantity,userId,vendorId,price);
    let response= await helpers.cartHelper(ProductId,size,InnerId,quantity,userId,vendorId,price)
    if(response.success){
      return res.status(200).json({ success: true })
    }

  } catch (error) {
    console.error("ERROR FROM [cart] Due to => ", error);
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
}

let cartView =async (req,res) => {
  try {
     console.log("cart view section");
     if(!req.cookies.jwt){
      return res.redirect('/userLogin')
     }
     if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      var userName = tokenExracted.userName
      var userId=tokenExracted.userId
    }
    let response= await helpers.cartViewHelper(userId)     
     return res.render('user/cart', {userName, user: true,cart:response})
  } catch (error) {
    console.error("ERROR FROM [cartView] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}



let cartRemove = async (req,res) => {
  try {
    console.log("cart remove produt section");
    const{productId}=req.body
    console.log(productId);
    let response=await helpers.cartRemoveHelper(productId)
    if(response){
      return res.status(200).json({success:true})
    }
    
  } catch (error) {
    console.error("ERROR FROM [cart] Due to => ", error);
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
}


let cartEdit=async(req,res) => {
  try {
    console.log("cart edit section");
    console.log(req.body);
    const {cartId,qty,price} =req.body
    let response=await helpers.cartEditHelper(cartId,qty,price)
    if(response){
      return res.redirect('/cartView')
    }
    
  } catch (error) {
    console.error("ERROR FROM [cartEdit] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}


let checkOut=async (req,res) => {
  try {
    console.log("check out section");
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      var userName = tokenExracted.userName
    }
    if(req.body.cartIds){//NOW IT KNOW THAT IT FROM ADD TO CART BUY
    console.log(req.body);
    const{noOfProducts,productTotal,gst,orderAmount,cartIds} = req.body
    let response=await helpers.checkOutHelper(cartIds)
    return res.render('user/checkOut', {userName, user: true,noOfProducts,productTotal,gst,orderAmount,orderedProducts:response,multiple:true})
    }
   
  } catch (error) {
    console.error("ERROR FROM [checkOut] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}




module.exports = {
  loginGetPage, loginPostPage, signUpGetPage, signUpPostPage, homePage, googleAccountSelect, googleCallback, googleSign, logoutPage, passwordReset, passwordResetPost, passwordVerifyPost, NewPassword, NewPasswordPost,
  menPage, menFilter, women, womenFilter, productDetails, search, searchFilter,cart,cartView,cartRemove,cartEdit,checkOut,
}