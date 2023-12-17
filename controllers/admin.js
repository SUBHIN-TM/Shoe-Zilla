const helper = require("../helpers/adminHelper");

//ADMIN LOGIN PAGE DISPLAY
let loginGetPage = (req, res) => {
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
      console.log("verified");
      res.status(200).send(`Verified And WELCOME `);
    }
    
  } catch (error) {
    res.render("error", { print: error });
  }
};

module.exports = { loginGetPage, loginPostPage };
