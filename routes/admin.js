const express=require('express')
const router=express.Router()
const adminControllers=require('../controllers/admin')
const {authentication} = require('../middleware/jwt')


router.get('/adminLogin',adminControllers.loginGetPage)
router.post('/adminLogin',adminControllers.loginPostPage)
router.get('/adminLogout',adminControllers.adminLogout)
router.get('/admin/passwordReset',adminControllers.passwordReset)
router.post('/admin/passwordReset',adminControllers.passwordResetPost)
router.post('/admin/passwordVerify',adminControllers.passwordVerifyPost)
router.get('/admin/NewPassword',adminControllers.NewPassword)
router.post('/admin/NewPassword',adminControllers.NewPasswordPost)

router.get('/admin/dashboard',authentication('admin'),adminControllers.dashboardGetPage)
router.get('/admin/ViewCategory',adminControllers.ViewCategory)
router.get('/admin/ViewSubCategory',adminControllers.ViewSubCategory)
router.get('/admin/ViewBrand',adminControllers.ViewBrand)
router.post('/admin/addCategory',adminControllers.addCategory)


module.exports=router;