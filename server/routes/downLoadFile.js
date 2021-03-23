let express = require('express')
let router = express.Router()
let base_fs = require('fs')
let path = require('path')
let multer = require('multer')
let upload = multer({ dest: 'img' }) //用于指定上传文件 dest指定路径
let { isLogin } = require('../../lib/util')

router.post('/', upload.single('editormd-image-file'), function(req, res) {
    if (isLogin(req) && !req.session.isLoadingGenerate) {
        let data =  null;
        switch (req.query.action) {
            case 'upload_img':
                data = download_Img(req.file);
                res.send(data);
                break;
        }
    }
})

function download_Img(file) {
    let info = olConfig.info;
    let file_name = info.name;
    let file1_path = path.join(olConfig.source_dir, file.destination, info.type);
    let file2_path = path.join(file1_path, file_name);
    let img_path = path.join(file2_path, file.originalname);
    let my_file = file.path;
    let fileName = file.originalname;
    if (!base_fs.existsSync(file1_path)) {
        try {
            base_fs.mkdirSync(file1_path)
        }
        catch (err) { console.log(err) }
    }
    if (!base_fs.existsSync(file2_path)) {
        try {
            base_fs.mkdirSync(file2_path)
        }
        catch (err) { console.log(err) }
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
        } catch (error) { console.log(error) }
    }
    
    return {
        'url': '/img/' + info.type + '/' + file_name + '/' + fileName,
        'success': 1,
        'massage': '上传成功'
    }
}

module.exports = router