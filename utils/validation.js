const checkDuplicationArraryValues = (arr) => {
    return (new Set(arr)).size !== arr.length
}

module.exports = {checkDuplicationArraryValues}