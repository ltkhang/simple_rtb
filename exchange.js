const express = require('express')
const cors = require('cors')
const { checkSchema, validationResult, check } = require('express-validator');
const {exchangeValidation, generalValidation} = require('./validation')
const {mathUtil} = require('./utils');
const res = require('express/lib/response');
const myArgs = process.argv.slice(2)


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
    checkSchema(exchangeValidation.initSessionPostCheckSchema),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({error: errors.array() });
        }
        let session_id = req.body.session_id
        if (!(session_id in session_db)){
            session_db[session_id] = {}
        }

        res.end(JSON.stringify({result: 'ok'}))
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
