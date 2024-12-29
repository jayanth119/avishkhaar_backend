const { Kafka } = require('kafkajs');
// Kafka Configuration
const kafka = new Kafka({
    clientId: 'cctv-monitoring-producer',
    brokers: ['localhost:9092'], // Replace with your Kafka brokers
});

const producer = kafka.producer(); 

module.exports = producer; 
