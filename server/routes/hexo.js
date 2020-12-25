var express = require('express');
var router = express.Router();
var {isLogin} = require('../../lib/util');

/* GET home page. */
router.get('/', function (req, res, next) {
    if (isLogin(req)) {
        if (req.query.pjax) {
            res.render('post');
        } else {
            res.render('index', { wsPort: olConfig.wsPort, path: "hexo", ssl: olConfig.ssl });
        }
    } else {
        res.render('login', { script: '' });
    }
});

module.exports = router;