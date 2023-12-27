const express=require('express')
const router=express.Router()
const adminControllers=require('../controllers/admin')
const {authentication} = require('../middleware/jwt')


router.get('/adminLogin',adminControllers.loginGetPage)
router.post('/adminLogin',adminControllers.loginPostPage)
router.get('/admin/dashboard',authentication('admin'),adminControllers.dashboardGetPage)
router.get('/adminLogout',adminControllers.adminLogout)
router.get('/admin/passwordReset',adminControllers.passwordReset)
router.post('/admin/passwordReset',adminControllers.passwordResetPost)
router.post('/admin/passwordVerify',adminControllers.passwordVerifyPost)
router.get('/admin/NewPassword',adminControllers.NewPassword)
router.post('/admin/NewPassword',adminControllers.NewPasswordPost)



module.exports=router;