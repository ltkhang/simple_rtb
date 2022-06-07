# simple_rtb

# How to start the system

## Manually

Step 1: Install nodejs and libraries

- Install nodejs on your system
- ```cd <project directory>```, e.g: cd simple_rtb
- ```npm install```

Step 2: Install docker
- Install docker on your system
- ```cd simple_rtb\DB-Docker```
- Run docker container of MongoDB ```docker-compose up -d```

Start exchange sever

```
node exchange.js <port>
```

if port is not specified, the default 3000 will be used

e.g:

```
node exhchange.js 3000
```

Start bidder server(s)

```
node bidder.js <port> <bidderName>
```

if port is not specified, the default 4000 will be used
e.g:

```
node bidder.js 4001 bidder 1
```

Example request body for /init_session

```
{
    "session_id": 1234,
    "estimated_traffic": 10,
    "bidders": [
        {
        "name": "bidder1",
        "endpoint": "http://localhost:4001/"
        },
        {
        "name": "bidder2",
        "endpoint": "http://localhost:4002/"
        }
    ],
    "bidder_setting": {
        "budget": 1000,
        "impression_goal": 5
    }
}
```

## Automatically

- Install docker on your system
- ```cd simple_rtb```
- ```docker-compose up```
  
Exchange server: local-ip:9000

2 bidders server:
- local-ip:10001
- local-ip:10002
  
if you would like to add more bidder server, you can use this template to add more block to docker-compose.yml

```
<bidder name>:
    build:
      context: .
      dockerfile: bidder.Dockerfile
    environment:
      - MONGODB_CONNECTION_STRING=mongodb://root:root@mongo:27017/
      - MONGODB_DB_NAME=<bidder name>
    depends_on:
      - mongo
    ports:
      - '<unqiue port>:4000'
```

Example request body for exchange, we need to use ip of the specific machine in "bidders".

```
{
    "session_id": 1234,
    "estimated_traffic": 10,
    "bidders": [
        {
        "name": "bidder2",
        "endpoint": "http://192.168.0.4:10002/"
        },
        {
        "name": "bidder1",
        "endpoint": "http://192.168.0.4:10001"
        }
    ],
    "bidder_setting": {
        "budget": 1000,
        "impression_goal": 5
    }
}
```

# Document

## Bidding strategy

References:
- https://python.quantecon.org/two_auctions.html
- https://www.youtube.com/watch?v=MROR272191E

### Problem statement:

As I analyzed, this is the "First-price sealed-bid auction" in game theory.

Based on reference, the best strategy is:

Assume we have N bidders, the bidding price will be ``` price = valuation * (N - 1) / N```

"Valuation" is the willing-to-pay price of each bidder, in this case, I use the formular

```
valuation = (budget - total_spending) / (impression_goal - number_of_win_impression)
```

where

- budget: the maximum spending
- total_spending: the total amount of win bid
- impression_goal: the total impression a bidder must win
- number_of_win_impression: number of impression already win

Therefore, the initial valuation, when total_spending and number_of_win_impression equal to 0, will be

```
valuation = budget / impression_goal
```

## System diagram

### Exchange server

![](images/exchange.png)

### Bidder server

![](images/bidder.png)

# Benchmark capacity

The test client is written in python for parallel call api with threading programming

To run stress test (python3):

- ```cd client```
- ```pip install -r requirements.txt``` to install library of python
- ```python client.py```