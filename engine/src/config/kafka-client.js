const {Kafka} = require("kafkajs");
exports.kafka = new Kafka({
    clientId:"probo",
    brokers:["192.168.0.55:9092"]
});