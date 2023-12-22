const express=require('express')
const router=express.Router()
const userControllers=require('../controllers/users')



router.get('/',userControllers.homePage)
router.get('/userLogout',userControllers.logoutPage)
router.get('/userLogin',userControllers.loginGetPage)
router.get('/userSignup',userControllers.signUpGetPage)
router.post('/userSignup',userControllers.signUpPostPage)
router.post('/userLogin',userControllers.loginPostPage)
router.get('/user/google',userControllers.googleAccountSelect)
router.get('/user/google/callback',userControllers.googleCallback)
router.get('/user/google/signin',userControllers.googleSign)





module.exports=router;