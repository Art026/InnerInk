const mongoose = require("mongoose");
const collection = require("./collection");

const reflectSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'collection' // Reference to the User model
    },
    answer: {
        type: String,
        required: true
    },
    day: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    }
});

const reflectEntry = mongoose.model("reflectentry", reflectSchema);

module.exports =reflectEntry;
