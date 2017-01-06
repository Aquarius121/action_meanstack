var camera_util = (function() {

    function init(canvas_selector, video_selector) {
        window.addEventListener("DOMContentLoaded", function() {
            // Grab elements, create settings, etc.
            var canvas = $(canvas_selector)[0],
                context = canvas.getContext("2d"),
                video = $(video_selector)[0],
                videoObj = { "video": true },
                errBack = function(error) {
                    console.log("Video capture error: ", error.code);
                };

            // Put video listeners into place
            if(navigator.getUserMedia) { // Standard
                navigator.getUserMedia(videoObj, function(stream) {
                    video.src = stream;
                    video.play();
                }, errBack);
            } else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
                navigator.webkitGetUserMedia(videoObj, function(stream){
                    video.src = window.webkitURL.createObjectURL(stream);
                    video.play();
                }, errBack);
            }
            else if(navigator.mozGetUserMedia) { // Firefox-prefixed
                navigator.mozGetUserMedia(videoObj, function(stream){
                    video.src = window.URL.createObjectURL(stream);
                    video.play();
                }, errBack);
            }

            function tryScan() {
                context.drawImage(video, 0, 0, 640, 480);
                barcode_decode.decodeCanvas(true, canvas, function(result) {
                    //var codeType = result[0].split(' ')[0].split(':')[0];
                    var codePart = result[0].split(' ')[1];
                    $('input.manual-entry').val(codePart);

                    console.log(codePart);
                }, function() {
                    console.log('could not find barcode.  retrying');
                    setTimeout(tryScan, 500);
                });
            }
            tryScan();
        }, false);
    }

    return {
        init: init
    }
}(camera_util));