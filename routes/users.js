const express=require('express')
const router=express.Router()
const userControllers=require('../controllers/users')
// const {verifyJWT} = require('../middleware/auth')

router.get('/',userControllers.homePage)
router.get('/userLogout',userControllers.logoutPage)
router.get('/userLogin',userControllers.loginGetPage)
router.get('/userSignup',userControllers.signUpGetPage)
router.post('/userSignup',userControllers.signUpPostPage)
router.post('/userLogin',userControllers.loginPostPage)





module.exports=router;