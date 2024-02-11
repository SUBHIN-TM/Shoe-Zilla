const express=require('express')
const router=express.Router()
const adminControllers=require('../controllers/admin')
const {authentication} = require('../middleware/jwt')
const multer = require('multer')
const upload = multer({dest:"uploads/"})
const prevent=require('../middleware/preventBack')

router.get('/adminLogin',prevent,adminControllers.loginGetPage)
router.post('/adminLogin',adminControllers.loginPostPage)
router.get('/adminLogout',prevent,adminControllers.adminLogout)
router.get('/admin/passwordReset',adminControllers.passwordReset)
router.post('/admin/passwordReset',adminControllers.passwordResetPost)
router.post('/admin/passwordVerify',adminControllers.passwordVerifyPost)
router.get('/admin/NewPassword',adminControllers.NewPassword)
router.post('/admin/NewPassword',adminControllers.NewPasswordPost)

router.get('/admin/dashboard',prevent,authentication('admin'),adminControllers.dashboardGetPage)
router.post('/admin/addCategory',authentication('admin'),upload.single('image'),adminControllers.addCategory)
router.get('/admin/ViewCategory',prevent,authentication('admin'),adminControllers.ViewCategory)
router.delete('/admin/deleteCategory',authentication('admin'),adminControllers.deleteCategory)
router.put('/admin/editCategory/:id',authentication('admin'),upload.single('image'),adminControllers.editCategory)


router.post('/admin/addSubCategory',authentication('admin'),upload.single('image'),adminControllers.addSubCategory)
router.get('/admin/ViewSubCategory',prevent,authentication('admin'),adminControllers.ViewSubCategory)
router.delete('/admin/deleteSubCategory',authentication('admin'),adminControllers.deleteSubCategory)
router.put('/admin/editSubCategory/:id',authentication('admin'),upload.single('image'),adminControllers.editSubCategory)

router.post('/admin/addBrand',authentication('admin'),upload.single('image'),adminControllers.addBrand)
router.get('/admin/ViewBrand',prevent,authentication('admin'),adminControllers.ViewBrand)
router.delete('/admin/deleteBrand',authentication('admin'),adminControllers.deleteBrand)
router.put('/admin/editBrand/:id',authentication('admin'),upload.single('image'),adminControllers.editBrand)

router.get('/admin/ViewBanner',prevent,authentication('admin'),adminControllers.ViewBanner)
router.post('/admin/addBanner',authentication('admin'),upload.single('image'),adminControllers.addBanner)
router.delete('/admin/deleteBanner',authentication('admin'),adminControllers.deleteBanner)
router.put('/admin/editBanner/:id',authentication('admin'),upload.single('image'),adminControllers.editBanner)

router.get('/admin/ViewCoupon',prevent,authentication('admin'),adminControllers.ViewCoupon)
router.post('/admin/addCoupon',authentication('admin'),adminControllers.addCoupon)
router.post('/admin/editCoupon',authentication('admin'),adminControllers.editCoupon)
router.delete('/admin/deleteCoupon',authentication('admin'),adminControllers.deleteCoupon)
router.post('/admin/couponStatus',authentication('admin'),adminControllers.couponStatus)


router.get('/admin/ViewProduct',prevent,authentication('admin'),adminControllers.ViewProduct)
router.post('/admin/productEyeView',authentication('admin'),adminControllers.productEyeView)

router.get('/admin/userList',prevent,authentication('admin'),adminControllers.userList)
router.get('/admin/userStatus',prevent,authentication('admin'),adminControllers.userStatus)


router.get('/admin/vendorList',prevent,authentication('admin'),adminControllers.vendorList)
router.get('/admin/vendorStatus',authentication('admin'),adminControllers.vendorStatus)

router.get('/admin/orders',prevent,authentication('admin'),adminControllers.orders)





module.exports=router;