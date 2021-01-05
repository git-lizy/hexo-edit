var express = require('express')
var router = express.Router()
var { dateFormat } = require('../../lib/util')
var fs = require("fs")
var path = require("path")
var os = require('os')

var { isLogin } = require('../../lib/util')
const { exec } = require('child_process')

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
                global.olConfig.info = {
                    name: olConfig.post,
                    type: 'post'
                };
                res.end();
                break
            case "get_pagename":
                global.olConfig.info = {
                    name: olConfig.page,
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
}).post('/', function (req, res, next) {
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
            // case "upload_file":
            //     data = upload_file(req.file);
            //     res.send(data);
            //     break;
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
    let pull = olConfig.pull;
    cmds(pull);
}
function cmds(commands, i = 0) {
    if (i < commands.length) {
        exec(commands[i].replace("{time}", dateFormat('YYYY-MM-DD HH:mm:ss')), { cwd: olConfig.base_dir }, (error, stdout, stderr) =>{
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
    let push = olConfig.push;
    cmds(push);
}
function hexoClean() {
    exec(`hexo clean`, { cwd: olConfig.base_dir }, (error) =>{ if(error) throw error });
}
function hexoServer() {
    exec(`hexo server`, { cwd: olConfig.base_dir }, (error) =>{ if(error) throw error });
}
function closeServer() {
    let reg = new RegExp(`^.*TCP.*?:${olConfig.port || 4000}.*?LISTEN.*?([\\d]+)`, 'i');
    if (/windows/gim.test(os.type())) {
        exec(`netstat -ano | findstr ${olConfig.port || 4000}`, { cwd: olConfig.base_dir }, (error, stdout, stderr) =>{
            let results = stdout.split("\n");
            for (let i = 0; i < results.length; i++) {
                let res = results[i] ? results[i].match(reg) : null;
                if (res && res[1]) {
                    //shell({ e: ``, sendLog: false, });
                    exec(`taskkill /f /pid ${res[1]}`, { cwd: olConfig.base_dir }, (error) => {throw error});
                    break;
                }
            }
        });
    } else if (/linux/gim.test(os.type())) {
        exec(`netstat -tunlp | grep ${olConfig.port || 4000}`, { cwd: olConfig.base_dir }, (error, stdout, stderr) =>{
                let results = stdout.split("\n");
                for (let i = 0; i < results.length; i++) {
                    let res = results[i] ? results[i].match(reg) : null;
                    if (res && res[1]) {
                        exec(`kill ${res[1]}`, { cwd: olConfig.base_dir }, (error) => {throw error});
                        //shell({ e: ` ${res[1]}`, sendLog: false, next: () => { } });
                        break;
                    }
                }
        });
    }
}
function hexoGenerate(req, res) {
    req.session.isLoadingGenerate = true;
    exec("hexo generate", { cwd: olConfig.base_dir }, error => {
        if (error) {
            console.log(error);
            return
        }
        exec("gulp", { cwd: olConfig.base_dir }, error => {
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
    exec("hexo deploy" + name, { cwd: olConfig.base_dir }, (error, stdout, stderr) =>{
        if (error) {
            console.log(error);
            return
        }
        send("部署完成","success");
    });
}
function new_post(req, res) {
    let name = olConfig.post;
    exec("hexo new " + name, { cwd: olConfig.base_dir }, (error, stdout, stderr) =>{
        if (error) {
            console.log(error);
            return
        }
        let checkExists = setTimeout(() => {
            if (fs.existsSync(path.join(olConfig.source_dir, '_posts/', name + ".md"))) {
                clearTimeout(checkExists);
                res.json({ success: true, name: name, msg: "新建《" + name + "》文章成功" });
            }
        }, 100);
    });
    // shell({
    //     e: olConfig.base_dir + "/hexo new " + name, next: () => {
    //         let checkExists = setTimeout(() => {
    //             if (fs.existsSync(path.join(olConfig.source_dir, '_posts/', name + ".md"))) {
    //                 clearTimeout(checkExists);
    //                 res.json({ success: true, name: name, msg: "新建《" + name + "》文章成功" });
    //             }
    //         }, 100);
    //     }
    // });
}
function delete_post(req, res) {
    let postName = olConfig.post;
    fs.unlink(path.join(olConfig.source_dir, '_posts/', postName + ".md"), function (err) {
        if (err) {
            send("删除文章《" + postName + "》失败", "error");
            return;
        }
        res.json({ success: true, pId: postName, msg:"删除《" + postName + "》文章成功" });
    });
}
function save_post(postName, data) {
    try{
        fs.writeFileSync(path.join(olConfig.source_dir, '_posts/', postName + ".md"), data)
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
    fs.rename(path.join(olConfig.source_dir, '_posts/', old_name + ".md"), path.join(olConfig.source_dir, '_posts/', new_name + ".md"),function (err) {
        if (err) {
            console.log(err)
            return
        }
        res.json({ success: true, new_name : new_name });
    })
}
function new_page(req, res) {
    let name = olConfig.page;
    exec("hexo new page " + name, {cwd: olConfig.base_dir }, (error, stdout, stderr) =>{ 
        let checkExists = setTimeout(() => {
            if (fs.existsSync(path.join(olConfig.source_dir, name, "index.md"))) {
                clearTimeout(checkExists);
                res.json({ success: true, name: name, msg: "新建\"" + name + "\"页面成功" });
            }
        }, 100);
    })
}
function delete_page(req, res) {
    let page = olConfig.page.replace("#", "");
    let files = fs.readdirSync(path.join(olConfig.source_dir, page));
    if (files.length > 1) {
        send("\"" + page + "\"文件夹内有其他文件，请手动删除", "error");
        return;
    }
    fs.unlink(path.join(olConfig.source_dir, page, "index.md"), function (err) {
        if (err) {
            send("删除页面\"index.md\"文件失败", "error");
            return;
        }
        fs.rmdir(path.join(olConfig.source_dir, page), function (err) {
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
        fs.writeFileSync(path.join(olConfig.source_dir, page, "index.md"), data)
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
    fs.rename(path.join(olConfig.source_dir, old_name), path.join(olConfig.source_dir, new_name), function (err) {
        if (err) {
            console.log(err)
            return
        }
        res.json({ success: true, new_name: new_name });
    })
}

function setConfigPathValue(req) {
    global.olConfig.post = req.query && req.query.post;
    global.olConfig.page = req.query && req.query.page;
}

module.exports = router;