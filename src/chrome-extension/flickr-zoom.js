/* This is the first mockup of a chrome extension */
(function () {



    var IMAGE_URLS = [
        /(http:\/\/.*_b\.jpg)/,
        /(http:\/\/.*_o\.jpg)/,
        /(http:\/\/.*_z\.jpg)/,
        /(http:\/\/.*_.\.jpg)/
    ];


    var LARGE_IMAGE_URL = /(http:\/\/.*_b\.jpg)/,
        ORIGINAL_IMAGE_URL = /(http:\/\/.*_o\.jpg)/,
        IMAGE_URL = /(http:\/\/.*_.\.jpg)/;

    var wrapperId = "flickr-zoom-wrapper";

    var cameraX = 0,
        cameraY = 0,
        cameraW = 800,
        cameraH = 500;

    /**
     * Gets the size of an element
     *
     * @param element {Object} jQuery object that stores the element
     * @return {Object}
     */
    function getSize(element) {

        var w = element.outerWidth(false),
            h = element.outerHeight(false);

        var style = window.getComputedStyle(element[0], null);
        w -= parseInt(style["padding-left"], 10);
        h -= parseInt(style["padding-top"], 10);

        return { w: w, h: h};
    }

    /**
     * Gets the position of an element
     *
     * @param element {Object}
     * @return {Object}
     */
    function getPosition(element) {

        var x = parseInt(element.attr("_left"),10),
            y = parseInt(element.attr("_top"), 10);

        // adding the padding
        var style = window.getComputedStyle(element[0], null);
        x += parseInt(style["padding-left"], 10);
        y += parseInt(style["padding-top"], 10);

        return { x: x, y: y };
    }


    function moveToDefault(container) {

        var matrix = new WebKitCSSMatrix();

        var containerRaw = container[0];
        containerRaw.style.webkitTransform = matrix;

        // no loading icon
        $(".flickr-zoom-loading-icon").remove();
    }


    function moveTo(target, container) {

        var targetPos = getPosition(target);

        var targetSize = getSize(target);

        var containerRaw = container[0];

        containerRaw.style.webkitTransformOrigin = "0% 0%";

        var matrix = new WebKitCSSMatrix();

        var offsetY = document.body.scrollTop;
            offsetX = document.body.scrollLeft;

        var scaleX = cameraW / targetSize.w,
            scaleY = cameraH / targetSize.h,
            scaleValue = scaleX < scaleY ? scaleX : scaleY;

        // there will be a border
        scaleValue *= 0.98;


        var animLength = 300 * scaleValue;

        if (animLength > 1500) {
            animLength = 1500;
        }

        $("#" + wrapperId).css("-webkit-transition", "-webkit-transform " + animLength + "ms ease");

        var centerOffsetX = (cameraW - targetSize.w * scaleValue) / 2,
            centerOffsetY = (cameraH - targetSize.h * scaleValue) / 2;

        // translation
        var tx = targetPos.x - (cameraX + offsetX) - centerOffsetX;
        var ty = targetPos.y - (cameraY + offsetY) - centerOffsetY;

        // translation for scaling
        var ox = targetPos.x;
            oy = targetPos.y;

        // translating
        matrix = matrix.translate(-tx, -ty);

        // scaling around the origo
        matrix = matrix.translate(ox, oy);
        matrix = matrix.scale(scaleValue, scaleValue);
        matrix = matrix.translate(-ox, -oy);



        // applying the matrix
        containerRaw.style.webkitTransform = matrix;
    }


    /**
     * Creates the wrapper element (ants-and-elephants-scene-plane)
     *
     */
    function init() {

        // wrapper
        var wrapper = document.createElement("div");
        wrapper.id = wrapperId;

        // Move the body's children into this wrapper
        while (document.body.firstChild) {
            wrapper.appendChild(document.body.firstChild);
        }
        document.body.appendChild(wrapper);

    }

    /**
     * Gets the url of the higher resolution image
     *
     * @param image_url {String}
     * @param successHandler {Function}
     */
    function getFullURL(image_url, successHandler) {

        $.ajax({
           type: "GET",
           url:  image_url + "sizes/l/",
           success: function (data) {

               var url = IMAGE_URL;

               var result,
                   i = 0,
                   l = IMAGE_URLS.length;

               while (result == null && i < l) {

                   result = data.match(IMAGE_URLS[i]);
                   i++;
               }

               if (result != null && result[0] !== undefined) {
                   successHandler(result[0]);
               }
           }
        });
    }

    /**
     * Replaces the thumbnail with a higher resolution version
     *
     * @param target {Object} jQuery object that contains the image
     */
    function replaceImage(target) {

        var link = target.closest("a"),
            src = link.attr("href"),
            original;

        // loading icon
        var loading_icon = $("<img>", {
            src: "http://l.yimg.com/g/images/pulser2.gif",
            className: "flickr-zoom-loading-icon"
        });

        loading_icon.css({ "position": "fixed",
                           "top": "4px",
                           "left": "4px",
                           "z-index": 100
        });

        $(".flickr-zoom-loading-icon").remove();
        loading_icon.prependTo("body");

        $(target).load( function () {
            $(".flickr-zoom-loading-icon").remove();
        });


        getFullURL(src, function (url) {
            // when the image is loaded
            if (target.attr("src") == url) {
                $(".flickr-zoom-loading-icon").remove();
            } else {
                target.attr("src", url);
            }
        });
    }

    function prepareZoomIn(target) {
        target.closest(".ResultsThumbsChild").find(".search-moreinfo-small").hide();
    }

    function prepareZoomOut(target) {
        target.closest(".ResultsThumbsChild").find(".search-moreinfo-small").show();
    }

    $( function () {


        init();

        cameraW = window.innerWidth;
        cameraH = window.innerHeight;

        window.onresize = function (event) {
            cameraW = window.innerWidth;
            cameraH = window.innerHeight;
        };


        var lastTarget;


        // storing the starting positions
        $(".Photo a, .photo_container a").each( function (index, element) {

           var img = $(element).find("img"),
               offset = img.offset();

           img.attr({
               "_top": offset.top,
               "_left": offset.left
           });
        });

        document.body.addEventListener('click', function (event) {

            if (event.altKey) {

                var target = $(event.target);

                if (target.is(".Photo img, .photo_container img")) {

                    if (event.target !== lastTarget) {

                        prepareZoomIn(target);
                        moveTo(target, $("#" + wrapperId));

                        lastTarget = event.target;
                        replaceImage(target);
                    } else {
                        prepareZoomOut(target);
                        moveToDefault($("#" + wrapperId));
                        lastTarget = undefined;
                    }

                    event.cancelBubble = true;
                    event.stopPropagation();
                    event.preventDefault();
                }

            }

        },true);

    });

})();