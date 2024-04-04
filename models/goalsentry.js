const mongoose = require("mongoose");
const { isEmail } = require("validator");
const collection = require("../models/collection");


  const goalSchema = new mongoose.Schema({

    task: {
      type: Date,
      required: true
  },
  dueDate: {
    type: String
  },
  status: {
    type: String
  }
  });

// Define the Goal model
const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
