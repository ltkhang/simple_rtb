const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
    session_id: String,
    estimated_traffic: Number,
    bidders: [
        {
            name: String,
            endpoint: String
        }
    ],
    bidder_setting: {
        budget: Number,
        impression_goal: Number
    }
})

module.exports = mongoose.model('Session', sessionSchema)