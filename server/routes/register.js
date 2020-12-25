var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('register', { script: '' });
}).post('/info', function (req, res, next) {
    if (req.body.user && req.body.password) {
        req.session.user = olConfig.user;
        req.session.isLogin = true;
        res.redirect(olConfig.indexPath);
    }
});
module.exports = router;