const { response } = require('express');
const helper = require('../helpers/vendorHelper')
const { signVendor, verifyVendor } = require('../middleware/jwt')
const nodemailer = require('nodemailer');

//VENDOR LOGIN PAGE DISPLAY
let loginGetPage = (req, res) => {
  if (req.cookies.jwt) {
    return res.redirect('/vendor/dashboard')
  }

  else {
    res.render("vendor/login");
  }

};

//VENDOR SIGNUP PAGE DISPLAY
let signupGetPage = (req, res) => {
  res.render("vendor/signup");
};

//VENDOR REGISTRATION PROCESS
let signupPostPage = async (req, res) => {
  try {
    console.log("Entered In vendors Registration section");
    console.log(req.body);
    const { vendorName, ownerName, mail, password, phoneNumber } = req.body
    if (!vendorName || !ownerName || !mail || !password || !phoneNumber) {
      console.log("some field are missing");
      return
      res.status(400).send("some field are missing")
    }
    let resolved = await helper.signupHelper(req.body)
    if (resolved.success) {
      console.log('vendor registration completed and stored in database');
      return res.redirect('/vendorLogin?registered=true')
    } else if (resolved.mailExist) {
      console.log("vendor mail already exist");
      return res.render('vendor/signup', { mailError: 'Email Already Exists', vendorName: req.body.vendorName, ownerName: req.body.ownerName, mail: req.body.mail, phoneNumber: req.body.phoneNumber, password: req.body.password, confirmPassword: req.body.confirmPassword })
    }

  } catch (error) {
    res.render('error', { print: error })
  }
};


//VENDOR LOGIN SECTION
let loginPostPage = async (req, res) => {
  try {
    console.log('entered in vendor login post section');
    let resolved = await helper.loginHelper(req.body)
    if (resolved.invalidUsername) {
      console.log('invalid vendor name');
      return res.render('vendor/login', { mailError: 'invalid vendor Mail', mail: req.body.mail, password: req.body.password })
    }
    else if (resolved.passwordMismatch) {
      console.log("password not match");
      return res.render('vendor/login', { passwordError: 'Wrong Password', password: req.body.password, mail: req.body.mail })
    } else {
      if (resolved.verified) {

        // console.log(resolved.existingUser,"user verified and login success");
        /*if(resolved.existinguser!=="active"){
        //res.render('vendor/login',{passwordError:"temporarly blocked"})
        }*/

        console.log("Vendor verified and login success");
        let token = await signVendor(resolved.existingUser)

        // console.log("RECIEVED VENDOR TOKEN FROM JWT AUTH",token);
        console.log("RECIEVED VENDOR TOKEN FROM JWT AUTH AND PUT IT IN COOKIE");
        res.cookie('jwt', token, { httpOnly: true, maxAge: 7200000 })
        return res.redirect('/vendor/dashboard')
        // return res.send(`Vendor login success <br> HELLO: ${resolved.existingUser.vendorName}`);
      }
    }

  } catch (error) {
    res.render("error", { print: error });
  }
}


let dashboardGetPage = async (req, res) => {
  try {
    console.log("entered in vendor dashboard sample page after middleware vendor authaentication done");
    let tokenExracted = await verifyVendor(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
    //  console.log("extracted vendor deatils",tokenExracted);
    console.log("extracted vendor deatils succesfully and details show on dashboard");
    res.render('vendor/panel/dashboard', { vendorId: tokenExracted.vendorId, vendorName: tokenExracted.vendorName })

  } catch (error) {
    res.render("error", { print: error });
  }
}


let vendorLogout = async (req, res) => {
  res.clearCookie('jwt');
  res.redirect('/vendorLogin')
}



const passwordReset = (req, res) => {
  res.render('vendor/forgotPassword')
}


const passwordResetPost = async (req, res) => {
  try {
    let { mail } = req.body
    let resolved = await helper.passwordResetHelper(mail)
    if (resolved.invalidEmail) {
      return res.status(200).json({ invalidEmail: true })
    }

    //USER FOUND AND BEGINS OTP GENERATI0N FUNCTION AND CALLING IT
    otpGeneration(resolved.id, resolved.mail)

    //MAKE AN AUTHORIZATION TO RESOLVE UNWANTED LOGIN API
    req.session.mail = resolved.mail
    req.session.role = 'vendor'
    return res.status(200).json({ invalidEmail: false }) //

  } catch (error) {
    return res.render("error", { print: error })
  }
}



//FUNCTION CALLED AND GOT THE ID AND MAIL HERE.PROCEEDING OTP GENERTION,OTP MAIL SEND,OTP WRITES IN MONGO DB ALL FUNCTIONS ARE DONE IN HERE
let otpGeneration = async (id, mail) => {
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

    let resolved = await helper.otpHelper(recieverId, OTP) //CALLED HELPER TO SAVE THE OTP IN USER MONGODB DATABASE
    if (resolved) {
      console.log("OTP ADDED AND  Modified in DataBase");//WRITED IN MONG0DB AND MODIIFIED
    }

  } catch (error) {
    console.error("ERROR WITH OTP", error);
    return res.render("error", { print: error })
  }
}


//OTP VERIFYING SECTION
let passwordVerifyPost = async (req, res) => {
  try {
    const { otp } = req.body
    const mail = req.session.mail

    let resolved = await helper.passwordVerifyHelper(mail, otp)//CALLED THE HELPER TO VERIFY THE RECIEVED OTP AND DATABASE OTP ARE SAME 
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


//AFTER VERIFIED EMAIL OTP VERIFICATION NOW CAN CREATE NEW PASSWORD
let NewPassword = async (req, res) => {
  try {

    if (req.session.mail && req.session.role == 'vendor') {
      return res.render('vendor/newPassword')
    } else {
      console.log("Mail And Role Not added in Session  REDIRECTED TO FORGOT PASSWORD PAGE");
      res.redirect('/vendor/passwordReset')
    }
  } catch (error) {
    console.error("ERROR WITH NEW PASSWORD SETTING GET", error);
    return res.render("error", { print: error })
  }
}

let NewPasswordPost = async (req, res) => {
  try {
    const password = req.body.password
    const mail = req.session.mail
    // console.log(password,mail);
    let response = await helper.NewPasswordPostHelper(mail, password)
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


let ViewProducts = async (req, res) => {
  try {
    console.log("Vendor View products section");
    let tokenExracted = await verifyVendor(req.cookies.jwt)
    let response = await helper.ViewProductsHelper(tokenExracted.vendorId)
    let productAdded = req.query.productAdded
    let productDeleted = req.query.productDeleted
    let productUpdated = req.query.productUpdated
    let NothingUpdated =req.query.NothingUpdated
    if (response.success) {
      response.dataResult.forEach((datas, index) => {//MAKE SERIAL NUMBER FOR EACH DOCUMENT BEFORE RENDERING
        datas.serialNumber = index + 1
      });

      if (productAdded == 'true') {
        return req.res.render('vendor/panel/products', { alert: "Product Added Successfully", product: response.dataResult })
      } else if (productDeleted == 'true') {
        return req.res.render('vendor/panel/products', { alert: "Product Deleted Successfully", product: response.dataResult })
      }else if(productUpdated=='true'){
        return req.res.render('vendor/panel/products', { alert: "Product Updated Successfully", product: response.dataResult })
      }else if(NothingUpdated =='true'){
        return req.res.render('vendor/panel/products', { alert: "Nothing To Update ", product: response.dataResult })
      }
      return req.res.render('vendor/panel/products', { product: response.dataResult })
    } else {
      return req.res.render('vendor/panel/products')
    }

  } catch (error) {
    console.error("error occured in ViewProducts", error.message, error);
    return res.render("error", { print: error })
  }

}


let addProductsView = async (req, res) => {
  try {
    /*if(token.id.status===pending){
      return res.render()
    }
    */
    console.log("ADD PRODUCTS GET SECTION");
    const { category, subCategory, brand } = await helper.addProductsViewHelper();
    console.log("SUCCESSFULLY RENDERED THE DATA TO PRODUCTS OPTIONS SELECT");
    req.res.render('vendor/panel/addProducts', { category, subCategory, brand })
  } catch (error) {
    console.error("ERROR WITH ADD PRODUCTS GET PAGE ", error);
    return res.render("error", { print: error })
  }
}



let addProductsPost = async (req, res) => {
  try {
    console.log("Vendor add products section");
    let imageArray = req.files.map((file) => ({ //images come as array
      path: file.path,
      originalname: file.originalname
    }));


    let tokenExracted = await verifyVendor(req.cookies.jwt)
    //  console.log(req.body,tokenExracted.vendorId,imageArray);
    let resoponse = await helper.addProductsPostHelper(req.body, imageArray, tokenExracted.vendorId)
    if (resoponse.success) {
      return res.redirect('/vendor/ViewProducts?productAdded=true')
    }

  } catch (error) {
    console.error("ERROR WITH addProductsPost PAGE ", error);
    return res.render("error", { print: error })
  }
}






let deleteProducts = async (req, res) => {
  try {
    console.log("vendor delete product section");
    // console.log(req.body);
    const { productId } = req.body
    let response = await helper.deleteProductsHelper(productId)
    if (response.success) {
      return res.status(200).json({ success: true })

    }
  } catch (error) {
    console.error("ERROR WITH Vendor deleteProducts PAGE ", error);
    return res.render("error", { print: error })
  }
}




let editProductsView = async (req, res) => {

  try {
    console.log("edit section");
  // console.log(req.query);
  const { id } = req.query
  let response = await helper.editProductsViewHelper(id)
  if (response.success) {
    console.log(response.dataResult, response.category, response.subCategory, response.brand);
    console.log("all things rendred to editproducts");
    let brand = response.brand;
    let category = response.category;
    let subCategory = response.subCategory;
    let productBrand = response.dataResult.productBrand;
    let productCategory = response.dataResult.productCategory;
    let productSubCategory = response.dataResult.productSubCategory;
    let productName = response.dataResult.productName
    let productColor = response.dataResult.productColor;
    let productSize = response.dataResult.productSize;
    let productQty = response.dataResult.productQty;
    let productPrice = response.dataResult.productPrice;
    let productId = response.dataResult._id
    let productImage = response.dataResult.productImages
    let productMRP = response.dataResult.productMRP
    return res.render('vendor/panel/editProducts', { brand, category, subCategory, productImage, productMRP,productId, productBrand, productCategory, productSubCategory, productName, productColor, productSize, productQty, productPrice })
  }
  } catch (error) {
    console.error("ERROR FROM  [editProductsView] dueto => ", error);
    return res.status(404).render("error", { print: error,status:404 })
  }
  
}




let editProducts = async (req, res) => {
  try {
    console.log("update product put section");
    const productId = req.params.productId;
     console.log(productId, req.body);
    console.log(req.files); 
    let response=await helper.editProductsHelper(productId,req.body,req.files)
    if(response.success){
      return res.status(200).json({ success: true }) //RETURN BACK TO AXIOS
  
    }else if(response.notUpdate)
    {
      return res.status(200).json({notUpdate:true}) //RETURN BACK TO AXIOS
    }
  } catch (error) {
    console.error("ERROR WITH Vendor editProducts PAGE ", error);
    return res.render("error", { print: error })
  }
}


module.exports = {
  loginGetPage, signupGetPage, signupPostPage, loginPostPage, dashboardGetPage, vendorLogout, passwordReset, passwordResetPost, passwordVerifyPost, NewPassword, NewPasswordPost,
  ViewProducts, addProductsView, addProductsPost, deleteProducts, editProducts, editProductsView
};
