const mongoose = require('mongoose')

const Session = mongoose.Schema({
    session_id: String,
    request_id: String,
    estimated_traffic: String,
    budget: Number,
    impression_goal: Number,
    total_spending: Number,
    impression_count: Number,
    estimated_number_of_bidder: Number
})

module.exports = mongoose.model('Session', Session)