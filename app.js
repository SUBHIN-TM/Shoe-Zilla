const express=require('express')
const app=express()
const port=3000
const path=require('path')
const userRouter=require('./routes/users')
const adminRouter=require('./routes/admin')
const vendorRouter=require('./routes/vendors')
const cookieParser = require('cookie-parser');
const passport = require('passport')
const session = require('express-session')
 const googleSignUp = require('./X- Features/googleSignIn')
let hbs=require('express-handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')
const createErrors=require("http-errors")


app.engine('hbs',
  hbs.engine({
  handlebars: allowInsecurePrototypeAccess(require('handlebars')),
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, '/views/layout/'),
  partialsDir: path.join(__dirname, '/views/partials/')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '/views'));


app.use(cookieParser()); //FOR JWT USE
app.use(session({   //FOR GOOGLE VERIFICATION
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));
  app.use(passport.initialize());  //FOR GOOGLE VERIFICATION
  app.use(passport.session());  //FOR GOOGLE VERIFICATION


app.use(express.urlencoded({ extended: true }));
app.use(express.json());//TO PARSE THE BODY ALSO INSTED OF THIS WE CAN USE BODYPARSER MIDDLE WARE
app.use(express.static(path.join(__dirname, 'public')));
app.use('/',userRouter)
app.use('/',adminRouter)
app.use('/',vendorRouter)


app.use((req,res,next)=>{ //ANY 404 IT DIERECT T0 BELOW ERROR HANDLING MW
next(createErrors(404))
})

app.use((error,req,res,next) => { //ALL ERROR PAGE LEADS TO THIS AND IT WILL RENDER ERROR PAGE
 res.render("error")
})



app.listen(port,() => {
    console.log(`server is running on ${port}`);
})