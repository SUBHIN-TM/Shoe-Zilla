const helpers = require('../helpers/userHelper')
const { signUser, verifyUser } = require('../middleware/jwt')
const passport = require('passport')
const nodemailer = require('nodemailer');
const instance = require('../razorPayInstance') //RAZORPAY INSTANCE CREATION
const puppeteer=require('puppeteer') //PDF CONVERTER



//USER LOGIN PAGE DISPLAY
let loginGetPage = async (req, res) => {
  console.log("User login page");
  if (req.cookies.jwt) {
    let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
    if (tokenExracted.role === 'user') {
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
    } else if (resolved.blockedUser) {
      return res.render('user/login', { mailError: 'This user has been temporarily BLOCKED', password: req.body.password, mail: req.body.mail })
    } else {
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
    if (resolved.blockedUser) {
      return res.render('user/login', { mailError: 'This user has been temporarily BLOCKED', password: req.body.password, mail: req.body.mail })
    }
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
      var cartNumber = await helpers.cartNumber(tokenExracted.userId)

    }
    let response = await helpers.homePageHelper()
    if (response.success) {
      //  console.log(response.banner);
      //  console.log("ALL \n",response.allProducts);   
      return res.render('user/home', { cartNumber, userName, banner: response.banner, category: response.plainCategory, brands: response.brand, allProducts: response.allProducts, latestProducts: response.latestProduct, MenProducts: response.MenProducts, WomenProducts: response.WomenProducts, user: true, home: true })
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
      var cartNumber = await helpers.cartNumber(tokenExracted.userId)
    }
    let response = await helpers.menPageHelper()
    if (response.success) {
      // console.log(" \n all collections",response.Allcollections);
      return res.render('user/menHome', { cartNumber, userName, brands: response.brands, banner: response.banner, Allcollections: response.Allcollections, subCategory: response.subCategory, colors: response.colors, user: true, men: true }) //USER TRUE HBS PARTIAL ACCESS, MEN TRUE FOR NAV BAR PAGE BLUE LINK COLOR
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
      var cartNumber = await helpers.cartNumber(tokenExracted.userId)
    }
    let response = await helpers.womenHelper()
    if (response.success) {
      // console.log(" \n all collections",response.Allcollections);
      return res.render('user/women', { cartNumber, userName, brands: response.brands, banner: response.banner, Allcollections: response.Allcollections, subCategory: response.subCategory, colors: response.colors, user: true, women: true }) //USER TRUE HBS PARTIAL ACCESS, MEN TRUE FOR NAV BAR PAGE BLUE LINK COLOR
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
      if (searchResults.length == 0) {
        return res.render('user/search', { user: true, colors, brands, subCategory, noProducts: true, searchedValue: searchThings })
      }
      return res.render('user/search', { user: true, searchResults, colors, brands, subCategory, searchedValue: searchThings })
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
      var cartNumber = await helpers.cartNumber(tokenExracted.userId)
    }
    // console.log(req.body);
    const { productId } = req.body
    let response = await helpers.productDetailsHelper(productId)
    if (response) {
      //   console.log(response.currentProduct);
      return res.render('user/productView', { cartNumber, userName, user: true, product: response.currentProduct, productColors: response.relatedColors })
    } else {
      throw new Error("cant get details from helper")
    }

  } catch (error) {
    console.error("ERROR FROM [womenFilter] Due To => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}



let cart = async (req, res) => {
  try {
    console.log("add to cart section");
    if (!req.cookies.jwt) {
      return res.status(200).json({ loginRequired: true })
    }
    else if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      if (tokenExracted.role == 'user') {
        var userId = tokenExracted.userId
        // console.log(req.body);
        const { ProductId, size, InnerId, quantity, vendorId, price } = req.body
        console.log(ProductId, size, InnerId, quantity, userId, vendorId, price);
        let response = await helpers.cartHelper(ProductId, size, InnerId, quantity, userId, vendorId, price)
        if (response.success) {
          return res.status(200).json({ success: true })
        }
      }
      return res.status(200).json({ loginRequired: true })
    }

  } catch (error) {
    console.error("ERROR FROM [cart] Due to => ", error);
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
}

let cartView = async (req, res) => {
  try {
    console.log("cart view section");
    if (!req.cookies.jwt) {
      return res.redirect('/userLogin')
    }
    else if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      if (tokenExracted.role == 'user') {
        var userName = tokenExracted.userName
        var userId = tokenExracted.userId
        var cartNumber = await helpers.cartNumber(tokenExracted.userId)
        let response = await helpers.cartViewHelper(userId)
        return res.render('user/cart', { cartNumber, userName, user: true, cart: response })
      }
      return res.redirect('/userLogin')
    }

  } catch (error) {
    console.error("ERROR FROM [cartView] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}



let cartRemove = async (req, res) => {
  try {
    console.log("cart remove produt section");
    const { productId } = req.body
    console.log(productId);
    let response = await helpers.cartRemoveHelper(productId)
    if (response) {
      return res.status(200).json({ success: true })
    }

  } catch (error) {
    console.error("ERROR FROM [cart] Due to => ", error);
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
}


let cartEdit = async (req, res) => {
  try {
    console.log("cart edit section");
    console.log(req.body);
    const { cartId, qty, price } = req.body
    let response = await helpers.cartEditHelper(cartId, qty, price)
    if (response) {
      return res.redirect('/cartView')
    }

  } catch (error) {
    console.error("ERROR FROM [cartEdit] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}




let checkOut = async (req, res) => {
  try {
    console.log("check out section");
    if (req.cookies.jwt) {
      var tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      var userName = tokenExracted.userName
      var cartNumber = await helpers.cartNumber(tokenExracted.userId)
      var userId = tokenExracted.userId
    }

    if (req.body.cartIds) {//NOW IT KNOW THAT IT FROM ADD TO CART BUY
      // console.log(req.body);
      console.log("buy product through cart section");
      const { noOfProducts, productTotal, gst, orderAmount, cartIds } = req.body
      let orderAmountRounded = Math.floor(orderAmount)
      const { summary, address, coupon, productTotalMRP, productTotalDiscount } = await helpers.checkOutHelper(cartIds, userId)
      coupon.forEach((data, index) => {
        const expDATE = new Date(data.expDate) //ADDITIONALLY JOINED DATE ADDED
        const options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }
        data.modifiedDate = expDATE.toLocaleDateString('en-us', options)
      })
      return res.render('user/checkOut', { coupon, cartNumber, userName, user: true, noOfProducts, productTotal, gst, orderAmount: orderAmountRounded, orderedProducts: summary, multiple: true, address, productTotalMRP, productTotalDiscount })

    }else{
      return res.redirect('/')
    }
  } catch (error) {
    console.error("ERROR FROM [checkOut] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}



let checkOutDirectBuy = async (req, res) => {
  try {
    console.log("Direct buy without cart");
    if (!req.cookies.jwt) {
      return res.redirect('/userLogin')
    }
    else if (req.cookies.jwt) {
      var tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      //  console.log(tokenExracted);
      if (tokenExracted.role == 'user') {
        var userName = tokenExracted.userName
        var cartNumber = await helpers.cartNumber(tokenExracted.userId)
        var userId = tokenExracted.userId
        const { size, qty, productId } = req.body
        let response = await helpers.checkOutHelperDirectBuy(size, qty, productId, userId)
        const { summary, noOfProducts, productTotal, gst, orderAmount, address, coupon, productTotalDiscount, productTotalMRP } = response

        coupon.forEach((data, index) => {
          const expDATE = new Date(data.expDate) //ADDITIONALLY JOINED DATE ADDED
          const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          }
          data.modifiedDate = expDATE.toLocaleDateString('en-us', options)
        })
        return res.render('user/checkOut', { cartNumber, userName, user: true, multiple: true, orderedProducts: summary, noOfProducts, productTotal, gst, orderAmount, address, coupon, productTotalDiscount, productTotalMRP })
      }
      return res.redirect('/userLogin')
    }
  } catch (error) {
    console.error("ERROR FROM [checkOutDirectBuy] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}


let addNewAddress = async (req, res) => {
  try {
    console.log("addres adding section");
    console.log(req.body);

    if (req.cookies.jwt) {
      var tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      var userId = tokenExracted.userId;
      // var cartNumber= await helpers.cartNumber(tokenExracted.userId)
      //  var userName = tokenExracted.userName
    }
    const { name, address, district, state, zip, mail, number } = req.body;
    let response = await helpers.addNewAddressHelper(userId, name, address, district, state, zip, mail, number)
    if (response) {
      return res.json({ success: true })
    }


  } catch (error) {
    console.error("ERROR FROM [addNewAddress] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}




let editAddress = async (req, res) => {
  try {
    console.log("addres Edit section");
    let cartNumber;
    let userName;
    let role
    let userId
    if (!req.cookies.jwt) {
      return res.render('user/login')
    }
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      userName = tokenExracted.userName
      cartNumber = await helpers.cartNumber(tokenExracted.userId)
      userId = tokenExracted.userId
      role = tokenExracted.role
      if (role != 'user') {
        return res.render('user/login')
      } else {
        // console.log(req.body);
        const { name, address, district, state, zip, mail, number, addressInnerId } = req.body;
        let response = await helpers.editAddressHelper(userId, name, address, district, state, zip, mail, number, addressInnerId)
        if (response) {
          return res.json({ success: true })
        }

      }
    }


  } catch (error) {
    console.error("ERROR FROM [editAddress] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}


let deleteAddress = async (req, res) => {
  try {
    console.log("addres deleting section");
    console.log(req.body);

    if (req.cookies.jwt) {
      var tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      var userId = tokenExracted.userId;
    }
    const { addressInnerId } = req.body;
    console.log("adrs", addressInnerId);
    let response = await helpers.deleteAddressHelper(userId, addressInnerId)
    if (response) {
      return res.json({ success: true })
    }

  } catch (error) {
    console.error("ERROR FROM [deleteAddress] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}




let couponVerify = async (req, res) => {
  try {
    console.log("coupon verify section");
    console.log(req.body);
    const { couponName, allProductIds } = req.body
    let response = await helpers.couponVerifyHelper(allProductIds, couponName)
    if (response.invalid) {
      return res.status(200).json({ invalid: true, text: 'Invalid Coupon Number' })
    } else if (response.expired) {
      return res.status(200).json({ expired: true, text: 'Coupon Expired ' })
    } else {
      console.log("amount", response.discountedAmount, response.couponId);
      return res.status(200).json({ applied: true, text: 'Coupon Applied Successfully', finalAmount: response.discountedAmount, couponId: response.couponId })
    }


  } catch (error) {
    console.error("ERROR FROM [couponVerify] Due to => ", error);
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
}



let orderPlaced = async (req, res) => {
  try {
    console.log("order placed section");
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      let userName = tokenExracted.userName
      let cartNumber = await helpers.cartNumber(tokenExracted.userId)
      var userIdRef = tokenExracted.userId
    }
    //  console.log(req.body);
    const { addressId, modeOfPayment, couponId, productsArray, razorPaymentId, razorpayOrderId } = req.body
    let response = await helpers.orderPlacedHelpers(userIdRef, addressId, productsArray, couponId, modeOfPayment, razorPaymentId, razorpayOrderId)
    if (response.success) {
      const expDATE = new Date(response.SAVE.deliveryDate) //ADDITIONALLY JOINED DATE ADDED
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }
      let displayDate = expDATE.toLocaleDateString('en-us', options)


      res.status(200).json({ success: true, orderId: response.orderId, modeOfPayment: response.modeOfPayment, orderBase: response.SAVE, Delivery: displayDate })
    
      // let mailer = await helpers.productNodeMailer(response.orderId, userIdRef) //NODE MAILER CALLING
      // if (mailer.mailSend) {
      //   return console.log("Mail Send And Return");
      // }

    }
  } catch (error) {
    console.error("ERROR FROM [orderPlaced] Due to => ", error);
    return res.status(500).json({ success: false, error: "Internal server error" })

  }
}


let createOrder = async (req, res) => {
  try {
    console.log("create orderid request", req.body);
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      let userId = tokenExracted.userId
      var { name, mail, number } = await helpers.createOrderHelper(userId)

    }
    //NEED TO CREATE THE TOTAL HERE IF MAY I CAN DO THE SAME AS ORDER PLACED TOTAL CALCULATION HERE IN REQ.BODY I HAVE {} addressId, modeOfPayment, couponId: coupon, productsArray: products} SO ICAN CALCULATE IF NEED JUST COPY THE SAME CODE OFPALCE ORDER CONTROLLER AND HELPER 

    var options = {
      amount: (req.body.fm) * 100,
      // amount:5000,
      currency: "INR",
      receipt: "rcp1"
    };

    // Creating an order using the Razorpay instance
    instance.orders.create(options, function (err, order) {
      console.log("order", order);
      res.send({ orderId: order.id, name, mail, number });
    });


  } catch (error) {
    console.error("ERROR FROM [createOrder] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}



let paymentVerify = (req, res) => {
  try {
    console.log("Razor pay verification", req.body);
    let body = req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;

    var crypto = require("crypto");
    var expectedSignature = crypto.createHmac('sha256', 'AFrK16nAoKbuy8HfcyD3XnNK') //the last blick is id of razor env
      .update(body.toString())
      .digest('hex');
    console.log("sig received ", req.body.response.razorpay_signature);
    console.log("sig generated ", expectedSignature);

    var response = { "signatureIsValid": "false" }
    if (expectedSignature === req.body.response.razorpay_signature) {
      console.log("sig matched");
      response = { "signatureIsValid": "true" };
    }
    res.send(response);

  } catch (error) {
    console.error("ERROR FROM [paymentVerify] Due to => ", error);
    // Send an error response
    res.status(500).send({ error: "Internal Server Error" });
  }
}




let userProfile = async (req, res) => {
  try {
    let cartNumber;
    let userName;
    let role
    let userId =
      console.log("User profile section");
    if (!req.cookies.jwt) {
      return res.render('user/login')
    }
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      userName = tokenExracted.userName
      cartNumber = await helpers.cartNumber(tokenExracted.userId)
      userId = tokenExracted.userId
      role = tokenExracted.role
      if (role != 'user') {
        return res.render('user/login')
      }
    }
    return res.render('user/userProfile', { cartNumber, userName, user: true, }) //USER TRUE HBS PARTIAL ACCESS, MEN TRUE FOR NAV BAR PAGE BLUE LINK COLOR

  } catch (error) {
    console.error("ERROR FROM [userProfile] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }

}



let userAddress = async (req, res) => {
  try {
    console.log("User address view section");
    let cartNumber;
    let userName;
    let role
    let userIdRef
    console.log("User profile section");
    if (!req.cookies.jwt) {
      return res.render('user/login')
    }
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      userName = tokenExracted.userName
      cartNumber = await helpers.cartNumber(tokenExracted.userId)
      userIdRef = tokenExracted.userId
      role = tokenExracted.role
      if (role != 'user') {
        return res.render('user/login')
      } else {

        let address = await helpers.userAddressHelper(userIdRef)
        return res.render('user/address', { cartNumber, userName, user: true, address }) //USER TRUE HBS PARTIAL ACCESS, MEN TRUE FOR NAV BAR PAGE BLUE LINK COLOR
      }
    }

  } catch (error) {
    console.error("ERROR FROM [userAddress] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}




let profileDetails = async (req, res) => {
  try {
    console.log("Profile details displaying section");

    let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
    let userName = tokenExracted.userName
    let cartNumber = await helpers.cartNumber(tokenExracted.userId)
    let userId = tokenExracted.userId
    let details = await helpers.profileDetails(userId)

    const joinedDate = new Date(details.createdAt) //ADDITIONALLY JOINED DATE ADDED
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    let displayDate = joinedDate.toLocaleDateString('en-us', options)

    return res.render('user/profileDetails', { cartNumber, userName, user: true, details, displayDate }) //USER TRUE HBS PARTIAL ACCESS, MEN TRUE FOR NAV BAR PAGE BLUE LINK COLOR
  } catch (error) {
    console.error("ERROR FROM [profileDetails] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}


let profileEdit = async (req, res) => {
  try {
    console.log("profile edit section");
    //  console.log(req.body);
    let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
    let userId = tokenExracted.userId
    const { name, mail, number } = req.body
    let response = await helpers.profileEditHelper(userId, name, mail, number)
    if (response.mailExist) {
      return res.status(200).json({ mailExist: true })
    } else if (response.updated) {
      return res.status(200).json({ updated: true })
    }

  } catch (error) {
    console.error("ERROR FROM [profileEdit] Due to => ", error);
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
}


let passwordChange = async (req, res) => {
  try {
    console.log("password change section");
    // console.log(req.body);
    let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
    let userId = tokenExracted.userId
    const { oldPassword, NewPassword } = req.body
    let response = await helpers.passwordChangeHelper(userId, oldPassword, NewPassword)
    if (response.passwordMismatch) {
      return res.status(200).json({ passwordMismatch: true })
    } else if (response.updated) {
      return res.status(200).json({ updated: true })
    }

  } catch (error) {
    console.error("ERROR FROM [passwordChange] Due to => ", error);
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
}



let orderView = async (req, res) => {
  try {
    console.log("user order view section");
    let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
    userName = tokenExracted.userName
    cartNumber = await helpers.cartNumber(tokenExracted.userId)
    let { orders, totalProducts, outerProduct } = await helpers.orderViewHelper(tokenExracted.userId)
    return res.render('user/orders', { cartNumber, userName, user: true, orders, totalProducts, outerProduct })
  } catch (error) {
    console.error("ERROR FROM [orderView] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}



let invoice = async (req, res) => {
  try {
    console.log("invoice Displaying section");
   // console.log(req.query);
    const { orderid } = req.query
    let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
    userName = tokenExracted.userName
    cartNumber = await helpers.cartNumber(tokenExracted.userId)
    let response = await helpers.invoiceHelper(orderid) 
    if(req.query.orderPlaced == 'true'){
      return res.render('user/invoice',{orders:response.orders,orderPlacedAndFirstView:true})
    }else{
      
      return res.render('user/invoice',{orders:response.orders,orderPlacedAndFirstView:false})
    }
   



  } catch (error) {
    console.error("ERROR FROM [invoice] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }

}




let invoiceDownload=async (req,res) => {
  try {
    console.log("invoice download section");
    const {data} =req.body
   // console.log(data);
    const browser =await puppeteer.launch({headless: 'new',})
    const page= await browser.newPage()
    await page.setViewport({
        width:1000,
        height:800
    })
    await page.setContent(`<html> <body> ${data}</body></html>`)
    const pdfBuffer = await page.pdf({
        format:'A4',
        printBackground:false
    })
    await browser.close()
    res.setHeader('Content-Type','application/pdf')
    res.setHeader('Content-Disposition','attachment;filename=invoice.pdf')
    return res.send(pdfBuffer)
  } catch (error) {
    console.error("ERROR FROM [invoiceDownload] Due to => ", error);
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
}


let autoMailInvoiceSend =async (req,res) => { //AFTER ORDER PLACED IT WIL WORK ONLY THIS TIME AND SEND THE PDF TO MAIL
  try {
    console.log("auto Mail Invoice Send Section ");
    const {data} =req.body
   // console.log(data);
    const browser =await puppeteer.launch({headless: 'new',})
    const page= await browser.newPage()
    await page.setViewport({
        width:1000,
        height:800
    })
    await page.setContent(`<html> <body> ${data}</body></html>`)
    const pdfBuffer = await page.pdf({
        format:'A4',
        printBackground:false
    })
    await browser.close()
    let tokenExracted = await verifyUser(req.cookies.jwt) 
    let userId = tokenExracted.userId
    let mailer = await helpers.productNodeMailer(userId,pdfBuffer) //NODE MAILER CALLING
    if (mailer.mailSend) {
       console.log("INVOICE HAS BEEN SENT TO USER MAIL AND RETURN SUCCESS");
      return res.status(200).json({mailSend: true })
    }
   
  } catch (error) {
    console.error("ERROR FROM [autoMailInvoiceSend] Due to => ", error);
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
}



let cancelOrderRequest=async (req,res) => {
  try {
    console.log("request section for order");
    console.log(req.body);
    const{reason,innerProductId} =req.body
    let response=await helpers.cancelOrderRequestHelper(reason,innerProductId)
    if(response.updated){
      return res.redirect('/orderView')
    }
   
  } catch (error) {
    console.error("ERROR FROM [cancelOrderRequest] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}



let about=async(req,res) => {
  try {
    console.log("about section");
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      var userName = tokenExracted.userName
      var cartNumber = await helpers.cartNumber(tokenExracted.userId)

    }
    return res.render('user/about',{cartNumber, userName, user: true,})
    
  } catch (error) {
    console.error("ERROR FROM [about] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}


let contact=async(req,res) => {
  try {
    console.log("about section");
    if (req.cookies.jwt) {
      let tokenExracted = await verifyUser(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
      var userName = tokenExracted.userName
      var cartNumber = await helpers.cartNumber(tokenExracted.userId)

    }
    return res.render('user/contact',{cartNumber, userName, user: true,})
    
  } catch (error) {
    console.error("ERROR FROM [about] Due to => ", error);
    return res.status(404).render("error", { print: error, status: 404 })
  }
}



module.exports = {
  loginGetPage, loginPostPage, signUpGetPage, signUpPostPage, homePage, googleAccountSelect, googleCallback, googleSign, logoutPage, passwordReset, passwordResetPost, passwordVerifyPost, NewPassword, NewPasswordPost,
  menPage, menFilter, women, womenFilter, productDetails, search, searchFilter, cart, cartView, cartRemove, cartEdit, checkOut, checkOutDirectBuy, addNewAddress,
  deleteAddress, couponVerify, orderPlaced, createOrder, paymentVerify, userProfile, userAddress, editAddress, profileDetails, profileEdit, passwordChange, orderView,
  invoice,invoiceDownload,autoMailInvoiceSend,cancelOrderRequest,about,contact

}