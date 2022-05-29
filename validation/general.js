const errorHandler = (err, req, res, next) => {
    res.end(JSON.stringify({error: err.message}))
}

const endSessionSchemaCheck = {
    session_id: {
        isLength: {
            errorMessage: 'session_id must not empty',
            options: {min: 1}
        },
    }
}

const bidRequestSchemaCheck = {
    floor_price: {
        isFloat: {
            options: [{
                min: 0
            }],
            errorMessage: 'floor_price must be greater or equal 0'
        },
        toFloat: true
    },
    timeout_ms: {
        isInt: {
            options: [{
                min: 1
            }],
            errorMessage: 'timeout_ms must be greater or equal 0'
        }
    },
    session_id: {
        isLength: {
            errorMessage: 'session_id must not empty',
            options: {min: 1}
        },
    },
    user_id: {
        isLength: {
            errorMessage: 'user_id must not empty',
            options: {min: 1}
        },
    },
    request_id: {
        isLength: {
            errorMessage: 'request_id must not empty',
            options: {min: 1}
        },
    },
}

module.exports = {errorHandler, endSessionSchemaCheck, bidRequestSchemaCheck}