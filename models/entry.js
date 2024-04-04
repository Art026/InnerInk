const mongoose = require("mongoose");
const { isEmail } = require("validator");
const collection = require("../models/collection");

const JournalEntrySchema = new mongoose.Schema({
    diary: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'collection' // Reference to the User model
    },
    mood: {
        type: String,
        required: true
    },
    tags: {
        type: Array,
        required: true
    },
    day: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    image: {
        type: String // You can use 'Buffer' for binary data or 'String' for storing image URLs
    }
});

const entry = mongoose.model("entry", JournalEntrySchema);

module.exports = entry;
