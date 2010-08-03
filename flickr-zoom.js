/* This is the first mockup of a chrome extension */
(function () {

    var LARGE_IMAGE_URL = /(http:\/\/.*_b\.jpg)/,
        ORIGINAL_IMAGE_URL = /(http:\/\/.*_o\.jpg)/;

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

        var offset = $(element[0]).offset(),
            x = offset.left;
            y = offset.top;

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
    }


    function moveTo(target, container) {

        var targetPos = getPosition(target);

        var targetSize = getSize(target);

        var containerRaw = container[0];

        containerRaw.style.webkitTransformOrigin = "0% 0%";

        var cameraBorder = 20;



        var matrix = new WebKitCSSMatrix();

        var offsetY = document.body.scrollTop,
            offsetX = document.body.scrollLeft;

        var scaleX = (cameraW - 2*cameraBorder) / targetSize.w,
            scaleY = (cameraH - 2*cameraBorder) / targetSize.h,
            scaleValue = scaleX < scaleY ? scaleX : scaleY;


        var animLength = 300 * scaleValue;

        if (animLength > 1500) {
            animLength = 1500;
        }

        $("#" + wrapperId).css("-webkit-transition", "-webkit-transform " + animLength + "ms ease");

        var centerOffsetX = (cameraW - 2*cameraBorder - targetSize.w * scaleValue) / 2,
            centerOffsetY = (cameraH - 2*cameraBorder - targetSize.h * scaleValue) / 2;

        centerOffsetX = 0;
        centerOffsetY = 0;


        // translation
        var tx = targetPos.x - (cameraX + offsetX) - centerOffsetX - cameraBorder;
        var ty = targetPos.y - (cameraY + offsetY) - centerOffsetY - cameraBorder;


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
           url:  image_url + "/sizes/l/",
           success: function (data) {

               var url = LARGE_IMAGE_URL;

               var result = data.match(url);

               if (result !== undefined && result[0] !== undefined) {
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
            src: "http://l.yimg.com/g/images/pulser2.gif"
        });

        loading_icon.css({ "position": "fixed",
                           "top": "4px",
                           "left": "4px"
        });

        loading_icon.prependTo("body");

        $(target).load( function () {
           loading_icon.remove();
        });


        getFullURL(src, function (url) {
            // when the image is loaded
            target.attr("src", url);
        });

    }


    $( function () {

        init();

        cameraW = window.outerWidth;
        cameraH = window.outerHeight;

        window.onresize = function (event) {
            cameraW = window.outerWidth;
            cameraH = window.outerHeight;
        };


        var lastTarget;

        document.body.addEventListener('click', function (event) {

            if (event.altKey) {

                var target = $(event.target);

                if (event.target !== lastTarget && target.is("img")) {

                    moveTo(target, $("#" + wrapperId));
                    lastTarget = event.target;

                    replaceImage(target);


                } else {

                    moveToDefault($("#" + wrapperId));
                    lastTarget = undefined;

                }

                event.cancelBubble = true;
                event.stopPropagation();
                event.preventDefault();
            }



        },true);

    });

})();