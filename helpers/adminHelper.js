const Admin=require('../models/admin')
const Category=require('../models/category')
const SubCategory=require('../models/subCategory')
const Product = require("../models/product");
const Brand = require("../models/brand");


const bcrypt=require('bcrypt')
const cloudinary = require('../cloudinary')
const upload =require('../middleware/multer')




//ADMIN LOGIN SECTION
const loginHelper =async (recievedAdminData)=> {
        try{
            const {userName,password} = recievedAdminData
            const existingAdmin = await Admin.findOne({userName:userName})
            if(existingAdmin){
                const passwordMatch = await bcrypt.compare(password,existingAdmin.password)
                if(passwordMatch){
                    return {verified:true,existingAdmin}
                }else{
                    return {invalidPassword:true}
                }
            }else{
                return {invalidAdminDetails:true}
            }

        }catch(error){
            throw error;
        }
}




let passwordResetHelper = (mail) =>{
    return new Promise (async (resolve,reject) => {
  try{
      let existingUser = await Admin.findOne({mail:mail})
      if(!existingUser){
          resolve({invalidEmail:true})
      }

      resolve({id:existingUser._id,mail:existingUser.mail})
     
  }catch(error){
      reject(error)
  }
    })
  }
  
  
  let otpHelper = (id,otp)=> {
  return new Promise(async (resolve,reject) => {
      try {
        let userDatabase = await Admin.findOne({_id:id})
        userDatabase.otp=otp;
        
      let saveResponse = await userDatabase.save()
      resolve(saveResponse)
  
      } catch (error) {
          console.error("OTP HELPER ERROR DUE TO",error);
          reject(error)
      }
  })
  }
  
  
  let passwordVerifyHelper = (mail,otp)=> {
      return new Promise(async (resolve,reject) => {
  try {
      
      let database = await Admin.findOne({mail:mail})
      if(database){
          if(database.otp == otp){
              resolve({passwordVerified:true,id:database._id})
          }else{
              resolve({passwordNotVerified:true})
          }
      }else{
          throw new Error('cant get the user from database')
      }
      
  } catch (error) {
      reject(error)
  }
      })
  
  }
  


  let NewPasswordPostHelper = (mail,password) => {
            return new Promise(async (resolve,reject) => {
              try {
                  let database = await Admin.findOne({mail:mail})
                  if(!database){
                      throw new Error('cant get the user from database')
                  }else{
                      let hashedPassword = await bcrypt.hash(password,10)
                      database.password=hashedPassword
                      let saveResponse=await database.save()
                      if(saveResponse){
                          resolve({success:true,saveResponse})
                      }
                     else{
                      reject("Cant updated the new password to database")
                     }
                  }
             
              } catch (error) {
                  reject(error)
              }
          })
      }




let categoryAddPost = (categoryName,imagePath) => {
    return new Promise( async(resolve,reject) => {
        try {
            const cloudinaryResult =await cloudinary.uploader.upload(imagePath,{folder:'categories'});
            console.log("succesfully saved in cloudinary");   
            // console.log(cloudinaryResult);

            let data= new Category({
                categoryName:categoryName,
                categoryImage:cloudinaryResult.secure_url
            });
           await data.save();
           console.log("category added in database");
        //    console.log(data);
            resolve({success:true,data})
        } catch (error) {
            console.error("error during categoryAddPost HELPER Section",error);
            reject(error);
            
        }
    })
}

//CATOGERY LIST RENDERNING PAGE GIVS ENTIRE COLLECTIONS
let ViewCategoryHelper = () => {
    return new Promise(async(resolve,reject) => {
        try {
            let result = await Category.find()
            resolve(result)
        } catch (error) {
            reject(error)
        }
    })
}


let deleteCategoryHelper =(categoryId) => {
    return new Promise(async(resolve,reject) => {
        try {
            let dataResul = await Category.findByIdAndDelete({_id:categoryId})
            if(dataResul){
                console.log("successfully deleled this data ",dataResul);
                resolve({success:true})
            }else{
                resolve({success:false})
            }
        } catch (error) {
            console.error(error);
            reject("ERROR FROM [deleteCategoryHelper]",error)
        }
    })
}


let editCategoryHelper = (id,categoryNameEdit,image) => {
    return new Promise(async (resolve,reject) => {
        try {
            if(!image){
                const data={categoryName:categoryNameEdit}
                let dataResult = await Category.updateOne({_id:id},{$set:data});
                if(dataResult.matchedCount ===1 && dataResult.modifiedCount ===1){
                    console.log("updated Category Name successfully without Image",dataResult);
                    resolve({success:true})
                }else{
                    resolve({nothingToUpdate:true})
                }
            }else{
        
                const cloudinaryResult =await cloudinary.uploader.upload(image.path,{folder:'categories'});
                console.log("succesfully saved in cloudinary");
                const data ={categoryName:categoryNameEdit,categoryImage:cloudinaryResult.secure_url}
                let dataResult = await Category.updateOne({_id:id},{$set:data});
                if(dataResult.matchedCount ===1 && dataResult.modifiedCount ===1){
                    console.log("updated Category Name successfully with Image",dataResult);
                    resolve({success:true})
                }else{
                    throw new Error("error in with  image helper block while updating database")
                }
            }
        } catch (error) {
            console.error("FROM [editCategoryHelper]",error);
            reject(error)  
        }
    })
}




let editSubCategoryHelper =(id,subCategoryNameEdit,image) => {
    return new Promise(async (resolve,reject) => {
        try {
            if(!image){
                const data={subCategoryName:subCategoryNameEdit}
                let dataResult = await SubCategory.updateOne({_id:id},{$set:data});
                if(dataResult.matchedCount ===1 && dataResult.modifiedCount ===1){
                    console.log("updated SubCategory Name successfully without Image",dataResult);
                    resolve({success:true})
                }else{
                    resolve({nothingToUpdate:true})
                }
            }else{
        
                const cloudinaryResult =await cloudinary.uploader.upload(image.path,{folder:'Sub categories'});
                console.log("succesfully saved in cloudinary");
                const data ={subCategoryName:subCategoryNameEdit,subCategoryImage:cloudinaryResult.secure_url}
                let dataResult = await SubCategory.updateOne({_id:id},{$set:data});
                if(dataResult.matchedCount ===1 && dataResult.modifiedCount ===1){
                    console.log("updated SubCategory Name successfully with Image",dataResult);
                    resolve({success:true})
                }else{
                    throw new Error("error in with  image helper block while updating database")
                }
            }
        } catch (error) {
            console.error("FROM [editSubCategoryHelper]",error);
            reject(error)  
        }
    })
}





let editBrandHelper =(id,brandNameEdit,image) => {
    return new Promise(async (resolve,reject) => {
        try {
            if(!image){
                const data={brandName:brandNameEdit}
                let dataResult = await Brand.updateOne({_id:id},{$set:data});
                if(dataResult.matchedCount ===1 && dataResult.modifiedCount ===1){
                    console.log("updated Brand Name successfully without Image",dataResult);
                    resolve({success:true})
                }else{
                    resolve({nothingToUpdate:true})
                }
            }else{
        
                const cloudinaryResult =await cloudinary.uploader.upload(image.path,{folder:'Brand'});
                console.log("succesfully saved in cloudinary");
                const data ={brandName:brandNameEdit,brandImage:cloudinaryResult.secure_url}
                let dataResult = await Brand.updateOne({_id:id},{$set:data});
                if(dataResult.matchedCount ===1 && dataResult.modifiedCount ===1){
                    console.log("updated Brand Name successfully with Image",dataResult);
                    resolve({success:true})
                }else{
                    throw new Error("error in  editbrandHelpe rwith image block while updating database")
                }
            }
        } catch (error) {
            console.error("FROM [editBrandHelper]",error);
            reject(error)  
        }
    })
}











let SubCategoryAddPost = (subCategoryName,imagePath) => {
    return new Promise( async(resolve,reject) => {
        try {
            const cloudinaryResult =await cloudinary.uploader.upload(imagePath,{folder:'Sub categories'});
            console.log("subcategories succesfully saved in cloudinary");   
            // console.log(cloudinaryResult);
            let data= new SubCategory({
                subCategoryName:subCategoryName,
                subCategoryImage:cloudinaryResult.secure_url
            });
           await data.save();
           console.log("Subcategory added in database");
        //    console.log(data);
            resolve({success:true,data})
        } catch (error) {
            console.error("error during SubcategoryAddPost HELPER Section",error);
            reject(error);
            
        }
    })
}


let addBrandHelper =(brandName,imagePath) => {
    return new Promise(async(resolve,reject) => {
        try {
            const cloudinaryResult =await cloudinary.uploader.upload(imagePath,{folder:'Brand'});
            console.log("brand succesfully saved in cloudinary");   
            // console.log(cloudinaryResult);
            let data= new Brand({
                brandName:brandName,
                brandImage:cloudinaryResult.secure_url
            });
           await data.save();
           console.log("brand added in database");
        //    console.log(data);
            resolve({success:true,data})
            
        } catch (error) {
            console.error("error during addBrandHelper Section",error);
            reject(error);
        }
    })
}





//SUB CATOGERY LIST RENDERNING PAGE GIVS ENTIRE COLLECTIONS
let ViewSubCategoryHelper=() => {
return new Promise(async(resolve,reject) => {
    try {
        let result = await SubCategory.find()
        resolve(result)
    } catch (error) {
        reject(error)
    }
})
}


let deleteSubCategoryHelper =(subCategoryId) => {
    return new Promise(async(resolve,reject) => {
        try {
            let dataResul = await SubCategory.findByIdAndDelete({_id:subCategoryId})
            if(dataResul){
                console.log("successfully  deleted this subcategory ",dataResul);
                resolve({success:true})
            }else{
                resolve({success:false})
            }
        } catch (error) {
            console.error(error);
            reject("ERROR FROM [deleteSubCategoryHelper]",error)
        }
    })
}



let deleteBrandHelper = (brandId) => {
    return new Promise(async(resolve,reject) => {
        try {
            console.log(brandId);
            let dataResul = await Brand.findByIdAndDelete({_id:brandId})
            if(dataResul){
                console.log("successfully  deleted this Brand ",dataResul);
                resolve({success:true})
            }else{
                resolve({success:false})
            }
        } catch (error) {
            console.error(error);
            reject("ERROR FROM [deleteBrandHelper]",error)
        }
    })
}





let ViewBrandHelper =() => {
    return new Promise(async(resolve,reject) => {
        try {
            let result = await Brand.find()
            resolve(result)
        } catch (error) {
            reject(error)
        }
    })
    }









let ViewProductHelper =async () => {
    try {
        let dataResult=await Product.find()
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



module.exports={loginHelper,passwordResetHelper,otpHelper,passwordVerifyHelper,NewPasswordPostHelper,
    categoryAddPost,addBrandHelper,ViewCategoryHelper,SubCategoryAddPost,ViewSubCategoryHelper,ViewBrandHelper,ViewProductHelper,deleteCategoryHelper
    ,deleteSubCategoryHelper,deleteBrandHelper,editCategoryHelper,editSubCategoryHelper,editBrandHelper}