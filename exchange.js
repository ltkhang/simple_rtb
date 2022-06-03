const express = require('express')
const cors = require('cors')
const axios = require('axios')
const { checkSchema, validationResult, check } = require('express-validator');
const { exchangeValidation, generalValidation } = require('./validation')
const res = require('express/lib/response');
const { mathUtil, constants } = require('./utils')
const myArgs = process.argv.slice(2)

const allSettled = require('promise.allsettled');
allSettled.shim()

const PORT = 3000
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
    checkSchema(exchangeValidation.initSessionPostCheckSchema),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }
        let session_id = req.body.session_id
        let estimated_traffic = req.body.estimated_traffic
        let bidders = req.body.bidders
        let bidder_setting = req.body.bidder_setting
        if (!(session_id in session_db)) {
            session_db[session_id] = {
                estimated_traffic,
                bidders,
                bidder_setting
            }
            let endpoints = []
            bidders.forEach(bidder => {
                let route = 'init_session'
                if (bidder.endpoint[bidder.endpoint.length - 1] != '/')
                    route = '/' + route
                endpoints.push(bidder.endpoint + route)
            });
            const result = await Promise.allSettled(
                endpoints.map((endpoint) => {
                    return axios.post(endpoint, {
                        session_id,
                        estimated_traffic,
                        budget: bidder_setting.budget,
                        impression_goal: bidder_setting.impression_goal
                    }, { timeout: constants.DEFAULT_TIMEOUT }
                    )
                }
                )
            )
            res.json({ result: 'ok'})
        } else {
            return res.status(400).json({ error: `session_id ${session_id} has already initialized before` });
        }
    })

app.post('/end_session',
    checkSchema(generalValidation.endSessionSchemaCheck),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
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
            return res.status(400).json({ error: errors.array() });
        }
        let session_id = req.body.session_id
        let request_id = req.body.request_id
        let win_bid = {
            name: "",
            price: 0
        }
        let bid_responses = [
            {
                name: "",
                price: 0
            }
        ]
        return res.json({
            session_id,
            request_id,
            win_bid,
            bid_responses
        })
    }
)

app.listen(port, () => {
    console.log(`Bidder server listening on port ${port}`)
})

module.exports = app
