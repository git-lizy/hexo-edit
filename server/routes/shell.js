var express = require('express');
var router = express.Router();
var { dateFormat } = require('../../lib/util')
var fs = require("fs");
var path = require("path");
var os = require('os');
var base_fs = require('fs')
var multer = require('multer')
var { isLogin } = require('../../lib/util')
var olConfig = require('../../config/config.json')
const { exec } = require('child_process')
var config = {
    source_dir: '',
    base_dir: '',
    post: '',
    page: '',
    user: ''
}
var upload = multer({ dest: path.join(config.source_dir, '/img') })
var info = {}

/* GET home page. */
router.get('/', function (req, res, next) {
    if (isLogin(req) && !req.session.isLoadingGenerate) {
        setConfigPathValue(req);
        switch (req.query.action) {
            case "pull":
                gitPull();
                res.end();
                break;
            case "push":
                gitPush();
                res.end();
                break;
            case "get_postname":
                info = {
                    name: config.post,
                    type: 'post'
                };
                res.end();
                break
            case "get_pagename":
                info = {
                    name: config.page,
                    type: 'page'
                }
                res.end();
                break
            case "clean":
                hexoClean();
                res.end();
                break;
            case "generate": 
                hexoGenerate(req, res);
                break;
            case "deploy":
                hexoDeploy();
                res.end();
                break;
            // case "server":
            //     hexoServer();
            //     res.end();
            //     break;
            // case "close_server":
            //     //closeServer();
            //     res.end();
            //     break;
            case "new_post":
                new_post(req, res);
                break;
            case "delete_post":
                delete_post(req, res);
                break;
            case "rename_post":
                rename_post(req.query.old_name, req.query.new_name, res);
                break
            case "new_page":
                new_page(req, res);
                break;
            case "delete_page":
                delete_page(req, res);
                break;
            case "rename_page":
                rename_page(req.query.old_name, req.query.new_name, res);
                break;
            default:
                send("Undefined command","error");
                res.end();
                break;
        }
    } else {
        res.render('login', { script: '' });
    }
}).post('/', upload.single('editormd-image-file'), function (req, res, next) {
    if (isLogin(req) && !req.session.isLoadingGenerate) {
        let data = null;
        setConfigPathValue(req);
        switch (req.query.action) {
            case "save_post":
                data = save_post(req.body.post, req.body.data);
                res.json(data);
                break;
            case "save_page":
                data = save_page(req.body.page, req.body.data);
                res.json(data);
                break;
            case "upload_file":
                data = upload_file(req.file);
                res.send(data);
                break;
            default:
                send("Undefined command","error");
                res.end();
                break;
        }
    } else {
        res.render('login', { script: '' });
    }
});
function gitPull() {
    let pull = config.pull;
    cmds(pull);
}
function cmds(commands, i = 0) {
    if (i < commands.length) {
        exec(commands[i].replace("{time}", dateFormat('YYYY-MM-DD HH:mm:ss')), { cwd: config.base_dir }, (error, stdout, stderr) =>{
            if (error) {
                console.log(error);
                return
            }
            cmds(commands, ++i);
        });
    } else {
        send("-----End-----");
    }
}
function gitPush() {
    let push = config.push;
    cmds(push);
}
function hexoClean() {
    exec(`hexo clean`, { cwd: config.base_dir }, (error) =>{ if(error) throw error });
}
function hexoServer() {
    exec(`hexo server`, { cwd: config.base_dir }, (error) =>{ if(error) throw error });
}
function closeServer() {
    let reg = new RegExp(`^.*TCP.*?:${hexo.config.server.port || 4000}.*?LISTEN.*?([\\d]+)`, 'i');
    if (/windows/gim.test(os.type())) {
        exec(`netstat -ano | findstr ${olConfig.port || 4000}`, { cwd: config.base_dir }, (error, stdout, stderr) =>{
            let results = stdout.split("\n");
            for (let i = 0; i < results.length; i++) {
                let res = results[i] ? results[i].match(reg) : null;
                if (res && res[1]) {
                    //shell({ e: ``, sendLog: false, });
                    exec(`taskkill /f /pid ${res[1]}`, { cwd: config.base_dir }, (error) => {throw error});
                    break;
                }
            }
        });
    } else if (/linux/gim.test(os.type())) {
        exec(`netstat -tunlp | grep ${olConfig.port || 4000}`, { cwd: config.base_dir }, (error, stdout, stderr) =>{
                let results = stdout.split("\n");
                for (let i = 0; i < results.length; i++) {
                    let res = results[i] ? results[i].match(reg) : null;
                    if (res && res[1]) {
                        exec(`kill ${res[1]}`, { cwd: config.base_dir }, (error) => {throw error});
                        //shell({ e: ` ${res[1]}`, sendLog: false, next: () => { } });
                        break;
                    }
                }
        });
    }
}
function hexoGenerate(req, res) {
    req.session.isLoadingGenerate = true;
    exec("hexo generate", { cwd: config.base_dir }, error => {
        if (error) {
            console.log(error);
            return
        }
        exec("gulp", { cwd: config.base_dir }, error => {
            if (error) {
                console.log(error);
                return
            }
            req.session.isLoadingGenerate = false;
            res.end();
        })
    });
}
function hexoDeploy() {
    exec("hexo deploy" + name, { cwd: config.base_dir }, (error, stdout, stderr) =>{
        if (error) {
            console.log(error);
            return
        }
        send("部署完成","success");
    });
}
function new_post(req, res) {
    let name = config.post;
    exec("hexo new " + name, { cwd: config.base_dir }, (error, stdout, stderr) =>{
        if (error) {
            console.log(error);
            return
        }
        let checkExists = setTimeout(() => {
            if (fs.existsSync(path.join(config.source_dir, '_posts/', name + ".md"))) {
                clearTimeout(checkExists);
                res.json({ success: true, name: name, msg: "新建《" + name + "》文章成功" });
            }
        }, 100);
    });
    // shell({
    //     e: config.base_dir + "/hexo new " + name, next: () => {
    //         let checkExists = setTimeout(() => {
    //             if (fs.existsSync(path.join(config.source_dir, '_posts/', name + ".md"))) {
    //                 clearTimeout(checkExists);
    //                 res.json({ success: true, name: name, msg: "新建《" + name + "》文章成功" });
    //             }
    //         }, 100);
    //     }
    // });
}
function delete_post(req, res) {
    let postName = config.post;
    fs.unlink(path.join(config.source_dir, '_posts/', postName + ".md"), function (err) {
        if (err) {
            send("删除文章《" + postName + "》失败", "error");
            return;
        }
        res.json({ success: true, pId: postName, msg:"删除《" + postName + "》文章成功" });
    });
}
function save_post(postName, data) {
    try{
        fs.writeFileSync(path.join(config.source_dir, '_posts/', postName + ".md"), data)
    }
    catch (err) {
        send("保存文章《" + postName + "》失败", "error");
        return {
            error: true,
        };
    }
    return {
        success: true,
        msg: "保存文章《" + postName + "》成功"
    };
}
function rename_post(old_name, new_name, res) {
    base_fs.rename(path.join(config.source_dir, '_posts/', old_name + ".md"), path.join(config.source_dir, '_posts/', new_name + ".md"),function (err) {
        if (err) {
            console.log(err)
            return
        }
        res.json({ success: true, new_name : new_name });
    })
}
function new_page(req, res) {
    let name = config.page;
    exec("hexo new page " + name, {cwd: config.base_dir }, (error, stdout, stderr) =>{ 
        let checkExists = setTimeout(() => {
            if (fs.existsSync(path.join(config.source_dir, name, "index.md"))) {
                clearTimeout(checkExists);
                res.json({ success: true, name: name, msg: "新建\"" + name + "\"页面成功" });
            }
        }, 100);
    })
}
function delete_page(req, res) {
    let page = config.page.replace("#", "");
    let files = fs.readdirSync(path.join(config.source_dir, page));
    if (files.length > 1) {
        send("\"" + page + "\"文件夹内有其他文件，请手动删除", "error");
        return;
    }
    fs.unlink(path.join(config.source_dir, page, "index.md"), function (err) {
        if (err) {
            send("删除页面\"index.md\"文件失败", "error");
            return;
        }
        fs.rmdir(path.join(config.source_dir, page), function (err) {
            if (err) {
                send("删除页面\"" + page + "\"失败", "error");
                return;
            }
            res.json({ success: true, pId: page, msg: "删除\"" + page + "\"页面成功" });  
        });
    });
}
function save_page(page, data) {
    try {
        fs.writeFileSync(path.join(config.source_dir, page, "index.md"), data)
    }
    catch (err) {
        send("保存页面\"" + page + "\"失败", "error");
        return {
            error: true,
            msg: "保存页面\"" + page + "\"失败"
        };
    }
    //send("保存\"" + page + "\"页面成功","success");
    return {
        success: true,
        msg: "保存页面\"" + page + "\"成功"
    };
}
function rename_page(old_name, new_name, res) {
    base_fs.rename(path.join(config.source_dir, old_name), path.join(config.source_dir, new_name),function (err) {
        if (err) {
            console.log(err)
            return
        }
        res.json({ success: true, new_name: new_name });
    })
}
function upload_file(file) {
    var file_name = info.name.replace("#", "")
    var file1_path = path.join(config.source_dir, file.destination, info.type)
    var file2_path = path.join(file1_path, file_name)
    var img_path = path.join(file2_path, file.originalname)
    var my_file = file.path;
    let fileName = file.originalname;
    if (!base_fs.existsSync(file1_path)) {
        try {
            base_fs.mkdirSync(file1_path)
        }
        catch (err) {

        }
    }
    if (!base_fs.existsSync(file2_path)) {
        try {
            base_fs.mkdirSync(file2_path)
        }
        catch (err) {}
    }
    try{
        base_fs.copyFileSync(my_file, img_path)
        base_fs.unlinkSync(my_file)
    }
    catch (err) {
        return {
            'url': '/img/' + info.type + '/' + file_name + '/' + file.originalname,
            'success': 1,
            'massage': err
        }
    }
    if (base_fs.existsSync(img_path)) {
        try {
            fileName = new Date().getTime() +'_'+ file.originalname;
            base_fs.renameSync(img_path, file2_path+'/'+ fileName); //修改图片默认地址
        } catch (error) {
            console.log(error)
        }
    }
    
    return {
        'url': '/img/' + info.type + '/' + file_name + '/' + fileName,
        'success': 1,
        'massage': '上传成功'
    }
}
function setConfigPathValue(req) {
    let user = req.session.user, root = olConfig.root;
    config.source_dir = root + user + '/' + olConfig.source;
    config.base_dir = root + user;
    config.post = req.query && req.query.post;
    config.page = req.query && req.query.page;
    upload = multer({ dest: path.join(config.source_dir, '/img') });
}

module.exports = router;