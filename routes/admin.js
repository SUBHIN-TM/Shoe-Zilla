const express=require('express')
const router=express.Router()
const adminControllers=require('../controllers/admin')


router.get('/adminLogin',adminControllers.loginGetPage)
router.post('/adminLogin',adminControllers.loginPostPage)

module.exports=router;