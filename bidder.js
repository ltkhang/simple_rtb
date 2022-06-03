const express = require('express')
const cors = require('cors')
const { checkSchema, validationResult, check } = require('express-validator');
const { bidderValidation, generalValidation } = require('./validation')
const { mathUtil, constants } = require('./utils')
const myArgs = process.argv.slice(2)

const PORT = 4000
let port = PORT
// Check if PORT provided correctly
if (myArgs.length == 0) {
    console.log(`Custom PORT not found, choose default port ${PORT}`)
} else {
    port = parseInt(myArgs[0], 10)

    if (isNaN(port)) {
        console.log(`Port value should be a number, choosr default port ${PORT}`)
        port = PORT
    }
}


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
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(constants.STATUS_ERR).json({ error: errors.array() });
        }
        let session_id = req.body.session_id
        let estimated_traffic = req.body.estimated_traffic
        let budget = req.body.budget
        let impression_goal = req.body.impression_goal
        if (!(session_id in session_db)) {
            session_db[session_id] = {
                estimated_traffic,
                budget,
                impression_goal,
                users: {},
                total_spending: 0, // total amount of winning bid
                impression_count: 0, // number of winning bid
                request_list: {} // store list of current request in session
            }
        }

        return res.json({ result: 'ok' })
    })

app.post('/end_session',
    checkSchema(generalValidation.endSessionSchemaCheck),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(constants.STATUS_ERR).json({ error: errors.array() });
        }
        let session_id = req.body.session_id
        delete session_db[session_id]
        return res.json({ result: 'ok' })
    })

app.post('/bid_request',
    checkSchema(generalValidation.bidRequestSchemaCheck),
    (req, res) => {
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
        if (!(session_id in session_db)) {
            return res.status(constants.STATUS_ERR).json({ error: 'session_id has not been initialized' })
        }

        // store the information of user
        if (!(user_id in session_db[session_id].users)) {
            session_db[session_id].users[user_id] = {}
        }
        let estimated_traffic = session_db[session_id].estimated_traffic
        let budget = session_db[session_id].budget
        let impression_goal = session_db[session_id].impression_goal
        let total_spending = session_db[session_id].total_spending
        let impression_count = session_db[session_id].impression_count

        let estimated_number_of_bidder = estimated_traffic / impression_goal

        // divide remain budget for remain impression
        let valuation = (budget - total_spending) / (impression_goal - impression_count)

        // or bid based on theory, 
        // ref: https://python.quantecon.org/two_auctions.html
        // ref: https://www.youtube.com/watch?v=MROR272191E
        price = (valuation * (estimated_number_of_bidder - 1)) / estimated_number_of_bidder
        price = parseFloat(price.toFixed(constants.DEXIMALS))

        if (price < floor_price) {
            price = -1 // no bid
        }

        session_db[session_id].request_list[request_id] = { price }

        return res.json({
            session_id,
            request_id,
            price
        })
    })

app.post('/notify_win_bid',
    checkSchema(bidderValidation.notifyWinBidSchemaCheck),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(constants.STATUS_ERR).json({ error: errors.array() });
        }
        let session_id = req.body.session_id
        let request_id = req.body.request_id
        let clear_price = req.body.clear_price
        // check if session_id has been initialized
        if (!(session_id in session_db)) {
            return res.status(constants.STATUS_ERR).json({ error: 'session_id has not been initialized' })
        }
        if (!(request_id in session_db[session_id].request_list)) {
            return res.status(constants.STATUS_ERR).json({ error: 'request_id has not been initialized' })
        }
        // be the winner, update total_spending and number of impression
        let price = parseFloat(session_db[session_id].request_list[request_id].price)
        if (price != -1) {
            session_db[session_id].impression_count += 1
            session_db[session_id].total_spending += clear_price
        }
        return res.json({ result: 'ok' })
    })

app.listen(port, () => {
    console.log(`Bidder server listening on port ${port}`)
})

module.exports = app

