const Admin = require('../models/admin')
const Category = require('../models/category')
const SubCategory = require('../models/subCategory')
const Product = require("../models/product");
const Brand = require("../models/brand");
const Banner = require("../models/banner");
const Users = require("../models/users")
const Vendors = require("../models/vendors")
const Coupon = require("../models/coupon")
const bcrypt = require('bcrypt')
const cloudinary = require('../cloudinary')
const upload = require('../middleware/multer');
const vendor = require('../models/vendors');
const Order = require('../models/order');
const util = require('util');
const moment = require('moment');

// const { resolve } = require('path');




//ADMIN LOGIN SECTION
const loginHelper = async (recievedAdminData) => {
    try {
        const { userName, password } = recievedAdminData
        const existingAdmin = await Admin.findOne({ userName: userName })
        if (existingAdmin) {
            const passwordMatch = await bcrypt.compare(password, existingAdmin.password)
            if (passwordMatch) {
                return { verified: true, existingAdmin }
            } else {
                return { invalidPassword: true }
            }
        } else {
            return { invalidAdminDetails: true }
        }

    } catch (error) {
        throw error;
    }
}




let passwordResetHelper = (mail) => {
    return new Promise(async (resolve, reject) => {
        try {
            let existingUser = await Admin.findOne({ mail: mail })
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
            let userDatabase = await Admin.findOne({ _id: id })
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

            let database = await Admin.findOne({ mail: mail })
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
            let database = await Admin.findOne({ mail: mail })
            if (!database) {
                throw new Error('cant get the user from database')
            } else {
                let hashedPassword = await bcrypt.hash(password, 10)
                database.password = hashedPassword
                let saveResponse = await database.save()
                if (saveResponse) {
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



let dashboardGetPageHelper = () => {
    return new Promise(async (resolve, reject) => {
        try {

            const [users, vendors, orders] = await Promise.all([
                Users.find(),
                Vendors.find(),
                Order.find(),
            ])//WILL RETURN ONLY every PROMIS RESOLVED.EITHER OF THIS REJECT ALL WIL REJECT
            let totalUsers = users.length
            let totalVendors = vendors.length
            let totalOrders = orders.length
            let totalRevenue = orders.reduce((acc, data) => acc + data.total, 0)


            const selectedSevenDays = [];
            for (let i = 6; i >= 0; i--) { //
                selectedSevenDays.push(moment().subtract(i, 'days').format('YYYY-MM-DD')); //IT WILL STORE THE DATE ARRAY START FROM THE LAST 6 DAY FROM CURRENT DAY        
                //6th date will be subs from current date,'days' indicate the value denotes days     
            }
         //   console.log(selectedSevenDays);


            // Fetch the sales data for the last 7 days
            const sales = await Order.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, //GROU NY DATES SO DIFFERENT GROUPS ARE THERE BY EACH
                        totalAmount: { $sum: "$total" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                },
                {
                    $limit: 7
                }
            ]);
            // Merge the aggregation result with the date range, filling in missing dates with zero values
            const dailySales = selectedSevenDays.map(date => {
                const existingData = sales.find(sale => sale._id === date);
                return {
                    date: date,
                    dayName: moment(date).format('dddd'),
                    totalAmount: existingData ? existingData.totalAmount : 0,
                    count: existingData ? existingData.count : 0
                };
            });

        //    console.log(dailySales);


            const selectedTwelveMonths = [];
            for (let j = 11; j >= 0; j--) {
                selectedTwelveMonths.push(moment().subtract(j, 'months').startOf('month').format('YYYY-MM')); // Start of each month
                //SUBSTRACT FROM CURRENT .11 MONTHS FROM THE STARTING OF CURRENT ,THIS MONTH DATE 1 - 11 MONTH .....CRNT MONTH DATE 1 - 0=CURRNT MONTH
            }
          //  console.log(selectedTwelveMonths);//GET Past 12 MNTHS INCLUDING THIS MONTH 

            // Fetch the sales data for the past 12 months
            const salesMonth = await Order.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, // GOUPED BY MONTHS SO 12 GROUPS WILL BE GET 
                        totalAmount: { $sum: "$total" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        "_id": { $in: selectedTwelveMonths } // Filter to include only the past 12 months
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);

            // Merge the aggregation result with the month range, filling in missing months with zero values
            const monthlySales = selectedTwelveMonths.map(month => {
                const existingData = salesMonth.find(sale => sale._id === month);
                return {
                    month: month,
                    monthName: moment(month, 'YYYY-MM').format('MMMM'),
                    totalAmount: existingData ? existingData.totalAmount : 0,
                    count: existingData ? existingData.count : 0
                };
            });

         //   console.log(monthlySales);


            const currentMonth = moment().startOf('month'); //STARTING OF THE MONTH = 1 FEBRUARY
            const selectedWeeks = [];
            let startDate = currentMonth.clone(); //CREATES THE SAME TO STARTAE CLONE USED BCZ IT PRODUCW A COPY NOT BY REFFERENCE ,OTHER WISE IT MUTABLE,WHILE WE MAKE CHANGE IN
            //MODIFICATIONS OF START DATE WONT EFFECT THE CURRNTMONTH BY CREATING CLONE,OTHERWISE IT EFFECT
            console.log(startDate);

            // Define the date ranges for each week in the current month
            for (let i = 0; i < 5; i++) {
                let endDate = startDate.clone().add(6, 'days'); // End date is start date + 6 days
                if (i === 4) {
                    // For the last week, adjust the end date to the last day of the month
                    endDate = currentMonth.clone().endOf('month');
                }
                selectedWeeks.push({ start: startDate.format('YYYY-MM-DD'), end: endDate.format('YYYY-MM-DD') });
                startDate.add(7, 'days'); // Move to the next week
            }

            console.log(selectedWeeks);





            resolve({ totalUsers, totalVendors, totalOrders, totalRevenue, dailySales })
        } catch (error) {
            console.error("error during dashboardGetPageHelper Section", error);
            reject(error)
        }
    })
}





//CATEGORY VIEW
let ViewCategoryHelper = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await Category.find()
            resolve(result)
        } catch (error) {
            console.error("error during ViewCategoryHelper  Section", error);
            reject(error)
        }
    })
}


//CATEGORY ADDING SECTION
let categoryAddPost = (categoryName, imagePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            const cloudinaryResult = await cloudinary.uploader.upload(imagePath, { folder: 'categories' });
            console.log("succesfully saved in cloudinary", cloudinaryResult);
            // console.log(cloudinaryResult);
            let data = new Category({
                categoryName: categoryName,
                categoryImage: cloudinaryResult.secure_url,
                imageId: cloudinaryResult.public_id
            });
            await data.save();
            console.log("category added in database");
            //    console.log(data);
            resolve({ success: true, data })
        } catch (error) {
            console.error("error during categoryAddPost HELPER Section", error);
            reject(error);

        }
    })
}





//CATEGORY EDIT SECTION
let editCategoryHelper = (id, categoryNameEdit, image) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!image) {
                const data = { categoryName: categoryNameEdit }
                let dataResult = await Category.updateOne({ _id: id }, { $set: data });
                if (dataResult.matchedCount === 1 && dataResult.modifiedCount === 1) {
                    console.log("updated Category Name successfully without Image", dataResult);
                    resolve({ success: true })
                } else {
                    console.log("Nothing to update", dataResult);
                    resolve({ nothingToUpdate: true })
                }
            } else {
                const cloudinaryResult = await cloudinary.uploader.upload(image.path, { folder: 'categories' });
                console.log("succesfully saved in cloudinary");
                let oldImageId = await Category.findById({ _id: id });
                const cloudinaryDelete = await cloudinary.uploader.destroy(oldImageId.imageId);
                if (cloudinaryDelete.result == 'ok') {
                    console.log('Successfully deleted old image from Cloudinary:', cloudinaryDelete);
                } else {
                    console.log('cannot  delete old image from Cloudinary:', cloudinaryDelete);
                }
                const data = { categoryName: categoryNameEdit, categoryImage: cloudinaryResult.secure_url, imageId: cloudinaryResult.public_id }
                let dataResult = await Category.updateOne({ _id: id }, { $set: data });
                if (dataResult.matchedCount === 1 && dataResult.modifiedCount === 1) {
                    console.log("updated Category Name successfully with Image", dataResult);
                    resolve({ success: true })
                } else {
                    throw new Error("error in with  image helper block while updating database")
                }
            }
        } catch (error) {
            console.error("FROM [editCategoryHelper]", error);
            reject(error)
        }
    })
}




//CATEGORY DELETE SECTION
let deleteCategoryHelper = (categoryId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let dataResul = await Category.findByIdAndDelete({ _id: categoryId })
            if (dataResul) {
                console.log("successfully deleted this data ", dataResul);
                resolve({ success: true })
                imageId = dataResul.imageId //retrive the imageid from mongo db to delete it from cloudinary
                // console.log("URL",imageId);
                const cloudinaryResultresult = await cloudinary.uploader.destroy(imageId);
                if (cloudinaryResultresult.result == 'ok') {
                    console.log('Successfully deleted image from Cloudinary:', cloudinaryResultresult);
                } else {
                    console.log('cannot  delete image from Cloudinary:', cloudinaryResultresult);
                }

            } else {
                resolve({ success: false })
            }
        } catch (error) {
            console.error(error);
            reject("ERROR FROM [deleteCategoryHelper]", error)
        }
    })
}




//VIEW SUBCATEGORY
let ViewSubCategoryHelper = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await SubCategory.find()
            resolve(result)
        } catch (error) {
            reject(error)
        }
    })
}



//ADD SUBCATEGORY
let SubCategoryAddPost = (subCategoryName, imagePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            const cloudinaryResult = await cloudinary.uploader.upload(imagePath, { folder: 'Sub categories' });
            console.log("subcategories succesfully saved in cloudinary");
            // console.log(cloudinaryResult);
            let data = new SubCategory({
                subCategoryName: subCategoryName,
                subCategoryImage: cloudinaryResult.secure_url,
                imageId: cloudinaryResult.public_id
            });
            await data.save();
            console.log("Subcategory added in database");
            //    console.log(data);
            resolve({ success: true, data })
        } catch (error) {
            console.error("error during SubcategoryAddPost HELPER Section", error);
            reject(error);

        }
    })
}




//EDIT SUBCATEGORY
let editSubCategoryHelper = (id, subCategoryNameEdit, image) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!image) {
                const data = { subCategoryName: subCategoryNameEdit }
                let dataResult = await SubCategory.updateOne({ _id: id }, { $set: data });
                if (dataResult.matchedCount === 1 && dataResult.modifiedCount === 1) {
                    console.log("updated SubCategory Name successfully without Image", dataResult);
                    resolve({ success: true })
                } else {
                    resolve({ nothingToUpdate: true })
                }
            } else {
                const cloudinaryResult = await cloudinary.uploader.upload(image.path, { folder: 'Sub categories' });
                console.log("succesfully saved in cloudinary");
                let oldImageId = await SubCategory.findById({ _id: id });
                const cloudinaryDelete = await cloudinary.uploader.destroy(oldImageId.imageId);
                if (cloudinaryDelete.result == 'ok') {
                    console.log('Successfully deleted old image from Cloudinary:', cloudinaryDelete);
                } else {
                    console.log('cannot  delete old image from Cloudinary:', cloudinaryDelete);
                }
                const data = { subCategoryName: subCategoryNameEdit, subCategoryImage: cloudinaryResult.secure_url, imageId: cloudinaryResult.public_id }
                let dataResult = await SubCategory.updateOne({ _id: id }, { $set: data });
                if (dataResult.matchedCount === 1 && dataResult.modifiedCount === 1) {
                    console.log("updated SubCategory Name successfully with Image", dataResult);
                    resolve({ success: true })
                } else {
                    throw new Error("error in with  image helper block while updating database")
                }
            }
        } catch (error) {
            console.error("FROM [editSubCategoryHelper]", error);
            reject(error)
        }
    })
}





//DELELTE SUBCATERGORY
let deleteSubCategoryHelper = (subCategoryId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let dataResul = await SubCategory.findByIdAndDelete({ _id: subCategoryId })
            if (dataResul) {
                console.log("successfully  deleted this subcategory ", dataResul);
                resolve({ success: true })
                imageId = dataResul.imageId //retrive the imageid from mongo db to delete it from cloudinary
                // console.log("URL",imageId);
                const cloudinaryResultresult = await cloudinary.uploader.destroy(imageId);
                if (cloudinaryResultresult.result == 'ok') {
                    console.log('Successfully deleted image from Cloudinary:', cloudinaryResultresult);
                } else {
                    console.log('cannot  delete image from Cloudinary:', cloudinaryResultresult);
                }
            } else {
                resolve({ success: false })
            }
        } catch (error) {
            console.error(error);
            reject("ERROR FROM [deleteSubCategoryHelper]", error)
        }
    })
}









//VIEW BRAND SECTION
let ViewBrandHelper = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await Brand.find()
            resolve(result)
        } catch (error) {
            reject(error)
        }
    })
}



let ViewBannerHelper = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await Banner.find()
            resolve(result)
        } catch (error) {
            reject(error)
        }
    })
}


let ViewCouponHelper = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await Coupon.find()
            resolve(result)
        } catch (error) {
            reject(error)
        }
    })
}


let addCouponHelper = (name, value, expDate) => {
    return new Promise(async (resolve, reject) => {
        try {

            let data = new Coupon({
                name: name,
                value: value,
                status: 'ENABLED',
                expDate: expDate
            });
            await data.save();
            console.log("coupon added in database", data);
            //    console.log(data);
            resolve({ success: true, data })

        } catch (error) {
            console.error("error during [addCouponHelper] Section", error);
            reject(error);
        }
    })
}



let editCouponHelper = (id, name, value, expDate) => {
    return new Promise(async (resolve, reject) => {
        try {
            let dataResult = await Coupon.updateOne({ _id: id }, { $set: { name: name, value: value, expDate: expDate } })
            if (dataResult.acknowledged) {
                console.log("coupon edited in database successfully", dataResult);
                resolve(dataResult)
            }
        } catch (error) {
            console.error("error during [editCouponHelper] Section", error);
            reject(error);
        }
    })
}





let deleteCouponHelper = (couponId) => {
    return new Promise(async (resolve, reject) => {
        try {

            let dataResul = await Coupon.findByIdAndDelete({ _id: couponId })
            if (dataResul) {
                console.log("successfully  deleted this Coupon ");
                resolve({ success: true })
            }
        } catch (error) {
            console.error(error);
            reject("ERROR FROM [deleteBannerHelper]", error)
        }
    })
}




let couponStatusHelper = (id, status) => {
    return new Promise(async (resolve, reject) => {
        try {
            let response = await Coupon.findOneAndUpdate({ _id: id }, { $set: { status: status } }, { new: true })

            if (response) {
                console.log("Successfully changed status", response);
                resolve({ status: response.status })
            }
        } catch (error) {
            console.error(error);
            reject("ERROR FROM [couponStatusHelper]", error)
        }
    })
}





//ADD BRAND SECTION
let addBrandHelper = (brandName, imagePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            const cloudinaryResult = await cloudinary.uploader.upload(imagePath, {
                // width:600,
                // height:600,
                folder: 'Brand'
            });
            console.log("brand succesfully saved in cloudinary");
            // console.log(cloudinaryResult);
            let data = new Brand({
                brandName: brandName,
                brandImage: cloudinaryResult.secure_url,
                imageId: cloudinaryResult.public_id
            });
            await data.save();
            console.log("brand added in database");
            //    console.log(data);
            resolve({ success: true, data })

        } catch (error) {
            console.error("error during [addBrandHelper] Section", error);
            reject(error);
        }
    })
}


let addBannerHelper = (bannerName, imagePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(bannerName, imagePath);
            //  let cloudinaryResult = await Promise.all(imageArray.map((image) => cloudinary.uploader.upload(image.path,{folder:'Banner'}) ))
            const cloudinaryResult = await cloudinary.uploader.upload(imagePath, { folder: 'Banner' });
            console.log("banner succesfully saved in cloudinary");
            // console.log(cloudinaryResult);
            let data = new Banner({
                bannerName: bannerName,
                bannerImage: cloudinaryResult.secure_url,
                imageId: cloudinaryResult.public_id
                // bannerImage:cloudinaryResult.secure_url,
                // bannerImage:cloudinaryResult.map((result,index) => ({
                //     url:result.secure_url,
                //     originalName:imageArray[index].originalName
                // })),
                // imageId:cloudinaryResult.map((result) => ({
                //     publicId:result.public_id
                // }))
            });
            await data.save();
            console.log("banner added in database");
            //    console.log(data);
            resolve({ success: true, data })

        } catch (error) {
            console.error("error during addBannerHelper Section", error);
            reject(error);
        }
    })
}



//EDIT BRAND
let editBrandHelper = (id, brandNameEdit, image) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!image) {
                const data = { brandName: brandNameEdit }
                let dataResult = await Brand.updateOne({ _id: id }, { $set: data });
                if (dataResult.matchedCount === 1 && dataResult.modifiedCount === 1) {
                    console.log("updated Brand Name successfully without Image", dataResult);
                    resolve({ success: true })
                } else {
                    resolve({ nothingToUpdate: true })
                }
            } else {

                const cloudinaryResult = await cloudinary.uploader.upload(image.path, { folder: 'Brand' });
                console.log("succesfully saved in cloudinary");
                let oldImageId = await Brand.findById({ _id: id });
                const cloudinaryDelete = await cloudinary.uploader.destroy(oldImageId.imageId);
                if (cloudinaryDelete.result == 'ok') {
                    console.log('Successfully deleted old image from Cloudinary:', cloudinaryDelete);
                } else {
                    console.log('cannot  delete old image from Cloudinary:', cloudinaryDelete);
                }

                const data = { brandName: brandNameEdit, brandImage: cloudinaryResult.secure_url, imageId: cloudinaryResult.public_id }
                let dataResult = await Brand.updateOne({ _id: id }, { $set: data });
                if (dataResult.matchedCount === 1 && dataResult.modifiedCount === 1) {
                    console.log("updated Brand Name successfully with Image", dataResult);
                    resolve({ success: true })
                } else {
                    throw new Error("error in  editbrandHelpe rwith image block while updating database")
                }
            }
        } catch (error) {
            console.error("FROM [editBrandHelper]", error);
            reject(error)
        }
    })
}


let editBannerHelper = (id, bannerNameEdit, image) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!image) {
                const data = { bannerName: bannerNameEdit }
                let dataResult = await Banner.updateOne({ _id: id }, { $set: data });
                if (dataResult.matchedCount === 1 && dataResult.modifiedCount === 1) {
                    console.log("updated Banner Name successfully without Image", dataResult);
                    resolve({ success: true })
                } else {
                    resolve({ nothingToUpdate: true })
                }
            } else {

                const cloudinaryResult = await cloudinary.uploader.upload(image.path, { folder: 'Banner' });
                console.log("succesfully saved in cloudinary");
                let oldImageId = await Banner.findById({ _id: id });
                const cloudinaryDelete = await cloudinary.uploader.destroy(oldImageId.imageId);
                if (cloudinaryDelete.result == 'ok') {
                    console.log('Successfully deleted old image from Cloudinary:', cloudinaryDelete);
                } else {
                    console.log('cannot  delete old image from Cloudinary:', cloudinaryDelete);
                }
                const data = { bannerName: bannerNameEdit, bannerImage: cloudinaryResult.secure_url, imageId: cloudinaryResult.public_id }
                let dataResult = await Banner.updateOne({ _id: id }, { $set: data });
                if (dataResult.matchedCount === 1 && dataResult.modifiedCount === 1) {
                    console.log("updated Brand Name successfully with Image", dataResult);
                    resolve({ success: true })
                } else {
                    throw new Error("error in  editBannerHelper with image block while updating database")
                }
            }
        } catch (error) {
            console.error("FROM [editBannerHelper]", error);
            reject(error)
        }
    })
}




//DELETE BRAND
let deleteBrandHelper = (brandId) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(brandId);
            let dataResul = await Brand.findByIdAndDelete({ _id: brandId })
            if (dataResul) {
                console.log("successfully  deleted this Brand ", dataResul);
                resolve({ success: true })
                imageId = dataResul.imageId //retrive the imageid from mongo db to delete it from cloudinary
                // console.log("URL",imageId);
                const cloudinaryResult = await cloudinary.uploader.destroy(imageId);
                if (cloudinaryResult.result == 'ok') {
                    console.log('Successfully deleted image from Cloudinary:', cloudinaryResult);
                } else {
                    console.log('cannot  delete image from Cloudinary:', cloudinaryResult);
                }
            } else {
                resolve({ success: false })
            }
        } catch (error) {
            console.error(error);
            reject("ERROR FROM [deleteBrandHelper]", error)
        }
    })
}






let deleteBannerHelper = (bannerId) => {
    return new Promise(async (resolve, reject) => {
        try {
            //  console.log(bannerId);
            let dataResul = await Banner.findByIdAndDelete({ _id: bannerId })
            if (dataResul) {
                console.log("successfully  deleted this Banner ", dataResul);
                resolve({ success: true })
                imageId = dataResul.imageId //retrive the imageid from mongo db to delete it from cloudinary
                // console.log("URL",imageId);
                // const cloudinaryResult=await Promise.all(dataResul.imageId.map(data =>cloudinary.uploader.destroy( data.publicId)));
                // const allDeletionsSuccessful = cloudinaryResult.every(response => response.result === 'ok');
                const cloudinaryResult = await cloudinary.uploader.destroy(imageId);
                if (cloudinaryResult.result == 'ok') {
                    console.log('Successfully deleted image from Cloudinary:', cloudinaryResult);
                } else {
                    console.log('cannot  delete image from Cloudinary:', cloudinaryResult);
                }
            } else {
                resolve({ success: false })
            }
        } catch (error) {
            console.error(error);
            reject("ERROR FROM [deleteBannerHelper]", error)
        }
    })
}



let ViewProductHelper = async () => {
    try {
        // let dataResult=await Product.find()
        let dataResult = await Product.aggregate([
            {
                $sort: { createdAt: -1 }
            }
        ])

        // console.log(dataResult);
        if (dataResult) {
            return { success: true, dataResult }
        } else {
            return { success: false }
        }

    } catch (error) {
        console.error('Error occurred in ViewProductsHelper section:', error);
        throw new Error("error occured in ViewProductsHelper section")
    }

}


let productEyeViewHelper = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            let dataResult = await Product.findOne({ _id: id })
            //   console.log(dataResult);
            if (dataResult) {
                resolve(dataResult)
            } else {
                return { success: false }
            }

        } catch (error) {
            reject(error)
            console.error('Error occurred in productEyeViewHelper section:', error);
        }
    })

}




let userListHelper = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = await Users.aggregate([
                { $sort: { createdAt: -1 } }
            ])
            resolve(users)

        } catch (error) {
            console.error(error);
            reject("ERROR FROM [userListHelper]", error)

        }
    })
}



let vendorListHelper = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let vendors = await Vendors.aggregate([
                { $sort: { createdAt: -1 } }
            ])
            resolve(vendors)

        } catch (error) {
            console.error(error);
            reject("ERROR FROM [vendorListHelper]", error)
        }
    })
}





let userStatusHelper = (id, status) => {
    return new Promise(async (resolve, reject) => {
        try {
            let update = await Users.findOneAndUpdate(
                { _id: id },
                { $set: { status: status } },
                { new: true }, //OTHER WISE IT WILL RETURN IN UPDATE OLD DATA
            )
            //  console.log("after updated", update);
            resolve(update)
        } catch (error) {
            console.error(error);
            reject("Error from [userStatusHelper] Due to =>", error)
        }
    })
}


let vendorStatusHelper = (id, status) => {
    return new Promise(async (resolve, reject) => {
        try {
            let update = await Vendors.findOneAndUpdate(
                { _id: id },
                { $set: { status: status } },
                //  {new:true}, //OTHER WISE IT WILL RETURN IN UPDATE OLD DATA
            )
            //  console.log("after updated", update);
            resolve(update) //NEW TRUE FALSE WHILE WRITE TO MONGO DB SO .WE GET OLD DATA= DATA BEFORE MODIFICATION,SO WE CAN GET WHETHER IT IS PENDING,ACTIVE,BLOCK
        } catch (error) {
            console.error(error);
            reject("Error from [vendorStatusHelper] Due to =>", error)
        }
    })
}



let ordersHelper = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let orders = await Order.find().populate('userIdRef productsArray.productIdRef addressId couponIdRef').sort({ createdAt: -1 })

            //  let  modified=ORDERS.userIdRef.address.filter((data) => data._id.toString() === ORDERS.addressId )
            let modifiedData = orders.map((data) => {
                let find = data.userIdRef.address.filter((innerData) => innerData._id.toString() == data.addressId)
                return { ...data.toObject(), deliveryAddress: find[0] }
            })


            console.log(util.inspect(modifiedData, { depth: null }));

            resolve({ orders: modifiedData, orderStringified: JSON.stringify(modifiedData) }) //stringified for dom purpose to eye view in oreder table
        } catch (error) {
            console.error(error);
            reject("Error from [ordersHelper] Due to =>", error)
        }
    })
}






module.exports = {
    loginHelper, passwordResetHelper, otpHelper, passwordVerifyHelper, NewPasswordPostHelper,
    categoryAddPost, addBrandHelper, ViewCategoryHelper, SubCategoryAddPost, ViewSubCategoryHelper, ViewBrandHelper, ViewProductHelper, deleteCategoryHelper
    , deleteSubCategoryHelper, deleteBrandHelper, editCategoryHelper, editSubCategoryHelper, editBrandHelper, ViewBannerHelper, addBannerHelper,
    deleteBannerHelper, editBannerHelper, productEyeViewHelper, userListHelper, userStatusHelper, vendorListHelper, vendorStatusHelper, ViewCouponHelper, addCouponHelper,
    deleteCouponHelper, editCouponHelper, ordersHelper, couponStatusHelper, dashboardGetPageHelper
}