const { model, Schema } = require('mongoose');
const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
};

const schema = new Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, schemaOptions);

const Task = model('Task', schema);

module.exports = Task;