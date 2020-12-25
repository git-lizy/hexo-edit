var express = require('express');
var router = express.Router();
var fs = require("fs");
var path = require("path");
var {isLogin} = require('../../lib/util');

/* GET home page. */
router.get('/', function (req, res, next) {
    if (isLogin(req)) {
        let fileName = req.query.post.replace("%23", "") + '.md';
        fs.readFile(path.join(olConfig.source_dir, '_posts/', fileName), function (err, data) {
            if (err) {
                send("读取文件\"" + fileName + "\"失败", "error");
                res.json({ success: false, data: err });
                console.error(err);
                return;
            }
            res.json({ success: true, data: data.toString() });
        });
    } else {
        res.render('login', { script: '' });
    }
});
module.exports = router;