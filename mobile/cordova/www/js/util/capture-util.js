var capture_util = (function() {

    // alternative to
    // <input type=file accept="video/*">
    // <input type=file accept="image/*">
    function captureVideo(endpoint, callback2) {
        if(!navigator.device) {
            callback2('device hook not found');
            return;
        }
        navigator.device.capture.captureVideo(
            function(mediaFiles) {
                if(!endpoint) {
                    callback2(null, mediaFiles);
                    return;
                }
                _uploadFile(endpoint, mediaFiles[0], function(err_upload, upload_result) {
                    if(err_upload) {
                        return;
                    }
                    console.log('Upload success: ' + upload_result.responseCode);
                    console.log(upload_result.bytesSent + ' bytes sent');
                    callback2(null, upload_result);
                });
            }, function(error) {
                callback2(error);
            }, {
                limit: 1,
                duration: 10
            }
        );
    }

    function captureAudio(endpoint, callback2) {
        if(!navigator.device) {
            callback2('device hook not found');
            return;
        }
        navigator.device.capture.captureAudio(
            function(mediaFiles) {
                if(!endpoint) {
                    callback2(null, mediaFiles);
                    return;
                }
                _uploadFile(endpoint, mediaFiles[0], function(err_upload, upload_result) {
                    if(err_upload) {
                        return;
                    }
                    console.log('Upload success: ' + upload_result.responseCode);
                    console.log(upload_result.bytesSent + ' bytes sent');
                    callback2(null, upload_result);
                });
            }, function(error) {
                callback2(error);
            }, {
                limit: 1,
                duration: 30
            }
        );
    }

    function captureImage(endpoint, callback2) {
        if(!navigator.device) {
            callback2('device hook not found');
            return;
        }
        navigator.device.capture.captureImage(
            function(mediaFiles) {
                if(!endpoint) {
                    callback2(null, mediaFiles);
                    return;
                }
                _uploadFile(endpoint, mediaFiles[0], function(err_upload, upload_result) {
                    if(err_upload) {
                        return;
                    }
                    console.log('Upload success: ' + upload_result.responseCode);
                    console.log(upload_result.bytesSent + ' bytes sent');
                    callback2(null, upload_result);
                });
            }, function(error) {
                callback2(error);
            }, {
                limit: 1
            }
        );
    }

    function _uploadFile(endpoint, mediaFile, body, progress_function, callback2) {
        console.log("Media File");
        console.log(JSON.stringify(mediaFile));
        var ft = new FileTransfer(),
            name = mediaFile.name;
        if(mediaFile.fullPath)
            path = mediaFile.fullPath
        if(mediaFile.localURL)
            path = mediaFile.localURL
        console.log(path);
        var options =  {
            fileName: name,
            params: {}
        };

        if(body) {
            options.params = body;
        }

        if(progress_function) {
            ft.onprogress = progress_function;
        }

        ft.upload(path,
            endpoint,
            function(result) {
                callback2(null, result);
            },
            function(upload_error) {
                callback2(upload_error);
            }, options
        );
    }

    return {
        captureVideo: captureVideo,
        captureAudio: captureAudio,
        captureImage: captureImage,
        uploadFile: _uploadFile
    }
}());