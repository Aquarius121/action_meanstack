// extremely similar to the server polling util.  The differences are:
// 1. remote url
// 2. app reference
// 3. action taken when poll complete

var polling_util = (function() {

    var last_count = -1;
    var polling_job, session_job;
    var message_interval = 10000;// every 10 seconds
    var message_interval_when_paused = 900000; // every 15 minutes
    var session_interval = 900000; // every 15 minutes
    var session_renewal_time = 43200000; // every 12 hours

    function init() {
        polling_job = setInterval(_pollMessages, message_interval);
        session_job = setInterval(_ensureSession, session_interval);
    }

    function pause() {
        clearInterval(polling_job);
        polling_job = setInterval(_pollMessages, message_interval_when_paused);
    }

    function resume() {
        clearInterval(polling_job);
        polling_job = setInterval(_pollMessages, message_interval);
    }

    function _ensureSession() {
        console.log('ensuring session active');
        try {
            if(app && app.caller) {
                var ms_since_login = moment().diff(app.login_time);

                if(ms_since_login >= session_renewal_time) {
                    console.log('logging back in to keep the session active');
                    app.logIn(function(err_login) {
                        if(err_login) {
                            app.logOut();
                        }
                        console.log('automated login to prolong session successful');
                    });
                }
            }
        } catch(ex) {
            console.log('an exception occurred in ensureSession: ' + ex);
        }
    }

    function _pollMessages() {
        try {
            if(app && app.caller) {
                //console.log('polling for unread messages...');
                $.ajax({
                    type: 'GET',
                    url: app_util.getRemoteUrl() + '/messages/unread'
                }).error(function(jqXHR, text) {
                    if(jqXHR.status == 404) {
                        //app.logOut();
                        return;
                    }
                    console.log(jqXHR.statusText);
                }).success(function(result) {
                    var unread_badge = $('.unread-messages.badge');
                    if(result.length > 0) {
                        unread_badge.html(result.length);
                        unread_badge.removeClass('hidden');
                    } else {
                        unread_badge.addClass('hidden');
                    }

                    if(typeof(cordova) != 'undefined' &&
                        typeof(cordova.plugins) != 'undefined' &&
                        typeof(cordova.plugins.notification) != 'undefined' &&
                        typeof(cordova.plugins.notification.badge) != 'undefined') {

                        // only post/delete notification if there's a change in count
                        if(result.length == last_count) {
                            return;
                        }

                        cordova.plugins.notification.badge.hasPermission(function (granted) {
                            if(!granted) {
                                console.log('requesting user permission to badge the application');
                                cordova.plugins.notification.badge.promptForPermission();
                                return;
                            }

                            last_count = result.length;
                            if(result.length == 0) {
                                cordova.plugins.notification.badge.clear();
                            } else {
                                cordova.plugins.notification.badge.set(result.length);
                            }
                        });
                    }
                });
            }
        } catch(ex) {
            console.log('an exception occurred: ' + ex);
        }

    }

    return {
        init: init,
        pause: pause,
        resume: resume
    }
}());