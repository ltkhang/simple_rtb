const express = require('express')
const cors = require('cors')
const { checkSchema, validationResult, check } = require('express-validator');
const {bidderValidation, generalValidation} = require('./validation')
const {mathUtil} = require('./utils')
const myArgs = process.argv.slice(2)

const DEFAULT_BID = mathUtil.getRandomFloat()

// Check if PORT provided correctly
if (myArgs.length != 1) {
    console.log('Need to provide only 1 parameter as entry PORT')
    process.exit(1)
}

let port = parseInt(myArgs[0], 10)

if (isNaN(port)){
    console.log('Port value should be a number')
    process.exit(1)
}

// Init express instance
const app = express()

// use middle ware to parse json
app.use(express.json({type: 'application/json'}))

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
          return res.status(400).json({error: errors.array() });
        }
        let session_id = req.body.session_id
        if (!(session_id in session_db)){
            session_db[session_id] = {}
        }

        return res.json({result: 'ok'})
})

app.post('/end_session',
    checkSchema(generalValidation.endSessionSchemaCheck),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({error: errors.array() });
        }
        let session_id = req.body.session_id
        delete session_db[session_id]
        return res.json({result: 'ok'})
})

app.post('/bid_request',
    checkSchema(generalValidation.bidRequestSchemaCheck),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({error: errors.array() });
        }
        let session_id = req.body.session_id
        let request_id = req.body.request_id
        let user_id = req.body.user_id
        let floor_price = req.body.floor_price
        let timeout_ms = req.body.timeout_ms
        let price = 0
        // check if session_id has been initialized
        if (!(session_id in session_db)){
            return res.status(400).json({error: 'session_id has not been initialized'})
        }
        // store the information of user
        if (!(user_id in session_db[session_id])){
            session_db[session_id][user_id] = {}
        }

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
        return res.status(400).json({error: errors.array() });
        }
        res.end(JSON.stringify({result: 'ok'}))
})

app.listen(port, () => {
    console.log(`Bidder server listening on port ${port}`)
})

