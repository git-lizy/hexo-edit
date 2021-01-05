function nextTick(callback) {
    return new Promise((res, rej) => {
        res();
    }).then( () => {
        if(isFunction(callback)) {
            callback();
        }
    }).catch( e => { throw e });
}

function btnClickEffect() {
    var nowTime = new Date().getTime();
    var clickTime = $(this).attr("ctime");
    if(clickTime && (nowTime - clickTime < 2500)){
        swal('操作过于频繁，稍后再试！', "error");
        return false;
    } else {
        $(this).attr("ctime", nowTime);
        return true;
    }
}

function isFunction(fun) {
    return Object.prototype.toString.call(fun) === '[object Function]';
}

window.onresize = function() {
    let clientWidth = getClientWidth();
    if (clientWidth > 1400) {
        $('.el-button-primary').show();
    } else {
        $('.el-button-primary').hide();
    }
}

function getClientWidth() {
    if(window.innerHeight !== undefined){
        return window.innerWidth;
    }else if(document.compatMode === "CSS1Compat"){
        return  document.documentElement.clientWidth;
    }else{
        return document.body.clientWidth;
    }
}