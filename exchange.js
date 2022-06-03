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
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }
        let session_id = req.body.session_id
        if (!(session_id in session_db)) {
            return res.status(400).json({ error: `session_id ${session_id} has not initialized` });
        }

        let floor_price = req.body.floor_price
        let timeout_ms = req.body.timeout_ms
        
        let user_id = req.body.user_id
        let request_id = req.body.request_id
        let bidders = session_db[session_id]['bidders']


        // inject response time: https://stackoverflow.com/a/59885486
        const instance = axios.create()
        instance.interceptors.request.use((config) => {
            config.headers['request-startTime'] = process.hrtime()
            return config
        })
        
        instance.interceptors.response.use((response) => {
            const start = response.config.headers['request-startTime']
            const end = process.hrtime(start)
            const milliseconds = Math.round((end[0] * 1000) + (end[1] / 1000000))
            response.headers['request-duration'] = milliseconds
            return response
        })

        let endpoints = []
            bidders.forEach(bidder => {
                let route = 'bid_request'
                if (bidder.endpoint[bidder.endpoint.length - 1] != '/')
                    route = '/' + route
                endpoints.push(bidder.endpoint + route)
            });
            const http_result = await Promise.allSettled(
                endpoints.map((endpoint) => {
                    return instance.post(endpoint, {
                        floor_price,
                        timeout_ms,
                        session_id,
                        user_id,
                        request_id
                    }, { timeout: timeout_ms }
                    )
                }
                )
            )
            let winner = 0
            let price = -1
            let min_response = 0
            let bid_responses = [] 
            for (let i = 0; i < http_result.length; i++){
                result = http_result[i]
                if (result.status == 'fulfilled')
                    if (result.value.status == constants.STATUS_OK){
                        let bidder_name = bidders[i]['name']
                        let bidder_price = result.value.data.price
                        let bidder_response_time = result.value.headers['request-duration']
                        
                        if (bidder_price > -1){
                            bid_responses.push({
                                name: bidder_name,
                                price: bidder_price
                            })

                            if ((bidder_price > price) || (bidder_price == price && bidder_response_time < min_response)){
                                winner = i
                                price = bidder_price
                                min_response = bidder_response_time
                            }
                        }
                    }
            }

        let name = ""
        if (price > -1){
            name = bidders[winner]['name']
            let endpoint = bidders[winner]['endpoint']
            let route = 'notify_win_bid'
            if (endpoint[endpoint.length - 1] != '/')
                route = '/' + route
            endpoint = endpoint + route
            try {
                await axios.post(endpoint, {
                    session_id,
                    request_id,
                    clear_price: price
                }, {timeout: constants.DEFAULT_TIMEOUT})
            } catch {
                
            }
        }
        let win_bid = {
            name,
            price
        }
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
