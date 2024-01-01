const jwt = require('jsonwebtoken');
const env = require('dotenv').config()

module.exports = {
    signUser  : (user) => {
        return new Promise ((resolve,reject) => {
            const jwtKey = process.env.JWT_KEY
            const payLoad = {
                userId : user._id,
                userName : user.userName,
                role : 'user'
            }
            jwt.sign(payLoad,jwtKey,{expiresIn: '2h'}, (error,token) => {
                if(error){
                    reject(error)
                }else{
                    resolve(token)
                }
            })
        })
    },


    verifyUser: (recievedToken) => {
        return new Promise ((resolve,reject) => {
            const jwtKey = process.env.JWT_KEY
            jwt.verify(recievedToken,jwtKey,(error,decodedToken) => {
             if(error){
                console.error("some problems occured during jwt verification",error);
                reject(error)
             }else{
                // console.log("DECODED TOKEN DETAILS FROM REQUEST " ,decodedToken);
                 console.log("SUCCESSFULLY DECODED TOKEN DETAILS FROM USER REQUEST  *FROM MIDDLEWARE JWT* ");
                resolve(decodedToken)
             }
            })
        })
    },




    signAdmin  : (admin) => {
        return new Promise ((resolve,reject) => {
            const jwtKey = process.env.JWT_KEY
            const payLoad = {
                adminId : admin._id,
                adminName : admin.userName,
                role : 'admin'
            }
            jwt.sign(payLoad,jwtKey,{expiresIn: '2h'}, (error,token) => {
                if(error){
                    reject(error)
                }else{
                    resolve(token)
                }
            })
        })
    },


    verifyAdmin: (recievedToken) => {
        return new Promise ((resolve,reject) => {
            const jwtKey = process.env.JWT_KEY
            jwt.verify(recievedToken,jwtKey,(error,decodedToken) => {
             if(error){
                console.error("some problems occured during jwt verification",error);
                reject(error)
             }else{
                // console.log("DECODED TOKEN DETAILS FROM REQUEST " ,decodedToken);
                 console.log("SUCCESSFULLY DECODED TOKEN DETAILS FROM ADMIN REQST  *FROM MIDDLEWARE*");
                resolve(decodedToken)
             }
            })
        })
    },




    signVendor  : (vendor) => {
        return new Promise ((resolve,reject) => {
            const jwtKey = process.env.JWT_KEY
            const payLoad = {
                vendorId : vendor._id,
                vendorName : vendor.vendorName,
                 role : 'vendor'
            }
            jwt.sign(payLoad,jwtKey,{expiresIn: '2h'}, (error,token) => {
                if(error){
                    reject(error)
                }else{
                    resolve(token)
                }
            })
        })
    },


    verifyVendor: (recievedToken) => {
        return new Promise ((resolve,reject) => {
            const jwtKey = process.env.JWT_KEY
            jwt.verify(recievedToken,jwtKey,(error,decodedToken) => {
             if(error){
                console.error("some problems occured during jwt verification",error);
                reject(error)
             }else{
                // console.log("DECODED TOKEN DETAILS FROM REQUEST " ,decodedToken);
                console.log("DECODED TOKEN DETAILS FROM VENDOR REQUEST *FROM MIDDLEWARE JWT*");

                resolve(decodedToken)
             }
            })
        })
    },



    authentication : (requiredRole) => (req,res,next) => {
        try{
            const jwtKey = process.env.JWT_KEY
        const baererToken = req.cookies.jwt;
        if(!baererToken){
           return res.status(401).send("you are un authorized");
        //    return res.redirect('/adminLogin')

        }
        jwt.verify(baererToken,jwtKey,(error,decodedToken) => {
            if(error){
                console.error("some error occured during JWT verification",error);
                return res.status(403).send('some error occured during JWT verification SO you are un authorized')
            }
            
            if(decodedToken.role !== requiredRole){
             return res.status(403).send('Role Should to be Changed')
                // return res.redirect('/adminLogin')
            }
            next();
        })
            
        }catch(error){
            console.error(error);
          
        }
        
    },







    // authenticationAppu :(requiredRole) => (req,res,next) =>  {
//     console.log( "check",requiredRole);
//     const baererToken = req.headers.authorization
//     console.log("barere",baererToken);
//     if(!baererToken){
//         console.log("notoken");
//     }
//     const token = baererToken.split(" ")[1]
//     if(!token){
//         console.log("no token extratted");
//     }
//     const jwtKey = process.env.JWT_KEY
//     jwt.verify(token,jwtKey,(error,decodedToken) => {
//         if(error){
//             console.log("no decoded token");
//         }
//         const {role} = decodedToken
//         if(!role || role !== requiredRole){
//             console.log("not authorized");
//         }
//         next()
//     })
// },


}

