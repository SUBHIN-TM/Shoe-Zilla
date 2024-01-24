const User = require('../models/users')
const bcrypt = require('bcrypt')
const Product = require("../models/product");
const Brand = require("../models/brand");
const Category = require('../models/category');
const Banner = require("../models/banner");
const SubCategory = require('../models/subCategory');
const Cart = require('../models/cart');


//USER SIGN UP SECTION
function signupHelper(recievedUserData) {
  const { firstName, lastName, mail, phoneNumber, password } = recievedUserData
  return new Promise(async (resolve, reject) => {
    try {
      const existingUser = await User.findOne({ mail: mail })
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new User({
          userName: `${firstName} ${lastName}`,
          mail: mail,
          password: hashedPassword,
          phoneNumber: phoneNumber,
          status:"Active",
        });
        user.save();
        resolve({ success: true, user })
      } else {
        resolve({ mailExist: true })
      }

    } catch (error) {
      reject(error)
    }
  })
}


//USER LOGIN SECTION
let loginHelper = async (recievedUserData) => {
  try {
    const { mail, password } = recievedUserData
    let existingUser = await User.findOne({ mail: mail })
    if (existingUser) {
      const passwordMatch = await bcrypt.compare(password, existingUser.password)
      if (!passwordMatch) {
        return { passwordMismatch: true }
      } else {
        if(existingUser.status === 'Block'){
          return { blockedUser: true, existingUser }
        }
        return { verified: true, existingUser }
      }
    } else {
      return { invalidUsername: true }
    }

  } catch (error) {
    throw error;
  }
}


let googleHelper = async (recievedGoogleMail) => {
  try {
    let existingUser = await User.findOne({ mail: recievedGoogleMail })
    if (existingUser) {
      return { found: true, existingUser }
    } else {
      return { nonExistingUser: true }
    }
  } catch (error) {
    throw error;
  }

}



let passwordResetHelper = (mail) => {
  return new Promise(async (resolve, reject) => {
    try {
      let existingUser = await User.findOne({ mail: mail })
      if (!existingUser) {
        resolve({ invalidEmail: true })
      }

      resolve({ id: existingUser._id, mail: existingUser.mail })

    } catch (error) {
      reject(error)
    }
  })
}


let otpHelper = (id, otp) => {
  return new Promise(async (resolve, reject) => {
    try {
      let userDatabase = await User.findOne({ _id: id })
      userDatabase.otp = otp;

      let saveResponse = await userDatabase.save()
      resolve(saveResponse)

    } catch (error) {
      console.error("OTP HELPER ERROR DUE TO", error);
      reject(error)
    }
  })
}


let passwordVerifyHelper = (mail, otp) => {
  return new Promise(async (resolve, reject) => {
    try {

      let database = await User.findOne({ mail: mail })
      if (database) {
        if (database.otp == otp) {
          resolve({ passwordVerified: true, id: database._id })
        } else {
          resolve({ passwordNotVerified: true })
        }
      } else {
        throw new Error('cant get the user from database')
      }

    } catch (error) {
      reject(error)
    }
  })

}

let NewPasswordPostHelper = (mail, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      let database = await User.findOne({ mail: mail })
      if (!database) {
        throw new Error('cant get the user from database')
      } else {
        let hashedPassword = await bcrypt.hash(password, 10)
        database.password = hashedPassword
        let saveResponse = await database.save()
        if (saveResponse) {
          // console.log("resolved",saveResponse);
          resolve({ success: true, saveResponse })
        }
        else {
          reject("Cant updated the new password to database")
        }
      }

    } catch (error) {
      reject(error)
    }
  })
}




let homePageHelper = async () => {
  try {
    // console.log("aggregation begins");
    const latestProduct = await Product.aggregate([
      // {
      //   $match: {
      //     createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }

      //   }
      // },
       {
        $sort: { updatedAt: -1 } // Sorting by updatedAt in descending order to get the latest documents first
      },
      {
        $group: {
          _id: "$productName",
          products: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          _id: 1,
          products: {
            $map: {
              input: "$products",
              as: "pointer",
              in: {
                _id: "$$pointer._id",
                productName: "$$pointer.productName",
                productPrice: "$$pointer.productPrice",
                productMRP: "$$pointer.productMRP",
                productDiscount: "$$pointer.productDiscount",
                createdAt: "$$pointer.createdAt",
                updatedAt: "$$pointer.updatedAt",
                productImages: "$$pointer.productImages",
                productCategory: "$$pointer.productCategory",//from here extra
                productSubCategory: "$$pointer.productSubCategory",
                productBrand: "$$pointer.productBrand",
                productColor: "$$pointer.productColor",
                vendorId: "$$pointer.vendorId",
              }
            }
          }
        }
      },
      {
        $sort: { "products.updatedAt": -1 } // Sorting each product group by updatedAt in descending order
      }, {
        $limit: 8
      }
    ]);
    //   let trial=await Product.findOne({_id:'659fa13965fda8f916787ceb'})
    // console.log(trial.productSizeAndQty);
    //   console.log(" \n result",latestProduct);
    //   console.log(" \n  for hbs",latestProduct[3]);
    const allProducts = await Product.aggregate([

      {
        $group: {
          _id: "$productName",
          products: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          _id: 1,
          products: {
            $map: {
              input: "$products",
              as: "pointer",
              in: {
                _id: "$$pointer._id",
                productName: "$$pointer.productName",
                productPrice: "$$pointer.productPrice",
                productMRP: "$$pointer.productMRP",
                productDiscount: "$$pointer.productDiscount",
                createdAt: "$$pointer.createdAt",
                updatedAt: "$$pointer.updatedAt",
                productImages: "$$pointer.productImages",
                productCategory: "$$pointer.productCategory",
                productSubCategory: "$$pointer.productSubCategory",
                productBrand: "$$pointer.productBrand",
                productColor: "$$pointer.productColor",
                vendorId: "$$pointer.vendorId",
              }
            }
          }
        }
      },
    ]);

    // console.log("all \n",allProducts);
    // console.log("new \n",latestProduct.map((data) => data.products));


    const [MenProducts, WomenProducts, brand, category, banner] = await Promise.all([
      Product.find({ productCategory: "MEN" }),
      Product.find({ productCategory: 'WOMEN' }),
      Brand.find(),
      Category.find(),
      Banner.find({ bannerName: 'Home' })
    ])//WILL RETURN ONLY BOTH PROMIS RESOLVED.EITHER OF THIS REJECT ALL WIL REJECT

    // console.log(allProduct,"\n",MenProducts,"\n",WomenProducts,"\n" );
    const plainCategory = category.map(doc => doc.toObject());//CONVERT MONGOOSE OBJECT TO JAVA SCRIPT OBJECT
    //BEACUSE IF WE WANT TO ADD ANY NEW FILED TO THIS OR MODIFY WE HAVE TO MAKE IT AS NORMAL JAVA SCRIPT OBJECT 

    plainCategory.forEach(category => {
      if (category.categoryName === 'MEN') {
        category.currentCategoryIsMen = true; // i just ADDED  NEW KEY TO IDENTIFY MEN CATEGORY FOR FRONT END
        //I WANT TO SELCT IN FRONT END FOR IF MEN=a="/men" ELSE a="/women"
        //IN HBS WE CAT CHECK IN THRE AS IF(this.categoryName=="MEN")thats why.!
      }
    });

    //  console.log(plainCategory);

    return { success: true, allProducts, latestProduct, MenProducts, WomenProducts, brand, plainCategory, banner }
  } catch (error) {
    throw new Error("eror from homePageHelper", error)

  }
}


let menPageHelper = () => {

  return new Promise(async (resolve, reject) => {
    try {
      let Allcollections = await Product.aggregate([
        {
          $match: {
            productCategory: "MEN"
          }
        },
        {
          $group: {
            _id: '$productName',
            products: { $push: "$$ROOT" }
          }
        },
        {
          $project: {
            _id: 1,
            products: {
              $map: {
                input: "$products",
                as: "pointer",
                in: {
                  _id: "$$pointer._id",
                  productName: "$$pointer.productName",
                  productPrice: "$$pointer.productPrice",
                  productMRP: "$$pointer.productMRP",
                  productDiscount: "$$pointer.productDiscount",
                  createdAt: "$$pointer.createdAt",
                  updatedAt: "$$pointer.updatedAt",
                  productImages: "$$pointer.productImages",
                  productCategory: "$$pointer.productCategory",
                  productSubCategory: "$$pointer.productSubCategory",
                  productBrand: "$$pointer.productBrand",
                  productColor: "$$pointer.productColor",
                  productSize: "$$pointer.productSize",
                  vendorId: "$$pointer.vendorId",
                  productQty: "$$pointer.productQty",
                }
              }
            }
          }
        }
      ])

      //  console.log("men collections",Allcollections);
      let colors = await Product.aggregate([
        {
          $match: {
            productCategory: 'MEN'
          }
        },
        {
          $group: {
            _id: {
              $trim: { //JUST MAKE SURE NO ADDITIONAL SPCE.TO AVOID SAME COLOR GROUP AGAIN
                input: {
                  $toUpper: '$productColor'  //JUST MAKE IT TO UPPERCASE AND GROUPED
                }
              }
            }
          }
        },
        {
          $sort: {
            _id: 1

          }

        },
        {
          $project: {
            colors: '$_id'

          }

        }

      ])
      //   console.log("colors",colors);

      const [brands, banner, subCategory] = await Promise.all([
        Brand.find(),
        Banner.find({ bannerName: 'Men' }),
        SubCategory.find()
      ])//WILL RETURN ONLY BOTH PROMIS RESOLVED.EITHER OF THIS REJECT ALL WIL REJECT

      resolve({ success: true, brands, banner, Allcollections, subCategory, colors })
    } catch (error) {
      console.error("Error From [menPageHelper] Due to =>", error);
      reject(error)
    }
  })
}



let womenHelper = () => {

  return new Promise(async (resolve, reject) => {
    try {
      let Allcollections = await Product.aggregate([
        {
          $match: {
            productCategory: "WOMEN"
          }
        },
        {
          $group: {
            _id: '$productName',
            products: { $push: "$$ROOT" }
          }
        },
        {
          $project: {
            _id: 1,
            products: {
              $map: {
                input: "$products",
                as: "pointer",
                in: {
                  _id: "$$pointer._id",
                  productName: "$$pointer.productName",
                  productPrice: "$$pointer.productPrice",
                  productMRP: "$$pointer.productMRP",
                  productDiscount: "$$pointer.productDiscount",
                  createdAt: "$$pointer.createdAt",
                  updatedAt: "$$pointer.updatedAt",
                  productImages: "$$pointer.productImages",
                  productCategory: "$$pointer.productCategory",
                  productSubCategory: "$$pointer.productSubCategory",
                  productBrand: "$$pointer.productBrand",
                  productColor: "$$pointer.productColor",
                  productSize: "$$pointer.productSize",
                  vendorId: "$$pointer.vendorId",
                  productQty: "$$pointer.productQty",
                }
              }
            }
          }
        }
      ])

      //  console.log("men collections",Allcollections);
      let colors = await Product.aggregate([
        {
          $match: {
            productCategory: 'WOMEN'
          }
        },
        {
          $group: {
            _id: {
              $trim: { //JUST MAKE SURE NO ADDITIONAL SPCE.TO AVOID SAME COLOR GROUP AGAIN
                input: {
                  $toUpper: '$productColor'  //JUST MAKE IT TO UPPERCASE AND GROUPED
                }
              }
            }
          }
        },
        {
          $sort: {
            _id: 1

          }

        },
        {
          $project: {
            colors: '$_id'

          }

        }

      ])
      //  console.log("colors",colors);

      const [brands, banner, subCategory] = await Promise.all([
        Brand.find(),
        Banner.find({ bannerName: 'Women' }),
        SubCategory.find()
      ])//WILL RETURN ONLY BOTH PROMIS RESOLVED.EITHER OF THIS REJECT ALL WIL REJECT

      resolve({ success: true, brands, banner, Allcollections, subCategory, colors })
    } catch (error) {
      console.error("Error From [womenPageHelper] Due to =>", error);
      reject(error)
    }
  })
}



let menFilterHelper = (brand, subCategory, color, size, sortOrder) => {
  return new Promise(async (resolve, reject) => {
    try {
      //  console.log(brand,subCategory,color,size,sortOrder);

      let model = [
        {
          $match: {
            productCategory: "MEN",
            productBrand: { $in: brand },
            productSubCategory: { $in: subCategory },
            productColor: { $in: color },
            'productSizeAndQty.size': { $in: size.map(s => parseInt(s)) }
          }
        },
        {
          $sort: sortOrder
        }
      ];


      let Allcollections = await Product.aggregate(model);
      //  console.log("all", Allcollections);
      resolve(Allcollections)
      //  console.log("INSIDE",Allcollections.map((data) => data.productSizeAndQty));


    } catch (error) {
      console.error("ERROR FROM [menFilterHelper] Due to => ", error)
      reject(error)
    }
  })
}



let searchFilterHelper = (brand, subCategory, color, size, sortOrder) => {
  return new Promise(async (resolve, reject) => {
    try {
      // console.log(brand,subCategory,color,size,sortOrder);

      let model = [
        {
          $match: {
            productBrand: { $in: brand },
            productSubCategory: { $in: subCategory },
            productColor: { $in: color },
            'productSizeAndQty.size': { $in: size.map(s => parseInt(s)) }
          }
        },
        {
          $sort: sortOrder
        }
      ];

      let Allcollections = await Product.aggregate(model);
      //  console.log("all", Allcollections);
      resolve(Allcollections)
      //  console.log("INSIDE",Allcollections.map((data) => data.productSizeAndQty));


    } catch (error) {
      console.error("ERROR FROM [searchFilterHelper] Due to => ", error)
      reject(error)
    }
  })
}


let womenFilterHelper = (brand, subCategory, color, size, sortOrder) => {
  return new Promise(async (resolve, reject) => {
    try {
      //  let trial=await Product.find({productBrand:'SPARX'})
      //  console.log("trial" ,trial);

      // console.log(brand,subCategory,color,size,sortOrder);


      let model = [
        {
          $match: {
            productCategory: "WOMEN",
            productBrand: { $in: brand },
            productSubCategory: { $in: subCategory },
            productColor: { $in: color },
            'productSizeAndQty.size': { $in: size.map(s => parseInt(s)) }
          }
        },
        {
          $sort: sortOrder
        }
      ];


      let Allcollections = await Product.aggregate(model);
      //  console.log("all", Allcollections);
      resolve(Allcollections)
      //  console.log("INSIDE",Allcollections.map((data) => data.productSizeAndQty));


    } catch (error) {
      console.error("ERROR FROM [womenFilterHelper] Due to => ", error)
      reject(error)
    }
  })
}




let searchHelper = (searchThings) => {
  return new Promise(async (resolve, reject) => {
    try {
      //CREATED INDEX IN MONGO SCHEMA FOR TEXt
      const searchResults = await Product.find({ $text: { $search: searchThings } });
      //  console.log("search",searchResults);

      let colors = await Product.aggregate([
        {
          $group: {
            _id: {
              $trim: { //JUST MAKE SURE NO ADDITIONAL SPCE.TO AVOID SAME COLOR GROUP AGAIN
                input: {
                  $toUpper: '$productColor'  //JUST MAKE IT TO UPPERCASE AND GROUPED
                }
              }
            }
          }
        },
        {
          $sort: {
            _id: 1

          }

        },
        {
          $project: {
            colors: '$_id'

          }

        }

      ])
      //   console.log("colors",colors);

      const [brands, subCategory] = await Promise.all([
        Brand.find(),
        SubCategory.find()
      ])


      resolve({ success: true, searchResults, colors, brands, subCategory })
    } catch (error) {
      console.error("ERROR FROM [searchHelper]", error);
      reject(error)

    }
  })
}




let productDetailsHelper = (productId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let currentProduct = await Product.findOne({ _id: productId })
      // console.log("CURRENT \n",currentProduct);

      let relatedColors = await Product.aggregate([
        {
          $match: { productName: currentProduct.productName }
        }
      ])
      // console.log("RELATED PRODUCTS \n",relatedColors); 

      resolve({ success: true, currentProduct, relatedColors })
    } catch (error) {
      console.error("ERROR FROM [productDetailsHelper]", error);
      reject(error)
    }
  })
}


let cartHelper =(ProductId,size,InnerId,quantity,userId,vendorId,price) =>{
  return new Promise(async(resolve,reject) => {
    try {
      let userAllCurrntCartProducts=await Cart.find({userId:userId})
      console.log("User already added cart products",userAllCurrntCartProducts);
      let sameProduct=userAllCurrntCartProducts.filter((product,index) => {
        return (
          product.productRef.toString() === ProductId.toString() &&
          product.productSize === size
        );
      })
      
      console.log("same product",sameProduct);

      





    //  console.log(quantity,price);
         let cartAdd=  await new Cart({
          userId:userId,
          productRef:ProductId,
          productInnerId:InnerId,
          productQty:quantity,
          productSize:size,
          vendorRef:vendorId,
          total:parseInt(price) * quantity
         }).save()

      //   console.log("successfully writed the product to the cart database", cartAdd);
         if(cartAdd){
          resolve({success:true})
         }

    } catch (error) {
      console.error("ERROR FROM [cartHelper]", error);
      reject(error)
      
    }
  })
}


let cartViewHelper =(userId) => {
  return new Promise(async(resolve,reject) => {
    try {
      // let cartItems=await Cart.aggregate([
      //   {$match:{userId:userId}}
      // ])
      let cartItems = await Cart.find({ userId: userId }).populate('productRef').populate('vendorRef').exec();
   //   console.log("user cart lists are",cartItems);
      resolve(cartItems)
      
    } catch (error) {
      console.error("ERROR FROM [cartViewHelper]", error);
      reject(error)
    }
  })
}



let cartRemoveHelper=(cartId) =>{
  return new Promise (async(resolve,reject) => {
    try {
      let response= await Cart.findOneAndDelete({_id:cartId})//IF SUCES OLD DATA WIL RETURN IF IT FAILS TO DELETE RETURN NULL
      console.log("successfully deleted the current product from cart",response);
      resolve(response)
    } catch (error) {
      console.error("ERROR FROM [cartRemoveHelper]", error);
      reject(error)
    }
  })
}



module.exports = {
  signupHelper, loginHelper, googleHelper, passwordResetHelper, otpHelper, passwordVerifyHelper, NewPasswordPostHelper, homePageHelper
  , menPageHelper, menFilterHelper, womenHelper, womenFilterHelper, productDetailsHelper, searchHelper, searchFilterHelper,
  cartHelper,cartViewHelper,cartRemoveHelper
}