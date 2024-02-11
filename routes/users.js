const express=require('express')
const router=express.Router()
const userControllers=require('../controllers/users')
const {userLogined} = require('../middleware/jwt')
const prevent=require('../middleware/preventBack')

router.get('/',prevent,userControllers.homePage)
router.get('/userLogout',prevent,userControllers.logoutPage)
router.get('/userLogin',prevent,userControllers.loginGetPage)
router.get('/userSignup',prevent,userControllers.signUpGetPage)
router.post('/userSignup',userControllers.signUpPostPage)
router.post('/userLogin',userControllers.loginPostPage)
router.get('/user/google',userControllers.googleAccountSelect)
router.get('/user/google/callback',userControllers.googleCallback)
router.get('/user/google/signin',userControllers.googleSign)
router.get('/user/passwordReset',prevent,userControllers.passwordReset)
router.post('/user/passwordReset',userControllers.passwordResetPost)
router.post('/user/passwordVerify',userControllers.passwordVerifyPost)
router.get('/user/NewPassword',prevent,userControllers.NewPassword)
router.post('/user/NewPassword',userControllers.NewPasswordPost)

router.get('/men',prevent,userControllers.menPage)
router.post('/menFilter',userControllers.menFilter)
router.get('/women',prevent,userControllers.women)
router.post('/womenFilter',userControllers.womenFilter)

router.post('/productDetails',userControllers.productDetails)
router.post('/search',userControllers.search)
router.post('/searchFilter',userControllers.searchFilter)

router.post('/cart',userControllers.cart)
router.get('/cartView',prevent,userLogined(),userControllers.cartView)
router.post('/cartRemove',userControllers.cartRemove)
router.post('/cartEdit',userControllers.cartEdit)
router.post('/checkOut',prevent,userControllers.checkOut)
router.post('/checkOutDirectBuy',prevent,userControllers.checkOutDirectBuy)

router.post('/addNewAddress',userControllers.addNewAddress)
router.post('/deleteAddress',userControllers.deleteAddress)
router.post('/editAddress',userControllers.editAddress)

router.post('/couponVerify',userControllers.couponVerify)
router.post('/orderPlaced',userLogined(),userControllers.orderPlaced)

router.post('/create/orderId',userControllers.createOrder)
router.post('/api/payment/verify',userControllers.paymentVerify)

router.get('/userProfile',prevent,userControllers.userProfile)
router.get('/userAddress',prevent,userControllers.userAddress)
router.get('/profileDetails',userLogined(),userControllers.profileDetails)
router.post('/profileEdit',userLogined(),userControllers.profileEdit)
router.post('/passwordChange',userLogined(),userControllers.passwordChange)
router.get('/orderView',prevent,prevent,userLogined(),userControllers.orderView)
router.get('/invoice',prevent,userLogined(),userControllers.invoice)
router.post('/autoMailInvoiceSend',prevent,userLogined(),userControllers.autoMailInvoiceSend)
router.post('/invoiceDownload',prevent,userLogined(),userControllers.invoiceDownload)

router.post('/cancelOrderRequest',userLogined(),userControllers.cancelOrderRequest)
router.get('/about',userControllers.about)
router.get('/contact',userControllers.contact)






















module.exports=router;