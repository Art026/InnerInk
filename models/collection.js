const mongoose = require("mongoose");
const {isEmail} = require("validator");
const bcrypt = require('bcrypt');

const Loginschema = new mongoose.Schema({
    name: {
        type:String,
        required: true
    },
    email: {
        type:String,
        unique: true,
        lowercase: true,
        validate: [isEmail, "please enter a valid email"]
    },
    password: {
        type: String,
        required: [true, "please enter a password"],
        minlength: [6, "min len is 6 characters"]
    }
});

Loginschema.pre('save', async function(next) {
    const salt = await bcrypt.genSalt()
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

Loginschema.statics.login = async function (name, email, password){
    const user = await this.findOne({name})
    if(user){
        const auth = await bcrypt.compare(password, user.password)
        if(auth){
            return user
        }
        throw Error("incorrect password")
    }
    else{
        throw Error("incorrect username")
    }
}

const collection = mongoose.model("newusers", Loginschema);

module.exports = collection;
