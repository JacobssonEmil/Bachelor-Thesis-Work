const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    age: Number,
  });
  
const User = mongoose.model('User', userSchema, 'documents'); // 'documents' är namnet på collectionen  

module.exports = User;
