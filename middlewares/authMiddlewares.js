const jwt = require('jsonwebtoken')
const collection = require("../models/collection")

const requireAuth = (req,res,next) => {
    const token = req.cookies.jwt

    if(token){
        jwt.verify(token, 'secret', (err, decodedToken) => {
            if(err){
                res.redirect('/login')
            }
            else{
                next()
            }
        })
    }
    else{
        res.redirect('/login')
    }
}

const checkUser = (req,res,next) => {
    const token = req.cookies.jwt
    if(token){
        jwt.verify(token, "secret", async(err, decodedToken) => {
            if(err){
                res.locals.user = null;
                next();
            }
            else{
                let user = await collection.findById(decodedToken.id)
                res.locals.user = user
                next()
            }
        });
    }else{
        res.locals.user = null;
        next();
    }
} 

module.exports = {
    requireAuth, checkUser
}