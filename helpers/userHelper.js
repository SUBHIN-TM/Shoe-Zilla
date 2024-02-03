const User = require('../models/users')
const bcrypt = require('bcrypt')
const Product = require("../models/product");
const Brand = require("../models/brand");
const Category = require('../models/category');
const Banner = require("../models/banner");
const SubCategory = require('../models/subCategory');
const Cart = require('../models/cart');
const { ObjectId } = require('mongodb');
const vendor = require('../models/vendors');
const user = require('../models/users');
const Order = require('../models/order')
const Coupon = require("../models/coupon")



//CART NUMBER FIND
let cartNumber = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response = await Cart.find({ userId: userId })
      //   console.log("cart number",response.length);
      resolve(response.length)

    } catch (error) {
      console.error("ERROR FROM [cartNumber] Due to => ", error)
      reject(error)
    }
  })
}





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
          status: "Active",
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
        if (existingUser.status === 'Block') {
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
      console.log("existing user", existingUser);
      if (existingUser.status == 'Block') {
        return { blockedUser: true, existingUser }
      }
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
      console.log("RELATED PRODUCTS \n", relatedColors);

      resolve({ success: true, currentProduct, relatedColors })
    } catch (error) {
      console.error("ERROR FROM [productDetailsHelper]", error);
      reject(error)
    }
  })
}


let cartHelper = (ProductId, size, InnerId, quantity, userId, vendorId, price) => {
  return new Promise(async (resolve, reject) => {
    try {
      //FIRST CHECK WHETHER THE SAME USER ID HAS REGISTERD IF IT CHECK SAME PRODUCT WITH SIZE ARE THERE THEN UPDATE IT NOT CREATE NEW
      let filter = {
        userId: userId,
        productRef: new ObjectId(ProductId),
        productSize: size
      };

      let update = {
        $inc: {
          productQty: quantity,
          total: parseInt(price) * quantity
        }
      };

      let options = {
        returnDocument: 'after'
      };

      let sameProduct = await Cart.findOneAndUpdate(filter, update, options) //if same product found it will execute
      if (sameProduct) {
        console.log("same Product Found And QTY Updated", sameProduct);
        resolve({ success: true })
      } else {

        let productDetails = await Product.findOne({ _id: ProductId })
        console.log("try", productDetails);

        // console.log(quantity,price);
        let cartAdd = await new Cart({
          userId: userId,
          productRef: ProductId,
          productInnerId: InnerId,
          productQty: quantity,
          productSize: size,
          vendorRef: vendorId,
          productMRP: productDetails.productMRP,
          productDiscount: productDetails.productMRP - productDetails.productPrice,
          total: parseInt(price) * quantity
        }).save()

        console.log("successfully writed the product to the cart database", cartAdd);
        if (cartAdd) {
          resolve({ success: true })
        }
      }

    } catch (error) {
      console.error("ERROR FROM [cartHelper]", error);
      reject(error)

    }
  })
}


const cartViewHelper = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let cartItems = await Cart.find({ userId: userId }).populate('productRef').populate('vendorRef').sort({ createdAt: -1 }).exec();

      const newData = cartItems.map(item => {
        const productSizeAndQty = item.productRef.productSizeAndQty.flat();

        const avilableVariations = productSizeAndQty.reduce((acc, obj) => {
          acc[obj.size] = obj.qty;
          return acc;
        }, {});

        return {
          ...item.toObject(),  //CONVERT MONGOOSE DOCUMNT TO PLAIN JAVASCRIPT OBJECT AND ALL DATA AND NEW AVAILLEQTY ADDED TO  NEWdata
          avilableVariations,
        };
      });

      //  console.log("user cart lists are", newData);
      let final = newData.map((products) => {
        let vendorStock = products.avilableVariations[products.productSize]  //ONLY CHOOSED SIZE THAT MATCHE SAND WRITE CORRESPONDING QTY TO VARIABLE FOR CART VALIDATION TO CHECK AVIALABILITY
        return { ...products, vendorStock }
      })


      console.log("user cart lists are", final);
      resolve(final);
    } catch (error) {
      console.error("ERROR FROM [cartViewHelper]", error);
      reject(error);
    }
  });
};




let cartRemoveHelper = (cartId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response = await Cart.findOneAndDelete({ _id: cartId })//IF SUCES OLD DATA WIL RETURN IF IT FAILS TO DELETE RETURN NULL
      console.log("successfully deleted the current product from cart", response);
      resolve(response)
    } catch (error) {
      console.error("ERROR FROM [cartRemoveHelper]", error);
      reject(error)
    }
  })
}



let cartEditHelper = (cartId, newQty, price) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response = await Cart.updateOne({ _id: cartId }, { $set: { productQty: newQty, total: parseInt(price) * parseInt(newQty) } })
      console.log(response);
      if (response.acknowledged) {
        resolve(response)
      } else {
        throw new Error("cant update qty now")
      }
    } catch (error) {
      console.error("ERROR FROM [cartEditHelper]", error);
      reject(error)
    }
  })
}




let checkOutHelper = (cartArray, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let selectedItems = await Cart.find({ _id: { $in: cartArray } }).populate('productRef').populate('vendorRef').exec();
      //  console.log(selectedItems);
      let summary = selectedItems.map((data) => ({
        productImage: data.productRef.productImages[0].url,
        productName: data.productRef.productName,
        productCategory: data.productRef.productCategory,
        productSubCategory: data.productRef.productSubCategory,
        productBrand: data.productRef.productBrand,
        productColor: data.productRef.productColor,
        productSize: data.productSize,
        productQty: data.productQty,
        productMRP: data.productMRP,
        productDiscount: data.productMRP - data.productRef.productPrice,
        productPrice: data.productRef.productPrice,
        productTotal: `${data.productQty} x ${data.productRef.productPrice} = ${data.productQty * data.productRef.productPrice} `,
        vendorName: data.vendorRef.vendorName,
        userId: data.userId,
        productId: data.productRef._id,
        vendorId: data.vendorRef._id
      }));

      let totalMRPArray = []
      let totalDiscountArray = []
      summary.map((data) => {
        totalMRPArray.push(data.productMRP)
        totalDiscountArray.push(data.productDiscount)
      })

      let productTotalMRP = totalMRPArray.reduce((acc, data) => acc + data, 0)
      let productTotalDiscount = totalDiscountArray.reduce((acc, data) => acc + data, 0)

      console.log("mrp total =", totalMRPArray, "total discount", totalDiscountArray)

      // let productTest=await Product.findOne({_id:summary[0].productId})
      // console.log("test",productTest);
      // let vendorTest=await vendor.findOne({_id:summary[0].vendorId})
      // console.log(" vendor test",vendorTest);
      // let userTest=await user.findOne({_id:summary[0].userId})
      // console.log(" user test",userTest);

      // console.log("summary",summary[0]);

      const { address } = await User.findOne({ _id: userId })
      //   console.log(address);

      const coupon = await Coupon.find({ status: 'ENABLED' })
      //   console.log("coupons",coupon);

      resolve({ summary, address, coupon, productTotalMRP, productTotalDiscount })

    } catch (error) {
      console.error("ERROR FROM [checkOutHelper]", error);
      reject(error)
    }
  })
}


let checkOutHelperDirectBuy = (size, qty, productId, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let selectedItem = await Product.find({ _id: productId })
      const { vendorName } = await vendor.findOne({ _id: selectedItem[0].vendorId })
      //   console.log("vendor", vendorName);
      //  console.log(selectedItem);
      let summary = selectedItem.map((data) => ({
        productImage: data.productImages[0].url,
        productName: data.productName,
        productCategory: data.productCategory,
        productSubCategory: data.productSubCategory,
        productBrand: data.productBrand,
        productColor: data.productColor,
        productSize: size,
        productQty: qty,
        productMRP: data.productMRP,
        productDiscount: data.productMRP - data.productPrice,
        productPrice: data.productPrice,
        productTotal: `${qty} x ${data.productPrice} = ${qty * data.productPrice} `,
        vendorName: vendorName,
        userId: userId,
        productId: productId,
        vendorId: data.vendorId
      }));
      //   console.log("summary",summary);
      let noOfProducts = qty;
      let productTotalMRP = summary[0].productMRP
      let productTotalDiscount = summary[0].productDiscount
      let productTotal = qty * summary[0].productPrice
      let gst = (productTotal * 5) / 100
      let orderAmount = Math.floor(productTotal + gst)
      // console.log(noOfProducts,productTotal,gst,orderAmount);


      // console.log("user", userId);
      const { address } = await User.findOne({ _id: userId })
      //    console.log(address);

      const coupon = await Coupon.find({ status: 'ENABLED' })
      //   console.log("coupons",coupon);


      resolve({ summary, noOfProducts, productTotal, gst, orderAmount, address, coupon, productTotalDiscount, productTotalMRP })

    } catch (error) {
      console.error("ERROR FROM [checkOutHelperDirectBuy]", error);
      reject(error)
    }
  })
}



let addNewAddressHelper = (userId, name, address, district, state, zip, mail, number) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = {
        name: name,
        address: address,
        district: district,
        state: state,
        zip: zip,
        number: number,
        mail: mail
      }
      let response = await User.updateOne({ _id: userId }, { $push: { 'address': data } })
      console.log(response);
      if (response.acknowledged) {
        resolve(response)
      }


    } catch (error) {
      console.error("ERROR FROM [addNewAddressHelper]", error);
      reject(error)

    }
  })
}



let editAddressHelper = (userId, name, address, district, state, zip, mail, number, addressInnerId) => {
  return new Promise(async (resolve, reject) => {
    try {

      let filter = {
        _id:userId,
      "address._id":addressInnerId
      };

      let update = {
      $set :{"address.$":{
        name: name,
        address: address,
        district: district,
        state: state,
        zip: zip,
        number: number,
        mail: mail
      } }
   
      };

      let options = {
        returnDocument: 'after'
      };
      let updated=await User.findOneAndUpdate(filter,update,options)
      console.log("successfully edited the address",updated);
      resolve(updated)

    } catch (error) {
      console.error("ERROR FROM [editAddressHelper]", error);
      reject(error)
    }
  })
}





let deleteAddressHelper = (userId, addressInnerId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response = await User.findOneAndUpdate(
        { _id: userId },
        { $pull: { address: { _id: addressInnerId } } }
      );
      console.log("successfully deleted the address", response);
      resolve(response)
    } catch (error) {
      console.error("ERROR FROM [deleteAddressHelper]", error);
      reject(error)
    }
  })
}



let couponVerifyHelper = (productArray, couponName) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(productArray, couponName);
      let allProductPrice = await Promise.all(
        productArray.map(async (product) => {
          const { productPrice } = await Product.findOne({ _id: product.productId })
          return productPrice * product.qty
        })
      );
      // console.log(allProductPrice); //ALL INDUVIDUL PRICE ARE ARRAY STORED

      let total = allProductPrice.reduce((acc, data) => acc + data, 0) //ALL PRODUCT TOTAL CALCULATED
      //  console.log(total);

      let gst = total * 0.05  //5% OF TOTAL CALCULATED TO ADD ON IT
      // console.log("gst",gst);

      let orderTotal = Math.floor(total + gst)  //ORDER TOTAL WITH GST
      //   console.log(orderTotal);

      const coupon = await Coupon.findOne({ name: couponName })
      if (coupon) {
        console.log("coupn number verified", coupon);
        let currentDate = new Date();
        if (currentDate <= coupon.expDate) {
          let couponValue = coupon.value
          let discountPercentage = (orderTotal * couponValue) / 100
          console.log("discount value of order ", discountPercentage);
          let finalTotal = Math.floor(orderTotal - discountPercentage)
          console.log("After reduction of coupon percentage  final amount", finalTotal);
          resolve({ discountedAmount: finalTotal, couponId: coupon._id })
        } else {
          console.log("coupn Date Expired", coupon);
          resolve({ expired: true })
        }
      } else {
        console.log("invalid Coupn", coupon);
        resolve({ invalid: true })
      }
    } catch (error) {
      console.error("ERROR FROM [couponVerifyHelper]", error);
      reject(error)
    }
  })
}



let orderPlacedHelpers = (userIdRef, addressId, productsArray, couponIdRef, modeOfPayment, razorPaymentId, razorpayOrderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let TOTAL;
      let couponApplied = "NO"
      let discount = 0
      let GST;
      if (modeOfPayment == 'RP') {
        modeOfPayment = "Online Payment"
      }
      console.log(userIdRef, addressId, productsArray, couponIdRef, modeOfPayment);
      let allProductPrice = await Promise.all(
        productsArray.map(async (product) => {
          const { productPrice } = await Product.findOne({ _id: product.productId })
          product.total = productPrice * product.qty
          return productPrice * product.qty
        })
      );
      console.log("new field", productsArray[0])
      // console.log(allProductPrice); //ALL INDUVIDUL PRICE ARE ARRAY STORED
      let total = allProductPrice.reduce((acc, data) => acc + data, 0) //ALL PRODUCT TOTAL CALCULATED
      //  console.log(total);
      let gst = total * 0.05  //5% OF TOTAL CALCULATED TO ADD ON IT
      GST = Math.floor(gst)
      // console.log("gst",gst);      
      TOTAL = Math.floor(total + gst)  //ORDER TOTAL WITH GST
      //  console.log(TOTAL);
      if (couponIdRef) { //IF COUPON APPLIED
        const { value } = await Coupon.findOne({ _id: couponIdRef })
        let discountPercentage = (TOTAL * value) / 100
        let finalAmount = Math.floor(TOTAL - discountPercentage)
        TOTAL = finalAmount
        couponApplied = "YES"
        discount = Math.floor(discountPercentage)
      }
      console.log("Total", TOTAL);

      const currentDate = new Date();
      const deliveryDate = new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000);


      let SAVE = await new Order({
        userIdRef: userIdRef,
        addressId: addressId,
        productsArray: productsArray.map((data) => ({
          productIdRef: data.productId,
          size: data.size,
          qty: data.qty,
          total: data.total
        })),
        couponApplied: couponApplied,
        couponIdRef: couponIdRef,
        productPriceTotal: total,
        gst: GST,
        couponDiscount: discount,
        total: TOTAL,
        modeOfPayment: modeOfPayment,
        razorPaymentId: razorPaymentId,
        razorpayOrderId: razorpayOrderId,
        deliveryDate: deliveryDate
      }).save()

      let response = await Promise.all(
        SAVE.productsArray.map(async (data) => {
          const product = await Product.findOneAndUpdate(
            { '_id': data.productIdRef, 'productSizeAndQty.size': data.size },//NOW IT MATCHES THE PRODUCT AND ALSO MATCHED THE SIZE
            { $inc: { 'productSizeAndQty.$.qty': - data.qty } }, //INC IS THE INCREMENT OR DECREMENT OPERATOR WE CAN DO IT BY ASINGNING SINGNS + OR - ,
            //IT POSITIONED IN THE FIELD productSizeAndQty WITH $ INDICATE THE INDEXT OF MATCHED SIZE ,WITH IN THAT INDEX THE QTY KEY IS SELECTED AND ITS VALUE DECREMENTED BY USER CHOOSED QTY
            //${INC:{FILED NAME: VALUE}}               
            { new: true }
          );
          return product;
        })
      );
      console.log("products QTY DECREMENTED SUCCESFULLY", response);


      if (SAVE) {
        console.log("saved", SAVE);
        let orderId = SAVE._id
        resolve({ success: true, orderId, modeOfPayment, SAVE })
      }
    } catch (error) {
      console.error("ERROR FROM [orderPlacedHelpers]", error);
      reject(error)
    }
  })
}



let createOrderHelper = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let userDetails = await User.findOne({ _id: id })
      // console.log(userDetails);
      resolve(userDetails)
    } catch (error) {
      console.error("ERROR FROM [createOrderHelper]", error);
      reject(error)
    }
  })
}





let userAddressHelper = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { address } = await User.findOne({ _id: userId })
      resolve(address)
    } catch (error) {
      console.error("ERROR FROM [userAddressHelper]", error);
      reject(error)
    }
  })
}




let profileDetails =(id) => {
return new Promise(async(resolve,reject) => {
  try {
    let details=await User.findOne({_id:id})
  //  console.log(details);
    resolve(details)
  } catch (error) {
    console.error("ERROR FROM [profileDetails]", error);
    reject(error)
  }
})
}



let profileEditHelper= (userId,name,mail,number) => {
  return new Promise(async(resolve,reject) => {
    try {
      let user=await User.findOne({mail:mail}) //CHECK WHETER THE SAME MAIL EXIST OR NOT
      if(user._id !=userId ){ //MAKE SURE IT NOT CURRNT DOCUMET ,WE NEED TO SEARCH THAT MAIL EXCEPT THIS CURRNT
        console.log("Mail already exist");
        resolve({mailExist:true})
      }else{
        user.userName=name,
        user.mail=mail,
        user.phoneNumber=number
        await user.save()
        console.log("Updated Successfully",user);
        resolve({updated:true})
      }

    } catch (error) {
      console.error("ERROR FROM [profileEditHelper]", error);
      reject(error)
    }
  })
}



let passwordChangeHelper=(userId,oldPassword,NewPassword) => {
  return new Promise(async(resolve,reject ) => {
    try {
        let user= await User.findOne({_id:userId})
        let passwordMatch = await bcrypt.compare(oldPassword, user.password)
        if(!passwordMatch){
          console.log("Password Mismatch");
          resolve({passwordMismatch:true})
        }else{
          const hashedPassword = await bcrypt.hash(NewPassword, 10)
          user.password=hashedPassword
          await user.save()
          if(user){
            console.log("password changed successfully ",user);
            resolve({updated:true})
          }
        }

      
    } catch (error) {
      console.error("ERROR FROM [passwordChangeHelper]", error);
      reject(error)
    }

  })
}


module.exports = {
  cartNumber, signupHelper, loginHelper, googleHelper, passwordResetHelper, otpHelper, passwordVerifyHelper, NewPasswordPostHelper, homePageHelper
  , menPageHelper, menFilterHelper, womenHelper, womenFilterHelper, productDetailsHelper, searchHelper, searchFilterHelper,
  cartHelper, cartViewHelper, cartRemoveHelper, cartEditHelper, checkOutHelper, checkOutHelperDirectBuy, addNewAddressHelper, deleteAddressHelper, couponVerifyHelper,
  orderPlacedHelpers, createOrderHelper, userAddressHelper,editAddressHelper,profileDetails,profileEditHelper,passwordChangeHelper,
}