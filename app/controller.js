$(function(){
    var user_id = localStorage.user_id || '';
    var $body = $('body');
    var profile;
    var timer = null;
    var ajax = function(args){
        return $.ajax({
            url: 'https://api.grassboy.tw/api.php',
            data: args,
            type: 'post',
            beforeSend: function(){
                $body.addClass('loading');
            },
            complete: function(){
                $body.removeClass('loading');
            }
        });
    };
    var updateUser = function(user) {
        $('#user_name').val(user.name);
        $('#user_relation').val(user.relation);
        $('.user_name').text(user.name);
        $('.user_relation').text(user.relation);
        $('.user-avatar').attr('data-imgur', user.avatar).find('img').attr('src', 'https://i.imgur.com/'+user.avatar+'.png');
    };
    var updateQuestionList = function(now_qid){
        if(now_qid) {
            $('.question-item').removeClass('playing is-winner not-yet');
            $('.question-item[data-qid="'+Math.abs(now_qid)+'"]')
                .toggleClass('playing', (now_qid > 0)).nextAll().addClass('not-yet');
        } else {
            $('.question-item').addClass('not-yet');
        }
    }
    var updateQuestionBody = function(q, qid) {
        clearInterval(timer);
        var src = 'https://i.imgur.com/'+q.choice+'.png';
        $('.answer-body .correct').removeClass('correct');
        $('.answer-body .selected').removeClass('selected');
        $('.question-body h2').text('第'+('零一二三四五'[parseInt(qid,10)])+'題');
        $('.question-body p').text(q.body);
        $('<img>').bind('load', function(){
            if(q.your_answer) {
                updateAnswer(q.your_answer);
            }
            if(q.answer) {
                $('.answer-body .answer-item[data-answer="'+q.answer+'"]').addClass('correct');
            }
            $('.answer-outer').css('background-image', 'url(https://i.imgur.com/'+q.choice+'.png)');
        }).bind('error', function(){
            alert('答案讀不出來0rz');
        }).attr('src', src);
        $('.answer-body').data('qid', qid);
        $('.secret-event').addClass('in-question');
        $('.page-body:visible').scrollTop(0);
    }
    var loginUser = function(){
        ajax({op:'loginUser', user_id:user_id}).then(function(r){
            console.log(r);
            if(r.ok) {
                updateUser(r.rsp);
            } else {
                delete localStorage.user_id;
                user_id = '';
                $body.addClass('not-login');
            }
        });
    }
    var quick_ans = location.hash.match(/#q=([\d])&ans=([\w])/);
    if(!user_id) {
        $body.addClass('not-login');
    } else if(quick_ans){
        location.hash = '#';
        ajax({op:'quickSetAnswer', qid: quick_ans[1], user_id: user_id, answer: quick_ans[2]}).then(function(r){
            if(r.ok) {
                $body.addClass('in-page').attr('data-page', 'secret-event');
                updateUser(r.rsp.user);
                updateQuestionList(r.rsp.now_qid);
                updateQuestionBody(r.rsp.question, quick_ans[1]*1);
                if(!$body.is('.big-screen')) alert('您已作答完畢！在公佈正確答案前，您可不斷重新作答喲！');
            } else {
                alert(r.msg);
                loginUser();
            }
        });
    } else {
        loginUser();
    }
    window.ajax = ajax;

    $('.update-user').click(function(){
        var $this = $(this);
        var data = {name: $('#user_name').val(), relation: $('#user_relation').val(), imgur: ($('.user-avatar:not(.from-file)').data('imgur') || undefined)};
        if($('.user-avatar.from-camera').length) {
            data.img_base64 = $('.user-avatar canvas')[0].toDataURL();
            console.log(data.img_base64);
        }
        ajax({op:'updateUser', name: data.name, relation: data.relation, user_id: (user_id || undefined), imgur: data.imgur, img_base64: data.img_base64}).then(function(r){
            if(r.ok) {
                if($body.is('.not-login')) {
                    user_id = localStorage.user_id = r.rsp.name;
                    $('body').removeClass('not-login');
                }
                profile = data;
                $('.user_name').text(data.name);
                $('.user_relation').text(data.relation);
                if(r.rsp.avatar) {
                    $('.user-avatar-img').attr('src', 'https://i.imgur.com/'+r.rsp.avatar+'.png');
                    $('.user-avatar').removeClass('from-camera');
                }
                $this.hide();
            }
        });
    });
    $('.page-list').on('click', '.page-item', function(){
        var $this = $(this);
        var page = $this.data('page');
        $body.addClass('in-page');
        switch(page) {
        case "secret-event":
            $body.addClass('in-page').attr('data-page', 'secret-event');
            ajax({op:'getNowQid'}).then(function(r){
                if(r.ok) {
                    var now_qid = r.rsp;
                    updateQuestionList(now_qid);
                }
            });
            break;
        case "wedding-photo":
            $body[0].requestFullscreen();
            break;
        case "guestbook":
            $body.addClass('in-page').attr('data-page', 'guestbook');
            break;
        }
    });
    var updateAnswer = function(answer){
        $('.answer-body .selected').removeClass('selected');
        $('.answer-body .answer-item[data-answer="'+answer+'"]').addClass('selected');
    };
    $('.question-list').on('click', '.question-item', function(){
        var $this = $(this);
        var qid = $this.data('qid');
        $('.answer-body .correct').removeClass('correct');
        $('.answer-body .selected').removeClass('selected');
        ajax({op:'getQuestion', user_id: user_id, qid: qid}).then(function(r){
            if(r.ok) {
                var q = r.rsp;
                updateQuestionBody(r.rsp, qid);
            } else {
                alert(r.msg);
            }
        });
    });
    $('.answer-body').on('click', '.answer-item', function(){
        var $this = $(this);
        var qid = $('.answer-body').data('qid');
        var answer = $this.data('answer');
        ajax({op:'setAnswer', qid: qid, user_id: user_id, answer: answer}).then(function(r){
            if(r.ok) {
                updateAnswer(answer);
                //if(!$body.is('.big-screen')) alert('您已作答完畢！在公佈正確答案前，您可不斷重新作答喲！');
            } else {
                alert(r.msg);
            }
        });
    });
    $('.back-home').click(function(){
        if($('.secret-event').is('.in-question')) {
            $('.secret-event').removeClass('in-question');
        } else {
            $body.removeClass('in-page').attr('data-page', null);
        }
    });
    $('#user_name,#user_relation').change(function(){
        $('.update-user').show();
    });
    $('.ps').bind('click', function(){
        alert('在秘密活動中，會進行抽獎，\r\n到時候抽到您的時候，\r\n若您未出面，我們會主動電話聯繫您，\r\n所以請別忘了填寫一支聯絡得到您的手機喲');
    });
    $('.add-guestbook').click(function(){
        var message = $('.guestbook-input').val();
        ajax({op:'writeGuestbook', user_id: user_id, message: message}).then(function(r){
            if(r.ok) {
                $('.guestbook-input').val('');
                alert('留言已送出，等會將不定時投放至大螢幕');
            } else {
                alert(r.msg);
            }
        })
    });
    $('#avatar-file').change(function(e){
        var file = this.files[0];
        if(file.type.indexOf('image/')==-1) {
            alert('圖片無法辨識，請重新上傳');
            return;
        }
        $body.addClass('editing-avatar');
        loadImage(
            this.files[0],
            function(canvas) {
                $('.avatar-modal').data('canvas', canvas).css('background-image', 'url("'+canvas.toDataURL()+'")');
            },
            {maxWidth: 1000, maxHeight: 1000, noRevoke: true, orientation: true}
        );
    });
    $('.default-avatar[data-imgur]').map(function(){
        var $this = $(this);
        var imgur = $this.data('imgur');
        $this.find('i').css('background-image', 'url(https://i.imgur.com/'+imgur+'.png)');
    });
    $('.avatar-box').on('click', '.default-avatar:not(.from-camera)', function(){
        var $this = $(this);
        var imgur = $this.data('imgur');
        $('.user-avatar').removeClass('from-camera');
        $('.user-avatar-img').attr('src', 'https://i.imgur.com/'+imgur+'.png');
        $('.user-avatar').attr('data-imgur', imgur);
        $('.update-user').show();
    });
    $('.cancel-avatar').click(function(){
        $body.removeClass('editing-avatar');
        $('.avatar-modal').css('background-image', 'none');
    });
    $('.update-avatar').click(function(){
        var canvas = $('.avatar-modal').data('canvas'); 
        var w = canvas.width, h = canvas.height;
        var cw = $('.avatar-modal').width(), ch = $('.avatar-modal').height();
        var box = boundIn(canvas.width, canvas.height, cw, ch);
        var zoom = w / box.w;
        var offset = $('.crop-zone').offset();
        var tw = $('.crop-zone').width();
        var th = $('.crop-zone').height();
        var x = offset.left * zoom, y = offset.top * zoom;
        tw *= zoom; th *= zoom;
        if(box.w == cw) { //上下有空白
            y -= ((ch - box.h)/2*zoom);
        } else { //左右有空白
            x -= ((cw - box.w)/2*zoom);
        }
        //console.log(x,y,tw,th);
        var ctx = $('.user-avatar-editing')[0].getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0,0,140,140);
        ctx.drawImage(canvas, x, y, tw, th, 0, 0, 140, 140);
        $('.cancel-avatar').click();
        $('.update-user').show();
        $('.user-avatar').addClass('from-camera');
    });
    $('.change-avatar').click(function(){
        $body.addClass('show-avatar-box');
    });
    $body.bind('click', function(e){
        if($(e.target).closest('.change-avatar').length == 0) {
            $body.removeClass('show-avatar-box');
        }
    });
});

(function attachDraggable(){
    var sx, sy, $box;
    var dragging = false, dragtype = null;
    $('.avatar-modal').on('touchstart mousedown', '.draggable', function(e){
        try {
            e = e.originalEvent;
            dragtype = $(this).data('dragtype')
            $box = $('.crop-zone');
            var offset = $box.offset();
            var w = $box.width(), h = $box.height();
            var px, py;
            if(e.touches) {
                px = e.touches[0].pageX;
                py = e.touches[0].pageY;
            } else {
                px = e.pageX;
                py = e.pageY;
            }
            switch(dragtype) {
            case "move":
                sx = offset.left - px; sy = offset.top - py;
                break;
            case "lt":
                sx = offset.left - px; sy = offset.top - py;
                break;
            case "rt":
                sx = offset.left + w - px; sy = offset.top - py;
                break;
            case "lb":
                sx = offset.left - px; sy = offset.top + h - py;
                break;
            case "rb":
                sx = offset.left + w - px; sy = offset.top + h - py;
                break;
            }
            dragging = true;
        } catch(e) {
            alert(e);
        
        }
    }).on('dragstart', '.draggable', function(e){
        e.preventDefault();
        return false;
    }).bind('touchmove mousemove', function(e){
        if(!dragging) return;
        e.preventDefault();
        e = e.originalEvent;
        if(e.touches) {
            px = e.touches[0].pageX;
            py = e.touches[0].pageY;
        } else {
            px = e.pageX;
            py = e.pageY;
        }
        target_x = sx + px;
        target_y = sy + py;
        var w = $box.width(), h = $box.height();
        var offset = $box.offset();
        switch(dragtype) {
        case "move":
            $box.offset({
                left: target_x,
                top: target_y
            });
            break;
        case "lt":
            var fix_x = offset.left + w, fix_y = offset.top + h;
            var new_w = Math.min(fix_x - target_x, fix_y - target_y);
            if(new_w < 140) return;
            $box.offset({
                left: fix_x - new_w,
                top: fix_y - new_w
            });
            $box.width(new_w);
            $box.height(new_w);
            break;
        case "rt":
            var fix_x = offset.left, fix_y = offset.top + h;
            var new_w = Math.min(target_x - fix_x, fix_y - target_y);
            if(new_w < 140) return;
            $box.offset({
                left: fix_x,
                top: fix_y - new_w
            });
            $box.width(new_w);
            $box.height(new_w);
            break;
        case "lb":
            var fix_x = offset.left + w, fix_y = offset.top;
            var new_w = Math.min(fix_x - target_x, target_y - fix_y);
            if(new_w < 140) return;
            $box.offset({
                left: fix_x - new_w,
                top: fix_y
            });
            $box.width(new_w);
            $box.height(new_w);
            break;
        case "rb":
            var fix_x = offset.left, fix_y = offset.top;
            var new_w = Math.min(target_x - fix_x, target_y - fix_y);
            if(new_w < 140) return;
            $box.offset({
                left: fix_x,
                top: fix_y
            });
            $box.width(new_w);
            $box.height(new_w);
            break;
        }
        return false;
    }).bind('touchend mouseup', function(e){
        e = e.originalEvent;
        if($(e.target).parents('.round-button').length == 0){
            e.preventDefault();
            dragging = false;
            return false;
        }
    });

})();
var boundIn = function(w, h, cw, ch, enlarge){
    if(enlarge) {
        if( w/h > cw/ch) {
            return {w: cw, h: cw*h/w};
        } else if( w/h <= cw/ch) {
            return {w: ch*w/h, h: ch};
        }
    } else {
        if( w/h > cw/ch && w > cw) {
            return {w: cw, h: cw*h/w};
        } else if( w/h <= cw/ch &&  h > ch) {
            return {w: ch*w/h, h: ch};
        } else {
            return {w: w, h: h};
        }
    }
};
