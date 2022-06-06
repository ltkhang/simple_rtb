const mongoose = require('mongoose')

const Request = mongoose.Schema({
    session_id: String,
    request_id: String,
    price: Number
})

module.exports = mongoose.model('Request', Request)