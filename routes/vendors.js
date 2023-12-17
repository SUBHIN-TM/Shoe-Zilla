const express=require('express')
const router=express.Router()
const vendorControllers=require('../controllers/vendors')



router.get('/vendorLogin',vendorControllers.loginGetPage)
router.get('/vendorSignup',vendorControllers.signupGetPage)
router.post('/vendorSignup',vendorControllers.signupPostPage)
router.post('/vendorLogin',vendorControllers.loginPostPage)


module.exports=router;