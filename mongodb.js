const dotenv = require('dotenv')
dotenv.config();

const mongoose=require('mongoose')

// mongoose.connect('mongodb://127.0.0.1:27017/shoeZilla',{
// });


mongoose.connect(process.env.MONGOPASSWORD,{ 
connectTimeoutMS: 30000 });

const customConnection = mongoose.connection
customConnection.on('error',console.error.bind(console,'MongoDB Connection Error'));
customConnection.once('open',() => {
    console.log("MongoDb Connected Successfully");
});

module.exports=mongoose;





