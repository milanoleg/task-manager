const mongoose = require('mongoose');
const validator = require('validator');

const username = 'milanoleg';
const pass = 'APPapp80639782677';

mongoose.connect(`mongodb+srv://${encodeURIComponent(username)}:${pass}@cluster0.hgbjjqw.mongodb.net/sample_airbnb`);