const getRandomFloat = (min, max, decimals) => {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);
    return parseFloat(str);
}

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {getRandomFloat, getRandomInt}


