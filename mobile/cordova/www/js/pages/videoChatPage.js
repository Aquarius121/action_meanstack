VideoChatPage.prototype  = new PageController();
VideoChatPage.prototype.constructor = VideoChatPage;

function VideoChatPage() {
    this.inited = false;
}

VideoChatPage.prototype.onPageReady = function() {
    this.pageContainer = $('#video-chat');

    /*
    var context = document.getElementById('camera').getContext("2d");
    var camImage = new Image();
    camImage.onload = function() {
        context.drawImage(camImage, 0, 0);
    };
    CanvasCamera.capture = function(data) {
        camImage.src = data;
    };
    */
};

VideoChatPage.prototype.onPageShow = function() {

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if(!navigator.getUserMedia) {
        this.pageContainer.html('getUserMedia not supported on this system<br><div class="backup"></div>');

        var config = {
            isInitiator: true,
            turn: {
                host: 'turn:107.20.226.120:3478' //,
                //username: 'test',
                //password: '123'
            },
            streams: {
                audio: true,
                video: true
            }
        };

        var phonertc = cordova.plugins.phonertc;

        var session = new phonertc.Session(config);

        session.call();

        phonertc.setVideoView({
            container: this.pageContainer.find('.backup')[0],
            local: {
                position: [0, 0],
                size: [100, 100]
            }
        });
        return;
    }
    video_chat_widget.init({
        remoteUrl: app_util.getRemoteUrl(),
        isCalling: true,
        roomName: "default",
        container: this.pageContainer.find('.video-container')
    });
    /*
    if(typeof(phonertc) == 'undefined' && typeof(navigator.phonertc) == 'undefined') {
        console.log('phone rtc not supported');
        return;
    }

    //action.audioVideo
    var video_container = this.pageContainer.find('.video-container');

    var config = {
        isInitiator: true,
        turn: {
            //host: 'turn:turn.example.com:3478',
            host: 'http://107.20.226.120:80',
            //username: 'test',
            //password: '123'
        },
        streams: {
            audio: false,
            video: true
        }
    };

    var session = new navigator.phonertc.Session(config);

    session.on('answer', function () {
        console.log('Other client answered!');
    });

    session.on('disconnect', function () {
        console.log('Other client disconnected!');
    });

    console.log('setting video view');

    navigator.phonertc.setVideoView({
        container: video_container[0],
        local: {
            position: [0, 0],
            size: [100, 100]
        }
    });

    console.log('set video view');
*/

    /*
    if(!this.inited) {
        easyrtc.setSocketUrl('http://107.20.226.120:80');
        video_chat_widget.init("easyrtc.audioVideo", this.pageContainer.find('.content'));
        this.inited = true;
    }

    console.log('starting canvas camera');
    CanvasCamera.start();
    */
};