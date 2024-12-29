const express = require('express');
const { Kafka } = require('kafkajs');
const mongoose = require('mongoose');
const { cosineSimilarity } = require('../utils/cosineSimilarity'); 
const sentimentAnalysis = require('../utils/sentimentAnalysis'); 
const generateCaption = require('../utils/generatecaption'); 

const router = express.Router();

// MongoDB models
const Caption = require('../models/caption'); 
const Cctv = require('../models/cctv');

// Kafka configuration
const kafka = new Kafka({
    clientId: 'cctv-monitoring',
    brokers: ['localhost:9092'], // Replace with actual Kafka brokers
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'cctv-consumers' });
const topicPrefix = 'cctv-frames';

// Connect Kafka producer
(async () => {
    await producer.connect();
    console.log('Kafka producer connected');
})();

// Subscribe Kafka consumer to topics
(async () => {
    try {
        await consumer.connect();
        console.log('Kafka consumer connected');

        const topics = [`${topicPrefix}-1`, `${topicPrefix}-2`]; // Add all topics you want to subscribe to
        await Promise.all(
            topics.map((topic) => consumer.subscribe({ topic, fromBeginning: true }))
        );
        console.log(`Subscribed to topics: ${topics.join(', ')}`);

        // Continuous monitoring and processing
        consumer.run({
            eachMessage: async ({ topic, message }) => {
                try {
                    const frameData = JSON.parse(message.value.toString());
                    const { cctvId, frameNumber, data: frameContent } = frameData;

                    const lastCaption = await Caption.findOne({ cctvid: cctvId }).sort({ date: -1 });
                    const lastFrameContent = lastCaption?.caption || '';

                    if (cosineSimilarity(frameContent, lastFrameContent) < 0.9) {
                        const caption = generateCaption(frameContent);
                        const sentiment = sentimentAnalysis(caption);

                        const newCaption = new Caption({
                            cctvid: cctvId,
                            locationId: frameData.locationId,
                            caption: `${caption} | ${sentiment}`,
                            date: new Date(),
                        });
                        await newCaption.save();
                        console.log(`Caption saved for CCTV ID: ${cctvId}`);
                    } else {
                        console.log(`Redundant frame ignored for CCTV ID: ${cctvId}`);
                    }
                } catch (error) {
                    console.error('Error processing frame:', error);
                }
            },
        });
    } catch (error) {
        console.error('Error initializing Kafka consumer:', error);
    }
})();

// API routes remain unchanged
router.post('/start', async (req, res) => {
    const { cctvIds } = req.body;
    if (!Array.isArray(cctvIds) || cctvIds.length === 0) {
        return res.status(400).json({ message: 'Invalid CCTV IDs' });
    }

    const frameInterval = 1000; // 1 frame per second
    const maxFrames = 10;

    cctvIds.forEach((cctvId) => {
        let frameCount = 0;

        const sendFrame = async () => {
            if (frameCount < maxFrames) {
                const frameData = {
                    cctvId,
                    frameNumber: frameCount,
                    timestamp: new Date().toISOString(),
                    locationId: `loc-${cctvId}`,
                    data: `Mock frame content for CCTV ID ${cctvId} frame ${frameCount}`,
                };

                const topic = `${topicPrefix}-${cctvId}`;
                await producer.send({
                    topic,
                    messages: [{ value: JSON.stringify(frameData) }],
                });

                console.log(`Produced frame ${frameCount} for CCTV ID: ${cctvId}`);
                frameCount++;
                setTimeout(sendFrame, frameInterval);
            }
        };

        sendFrame();
    });

    res.status(200).json({ message: 'Started frame production for CCTV IDs', cctvIds });
});

router.get('/captions/:cctvId', async (req, res) => {
    const { cctvId } = req.params;

    try {
        const captions = await Caption.find({ cctvid: cctvId }).sort({ date: 1 });
        res.status(200).json({ cctvId, captions });
    } catch (error) {
        console.error('Error fetching captions:', error);
        res.status(500).json({ message: 'Error fetching captions', error: error.message });
    }
});

module.exports = router;
