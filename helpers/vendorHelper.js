const bcrypt = require('bcrypt')
const cloudinary = require('../cloudinary')
const upload = require('../middleware/multer');
// const sharp = require('sharp');
const Vendor = require("../models/vendors");
const Category = require('../models/category')
const SubCategory = require('../models/subCategory')
const Product = require("../models/product");
const Brand = require("../models/brand");



//VENDOR SIGN UP SECTION
let signupHelper = (recievedVendorData) => {
    const { vendorName, ownerName, mail, password, phoneNumber } = recievedVendorData
    return new Promise(async (resolve, reject) => {
        try {
            // if (!ownerName || !mail || !phoneNumber|| !vendorName ||!password) {
            //     throw new Error('Required fields are missing');}

            let existingVendor = await Vendor.findOne({ mail: mail })
            if (!existingVendor) {
                let hashedPassword = await bcrypt.hash(password, 10)
                const vendor = new Vendor({
                    vendorName: vendorName,
                    ownerName: ownerName,
                    mail: mail,
                    password: hashedPassword,
                    phoneNumber: phoneNumber,
                })
             let dataResult=  await vendor.save();
                resolve({ success: true, dataResult })
            } else {
                resolve({ mailExist: true })
            }

        } catch (error) {
            reject(error)
        }
    })
}

//VENDOR LOGIN SECTION
let loginHelper = async (recievedVendorData) => {
    try {
        const { mail, password } = recievedVendorData
        let existingUser = await Vendor.findOne({ mail: mail })
        if (existingUser) {
            const passwordMatch = await bcrypt.compare(password, existingUser.password)
            if (!passwordMatch) {
                return { passwordMismatch: true }
            } else {
                return { verified: true, existingUser }
            }
        } else {
            return { invalidUsername: true }
        }

    } catch (error) {
        throw error;
    }
}


let passwordResetHelper = (mail) => {
    return new Promise(async (resolve, reject) => {
        try {
            let existingUser = await Vendor.findOne({ mail: mail })
            if (!existingUser) {
                console.log("User Not Found in mongoDb");
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
            let userDatabase = await Vendor.findOne({ _id: id })
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

            let database = await Vendor.findOne({ mail: mail })
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
            let database = await Vendor.findOne({ mail: mail })
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


let addProductsViewHelper = async () => {
    try {
        const [catResult, subCatResult,brandResult] = await Promise.all([Category.find(), SubCategory.find(),Brand.find()])//WILL RETURN ONLY BOTH PROMIS RESOLVED.EITHER OF THIS REJECT ALL WIL REJECT
         return {category:catResult,subCategory:subCatResult,brand:brandResult}
    } catch (error) {
      throw new Error("eror from addProductsViewHelper", error)
    }
}


let addProductsPostHelper = (body,imageArray,vendorId,sortedproductSizeAndQty) => {
    return new Promise (async(resolve,reject) =>{
        try {
           // console.log("helper");
            const {productCategory,productSubCategory,productBrand,productName,productColor,productPrice,productMRP,productDescription} = body;
            const productDiscount =Math.floor(((productMRP-productPrice)/productMRP*100))
            // console.log(body,imagePath,vendorId);
            let vendorDataBase = await Vendor.findOne({_id:vendorId})//FETCHING VENDOR NAME TO ADD IN PRODUCT DATA BASE
            // console.log(vendorDataBase.vendorName);
            //  const cloudinaryResult =await cloudinary.uploader.upload(imagePath,{folder:'products'});
            //  console.log("successfully stored product image in cloudinary with URL =",cloudinaryResult.secure_url);
            let cloudinaryResult = await Promise.all(imageArray.map((image) => cloudinary.uploader.upload(image.path,{
                width:600,
                height:600,
                folder:'products'
            }) ))
         //  console.log(vendorDataBase,cloudinaryResult);
           
            let data = new Product ({
                productCategory:productCategory,
                productSubCategory:productSubCategory,
                productBrand: productBrand,
                productName: productName,
                productColor: productColor,
                // productSizeAndQty:body.size.map((data,index) => ({
                // size:data,
                // qty:body.qty[index]
                // })),
                productSizeAndQty:sortedproductSizeAndQty,      
                productMRP:productMRP,
                productPrice:productPrice,
                productDiscount:productDiscount,

                productImages:cloudinaryResult.map((result,index) => ({
                    url:result.secure_url,
                    originalname:imageArray[index].originalname,//its bnot from the result,it comes as argument and fin from it with index
                })),
                imageId:cloudinaryResult.map((data) => ({
                    publicId:data.public_id
                })),
                productDescription:productDescription,
                vendorId:vendorId,
                vendorName:vendorDataBase.vendorName,
             })
             let dataResult =await data.save();
             console.log("successfully stored the product in data base",dataResult);
             resolve({success:true,dataResult})

        } catch (error) {
            console.error("error occured in addProductsPostHelper",error);
            reject(error)     
        }
    })
}


let ViewProductsHelper =async (vendorId) => {
    try {
        let dataResult=await Product.find({vendorId})
        // console.log(dataResult);
        if(dataResult){
            return {success:true,dataResult}
        }else{
            return {success:false}
        }
    
    } catch (error) {
        console.error('Error occurred in ViewProductsHelper section:', error);
        throw new Error("error occured in ViewProductsHelper section")
    }
}


let deleteProductsHelper =async (productId) => {
    try {
        let dataResult = await Product.findOneAndDelete({_id:productId}) //if it find and deleted the dataResult contain that document if not IT WILL BE NULL
        if(dataResult){
            console.log("product deleted successfully from database");
             cloudinaryResult = await Promise.all(dataResult.imageId.map(data => cloudinary.uploader.destroy(data.publicId)))
             const allDeletionsSuccessful = cloudinaryResult.every(response => response.result === 'ok');
             if(allDeletionsSuccessful){
                console.log("successfully deleted images from cloudinary",allDeletionsSuccessful);
             }else{
                console.log("cannot  delete images from cloudinary",allDeletionsSuccessful);
             }       
            return {success:true}
        }else{
            return {success:false}
        }
    } catch (error) {
        console.error('Error occurred in deleteProductsHelper section:', error);
        throw new Error("error occured in deleteProductsHelper section")
    }
}

//EDIT BUTTON RENDERING OLD PRODUCT DETAILS SECTION
let editProductsViewHelper = (id) => {
    return new Promise(async(resolve,reject) => {
      try {
        let[dataResult,category,subCategory,brand]  = await Promise.all([Product.findOne({_id:id}),Category.find(),SubCategory.find(),Brand.find()]) 
        if(dataResult && category && subCategory && brand){
            console.log('Modification needeed database found');
            resolve({success:true,dataResult,category,subCategory,brand})
        }else{
            reject("[editProductsViewHelper] section COULDNT FIND THE DATABASE")
        }
      } catch (error) {
        console.error('Error occurred in editProductsViewHelper section:', error);
        reject(error)
    }
    })
}



//EDIT PRODUCT UPATING NEW VALUES
let editProductsHelper =(productId,body,arrayImages,productSizeAndQty) => {
    return new Promise( async (resolve,reject) => { 
         try {
            const {productCategory,productSubCategory,productBrand,productName,productColor,productPrice,productMRP,productDescription} =body;
            const productDiscount =Math.floor(((productMRP-productPrice)/productMRP*100))

            if (arrayImages.length == 0) { //IF USER  EDIT WITH OUT UPDATING IMAGE.ONLY TEXT  FIELDS 
               console.log("no image");
               let updatedFields = {productCategory,productSubCategory,productBrand,productName,productColor,productPrice,productMRP,productDiscount,productSizeAndQty,productDescription};
              let dataResult = await Product.updateOne({_id:productId},{$set:updatedFields});
              if(dataResult.matchedCount === 1 && dataResult.modifiedCount === 1){
                console.log("updated database successfully without Images",dataResult);
                resolve({success:true})
              }else{
                console.log("nothing to update");
               resolve({notUpdate:true})
            }
            }else{ //IF IMAGE ALSO WANT TO MODIFY
                // console.log(arrayImages);
                const transformation = { width: 800, height: 800, crop: 'fill' };
                let cloudinaryResult = await Promise.all(arrayImages.map((image) => cloudinary.uploader.upload(image.path,{folder:'products',transformation: transformation }) ));
                let  productImages = cloudinaryResult.map((result,index) => ({
                    url:result.secure_url,
                    originalname:arrayImages[index].originalname,//its not from the result,it comes as argument and fin from it with index
               }));
               let updatedFields ={productCategory,productSubCategory,productBrand,productName,productColor,productPrice,productImages,productMRP,productDiscount,productSizeAndQty,productDescription};
               let dataResult = await Product.updateOne({_id:productId},{$set:updatedFields})
               if(dataResult.matchedCount ===1 && dataResult.modifiedCount ===1){
                console.log("updated database with new images successfully",dataResult);
                resolve({success:true})
              }else{
                resolve({notUpdate:true})
              }
            }

         } catch (error) {
            console.error('Error occurred in editProductsHelper section:', error);
            return reject(error)
         }
    } )
}


let productEyeViewHelper= (id) => {
    return new Promise(async(resolve,reject) => {
        try {
            let dataResult=await Product.findOne({_id:id})
         //   console.log(dataResult);
           if(dataResult){
              resolve(dataResult)
           }else{
               return {success:false}
           }
            
        } catch (error) {
            reject(error)
            console.error('Error occurred in Vendor productEyeViewHelper section:', error);
        }
    })
   
}



module.exports = { signupHelper, loginHelper, passwordResetHelper, otpHelper, passwordVerifyHelper, NewPasswordPostHelper, addProductsViewHelper,
    addProductsPostHelper,ViewProductsHelper,deleteProductsHelper,editProductsViewHelper,editProductsHelper,productEyeViewHelper }

