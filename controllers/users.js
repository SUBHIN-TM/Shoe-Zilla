const helpers=require('../helpers/userHelper')


let loginGetPage=(req,res) => {
    res.render('user/login')
}

let signUpGetPage=(req,res) => {
    res.render('user/signup')
}


let signUpPostPage= async (req,res) => {
try{
    console.log("entered user registration section");
    console.log(req.body);

    let resolved = await helpers.signupHelper(req.body);
        if(resolved.existingUser){
          console.log("mail already exist");
           res.status(200).render('user/signup',{mail:'Email Already Exists'})
        }else{
           console.log('user registration completed');
            res.redirect('/userLogin')
        }

}catch(error){
    res.render('error',{print:error})
}
}


module.exports={loginGetPage,signUpGetPage,signUpPostPage}