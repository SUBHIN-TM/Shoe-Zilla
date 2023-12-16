const Vendor = require("../models/vendors");

let loginGetPage = (req, res) => {
  res.render("vendor/login");
};

let signupGetPage = (req, res) => {
  res.render("vendor/signup");
};

let signupPostPage = (req, res) => {
  console.log("Entered In vendors Registration section");
  console.log(`Recieved data from vendors registration ${req.body}`);
  const {shopName,ownerName,mail,password,phoneNumber} = req.body
  const vendor=new Vendor({
    shopName: shopName,
    ownerName: ownerName,
    mail:mail,
    password: password,
    phoneNumber:phoneNumber,
  })
  vendor.save();
  console.log(vendor,'vender details stored in mongo db successfully');
};

module.exports = { loginGetPage, signupGetPage, signupPostPage };
