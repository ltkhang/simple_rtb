const request = require('supertest')
const async = require('async')
const bidder = require('./bidder')
const { mathUtil } = require('./utils')

describe('Bidder test', () => {
    const agent = request.agent(bidder)
    it('POST init_session -> ok', async () => {
        session_id = mathUtil.getRandomInt(10000, 20000)
        return agent
            .post('/init_session')
            .send({
                'session_id': session_id,
                'estimated_traffic': 100,
                'budget': 100000,
                'impression_goal': 10
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                        result: 'ok'
                    })
                )
                agent
                    .post('/end_session')
                    .send({
                        'session_id': session_id
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((response) => {
                        expect(response.body).toEqual(
                            expect.objectContaining({
                                result: 'ok'
                            })
                        )
                    })
            })
    })

    it('POST init_session -> error', async () => {
        return async.parallel({
            absentSessionID: (cb) => {
                agent.post('/init_session')
                    .send({
                        'estimated_traffic': 100,
                        'budget': 100000,
                        'impression_goal': 10
                    })
                    .expect('Content-Type', /json/)
                    .expect(400, cb)
            },
            absentEstimatedTraffic: (cb) => {
                agent.post('/init_session')
                    .send({
                        'session_id': mathUtil.getRandomInt(10000, 20000),
                        'budget': 100000,
                        'impression_goal': 10
                    })
                    .expect('Content-Type', /json/)
                    .expect(400, cb)
            },
            budgetLessThanZero: (cb) => {
                agent.post('/init_session')
                    .send({
                        'session_id': mathUtil.getRandomInt(10000, 20000),
                        'estimated_traffic': 100,
                        'budget': -1,
                        'impression_goal': 10
                    })
                    .expect('Content-Type', /json/)
                    .expect(400, cb)
            },
            impressionGoalOverMax: (cb) => {
                agent.post('/init_session')
                    .send({
                        'session_id': mathUtil.getRandomInt(10000, 20000),
                        'estimated_traffic': 100,
                        'budget': 0,
                        'impression_goal': 1000001
                    })
                    .expect('Content-Type', /json/)
                    .expect(400, cb)
            }
        }, (err, result) => {
            for (const task in result) {
                expect(result[task].body).toHaveProperty('error')
            }
        })
    })

    it('POST /end_session -> ok', async () => {
        return agent
            .post('/end_session')
            .send({
                'session_id': mathUtil.getRandomInt(10000, 20000)
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                        result: 'ok'
                    })
                )
            })
    })

    it('POST init_session -> bid_request -> ok', async () => {
        session_id = mathUtil.getRandomInt(10000, 20000)
        return agent
            .post('/init_session')
            .send({
                'session_id': session_id,
                'estimated_traffic': 100,
                'budget': 100000,
                'impression_goal': 10
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                        result: 'ok'
                    })
                )
                agent.post('/bid_request')
                    .send({
                        "floor_price": 7000,
                        "timeout_ms": 100,
                        "session_id": session_id,
                        "user_id": "1",
                        "request_id": "1"
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((response) => {
                        expect(response.body).toEqual(
                            expect.objectContaining({
                                session_id: session_id.toString(),
                                request_id: "1",
                                price: expect.any(Number)
                            })
                        )
                    })
            })
    })

    it('POST init_session -> bid_request -> notify_win_bid -> ok', async () => {
        session_id = mathUtil.getRandomInt(10000, 20000)
        return agent
            .post('/init_session')
            .send({
                'session_id': session_id,
                'estimated_traffic': 100,
                'budget': 100000,
                'impression_goal': 10
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                        result: 'ok'
                    })
                )
                agent.post('/bid_request')
                    .send({
                        "floor_price": 7000,
                        "timeout_ms": 100,
                        "session_id": session_id,
                        "user_id": "1",
                        "request_id": "1"
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((response) => {
                        expect(response.body).toEqual(
                            expect.objectContaining({
                                session_id: session_id.toString(),
                                request_id: "1",
                                price: expect.any(Number)
                            })
                        )
                        agent
                            .post('/notify_win_bid')
                            .send({
                                'session_id': session_id,
                                'request_id': 1,
                                'clear_price': 0
                            })
                            .expect('Content-Type', /json/)
                            .expect(200)
                            .then((response) => {
                                expect(response.body).toEqual(
                                    expect.objectContaining({
                                        result: 'ok'
                                    })
                                )
                            })

                            agent
                            .post('/end_session')
                            .send({
                                'session_id': session_id
                            })
                            .expect('Content-Type', /json/)
                            .expect(200)
                            .then((response) => {
                                expect(response.body).toEqual(
                                    expect.objectContaining({
                                        result: 'ok'
                                    })
                                )
                            })
                    })
            })
    })

})
