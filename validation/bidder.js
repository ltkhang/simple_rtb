const initSessionPostCheckSchema = {
    session_id: {
        isLength: {
            errorMessage: 'session_id must not empty',
            options: {min: 1}
        },
    },
    estimated_traffic: {
        isInt: {
            options: [{
                min: 0,
                max: 1000000
            }],
            errorMessage: 'estimated_traffic must be from 0 to 1000000'
        },
        toInt: true
    },
    budget: {
        isFloat: {
            options: [{
                min: 0
            }],
            errorMessage: 'budget must be greater or equal 0'
        },
        toFloat: true
    },
    impression_goal: {
        isInt: {
            options: [{
                min: 0,
                max: 1000000
            }],
            errorMessage: 'impression_goal must be from 0 to 1000000'
        },
        toInt: true
    }
}

const notifyWinBidSchemaCheck = {
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
    clear_price: {
        isFloat: {
            options: [{
                min: 0
            }],
            errorMessage: 'clear_price must be greater or equal 0'
        },
        toFloat: true
    },
}

module.exports = {initSessionPostCheckSchema, notifyWinBidSchemaCheck}