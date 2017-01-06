var video_chat_widget = (function() {

    var my_rtc_id = null, haveSelfVideo = false, showSelfVideo = false, room_join_time = null;

    var default_options = {
        roomName: 'defaultRoom',
        container: null,
        showSelf: false,
        remoteUrl: null,
        isCalling: true
    };

    var template_def =
        '<div class="your-id">' +
            '{{?it.showSelf}}' +
                '<video class="videoMirror" autoplay="autoplay" muted="muted" volume="0"></video>' +
            '{{?}}' +
            '<video class="callerVideo" autoplay="autoplay"></video>' +
            '<div class="callers"></div>' +
            '<button class="hang-up-all btn btn-warning">Hang up all</button>' +
        '</div>';

    var peers_template_def =
        '{{?Object.keys(it).length == 0}}' +
            'No callers are in the queue' +
        '{{??}}' +
            '{{~Object.keys(it) :caller_key}}' +
                '<a class="caller" data-caller="{{=caller_key}}">{{=caller_key}}</a>' +
            '{{~}}' +
        '{{?}}';

    var template = doT.template(template_def);
    var peers_template = doT.template(peers_template_def);

    function init(options_in) {

        var options = $.extend({}, default_options, options_in);

        options.container.html(template(options));

        var videoContainer = options.container.find('.callerVideo');
        var selfVideoContainer = options.container.find('.videoMirror');
        var callersContainer = options.container.find('.callers');

        videoContainer.addClass('hidden');
        callersContainer.html(peers_template({}));

        options.container.find('button.hang-up-all').click(function() {
            easyrtc.hangupAll();
        });

        if(options.showSelf) {
            showSelfVideo = true;
        }

        if(options.remoteUrl) {
            easyrtc.setSocketUrl(options.remoteUrl);
        }

        easyrtc.enableAudio(true);
        easyrtc.enableVideo(true);
        easyrtc.setRoomOccupantListener(roomListener);
        easyrtc.setAcceptChecker(_acceptChecker);

        easyrtc.setStreamAcceptor( function(easyrtcid, stream) {
            console.log('running stream acceptor');

            setUpMirror();
            easyrtc.setVideoObjectSrc(videoContainer[0],stream);
            console.log("saw video from " + easyrtcid);

            videoContainer.removeClass('hidden');
            //enable("hangupButton");
        });

        easyrtc.setOnStreamClosed( function (easyrtcid) {
            console.log('rtc stream closed');

            easyrtc.setVideoObjectSrc(callersContainer[0], "");
            //disable("hangupButton");
        });

        console.log('connecting to room ' + options.roomName);
        easyrtc.connect(options.roomName, _loginSuccess, _loginFailure);

        function _loginSuccess(easyrtcid) {
            console.log('rtc login succeeded');
            //easyrtc.hangupAll();
            my_rtc_id = easyrtcid;
            console.log('your rtc id is ' + easyrtcid);
        }

        function _loginFailure(err) {
            console.log('rtc login failed, an error occurred: ' + err);
        }

        function roomListener(roomName, otherPeers) {
            /*
             var otherClientDiv = document.getElementById('otherClients');
             while (otherClientDiv.hasChildNodes()) {
             otherClientDiv.removeChild(otherClientDiv.lastChild);
             }
             */
            console.log('roomListener called: ' + Object.keys(otherPeers).length + ' other peers');
            if(room_join_time == null) {
                room_join_time = new Date().getTime();
            }

            var callersContainer = options.container.find('.callers');
            callersContainer.html(peers_template(otherPeers));

            callersContainer.find('a.caller').click(function() {
                performCall($(this).data('caller'));
            });

            /*
            if(Object.keys(otherPeers).length == 1) {
                var peer_key = Object.keys(otherPeers)[0];
                var peer = otherPeers[peer_key];
                //if(peer.roomJoinTime < room_join_time) {

                if(options.isCalling) {
                    performCall(peer_key);
                }
                //}
            }
            */

            /*
             for(var i in otherPeers) {
             var button = document.createElement('button');
             button.onclick = function(easyrtcid) {
             return function() {
             performCall(easyrtcid);
             }
             }(i);
             }
             */
        }

        function performCall(otherEasyrtcid) {
            console.log('performing call');
            easyrtc.hangupAll();

            var acceptedCB = function(accepted, easyrtcid) {
                if( !accepted ) {
                    easyrtc.showError("CALL-REJECTED", "Sorry, your call to " + easyrtc.idToName(easyrtcid) + " was rejected");
                    enable('otherClients');
                }
            };

            var successCB = function() {
                setUpMirror();
                //enable('hangupButton');
            };
            var failureCB = function() {
                //enable('otherClients');
            };
            easyrtc.call(otherEasyrtcid, successCB, failureCB, acceptedCB);
            //enable('hangupButton');
        }

        function setUpMirror() {
            if(!haveSelfVideo && showSelfVideo) {
                var selfVideo = selfVideoContainer[0];
                easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
                selfVideo.muted = true;
                haveSelfVideo = true;
            }
        }

        function _acceptChecker(easyrtcid, callback) {
            return true;

            //callerPending = easyrtcid;
            if( easyrtc.getConnectionCount() > 0 ) {
                document.getElementById('acceptCallLabel').innerHTML = "Drop current call and accept new from " + easyrtc.idToName(easyrtcid) + " ?";
            }
            else {
                document.getElementById('acceptCallLabel').innerHTML = "Accept incoming call from " + easyrtc.idToName(easyrtcid) + " ?";
            }
            var acceptTheCall = function(wasAccepted) {
                document.getElementById('acceptCallBox').style.display = "none";
                if( wasAccepted && easyrtc.getConnectionCount() > 0 ) {
                    easyrtc.hangupAll();
                }
                callback(wasAccepted);
                //callerPending = null;
            };
            document.getElementById("callAcceptButton").onclick = function() {
                acceptTheCall(true);
            };
            document.getElementById("callRejectButton").onclick =function() {
                acceptTheCall(false);
            };
        }
    }

    return {
        init: init
    }

}());

/*
var video_chat_widget = (function() {

    var my_rtc_id, haveSelfVideo = false;

    function init(container) {

        var widget_html = '<div class="your-id"></div>' +
            '<video id="selfVideo" class="easyrtcMirror" autoplay="autoplay" muted="muted" volume="0"></video>' +
            '<video id="callerVideo" autoplay="autoplay"></video>';

        container.html(widget_html);

        easyrtc.setStreamAcceptor( function(easyrtcid, stream) {
            setUpMirror();
            var video = document.getElementById("callerVideo");
            easyrtc.setVideoObjectSrc(video,stream);
            console.log("saw video from " + easyrtcid);
            //enable("hangupButton");
        });

        easyrtc.setOnStreamClosed( function (easyrtcid) {
            easyrtc.setVideoObjectSrc(document.getElementById("callerVideo"), "");
            //console.log('closed stream for id ' + easyrtcid);
            //disable("hangupButton");
        });

        easyrtc.enableAudio(true);
        easyrtc.enableVideo(true);
        easyrtc.setRoomOccupantListener(roomListener);
        easyrtc.connect("easyrtc.audioVideo", loginSuccess, loginFailure);
    }

    function loginSuccess(easyrtcid) {
        easyrtc.hangupAll();
        my_rtc_id = easyrtcid;
        console.log('your rtc id is ' + easyrtcid);

        // TODO: get from brand
        var id = $.url().attr('query');
        if(typeof(id) != 'undefined') {
            id = id.split('=')[1];
            performCall(id);
        }
    }

    function loginFailure(err) {
        console.log('an error occurred: ' + err);
    }

    function roomListener(roomName, otherPeers) {

        //var otherClientDiv = document.getElementById('otherClients');
        //while (otherClientDiv.hasChildNodes()) {
        //    otherClientDiv.removeChild(otherClientDiv.lastChild);
        //}

        for(var i in otherPeers) {
            var button = document.createElement('button');
            button.onclick = function(easyrtcid) {
                return function() {
                    performCall(easyrtcid);
                }
            }(i);
        }
    }

    function performCall(otherEasyrtcid) {
        easyrtc.hangupAll();
        var acceptedCB = function(accepted, easyrtcid) {
            if( !accepted ) {
                easyrtc.showError("CALL-REJECTEd", "Sorry, your call to " + easyrtc.idToName(easyrtcid) + " was rejected");
                enable('otherClients');
            }
        };

        var successCB = function() {
            setUpMirror();
            //enable('hangupButton');
        };
        var failureCB = function() {
            //enable('otherClients');
        };
        easyrtc.call(otherEasyrtcid, successCB, failureCB, acceptedCB);
        //enable('hangupButton');
    }

    function setUpMirror() {
        // TODO: no duplicates
        if(!haveSelfVideo) {
            var selfVideo = document.getElementById("selfVideo");
            easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
            selfVideo.muted = true;
            haveSelfVideo = true;
        }
    }

    return {
        init: init
    }

}());
*/