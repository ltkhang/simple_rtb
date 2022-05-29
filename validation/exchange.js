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
    bidders: {
        isArray: true,
        errorMessage: 'bidders must be a list of bidder'
    },
    "bidders.*.name": {
        isLength: {
            errorMessage: 'bidder name must not empty',
            options: {min: 1}
        },
    },
    "bidders.*.endpoint": {
        isLength: {
            errorMessage: 'bidder endpoint must not empty',
            options: {min: 1}
        },
    },
    bidder_setting: {
        isObject: true
    },
    "bidder_setting.budget": {
        isFloat: {
            options: [{
                min: 0
            }],
            errorMessage: 'budget in bidder_setting must be greater or equal 0'
        },
        toFloat: true
    },
    "bidder_setting.impression_goal": {
        isInt: {
            options: [{
                min: 0,
                max: 1000000
            }],
            errorMessage: 'impression_goal in bidder_setting must be from 0 to 1000000'
        },
        toInt: true
    }
}
module.exports = {initSessionPostCheckSchema}