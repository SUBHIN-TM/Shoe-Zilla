const express=require('express')
const router=express.Router()
const userControllers=require('../controllers/users')


router.get('/userLogin',userControllers.loginGetPage)
router.get('/userSignup',userControllers.signUpGetPage)
router.post('/userSignup',userControllers.signUpPostPage)




module.exports=router;