
const { kafka} = require("./kafka-client.js")
const admin = kafka.admin();
async function init(){
    try {
        console.log("Kafka admin connecting...")
        admin.connect()
        console.log("Kafka admin connected");
        console.log("Creating topic")
        await admin.createTopics({
            topics:[{
                topic:"dbUpdates",
                numPartitions:2
            }]
        })
        await admin.listTopics()
        await admin.disconnect()
    } catch (error) {
        console.log(error)
    }
    console.log("Disconnected");
}
init()