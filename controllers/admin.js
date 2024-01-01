const helper = require("../helpers/adminHelper");
const { signAdmin, verifyAdmin } = require('../middleware/jwt')
const nodemailer = require('nodemailer');
const cloudinary = require('../cloudinary')
const upload =require('../middleware/multer')

//ADMIN LOGIN PAGE DISPLAY
let loginGetPage = (req, res) => {
  if (req.cookies.jwt) {
    return res.redirect('/admin/dashboard')
  }
  res.render("admin/login");
};

//ADMIN LOGIN SECTION
let loginPostPage = async (req, res) => {
  try {
    console.log("ENTERED ADMIN LOGIN POST SECTION");

    const resolved = await helper.loginHelper(req.body); //CALLING HELPER TO FETCH THE REQUEST ADMIN DETAILS FROM DATABASE
    if (resolved.invalidAdminDetails) {
      console.log('INVALID ADMIN DETAILS CANT FIND THE RQSTED ADMIN DETAILS');
      return res
        .status(401)
        .render("admin/login", {
          name: "Wrong User Name",
          adminName: req.body.userName,
        });
    } else if (resolved.invalidPassword) {
      console.log('wrong password');
      return res
        .status(401)
        .render("admin/login", {
          password: "Wrong Password",
          adminpassword: req.body.password,
          adminName: req.body.userName,
        });
    } else if (resolved.verified) {
      console.log("VERIFIED ADMIN AND LOGGED ");
      const token = await signAdmin(resolved.existingAdmin)
      console.log("RECIEVED ADMIN TOKEN FROM JWT AUTH, AND ADDED THIS TOKEN TO REQST ");
      res.cookie('jwt', token, { httpOnly: true, maxAge: 7200000 }); //1= COOKIE NAME AND  2 =DATA 3=OPTIONAL
      res.status(200).redirect('/admin/dashboard')
    }

  } catch (error) {
    res.render("error", { print: error });
  }
};




let dashboardGetPage = async (req, res) => {
  try {
    console.log("ENTERED IN ADMIN DASHBOARD AFTER VERIFIED REQST CONTAIN JWT TOKEN");
    let tokenExracted = await verifyAdmin(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
    // res.render('admin/dashboard', { adminId: tokenExracted.adminId })
     res.render('admin/panel/dashboard',{ adminId: tokenExracted.adminId })

  } catch (error) {
    res.render("error", { print: error });
  }

}


let adminLogout = (req, res) => {
  console.log("ADMIN LOGGED OUT AND ALL COOKIES ARE CLEARED");
  res.clearCookie('jwt');
  res.redirect('/adminLogin')
}




const passwordReset = (req, res) => {
  res.render('admin/forgotPassword')
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
    req.session.role = 'admin'
    return res.status(200).json({ invalidEmail: false }) //

  } catch (error) {
    return res.render("error", { print: error })
  }
}



//FUNCTION CALLED AND GOT THE ID AND MAIL HERE.PROCEEDING OTP GENERTION,OTP MAIL SEND,OTP WRITES IN MONGO DB ALL FUNCTIONS ARE DONE IN HERE
let otpGeneration = async (id, mail) => {
  console.log("OTP GENERTION PROCESSED ");
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
    console.log(`OTP Sent Successfully to ${recieverMail}`); //MESSAGE SEND TO USER EMAIL SUCCESSFULLY

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

    if (req.session.mail && req.session.role == 'admin') {
      return res.render('admin/newPassword')
    } else {
      console.log("Mail And Role Not added in Session  REDIRECTED TO FORGOT PASSWORD PAGE");
      res.redirect('/admin/passwordReset')
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


let ViewCategory=async (req,res) => {
  try {
    let category = await helper.ViewCategoryHelper();
     console.log("categories data base");
  const catAdded= req.query.catAdded; //CHECKING THE REQUEST COME FROM REDIRECT OF CATEGORY ADDED SECTION IF IT IS PRINT ALERT
  if(catAdded === 'true'){
   return res.render('admin/panel/categoryView',{alert:'Catogories successfully added',categories:category})
  }
  res.render('admin/panel/categoryView',{categories:category})
  } catch (error) {
    console.error("ERROR WITH ViewCategory Get Page", error);
    return res.render("error", { print: error })
  }
}

//SUB CATEGORIES RENDERING PAGE
let ViewSubCategory= async (req,res) => {
  try {
    console.log("Sub Category Section");
    let subCategory = await helper.ViewSubCategoryHelper();
    // console.log("subcat database",subCategory);
  const subCatAdded= req.query.subCatAdded; //CHECKING THE REQUEST COME FROM REDIRECT OF CATEGORY ADDED SECTION IF IT IS PRINT ALERT
  if(subCatAdded === 'true'){
   return res.render('admin/panel/subCategory',{alert:'Sub Categories successfully added',subCategories:subCategory})
  }
 return res.render('admin/panel/subCategory',{subCategories:subCategory})
  } catch (error) {
    console.error("ERROR WITH View SubCategory Get Page", error);
    return res.render("error", { print: error })
  }
}


let ViewBrand= (req,res) => {
  res.render('admin/panel/brand')

}


let addCategory = async (req,res) => {
  try {
    console.log("Category Post section");
    // console.log(req.body,req.file.path);
    const categoryName = req.body.categoryName
    const imagePath = req.file.path
    console.log(categoryName,imagePath);
    if(!imagePath){
      console.log("imge path not found in request");
      return res.status(400).render("error", { print: 'imge path not found in request'})
    }
    let response = await helper.categoryAddPost(categoryName,imagePath);
    if(response.success){
       return res.redirect('/admin/ViewCategory?catAdded=true')
  
    }else{
      throw new Error('error occured from ADD CAT HELPER')
    }
  } catch (error) {
    console.error(error);
    return res.status(500).render("error", { print: error })
  }
}



let addSubCategory =async (req,res) => {
  try {
    console.log('subCategory Post section');
    const SubCategoryName = req.body.subCategoryName
    const imagePath = req.file.path
    // console.log(SubCategoryName,imagePath);
    if(!imagePath){
      console.log("imge path not found in request");
      return res.status(400).render("error", { print: 'imge path not found in request'})
    }
    let response = await helper.SubCategoryAddPost(SubCategoryName,imagePath);
    if(response.success){
       return res.redirect('/admin/ViewSubCategory?subCatAdded=true')
  
    }else{
      throw new Error('error occured from ADD CAT HELPER')
    }
  } catch (error) {
    
  }
}



let ViewProduct = async(req,res) => {
  try {
    console.log("admin View products section");

    let response = await helper.ViewProductHelper()
    if(response.success){
      response.dataResult.forEach((datas,index) => {//MAKE SERIAL NUMBER FOR EACH DOCUMENT BEFORE RENDERING
        datas.serialNumber = index + 1
      });

      return req.res.render('admin/panel/viewProduct',{product:response.dataResult})
    }else{
      return req.res.render('admin/panel/viewProduct')
    }
  
  } catch (error) {
    console.error("error occured in ADMIN ViewProducts",error.message,error);
    return res.render("error", { print: error })
  }
}



module.exports = { loginGetPage, loginPostPage, dashboardGetPage, adminLogout, passwordReset, passwordResetPost, passwordVerifyPost, NewPassword,
   NewPasswordPost,ViewCategory,ViewSubCategory,ViewBrand,addCategory,addSubCategory,ViewProduct};
