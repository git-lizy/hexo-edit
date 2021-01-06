var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
global.olConfig = require('../config/config.json');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'editor.md')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'ENGTRON',
  resave: false,
  saveUninitialized: true,
  cookie: { user: "default", isLoadingGenerate: false }
}));

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var registerRouter = require('./routes/register');
var logoutRouter = require('./routes/logout');
var shellRouter = require('./routes/shell');
var hexoRouter = require('./routes/hexo');
var postRouter = require('./routes/post');
var getPostRouter = require('./routes/getPost');
var pageRouter = require('./routes/page');
var getPageRouter = require('./routes/getPage');
var getImgRouter = require('./routes/readImg');
var downLoadFileRouter = require('./routes/downLoadFile');

let indexPath = olConfig.indexPath;
app.use(indexPath, indexRouter);
app.use(indexPath + 'login', loginRouter);
app.use(indexPath + 'register', registerRouter);
app.use(indexPath + 'logout', logoutRouter);
app.use(indexPath + 'shell', shellRouter);
app.use(indexPath + 'hexo', hexoRouter);
app.use(indexPath + 'post', postRouter);
app.use(indexPath + 'getPost', getPostRouter);
app.use(indexPath + 'page', pageRouter);
app.use(indexPath + 'getPage', getPageRouter);
app.use(indexPath + 'readImg', getImgRouter);
app.use(indexPath + 'download_file', downLoadFileRouter);

app.use(function (req, res, next) {
  res.redirect(indexPath)
});

// app.get('', function (req, res) {
//   res.sendFile( __dirname + "/" + req.url);
//   console.log("Request for " + req.url + " received.");
// })

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
