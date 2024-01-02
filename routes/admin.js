const express=require('express')
const router=express.Router()
const adminControllers=require('../controllers/admin')
const {authentication} = require('../middleware/jwt')
const multer = require('multer')
const upload = require('../middleware/multer')


router.get('/adminLogin',adminControllers.loginGetPage)
router.post('/adminLogin',adminControllers.loginPostPage)
router.get('/adminLogout',adminControllers.adminLogout)
router.get('/admin/passwordReset',adminControllers.passwordReset)
router.post('/admin/passwordReset',adminControllers.passwordResetPost)
router.post('/admin/passwordVerify',adminControllers.passwordVerifyPost)
router.get('/admin/NewPassword',adminControllers.NewPassword)
router.post('/admin/NewPassword',adminControllers.NewPasswordPost)

router.get('/admin/dashboard',authentication('admin'),adminControllers.dashboardGetPage)
router.get('/admin/ViewCategory',authentication('admin'),adminControllers.ViewCategory)
router.get('/admin/ViewSubCategory',authentication('admin'),adminControllers.ViewSubCategory)
router.get('/admin/ViewBrand',authentication('admin'),adminControllers.ViewBrand)
router.post('/admin/addCategory',authentication('admin'),upload.single('image'),adminControllers.addCategory)
router.post('/admin/addSubCategory',authentication('admin'),upload.single('image'),adminControllers.addSubCategory)
router.get('/admin/ViewProduct',authentication('admin'),adminControllers.ViewProduct)


module.exports=router;