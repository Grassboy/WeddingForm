//jQuery 操作…嗚嗚時間太趕我必需作在 React 裡用 jQuery 的蠢事 0rz...
//徵求強者教我把這段改寫成 jQuery 0rz
$(function(){
    $card = $('.card-2019');
    var vclick = ('ontouchstart' in document.documentElement)?'touchend':'click';
    //https://stackoverflow.com/questions/27558996/how-can-i-test-for-clip-path-support
    var areClipPathShapesSupported = function () {
        var base = 'clipPath',
            prefixes = [ 'webkit', 'moz', 'ms', 'o' ],
            properties = [ base ],
            testElement = document.createElement( 'testelement' ),
            attribute = 'polygon(50% 0%, 0% 100%, 100% 100%)';

        // Push the prefixed properties into the array of properties.
        for ( var i = 0, l = prefixes.length; i < l; i++ ) {
            var prefixedProperty = prefixes[i] + base.charAt( 0 ).toUpperCase() + base.slice( 1 ); // remember to capitalize!
            properties.push( prefixedProperty );
        }

        // Interate over the properties and see if they pass two tests.
        for ( var i = 0, l = properties.length; i < l; i++ ) {
            var property = properties[i];

            // First, they need to even support clip-path (IE <= 11 does not)...
            if ( testElement.style[property] === '' ) {

                // Second, we need to see what happens when we try to create a CSS shape...
                testElement.style[property] = attribute;
                if ( testElement.style[property] !== '' ) {
                    return true;
                }
            }
        }
        return false;
    };
    if(!areClipPathShapesSupported()) {
        $('html').addClass('basic-mode');
    }
    /*
    $(window).bind('scroll', function(){
        var h = $(window).innerHeight()*0.6;
        var st = $(window).scrollTop();
        var f = st / h;
        f = f > 1?1:f;
        $card.css('perspective-origin', 'center '+(f*30 + 60) + '%');
    });
    */
    $('body')
        .on('transitionend', '[data-state="open1"] .card-group', function(){
            $card.attr('data-state', 'open2');
        })
        .on(vclick, '[data-state="ready"] .card-group', function(){
            if(!$('.basic-mode').length) {
                $card.attr('data-state', 'open1');
            }
        })
        .on('click', '[data-state="open2"] .card-group', function(){
            $card.attr('data-state', 'open3');
        })
        .on(vclick, '.button', function(){
            var $this = $(this);
            var h = parseInt($this.offset().top , 10) + $this.height() * 4;
            if($this.is('.icon-mail-close')) {
                $card.attr('data-state', 'ready');
            } else if($this.is('.icon-expand')) {
                $card.attr('data-state', 'open3');
                $(window).scrollTop(h);
            } else if($this.is('.icon-to3d')) {
                $card.attr('data-state', 'open2');
            } else if($this.is('.icon-mail-open')) {
                if($('.basic-mode').length) {
                    $card.attr('data-state', 'open3');
                    $(window).scrollTop(h);
                } else {
                    $card.attr('data-state', 'open1');
                }
            }
        });
    var $preload_area = $('<div class="preload-area" style="opacity: 0; width: 1px; height: 1px; position: absolute; top: -10px; left: -10px;"></div>').appendTo('body');
    var resource = [
        "arches.png,68787",
        "basic.jpg,102894",
        "basic.png,34816",
        "bell.png,75730",
        "bg1.jpg,21598",
        "bg2.jpg,69956",
        "couple_small.png,102386",
        "favicon.png,2865",
        "flower3.png,26997",
        "flower4.png,15801",
        "flower5.png,31253",
        "flowerbg.png,163458",
        "flowerbg2.png,34733",
        "front1.png,102614",
        "logo_hole.png,7513",
        "og_img.png,326211",
        "pillars.png,44766"
    ];
    var total = 0, loaded = 0;
    resource.forEach(function(d){
        var pair = d.split(',');
        pair[1]*=1;
        total+=pair[1];
        $('<img style="width:1px; height: 1px;">').attr('src', './img/'+pair[0]).appendTo($preload_area).bind('load', function(){
            loaded += pair[1];
            $('.front-logo').css('background-position', '0 '+(loaded*100/total).toString()+'%');
            if(total == loaded) {
                setTimeout(function(){
                    $card.attr('data-state', 'ready');
                    $('.text-group').addClass('active');
                }, 2000);
            }
        });
    });
});
