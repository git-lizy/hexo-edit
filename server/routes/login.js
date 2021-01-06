var express = require('express')
var router = express.Router()
var models = require('../../models')
var multer = require('multer')
var path = require('path')
var CryptoJS = require('crypto-js');
global.upload = multer({ dest: '/img' }) //用于指定上传文件 dest指定路径

/* GET home page. */
router.post('/', async function (req, res, next) {
    let name = req.body.username; 
    let pwd = req.body.password;
    if (name && pwd) {
        let users = await models.users.findAll({
            where: {
                username: name,
            }
        });
        if (users.length) {
            pwd = aesDecrypt(pwd, 'engtron');
            findUser({req, res, users, name, pwd});
        } else resetLogion(res, '用户不存在！请联系管理员！');
    } else {
        res.render('login', { script: '' });
    }
});

function findUser(params) {
    let result = params.users.find( user => {
        return user.username === params.name && user.password === params.pwd;
    });
    if (result) {
        excuteLogion(params.req, params.res, result);
    } else resetLogion(params.res, '密码错误！请重新输入！');
}

function aesDecrypt(encrypted, key) {
    let decrypted = CryptoJS.AES.decrypt(encrypted, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
}

function excuteLogion(req, res, result) {
    req.session.user = result.username;
    req.session.isLogin = true;
    setPublicPath(result);
    res.redirect(olConfig.indexPath);
}

function setPublicPath(result) {
    global.olConfig.source_dir = `${olConfig.root}/${result.username}/${olConfig.source}`;
    global.olConfig.base_dir = `${olConfig.root}/${result.username}`;
    global.upload = multer({ dest: path.join(global.olConfig.source_dir, '/img') });
}

function resetLogion(res, msg) {
    res.render('login', { script: `Tip("${msg}")` });
}

module.exports = router;