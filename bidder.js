const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const { checkSchema, validationResult, check } = require('express-validator');
const { bidderValidation, generalValidation } = require('./validation')
const { mathUtil, constants } = require('./utils')
const myArgs = process.argv.slice(2)

const Session = require('./models/BidderSession')
const Request = require('./models/BidderRequest')

const PORT = 4000
let port = PORT
let mongodbConnectionString = 'mongodb://root:example@localhost:27017/'
let dbName = 'bidder'
// Check if PORT provided correctly
if (myArgs.length == 0) {
    console.log(`Custom PORT not found, choose default port ${PORT}`)
} else {
    port = parseInt(myArgs[0], 10)

    if (isNaN(port)) {
        console.log(`Port value should be a number, choosr default port ${PORT}`)
        port = PORT
    }

    if (!!myArgs[1])
        dbName = myArgs[1]
}
if (!!process.env.MONGODB_CONNECTION_STRING) {
    mongodbConnectionString = process.env.MONGODB_CONNECTION_STRING
    dbName = process.env.MONGODB_DB_NAME
}

console.log(dbName)


// Init express instance
const app = express()

// use middle ware to parse json
app.use(express.json({ type: 'application/json' }))

// overall error handler

app.use(generalValidation.errorHandler)

// allow Cross-origin resource sharing
app.use(cors())

// store all session in global value as format key - value
let session_db = {}

app.post('/init_session',
    checkSchema(bidderValidation.initSessionPostCheckSchema),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(constants.STATUS_ERR).json({ error: errors.array() });
        }
        let session_id = req.body.session_id
        let estimated_traffic = req.body.estimated_traffic
        let budget = req.body.budget
        let impression_goal = req.body.impression_goal

        let session = await Session.findOne({ session_id })
        if (!!session) { // if existed
            return res.status(400).json({ error: `session_id ${session_id} has already initialized before` });
        } else {
            let session = new Session({
                session_id,
                estimated_traffic,
                budget,
                impression_goal,
                total_spending: 0, // total amount of winning bid
                impression_count: 0, // number of winning bid
            })
            await session.save()
        }

        return res.json({ result: 'ok' })
    })

app.post('/end_session',
    checkSchema(generalValidation.endSessionSchemaCheck),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(constants.STATUS_ERR).json({ error: errors.array() });
        }
        let session_id = req.body.session_id
        await Request.deleteMany({session_id})
        await Session.deleteMany({ session_id })
        return res.json({ result: 'ok' })
    })

app.post('/bid_request',
    checkSchema(generalValidation.bidRequestSchemaCheck),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(constants.STATUS_ERR).json({ error: errors.array() });
        }
        let session_id = req.body.session_id
        let request_id = req.body.request_id
        let user_id = req.body.user_id
        let floor_price = req.body.floor_price
        let timeout_ms = req.body.timeout_ms
        let price = 0
        // check if session_id has been initialized
        let session = await Session.findOne({ session_id })
        if (!!!session) { // if not existed
            return res.status(400).json({ error: `session_id ${session_id} has not initialized` });
        }

        // store the information of user
        // if (!(user_id in session_db[session_id].users)) {
        //     session_db[session_id].users[user_id] = {}
        // }
        let estimated_traffic = session.estimated_traffic
        let budget = session.budget
        let impression_goal = session.impression_goal
        let total_spending = session.total_spending
        let impression_count = session.impression_count

        let estimated_number_of_bidder = estimated_traffic / impression_goal

        // divide remain budget for remain impression
        let valuation = (budget - total_spending) / (impression_goal - impression_count)

        // or bid based on theory, 
        // ref: https://python.quantecon.org/two_auctions.html
        // ref: https://www.youtube.com/watch?v=MROR272191E
        price = (valuation * (estimated_number_of_bidder - 1)) / estimated_number_of_bidder
        price = parseFloat(price.toFixed(constants.DEXIMALS))
        if (isNaN(price) || !isFinite(price) || price < floor_price) {
            price = -1 // no bid
        }

        let request_obj = await Request.findOne({session_id, request_id})
        if (!!!request_obj) { // if not existed
            request_obj = new Request({
                session_id,
                request_id,
                price
            })
        } else {
            request_obj.price = price
        }
        await request_obj.save()


        return res.json({
            session_id,
            request_id,
            price
        })
    })

app.post('/notify_win_bid',
    checkSchema(bidderValidation.notifyWinBidSchemaCheck),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(constants.STATUS_ERR).json({ error: errors.array() });
        }
        let session_id = req.body.session_id
        let request_id = req.body.request_id
        let clear_price = req.body.clear_price
        // check if session_id has been initialized
        let session = await Session.findOne({ session_id })
        if (!!!session) { // if not existed
            return res.status(400).json({ error: `session_id ${session_id} has not initialized` });
        }

        let request_obj = await Request.findOne({session_id, request_id})
        if (!!!request_obj) { // if not existed
            return res.status(constants.STATUS_ERR).json({ error: `request_id ${request_id} in session_id ${session_id} has not been initialized` })
        }
        // be the winner, update total_spending and number of impression
        let price = parseFloat(request_obj.price)
        if (price != -1) {
            session.impression_count += 1
            session.total_spending += clear_price
        }
        await session.save()
        // console.log(`${request_id} I win with ${clear_price}, total_spending ${session_db[session_id].total_spending}`)
        return res.json({ result: 'ok' })
    })

mongoose.connect(mongodbConnectionString, { dbName }).then(() => {
    app.listen(port, () => {
        console.log(`Exchange server listening on port ${port}`)
    })
}).catch((e) => console.log(`Connect DB failed! Error: ${e.message}`))

module.exports = app

