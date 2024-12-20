var express = require('express') ; 
var router = express.Router();
const fs = require('fs');
const path = require('path');



// Path to your video file
const videoPath = path.join(__dirname, 'video.mp4');

router.get('/stream', (req, res) => {
  const range = req.headers.range;
  if (!range) {
    res.status(400).send('Requires Range header');
    return;
  }

  // Video duration in seconds (approximation)
  const videoDuration = 3 * 60; // 15 minutes in seconds
  const chunkDuration = 2 * 60; // 2 minutes in seconds

  // File stats to get the size of the video
  const videoStats = fs.statSync(videoPath);
  const videoSize = videoStats.size;

  // Compute start and end byte range
  const CHUNK_SIZE = Math.ceil((chunkDuration / videoDuration) * videoSize);
  const start = Number(range.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // Headers to inform the browser about the streamed content
  const contentLength = end - start + 1;
  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': 'video/mp4',
  });

  // Create a readable stream and pipe it to the response
  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
});

module.exports = router  ; 
