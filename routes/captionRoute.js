var express = require('express')
var router = express.Router() ;

router.get('/caption', (req, res) => {
    const captions = [
        { time: 0, text: "Video started." },
        { time: 10, text: "Person detected." },
        { time: 30, text: "Suspicious activity detected." }
    ];
    res.json(captions);
});


module.exports = router ; 
// implement in later 