const express=require('express')
const router=express.Router()
const vendorControllers=require('../controllers/vendors')
const {authentication} = require('../middleware/jwt')


router.get('/vendorLogin',vendorControllers.loginGetPage)
router.get('/vendorSignup',vendorControllers.signupGetPage)
router.post('/vendorSignup',vendorControllers.signupPostPage)
router.post('/vendorLogin',vendorControllers.loginPostPage)
router.get('/vendor/dashboard',authentication('vendor'),vendorControllers.dashboardGetPage)
router.get('/vendorLogout',vendorControllers.vendorLogout)


module.exports=router;