const helper = require("../helpers/adminHelper");
const {signAdmin, verifyAdmin} = require('../middleware/jwt')

//ADMIN LOGIN PAGE DISPLAY
let loginGetPage = (req, res) => {
  if(req.cookies.jwt){
    return res.redirect('/admin/dashboard')
  }
  res.render("admin/login");
};

//ADMIN LOGIN SECTION
let loginPostPage = async (req, res) => {
  try {
    console.log("entered admin login section");
    console.log(req.body);

    const resolved = await helper.loginHelper(req.body);
    if (resolved.invalidAdminDetails) {
      console.log('invalid admin details');
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
      console.log("verified admin name and password");
      const token = await signAdmin(resolved.existingAdmin)
      console.log("RECIEVED ADMIN TOKEN FROM JWT AUTH ",token);
      res.cookie('jwt',token, {httpOnly:true,maxAge:7200000}); //1= COOKIE NAME AND  2 =DATA 3=OPTIONAL
      res.status(200).redirect('/admin/dashboard')
    }
    
  } catch (error) {
    res.render("error", { print: error });
  }
};




let dashboardGetPage =async (req,res) => {
  try{
    console.log("entered in admin dashboard sample page after middleware admin authaentication done");
    let tokenExracted = await verifyAdmin(req.cookies.jwt) //NOW IT HAVE USER NAME AND ID ALSO THE ROLE (ITS COME FROM MIDDLE AUTH JWET)
    res.render('admin/dashboard',{adminId:tokenExracted.adminId})

  }catch(error){
    res.render("error", { print: error });
  }
 
}


let adminLogout = (req,res) => {
  res.clearCookie('jwt');
  res.redirect('/adminLogin')
}



module.exports = { loginGetPage, loginPostPage,dashboardGetPage,adminLogout};
