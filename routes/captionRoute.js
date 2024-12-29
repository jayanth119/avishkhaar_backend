var express = require('express');
var router = express.Router();

router.get('/caption', (req, res) => {
    const captions = [
        { time: 0, text: "Finnish forest, late autumn, 26.11.2014: parking lot with a test track. In the parking area, the BMW E89 M3 is parked, which was tested before sending to Finland." },
        { time: 10, text: "A gray car emitting heavy smoke from a source beneath the vehicle in a hazy, cloudy environment." },
        { time: 20, text: "The image depicts a scene from a car accident occurring during a rainy day. A blue car is shown with its windows half-closed, and water droplets are visible on the glass. The rear part of the car appears to be damaged, likely due to a collision, with noticeable dents and swirling mud on the paint. The image background shows foliage and a foggy atmosphere, indicating the challenging driving conditions." },
        { time: 30, text: "A vehicle is damaged after a minor road accident, and cones have been set up to cordon off the area." },
        { time: 40, text: "This is an image of a purple-colored car from a first-person perspective, showing the driver’s side. The rearview mirror is slightly visible, displaying the dark interior of the car. The image appears to be captured during heavy rain or snow, with raindrops and specks visible on the windshield and vehicle's surface. The wheel is partially obscured, and the background suggests a wet road and possibly stormy conditions. The image also contains the watermark 'Storyblocks'." },
        { time: 50, text: "This image shows a grey BMW car driving through a rural, grassy area that appears to be in a state of flooding. The car is moving towards a road with orange traffic cones, indicating a possible road construction or safety barrier. The scene is under a grey or overcast sky, and there is significant mud splashing around the vehicle, suggesting muddy or wet terrain. The environment is otherwise quite natural." }
    ];
    res.json(captions);
});

router.get('/summary' , 
    (req , res ) =>{
           res.json({summary : "The summary describes a series of images showing car accidents and vehicle damage scenarios in various settings, including collisions, mechanical failures, and environmental challenges. The images depict damaged vehicles with details like bent suspension components, emitting smoke, and muddy terrain, as well as the aftermath of accidents with cones set up and a person inside a partially damaged car. The scenes suggest hazardous driving conditions and the need for repairs or scrapping."}); 
    }
)
module.exports = router;
