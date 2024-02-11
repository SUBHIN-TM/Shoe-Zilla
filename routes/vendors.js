const express=require('express')
const router=express.Router()
const vendorControllers=require('../controllers/vendors')
const {authentication} = require('../middleware/jwt')
const multer = require('multer')
const uploads = multer({dest:"uploads/"})
const prevent=require('../middleware/preventBack')


router.get('/vendorLogin',prevent,vendorControllers.loginGetPage)
router.get('/vendorSignup',prevent,vendorControllers.signupGetPage)
router.post('/vendorSignup',vendorControllers.signupPostPage)
router.post('/vendorLogin',vendorControllers.loginPostPage)
router.get('/vendor/dashboard',prevent,authentication('vendor'),vendorControllers.dashboardGetPage)
router.get('/vendorLogout',prevent,vendorControllers.vendorLogout)
router.get('/vendor/passwordReset',prevent,vendorControllers.passwordReset)
router.post('/vendor/passwordReset',vendorControllers.passwordResetPost)
router.post('/vendor/passwordVerify',vendorControllers.passwordVerifyPost)
router.get('/vendor/NewPassword',prevent,vendorControllers.NewPassword)
router.post('/vendor/NewPassword',vendorControllers.NewPasswordPost)
router.get('/vendor/ViewProducts',prevent,authentication('vendor'),vendorControllers.ViewProducts)
router.post('/vendor/productEyeView',authentication('vendor'),vendorControllers.productEyeView)
router.get('/vendor/addProductsView',prevent,authentication('vendor'),vendorControllers.addProductsView)
router.post('/vendor/addProducts',authentication('vendor'),uploads.array('images'),vendorControllers.addProductsPost)
router.delete('/vendor/deleteProducts',authentication('vendor'),vendorControllers.deleteProducts)
router.get('/vendor/editProductsView',prevent,authentication('vendor'),vendorControllers.editProductsView)
router.put('/vendor/editProducts/:productId',uploads.array("images"),vendorControllers.editProducts)

router.get('/vendor/ordersView',prevent,authentication('vendor'),vendorControllers.ordersView)
router.post('/vendor/productStatusUpdate',authentication('vendor'),vendorControllers.productStatusUpdate)





module.exports=router;