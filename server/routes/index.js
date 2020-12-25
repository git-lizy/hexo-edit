var express = require('express');
var router = express.Router();
var {isLogin} = require('../../lib/util');

/* GET home page. */
router.get('/', function (req, res, next) {
  if (isLogin(req)) {
    res.render('index', { wsPort: olConfig.wsPort, ssl: olConfig.ssl });
  } else {
    res.render('login', { script: '' });
  }
});

module.exports = router;
