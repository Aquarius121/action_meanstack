/**
 * Created by jslater on 1/8/15.
 */
var google_util = (function() {

    var accessToken = "";
    var UserData = null;

    var credentials = [
        { // production
            client_id: '192342076250-k5gignea8gd9j8m09sfvci3rmqv188iu.apps.googleusercontent.com',
            client_secret: 'CNR0_IIyCAguG5QOcsfD7b3W',
            redirect_uri: 'http://localhost',
            scope: 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email'
        },
        { // demo
            client_id: '236399025490-vamo7pccc29umfmb6819s6ivihqg8amd.apps.googleusercontent.com',
            client_secret: 'tY3i_7Cwhf5aJl2_PWReu8DP',
            redirect_uri: 'http://localhost',
            scope: 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email'
        },
        { // dev
            client_id: '236399025490-vamo7pccc29umfmb6819s6ivihqg8amd.apps.googleusercontent.com',
            client_secret: 'tY3i_7Cwhf5aJl2_PWReu8DP',
            redirect_uri: 'http://localhost',
            scope: 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email'
        },
        { // localhost
            client_id: '236399025490-vamo7pccc29umfmb6819s6ivihqg8amd.apps.googleusercontent.com',
            client_secret: 'tY3i_7Cwhf5aJl2_PWReu8DP',
            redirect_uri: 'http://localhost',
            scope: 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email'
        }
    ];

    function init() {
    }


    function login() {

        googleapi.authorize(credentials[app_util.environmentIndex]).done(function (data) {
            accessToken = data.access_token;


            var getUrl = 'https://www.googleapis.com/plus/v1/people/me?' +
                'access_token=' + accessToken;

            $.get(getUrl, function(userData){
                if(userData)
                {
                    _onMe(userData);
                }
                else
                {
                    alert_modal.show('Error', 'Unable to login with Google');
                }
            });
        });
    }

    var googleapi = {
        authorize: function (options) {
            var deferred = $.Deferred();

            //Build the OAuth consent page URL
            var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + $.param({
                    client_id: options.client_id,
                    redirect_uri: options.redirect_uri,
                    response_type: 'code',
                    scope: options.scope

                });

            //Open the OAuth consent page in the InAppBrowser
            var authWindow = window.open(authUrl, '_blank', 'location=no,toolbar=no');

            //The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
            //which sets the authorization code in the browser's title. However, we can't
            //access the title of the InAppBrowser.
            //
            //Instead, we pass a bogus redirect_uri of "http://localhost", which means the
            //authorization code will get set in the url. We can access the url in the
            //loadstart and loadstop events. So if we bind the loadstart event, we can
            //find the authorization code and close the InAppBrowser after the user
            //has granted us access to their data.
            $(authWindow).on('loadstart', function (e) {
                var url = e.originalEvent.url;
                var code = /\?code=(.+)$/.exec(url);
                var error = /\?error=(.+)$/.exec(url);

                if (code || error) {
                    //Always close the browser when match is found
                    authWindow.close();
                }

                if (code) {
                    //Exchange the authorization code for an access token
                    $.post('https://accounts.google.com/o/oauth2/token', {
                        code: code[1],
                        client_id: options.client_id,
                        client_secret: options.client_secret,
                        redirect_uri: options.redirect_uri,
                        grant_type: 'authorization_code'
                    }).done(function (data) {
                        deferred.resolve(data);

                    }).fail(function (response) {
                        deferred.reject(response.responseJSON);
                    });
                } else if (error) {
                    //The user denied access to the app
                    deferred.reject({
                        error: error[1]
                    });
                }
            });

            return deferred.promise();
        }
    };

// This function gets data of user.

    function _onMe(userData) {
        var url = app_util.getRemoteUrl() + '/google/plus/me'; //app_util.getRemoteUrl() +
        loading_modal.show();

        $.support.cors = true;
        $.ajax({
            type: 'POST',
            url: url,
            data: userData
        }).success(function (actionUserData) { // , text, jqXHR
            loading_modal.hide();
            if (actionUserData) {


                app.caller = actionUserData;

                var settings = settings_manager.get();
                settings.goog_caller = true;
                settings_manager.save(settings);

                app.onLogin();
            } else {

                app.caller = {};
                app.caller.google_data = userData;

                if(userData.emails && userData.emails.length > 0) {
                    app.caller.email = userData.emails[0].value;
                }
                if (general_util.getByDotString(userData, 'name.givenName')) {
                    app.caller.first_name = userData.name.givenName;
                }
                if (general_util.getByDotString(userData, 'name.familyName')) {
                    app.caller.last_name = userData.name.familyName;
                }
                if (typeof(userData.gender) != 'undefined' && userData.gender.length > 0) {
                    app.caller.gender = userData.gender == 'male' ? 1 : 2;
                }
                if (typeof(userData.birthday) != 'undefined') {
                    var dob = new Date(userData.birthday);
                    app.caller.dob = moment(dob).format('YYYY-MM-DD');//dob.getYear() + '-' + dob.getMonth() + '-' + dob.getDay();
                }
                if (general_util.getByDotString(userData, 'image.url')) {
                    app.caller.image_url = userData.image.url;
                }

                app_controller.openInternalPage('#register-page');
            }

        }).error(function (data, text) { //
            loading_modal.hide();
            if(navigator.connection.type == "none")
            {
                alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                return;
            }
            alert_modal.show('Error', 'Unable to login with Google: ' + data.responseText);
        });
    }


    function disconnectUser() {
        var revokeUrl = 'https://accounts.google.com/o/oauth2/revoke?token=' + accessToken;

        // Perform an asynchronous GET request.
        $.ajax({
            type: 'GET',
            url: revokeUrl,
            async: false,
            contentType: "application/json",
            dataType: 'jsonp',
            success: function (nullResponse) {
                // Do something now that user is disconnected
                // The response is always undefined.
                accessToken = null;
                console.log(JSON.stringify(nullResponse));
                console.log("-----signed out..!!----" + accessToken);
            },
            error: function (e) {
                // Handle the error
                // console.log(e);
                // You could point users to manually disconnect if unsuccessful
                // https://plus.google.com/apps
            }
        });
    }

    return {
        init: init,
        login: login,
        logout: disconnectUser
    }
}());