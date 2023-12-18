const express=require('express')
const router=express.Router()
const adminControllers=require('../controllers/admin')
const {authentication} = require('../middleware/jwt')


router.get('/adminLogin',adminControllers.loginGetPage)
router.post('/adminLogin',adminControllers.loginPostPage)
router.get('/admin/dashboard',authentication('admin'),adminControllers.dashboardGetPage)
router.get('/adminLogout',adminControllers.adminLogout)

module.exports=router;