const express=require('express')
const mongooseConnection = require('./mongodb');
const app=express()
const port=3000
const path=require('path')
const userRouter=require('./routes/users')
const adminRouter=require('./routes/admin')
const vendorRouter=require('./routes/vendors')



app.set('view engine','hbs');
app.set('views',path.join(__dirname,'./views'))


app.use(express.urlencoded({ extended: true }));
app.use(express.json());//TO PARSE THE BODY ALSO INSTED OF THIS WE CAN USE BODYPARSER MIDDLE WARE
app.use(express.static(path.join(__dirname, 'public')));
app.use('/',userRouter)
app.use('/',adminRouter)
app.use('/',vendorRouter)





app.listen(port,() => {
    console.log(`server is running on ${port}`);
})