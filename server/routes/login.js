var express = require('express');
var router = express.Router();
var models = require('../../models');

/* GET home page. */
router.post('/', async function (req, res, next) {
    let name = req.body.username; 
    let pwd = req.body.password;
    if (name && pwd) {
        let user = await models.users.findOne({
            where: {
                username: name,
            }
        });
        if (user) {
            let result = await models.users.findOne({
                where: {
                    username: name,
                    password: pwd
                }
            });
            if (result) {
                excuteLogion(req, res, result);
            } resetLogion(res, '密码错误！请重新输入！');
        } else resetLogion(res, '用户不存在！请输入正确用户！');
    } else {
        res.render('login', { script: '' });
    }
});

function excuteLogion(req, res, result) {
    req.session.user = result.username;
    req.session.isLogin = true;
    setPublicPath(result);
    res.redirect(olConfig.indexPath);
}

function setPublicPath(result) {
    olConfig.source_dir = `blog/${result.username}/source`;
    olConfig.base_dir = `blog/${result.username}/`;
}

function resetLogion(res, msg) {
    res.render('login', { script: `Tip("${msg}")` });
}

module.exports = router;