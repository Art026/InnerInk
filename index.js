const express = require("express");
const {default: mongoose} = require("mongoose")
const jwt = require('jsonwebtoken')
const authRoutes = require("./routes/authRoutes")
const cookieParser = require("cookie-parser");
const {requireAuth, checkUser} = require('./middlewares/authMiddlewares');
require('dotenv').config();
const collection = require("./models/collection");
const bcrypt = require('bcrypt');

const multer = require('multer');

const app = express();
app.use(express.static("public"));
app.use(express.json());  
app.use(cookieParser());

app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");



const urldb = "mongodb+srv://user1:user_one@cluster1.en69ken.mongodb.net/Signupdb";
const connection = () => {
    mongoose.connect(urldb).then(async() => {
        console.log('connected to db')
        app.listen(5001, () => {
            console.log("app is listening on  port 5001")
        })
    }).catch((err) => {
        console.error(err)
    })
}

connection();

app.get('*', checkUser)

app.get("/", (req, res) => {
    const token = req.cookies.jwt; 
    if(token){
        jwt.verify(token, 'secret', (err, decodedToken) => {
            if(err){
                res.render('login');
            }
            else{
                res.render('userhome');  
            }
        })
    }
    else{
        res.render('main')
    }
});


app.get('/userhome', requireAuth, (req,res) => res.render('userhome'));

app.use(authRoutes);

module.exports = {app, connection};



