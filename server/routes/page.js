var express = require('express');
var router = express.Router();
var fs = require("fs");
var path = require("path");
var {isLogin} = require('../../lib/util');

/* GET home page. */
router.get('/', function (req, res, next) {
    if (isLogin(req)) {
        fs.readdir(olConfig.source_dir, function (err, files) {
            let pages = [];
            if (err) {
                res.render('page', { pages });
                console.error(err);
                return;
            }
            pages = getPages(files);
            if (req.query.pjax) {
                res.render('page', { pages, autoSave: olConfig.autoSave,  });
            } else {
                res.render('index', { wsPort: olConfig.wsPort, path: "page", pages, autoSave: olConfig.autoSave, ssl: olConfig.ssl });
            }
        });
    } else {
        res.render('login', { script: '' });
    }
});
function getPages(files, pages = []) {
    files.map((e, i) => {
        if (/^_/.test(e)) return e;
        let stats = fs.statSync(path.join(olConfig.source_dir, e));
        if (stats.isDirectory()) {
            let files = fs.readdirSync(path.join(olConfig.source_dir, e));
            if (files.includes("index.md")) {
                pages.push(e);
            }
        }
    });
    return pages;
}
module.exports = router;