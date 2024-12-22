const { Kafka } = require('kafkajs');
// Kafka configuration
const kafka = new Kafka({
    clientId: 'video-frame-producer',
    brokers: ['localhost:9092'], // Replace with your Kafka broker(s)
});
const producer = kafka.producer();
const topic = 'video-frames'; // Kafka topic name
