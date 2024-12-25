const express = require('express');
const fs = require('fs');
const path = require('path');
const { Kafka } = require('kafkajs');

const router = express.Router();

// Kafka configuration
const kafka = new Kafka({
    clientId: 'cctv-frame-producer',
    brokers: ['localhost:9092'], // Replace with your Kafka broker(s)
});
const producer = kafka.producer();
const topicPrefix = 'cctv-frames'; // Kafka topic name prefix

// Function to simulate frame data and send to Kafka for multiple CCTV IDs
const processCCTVFrames = async (cctvIds) => {
    await producer.connect();
    console.log('Kafka producer connected');

    const frameInterval = 1000; // 1 frame per second
    const maxFrames = 10; // Number of frames to generate per CCTV (for demo purposes)

    let frameCounts = {}; // Track frame count for each CCTV
    cctvIds.forEach(cctvId => {
        frameCounts[cctvId] = 0;
    });

    const sendFrame = async () => {
        let allFramesProcessed = true;

        for (const cctvId of cctvIds) {
            if (frameCounts[cctvId] < maxFrames) {
                allFramesProcessed = false;

                // Simulate frame data
                const frameData = {
                    cctvId,
                    frameNumber: frameCounts[cctvId],
                    timestamp: new Date().toISOString(),
                    data: `Mock frame data for CCTV ID ${cctvId}, frame ${frameCounts[cctvId]}`,
                };

                // Send frame to Kafka
                const topic = `${topicPrefix}-${cctvId}`;
                await producer.send({
                    topic,
                    messages: [
                        {
                            key: `frame_${frameCounts[cctvId]}`,
                            value: JSON.stringify(frameData),
                        },
                    ],
                });

                console.log(`Produced frame_${frameCounts[cctvId]} for CCTV ID: ${cctvId}`);

                frameCounts[cctvId]++;
            }
        }

        if (!allFramesProcessed) {
            setTimeout(sendFrame, frameInterval);
        } else {
            await producer.disconnect();
            console.log('Kafka producer disconnected');
        }
    };

    sendFrame();
};

// API route to start frame extraction for multiple CCTVs
router.post('/process', async (req, res) => {
    const { cctvIds } = req.body; // Expect an array of CCTV IDs in the request body

    if (!Array.isArray(cctvIds) || cctvIds.length === 0) {
        return res.status(400).json({ message: 'Invalid CCTV IDs' });
    }

    try {
        processCCTVFrames(cctvIds);
        res.status(200).json({ message: 'Started processing mock frames for CCTV IDs', cctvIds });
    } catch (error) {
        console.error('Error processing mock frames:', error);
        res.status(500).json({ message: 'Error processing mock frames', error: error.message });
    }
});

// API route to list available CCTV videos
// router.get('/list', (req, res) => {
//     const videoDir = __dirname;
//     const videoFiles = fs.readdirSync(videoDir).filter(file => file.endsWith('.mp4'));
//     const cctvIds = videoFiles.map(file => file.replace('cctv_', '').replace('.mp4', ''));

//     res.status(200).json({ cctvIds });
// });

module.exports = router;
