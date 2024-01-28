const helper = require("../helpers/adminHelper");
const { signAdmin, verifyAdmin } = require("../middleware/jwt");
const nodemailer = require("nodemailer");
const cloudinary = require("../cloudinary");
const upload = require("../middleware/multer");
const { json, query } = require("express");
const Coupon = require("../models/coupon");

//ADMIN LOGIN PAGE DISPLAY



let loginGetPage =async (req, res) => {
  console.log("Admin login page");
  if (req.cookies.jwt) {
    let tokenExracted = await verifyAdmin(req.cookies.jwt); //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
    if(tokenExracted.role==='admin'){
      return res.redirect("/admin/dashboard");
    }
  }
  return res.render("admin/login");
};

//ADMIN LOGIN SECTION
let loginPostPage = async (req, res) => {
  try {
    console.log("ENTERED ADMIN LOGIN POST SECTION");

    const resolved = await helper.loginHelper(req.body); //CALLING HELPER TO FETCH THE REQUEST ADMIN DETAILS FROM DATABASE
    if (resolved.invalidAdminDetails) {
      console.log("INVALID ADMIN DETAILS CANT FIND THE RQSTED ADMIN DETAILS");
      return res.status(401).render("admin/login", {
        name: "Wrong User Name",
        adminName: req.body.userName,
      });
    } else if (resolved.invalidPassword) {
      console.log("wrong password");
      return res.status(401).render("admin/login", {
        password: "Wrong Password",
        adminpassword: req.body.password, //TYPED WRONG PASSWORD TO SHOW
        adminName: req.body.userName,
      });
    } else if (resolved.verified) {
      console.log("VERIFIED ADMIN AND LOGGED ");
      const token = await signAdmin(resolved.existingAdmin);
      console.log(
        "RECIEVED ADMIN TOKEN FROM JWT AUTH, AND ADDED THIS TOKEN TO REQST "
      );
      res.cookie("jwt", token, { httpOnly: true, maxAge: 7200000 }); //1= COOKIE NAME AND  2 =DATA 3=OPTIONAL
      res.status(200).redirect("/admin/dashboard");
    }
  } catch (error) {
    res.render("error", { print: error });
  }
};


let adminLogout = (req, res) => {
  console.log("ADMIN LOGGED OUT AND ALL COOKIES ARE CLEARED");
  res.clearCookie("jwt");
  res.redirect("/adminLogin");
};

const passwordReset = (req, res) => {
  res.render("admin/forgotPassword");
};

const passwordResetPost = async (req, res) => {
  try {
    let { mail } = req.body;
    let resolved = await helper.passwordResetHelper(mail);
    if (resolved.invalidEmail) {
      return res.status(200).json({ invalidEmail: true });
    }

    //USER FOUND AND BEGINS OTP GENERATI0N FUNCTION AND CALLING IT
    otpGeneration(resolved.id, resolved.mail);

    //MAKE AN AUTHORIZATION TO RESOLVE UNWANTED LOGIN API
    req.session.mail = resolved.mail;
    req.session.role = "admin";
    return res.status(200).json({ invalidEmail: false }); //
  } catch (error) {
    return res.render("error", { print: error });
  }
};

//FUNCTION CALLED AND GOT THE ID AND MAIL HERE.PROCEEDING OTP GENERTION,OTP MAIL SEND,OTP WRITES IN MONGO DB ALL FUNCTIONS ARE DONE IN HERE
let otpGeneration = async (id, mail) => {
  console.log("OTP GENERTION PROCESSED ");
  try {
    let recieverMail = mail;
    let recieverId = id;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "chithuworks@gmail.com", // Your Gmail email address
        pass: "wopkuvauxajvwdol", // Your Gmail password or an App Password
      },
    });

    //RANDOM OTP CREATING
    const generateOTP = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };
    let OTP = generateOTP();

    let message = {
      from: '"ShoeZilla 👻" <chithuworks@gmail.com>', // Sender's email address
      to: recieverMail, // Receiver's email address
      subject: "Password RESET",
      text: ` Your OTP for ShoeZilla Password Reset is: ${OTP}`,
      html: `<p>Your OTP for ShoeZilla Password Reset is:<br><strong><h1> ${OTP} </h1></strong></p>`,
    };

    const info = await transporter.sendMail(message);
    console.log(`OTP Sent Successfully to ${recieverMail}`); //MESSAGE SEND TO USER EMAIL SUCCESSFULLY

    let resolved = await helper.otpHelper(recieverId, OTP); //CALLED HELPER TO SAVE THE OTP IN USER MONGODB DATABASE
    if (resolved) {
      console.log("OTP ADDED AND  Modified in DataBase"); //WRITED IN MONG0DB AND MODIIFIED
    }
  } catch (error) {
    console.error("ERROR WITH OTP", error);
    return res.render("error", { print: error });
  }
};

//OTP VERIFYING SECTION
let passwordVerifyPost = async (req, res) => {
  try {
    const { otp } = req.body;
    const mail = req.session.mail;

    let resolved = await helper.passwordVerifyHelper(mail, otp); //CALLED THE HELPER TO VERIFY THE RECIEVED OTP AND DATABASE OTP ARE SAME
    if (resolved.passwordVerified) {
      console.log("OTP VERIFIED");
      return res.status(200).json({ verified: true });
    } else if (resolved.passwordNotVerified) {
      console.log("OTP MISS MATCH");
      return res.status(200).json({ verified: false });
    }
  } catch (error) {
    console.error("ERROR WITH VERIFY OTP", error);
    return res.render("error", { print: error });
  }
};

//AFTER VERIFIED EMAIL OTP VERIFICATION NOW CAN CREATE NEW PASSWORD
let NewPassword = async (req, res) => {
  try {
    if (req.session.mail && req.session.role == "admin") {
      return res.render("admin/newPassword");
    } else {
      console.log(
        "Mail And Role Not added in Session  REDIRECTED TO FORGOT PASSWORD PAGE"
      );
      res.redirect("/admin/passwordReset");
    }
  } catch (error) {
    console.error("ERROR WITH NEW PASSWORD SETTING GET", error);
    return res.render("error", { print: error });
  }
};

let NewPasswordPost = async (req, res) => {
  try {
    const password = req.body.password;
    const mail = req.session.mail;

    let response = await helper.NewPasswordPostHelper(mail, password);
    if (response.success) {
      console.log("successfully password changed and writed in database ");
      req.session.role = "none"; //SESSION ROLE CHAGED TO NONE  TO AVOID REENTER PASSWORD PAGE
      return res.status(200).json({ success: true });
    } else {
      throw new Error("problem with write new password in database");
    }
  } catch (error) {
    console.error("ERROR WITH NEW PASSWORD SETTING POST", error);
    return res.render("error", { print: error });
  }
};



let dashboardGetPage = async (req, res) => {
  try {
    console.log(
      "ENTERED IN ADMIN DASHBOARD AFTER VERIFIED REQST CONTAIN JWT TOKEN"
    );
    let tokenExracted = await verifyAdmin(req.cookies.jwt); //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
    // res.render('admin/panel/dashboard', { adminId: tokenExracted.adminId })
    res.render("admin/AdminPanel/dashboard", { layout: 'adminLayout', admin: true, adminId: tokenExracted.adminId });
  } catch (error) {
    res.render("error", { print: error });
  }
};



let ViewCategory = async (req, res) => {
  try {
    let category = await helper.ViewCategoryHelper();
    console.log("categories section");
    res.render("admin/AdminPanel/categoryView", { layout: 'adminLayout', admin: true, categories: category });
  } catch (error) {
    console.error("ERROR WITH ViewCategory Get Page", error);
    return res.render("error", { print: error });
  }
};


let addCategory = async (req, res) => {
  try {
    console.log("Category Post section");
    // console.log(req.body,req.file.path);
    const categoryName = req.body.categoryName;
    const imagePath = req.file.path;
    console.log(categoryName, imagePath);
    if (!imagePath) {
      console.log("imge path not found in request");
      return res.status(400).render("error", { print: "imge path not found in request" });
    }
    let response = await helper.categoryAddPost(categoryName, imagePath);
    if (response.success) {
      res.cookie('alertDefinedForm', JSON.stringify({ message: "Category Added Successfully", color: "success" }), { path: '/admin' })
      return res.redirect("/admin/ViewCategory");
    } else {
      throw new Error("error occured from ADD CAT HELPER");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).render("error", { print: error });
  }
};


let editCategory = async (req, res) => {
  try {
    console.log("edit category  section");
    const { id } = req.params;
    const { categoryNameEdit } = req.body;
    let response = await helper.editCategoryHelper(
      id,
      categoryNameEdit,
      req.file
    );
    if (response.success) {
      return res.status(200).json({ success: { message: "Category Updated Successfully", color: "warning" } });
    } else if (response.nothingToUpdate) {
      return res.status(200).json({ success: { message: "Nothing To Update", color: "success" } });
    } else {
      return res.status(500).json({ error: "Internal Server Error" });

    }
  } catch (error) {
    console.error("ERROR FROM [editCategory] Due to =>", error);
    return res.status(400).json({ error: "Bad Request" });
  }
};


let deleteCategory = async (req, res) => {
  try {
    console.log("delete category section");
    // console.log(req.body);
    const { categoryId } = req.body;
    let response = await helper.deleteCategoryHelper(categoryId);
    if (response.success) {
      return res.status(200).json({ success: { message: "Category Deleted Successfully", color: "danger" } });
    }
  } catch (error) {
    console.error("ERROR FROM [deleteCategory] Due TO =>", error);
    return res.status(400).render("error", { print: error, status: 400 });
  }
};




//SUB CATEGORIES RENDERING PAGE
let ViewSubCategory = async (req, res) => {
  try {
    console.log("Sub Category Section");
    let subCategory = await helper.ViewSubCategoryHelper();
    // console.log("subcat database",subCategory);
    return res.render("admin/AdminPanel/subCategory", { layout: 'adminLayout', admin: true, subCategories: subCategory, });
  } catch (error) {
    console.error("ERROR WITH View SubCategory Get Page", error);
    return res.render("error", { print: error });
  }
};


let addSubCategory = async (req, res) => {
  try {
    console.log("subCategory Post section");
    const SubCategoryName = req.body.subCategoryName;
    const imagePath = req.file.path;
    // console.log(SubCategoryName,imagePath);
    if (!imagePath) {
      console.log("imge path not found in request");
      return res
        .status(400)
        .render("error", { print: "imge path not found in request" });
    }
    let response = await helper.SubCategoryAddPost(SubCategoryName, imagePath);
    if (response.success) {
      res.cookie('alertDefinedForm', JSON.stringify({ message: "Subcategory Added Successfully", color: "success" }), { path: '/admin' })
      return res.redirect("/admin/ViewSubCategory");
    } else {
      throw new Error("error occured from ADD CAT HELPER");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).render("error", { print: error });
  }
};


let editSubCategory = async (req, res) => {
  try {
    console.log("edit Sub category  section");
    const { id } = req.params;
    const { subCategoryNameEdit } = req.body;
    let response = await helper.editSubCategoryHelper(
      id,
      subCategoryNameEdit,
      req.file
    );
    if (response.success) {
      return res.status(200).json({ success: { message: "Subcategory Updated Successfully", color: "warning" } });
    } else if (response.nothingToUpdate) {
      return res.status(200).json({ success: { message: "Nothing To Update", color: "success" } });
    } else {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } catch (error) {
    console.error("ERROR FROM [editSubCategory] Due to =>", error);
    return res.status(400).json({ error: "Bad Request" });
  }
};


let deleteSubCategory = async (req, res) => {
  try {
    console.log("delete Subcategory section");
    // console.log(req.body);
    const { subCategoryId } = req.body;
    let response = await helper.deleteSubCategoryHelper(subCategoryId);
    if (response.success) {
      return res.status(200).json({ success: { message: "Subcategory Deleted Successfully", color: "danger" } });
    }
  } catch (error) {
    console.error("ERROR FROM [deleteSubCategory] Due TO =>", error);
    return res.status(400).render("error", { print: error, status: 400 });
  }
};



let ViewBrand = async (req, res) => {
  try {
    console.log("brand view section");
    let brand = await helper.ViewBrandHelper();
    return res.render("admin/AdminPanel/brand", { layout: 'adminLayout', admin: true, brand: brand });
  } catch (error) {
    console.error("ERROR WITH View Brand Get Page", error);
    return res.render("error", { print: error });
  }
};


let addBrand = async (req, res) => {
  try {
    console.log("reached in add brand section");
    // console.log(req.body,req.file.path);
    const brandName = req.body.brandName;
    const imagePath = req.file.path;
    if (!imagePath) {
      console.log("imge path not found in addBrand request");
      return res
        .status(400)
        .render("error", { print: "imge path not found in request" });
    }

    let response = await helper.addBrandHelper(brandName, imagePath);
    if (response.success) {
      res.cookie('alertDefinedForm', JSON.stringify({ message: "Brand Added Successfully", color: "success" }), { path: '/admin' })
      return res.redirect("/admin/ViewBrand");
    } else {
      throw new Error("error occured from addBrandHELPER");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).render("error", { print: error });
  }
};


let editBrand = async (req, res) => {
  try {
    console.log("edit Brand   section");
    const { id } = req.params;
    const { brandNameEdit } = req.body;
    let response = await helper.editBrandHelper(id, brandNameEdit, req.file);
    if (response.success) {
      return res.status(200).json({ success: { message: "Brand Updated Successfully", color: "warning" } });
    } else if (response.nothingToUpdate) {
      return res.status(200).json({ success: { message: "Nothing To Update", color: "success" } });
    } else {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } catch (error) {
    console.error("ERROR FROM [editBrand] Due to =>", error);
    return res.status(400).json({ error: "Bad Request" });
  }
};



let deleteBrand = async (req, res) => {
  try {
    console.log("delete Brand section");
    console.log(req.body);
    const { brandId } = req.body;
    let response = await helper.deleteBrandHelper(brandId);
    if (response.success) {
      return res.status(200).json({ success: { message: "Brand Deleted Successfully", color: "danger" } });
    }
  } catch (error) {
    console.error("ERROR FROM [deleteBrand] Due TO =>", error);
    return res.status(400).render("error", { print: error, status: 400 });
  }
};




let ViewBanner = async (req, res) => {
  try {
    console.log("view banner section");
    let banner = await helper.ViewBannerHelper();
    return res.render("admin/AdminPanel/banner", { layout: 'adminLayout', admin: true, banner: banner });
  } catch (error) {
    console.error("error occured in ADMIN viewBanner", error.message, error);
    return res.render("error", { print: error });
  }
};



let ViewCoupon = async (req, res) => {
  try {
    console.log("view coupon section");
   // console.log(Date());
    let coupon = await helper.ViewCouponHelper();
   // console.log(coupon);
      
    coupon.forEach((data, index) => {
      const expDATE = new Date(data.expDate) //ADDITIONALLY JOINED DATE ADDED
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }
      data.modifiedDate=expDATE.toLocaleDateString('en-us',options)
    })

    return res.render("admin/AdminPanel/coupon", { layout: 'adminLayout', admin: true,coupon  });
  } catch (error) {
    console.error("error occured in ADMIN ViewCoupon", error.message, error);
    return res.render("error", { print: error });
  }
};


let addCoupon =async (req, res) => {
  try {
    console.log("view Add Coupon section");
    console.log(req.body);
    const{ couponName,couponValue, expDate } = req.body
    let coupon = await helper.addCouponHelper(couponName,couponValue, expDate );
    let current=new Date();
  // console.log(coupon);
    // if(coupon.data.expDate > current ){
    //   console.log("still valid");
    // }
    if(coupon){
      res.cookie('alertDefinedForm', JSON.stringify({ message: "Coupon Added Successfully", color: "success" }), { path: '/admin' })
      return res.redirect("/admin/ViewCoupon");
    }
  } catch (error) {
    console.error("error occured in ADMIN addCoupon", error.message, error);
    return res.render("error", { print: error });
  }
};




let editCoupon =async (req, res) => {
  try {
    console.log(" Edit Coupon section");
   // console.log(req.body);
    const{couponId, couponName,couponValue, expDate } = req.body
     let response = await helper.editCouponHelper(couponId,couponName,couponValue, expDate );
    if(response){
      res.cookie('alertDefinedForm', JSON.stringify({ message: "Coupon Edited Successfully", color: "warning" }), { path: '/admin' })
      return res.redirect("/admin/ViewCoupon");
    }
  } catch (error) {
    console.error("error occured in ADMIN editCoupon", error.message, error);
    return res.render("error", { print: error });
  }
};


let deleteCoupon = async (req, res) => {
  try {
    console.log("delete coupon section");
    console.log(req.body);
    const { couponId } = req.body;
    let response = await helper.deleteCouponHelper(couponId);
    if (response.success) {
      return res.status(200).json({ success: { message: "Coupon Deleted Successfully", color: "danger" } });
    }
  } catch (error) {
    console.error("ERROR FROM [deleteCoupon] Due TO =>", error);
    return res.status(400).render("error", { print: error, status: 400 });
  }
};



let addBanner = async (req, res) => {
  try {
    console.log("add banner post section");
    // console.log(req.body,req.file.path);
    const bannerName = req.body.bannerName;
    const imagePath = req.file.path;

    // let imageArray =req.files.map((file) => ({
    //   path:file.path,
    //   originalName:file.originalname
    // }));
    // console.log(imageArray);

    if (!imagePath) {
      console.log("imge path not found in addBanner request");
      return res
        .status(400)
        .render("error", { print: "imge path not found in request" });
    }

    let response = await helper.addBannerHelper(bannerName, imagePath);
    if (response.success) {
      res.cookie('alertDefinedForm', JSON.stringify({ message: "New Banner Added Successfully", color: "success" }), { path: '/admin' })
      return res.redirect("/admin/ViewBanner");
    } else {
      throw new Error("error occured from addBannerHelper");
    }
  } catch (error) {
    console.error("error occured in ADMIN addBanner", error.message, error);
    return res.render("error", { print: error });
  }
};


let editBanner = async (req, res) => {
  try {
    console.log("edit Banner   section");
    const { id } = req.params;
    const { bannerNameEdit } = req.body;
    let response = await helper.editBannerHelper(id, bannerNameEdit, req.file);
    if (response.success) {
      return res.status(200).json({ success: { message: "Banner Updated Successfully", color: "warning" } });
    } else if (response.nothingToUpdate) {
      return res.status(200).json({ success: { message: "Nothing To Update", color: "success" } });
    } else {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } catch (error) {
    console.error("ERROR FROM [editBanner] Due to =>", error);
    return res.status(400).json({ error: "Bad Request" });
  }
};




let deleteBanner = async (req, res) => {
  try {
    console.log("delete Banner section");
    console.log(req.body);
    const { bannerId } = req.body;
    let response = await helper.deleteBannerHelper(bannerId);
    if (response.success) {
      return res.status(200).json({ success: { message: "Banner Deleted Successfully", color: "danger" } });
    }
  } catch (error) {
    console.error("ERROR FROM [deleteBanner] Due TO =>", error);
    return res.status(400).render("error", { print: error, status: 400 });
  }
};






let ViewProduct = async (req, res) => {
  try {
    console.log("admin View products section");

    let response = await helper.ViewProductHelper();
    if (response.success) {
      response.dataResult.forEach((datas, index) => {
        //MAKE SERIAL NUMBER FOR EACH DOCUMENT BEFORE RENDERING
        datas.serialNumber = index + 1;
      });
      // console.log(JSON.stringify(response.dataResult[1]));
      let trials = response.dataResult[1]
      return req.res.render("admin/AdminPanel/viewProduct", {
        layout: 'adminLayout', admin: true, product: true,
        product: response.dataResult, trialsTest: trials
      });
    } else {
      throw new Error("cant retrive the product now")
    }
  } catch (error) {
    console.error("error occured in ADMIN ViewProducts", error.message, error);
    return res.render("error", { print: error });
  }
};


let productEyeView = async (req, res) => {
  try {
    console.log("product eye view");
    const { id } = req.body;
    let result = await helper.productEyeViewHelper(id)
    //console.log(result);
    return res.status(200).json({ result, success: true });
  } catch (error) {
    console.error("ERROR FROM [productEyeView] Due to =>", error);
    return res.status(400).json({ error: "Bad Request" });
  }
}


let userList = async (req, res) => {
  try {
    console.log('Uselist Section');
    let response = await helper.userListHelper()
    //   console.log(response);
    response.forEach((data, index) => {
      data.serialNumber = index + 1 //ADDITIONALY SERLNO ADDED TO DATA
      const createdAtDate = new Date(data.createdAt) //ADDITIONALLY JOINED DATE ADDED
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        // second: 'numeric',
      //  timeZoneName: 'short',
      }
      data.joinedDate=createdAtDate.toLocaleDateString('en-us',options)
    })
   // console.log(response[0]);
    return req.res.render("admin/AdminPanel/users", { layout: 'adminLayout', admin: true, users:response})


  } catch (error) {
    console.error("ERROR FROM [userList] Due to =>", error);
    return res.status(400).render("error", { print: error, status: 400 });
  }
}



let vendorList= async (req, res) => {
  try {
    console.log('VendorList Section');
    let response = await helper.vendorListHelper()
    //   console.log(response);
    response.forEach((data, index) => {
      data.serialNumber = index + 1 //ADDITIONALY SERLNO ADDED TO DATA
      const createdAtDate = new Date(data.createdAt) //ADDITIONALLY JOINED DATE ADDED
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }
      data.joinedDate=createdAtDate.toLocaleDateString('en-us',options)
    })
    console.log(response[0]);
    return req.res.render("admin/AdminPanel/vendors", { layout: 'adminLayout', admin: true, vendors:response})


  } catch (error) {
    console.error("ERROR FROM [vendorList] Due to =>", error);
    return res.status(400).render("error", { print: error, status: 400 });
  }
}






let userStatus=async (req,res) => {
  try {
    console.log("User status Action ");
    //console.log(req.query);
    const {id,status}=req.query
    console.log(id,status);
   let response=await helper.userStatusHelper(id,status)
   if(response.status==='Active'){
   // console.log(response)
    res.cookie('alertDefinedForm', JSON.stringify({ message: "User Unblocked ", color: "success" }), { path: '/admin' })
   return res.redirect("/admin/userList");
   }else if(response.status==='Block'){
    res.cookie('alertDefinedForm', JSON.stringify({ message: "User Blocked ", color: "danger" }), { path: '/admin' })
    return res.redirect("/admin/userList");
   }else{
    throw new Error("CANT TAKE ACTION AGAINST USER  NOW")
   }

  } catch (error) {
    console.error(error);
    console.error("ERROR FROM [userStatus] Due to =>", error);
    return res.status(400).render("error", { print: error, status: 400 });
    
  }
}



let vendorStatus =async (req,res) => {
  try {
    console.log("Vendor status Action ");
    //console.log(req.query);
    const {id,status}=req.query
    console.log(id,status);
   let response=await helper.vendorStatusHelper(id,status)
   if(response.status==='Pending'){ //IF OLD STATE IS PENDING NOW IT GET ACTIVED
   // console.log(response)
    res.cookie('alertDefinedForm', JSON.stringify({ message: "Vendor Approved ", color: "success" }), { path: '/admin' })
   return res.redirect("/admin/vendorList");
   }else if(response.status==='Block'){//IF OLD STATE IS BLOCK NOW IT GET ACTIVED
    res.cookie('alertDefinedForm', JSON.stringify({ message: "Vendor Unblocked ", color: "success" }), { path: '/admin' })
    return res.redirect("/admin/vendorList");
   }else if(response.status==='Active'){
    res.cookie('alertDefinedForm', JSON.stringify({ message: "Vendor Blocked ", color: "danger" }), { path: '/admin' })
    return res.redirect("/admin/vendorList");
   }
   else{
    throw new Error("CANT TAKE ACTION AGAINST USER  NOW")
   }

  } catch (error) {
    console.error(error);
    console.error("ERROR FROM [userStatus] Due to =>", error);
    return res.status(400).render("error", { print: error, status: 400 });
    
  }
}





module.exports = {
  loginGetPage,
  loginPostPage,
  dashboardGetPage,
  adminLogout,
  passwordReset,
  passwordResetPost,
  passwordVerifyPost,
  NewPassword,
  NewPasswordPost,
  ViewCategory,
  deleteCategory,
  ViewSubCategory,
  ViewBrand,
  addCategory,
  addSubCategory,
  addBrand,
  ViewProduct,
  deleteSubCategory,
  deleteBrand,
  editCategory,
  editSubCategory,
  editBrand,
  addBanner,
  ViewBanner,
  deleteBanner,
  editBanner,
  productEyeView,
  userList,
  userStatus,
  vendorList,
  vendorStatus,
  ViewCoupon,
  addCoupon,
  deleteCoupon,
  editCoupon

};
