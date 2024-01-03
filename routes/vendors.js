const express=require('express')
const router=express.Router()
const vendorControllers=require('../controllers/vendors')
const {authentication} = require('../middleware/jwt')
const multer = require('multer')
const upload = require('../middleware/multer')
const uploads =require('../middleware/multerMultiple')


router.get('/vendorLogin',vendorControllers.loginGetPage)
router.get('/vendorSignup',vendorControllers.signupGetPage)
router.post('/vendorSignup',vendorControllers.signupPostPage)
router.post('/vendorLogin',vendorControllers.loginPostPage)
router.get('/vendor/dashboard',authentication('vendor'),vendorControllers.dashboardGetPage)
router.get('/vendorLogout',vendorControllers.vendorLogout)
router.get('/vendor/passwordReset',vendorControllers.passwordReset)
router.post('/vendor/passwordReset',vendorControllers.passwordResetPost)
router.post('/vendor/passwordVerify',vendorControllers.passwordVerifyPost)
router.get('/vendor/NewPassword',vendorControllers.NewPassword)
router.post('/vendor/NewPassword',vendorControllers.NewPasswordPost)
router.get('/vendor/ViewProducts',authentication('vendor'),vendorControllers.ViewProducts)
router.get('/vendor/addProductsView',authentication('vendor'),vendorControllers.addProductsView)
router.post('/vendor/addProducts',authentication('vendor'),upload.single('image'),vendorControllers.addProductsPost)
router.delete('/vendor/deleteProducts',authentication('vendor'),vendorControllers.deleteProducts)
router.get('/vendor/editProductsView',authentication('vendor'),vendorControllers.editProductsView)
// router.put('/vendor/editProducts/:productId',upload.single('image'),vendorControllers.editProducts)
router.put('/vendor/editProducts/:productId',uploads.array('images', 5),vendorControllers.editProducts)

 






module.exports=router;