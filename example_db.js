const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
    session_id: String,
    estimated_traffic: Number,
    bidders: [
        {
            name: String,
            endpoint: String
        }
    ],
    bidder_setting: {
        budget: Number,
        impression_goal: Number
    }
})

Session = mongoose.model("Session", sessionSchema)
async function run() {
    try {
        let mongodbConnectionString = "mongodb://root:example@localhost:27017/"
        await mongoose.connect(mongodbConnectionString, { dbName: 'exchange' })
        // const session = new Session({
        //     session_id: "1234",
        //     estimated_traffic: 10,
        //     bidders: [
        //         {
        //             name: "bidder2",
        //             endpoint: "http://localhost:4002/"
        //         },
        //         {
        //             name: "bidder1",
        //             endpoint: "http://localhost:4001"
        //         }
        //     ],
        //     bidder_setting: {
        //         budget: 1000,
        //         impression_goal: 5
        //     }
        // })
        // session.save()

        const testSession = await Session.findOne({session_id: 1234})
        console.log(!!testSession)
        await Session.deleteMany({session_id: 1234})
        

    } catch (e) {
        console.log(e.message)
    }
}
run()


