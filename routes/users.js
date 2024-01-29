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
router.get('/user/passwordReset',userControllers.passwordReset)
router.post('/user/passwordReset',userControllers.passwordResetPost)
router.post('/user/passwordVerify',userControllers.passwordVerifyPost)
router.get('/user/NewPassword',userControllers.NewPassword)
router.post('/user/NewPassword',userControllers.NewPasswordPost)

router.get('/men',userControllers.menPage)
router.post('/menFilter',userControllers.menFilter)
router.get('/women',userControllers.women)
router.post('/womenFilter',userControllers.womenFilter)

router.post('/productDetails',userControllers.productDetails)
router.post('/search',userControllers.search)
router.post('/searchFilter',userControllers.searchFilter)

router.post('/cart',userControllers.cart)
router.get('/cartView',userControllers.cartView)
router.post('/cartRemove',userControllers.cartRemove)
router.post('/cartEdit',userControllers.cartEdit)
router.post('/checkOut',userControllers.checkOut)
router.post('/checkOutDirectBuy',userControllers.checkOutDirectBuy)

router.post('/addNewAddress',userControllers.addNewAddress)
router.post('/deleteAddress',userControllers.deleteAddress)

router.post('/couponVerify',userControllers.couponVerify)
router.post('/orderPlaced',userControllers.orderPlaced)





















module.exports=router;