var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var videoRoute =  require('./routes/videoRoute'); 
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const cors = require('cors');
var loginRouter = require('./routes/login')
var SignupRouter = require('./routes/signup');
var SendOtpRouter = require('./routes/sendotp')
var mongoose = require('mongoose');
var dashboardRouter = require('./routes/dashboardRoute');
var VerifyOtpRouter = require('./routes/verifotp');
var captionRouter = require('./routes/captionRoute' ) ; 
var cctvRouter = require('./routes/cctvRoute');
var captionPlaceRouter = require('./routes/captionplaceRoute');
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api' , videoRoute) ; 
app.use('/api' , captionRouter );
app.use('/api', SignupRouter);
app.use('/api', loginRouter);
app.use('/api', SendOtpRouter);
app.use('/api', cctvRouter);
app.use('/api', dashboardRouter);
app.use('/api', VerifyOtpRouter);
app.use('/api', captionPlaceRouter);
// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });


const uri = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.3"

mongoose
  .connect(uri)
  .then(() => {
    console.log('MongoDb is connected');
  })
  .catch((err) => {
    console.log(err);
  });
console.log("testing2");

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
