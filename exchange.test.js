const request = require('supertest')
const exchange = require('./exchange')

describe('Exchange test', () => {
    const agent = request.agent(exchange)
    it('POST init_session -> ok', async () => {
        return agent
            .post('/init_session')
            .send({
                "session_id": 1234,
                "estimated_traffic": 1,
                "bidders": [{
                    "name": "bidder1",
                    "endpoint": "http://localhost:4001/"
                },
                {
                    "name": "bidder2",
                    "endpoint": "http://localhost:4002/"
                }],
                "bidder_setting": {
                    "budget": 0,
                    "impression_goal": 0
                }
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

    it('POST /end_session -> ok', async () => {
        return agent
            .post('/end_session')
            .send({
                'session_id': 1234
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
        return agent
            .post('/init_session')
            .send({
                "session_id": 1234,
                "estimated_traffic": 1,
                "bidders": [{
                    "name": "bidder1",
                    "endpoint": "http://localhost:4001/"
                },
                {
                    "name": "bidder2",
                    "endpoint": "http://localhost:4002/"
                }],
                "bidder_setting": {
                    "budget": 0,
                    "impression_goal": 0
                }
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
                    .post('/bid_request')
                    .send({
                        "floor_price": 50,
                        "timeout_ms": 1000,
                        "session_id": "1234",
                        "user_id": "1",
                        "request_id": "1"
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((response) => {
                        expect(response.body).toEqual(
                            expect.objectContaining({
                                session_id_id: '1234',
                                request_id: '1',
                                win_bid: expect.objectContaining({
                                    name: expect.any(String),
                                    price: expect.any
                                }),
                                bid_responses: expect.any(Array)
                            })
                        )
                    })
            })
    })
})