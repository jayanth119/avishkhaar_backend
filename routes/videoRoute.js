const express = require('express');
const fs = require('fs');
const path = require('path');
const { Kafka } = require('kafkajs');
const { createCanvas, loadImage } = require('canvas');

const router = express.Router();

// Kafka configuration
const kafka = new Kafka({
    clientId: 'cctv-frame-producer',
    brokers: ['localhost:9092'], // Replace with your Kafka broker(s)
});
const producer = kafka.producer();
const topicPrefix = 'cctv-frames'; // Kafka topic name prefix

// Function to process video frames and send to Kafka
const convertVideoToFrames = async (videoPath, cctvId) => {
    await producer.connect();
    console.log(`Kafka producer connected for CCTV ID: ${cctvId}`);

    const canvas = createCanvas(640, 360); // Adjust dimensions as needed
    const ctx = canvas.getContext('2d');

    const video = await loadImage(videoPath); // Simulate video loading (replace with actual video processing library if needed)
    let frameCount = 0;
    const frameInterval = 1000; // 1 frame per second

    const sendFrame = async () => {
        if (frameCount < 10) { // Example: Produce 10 frames (adjust as needed)
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to image buffer
            const imageBuffer = canvas.toBuffer('image/png');

            // Send frame to Kafka
            const topic = `${topicPrefix}-${cctvId}`;
            await producer.send({
                topic,
                messages: [
                    {
                        key: `frame_${frameCount}`,
                        value: imageBuffer.toString('base64'), // Send as base64 string
                    },
                ],
            });

            console.log(`Produced frame_${frameCount} for CCTV ID: ${cctvId}`);

            frameCount++;
            setTimeout(sendFrame, frameInterval);
        } else {
            await producer.disconnect();
            console.log(`Kafka producer disconnected for CCTV ID: ${cctvId}`);
        }
    };

    sendFrame();
};

// API route to start frame extraction for a specific CCTV
router.post('/process/:cctvId', async (req, res) => {
    const { cctvId } = req.params;
    const videoPath = path.join(__dirname, 'videoplayback.mp4'); // Example naming pattern for CCTV videos

    if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ message: `Video for CCTV ID: ${cctvId} not found` });
    }

    try {
        convertVideoToFrames(videoPath, cctvId);
        res.status(200).json({ message: `Started processing video for CCTV ID: ${cctvId}` });
    } catch (error) {
        console.error(`Error processing video for CCTV ID: ${cctvId}`, error);
        res.status(500).json({ message: `Error processing video for CCTV ID: ${cctvId}` });
    }
});

// API route to list available CCTV videos
router.get('/list', (req, res) => {
    const videoDir = __dirname;
    const videoFiles = fs.readdirSync(videoDir).filter(file => file.endsWith('.mp4'));
    const cctvIds = videoFiles.map(file => file.replace('cctv_', '').replace('.mp4', ''));

    res.status(200).json({ cctvIds });
});

module.exports = router;
