var facebook_util = (function() {

    var permissions = [
        //"basic_info",
        //"user_friends",
        "public_profile",
        //"user_about_me",
        "email"
        //"user_birthday"
    ];

    var fields = [
        'id',
        'first_name',
        'last_name',
        'picture',
        'email',
        'birthday',
        'gender'
    ];

    function init() {
    }

    function login() {
        var user_id;

        var fbLoginSuccess = function (userData) {
            //if(platform_util.isApple()) {

                console.log('using ' + userData.authResponse.userID + ' to get me data');
                user_id = userData.authResponse.userID;

                facebookConnectPlugin.api(user_id + "/?fields=" + fields.join(), permissions,
                    function (result) {
                        loading_modal.hide();
                        _onMe(result);
                    },
                    function (error) {
                        loading_modal.hide();
                        alert("Failed: " + error);
                    }
                );
                return;
            //}

            //loading_modal.hide();
            //console.log('getting /me from facebook on Android');
            //user_id = userData.id;
            //_onMe(userData);
        };

        function _onMe(userData) {
            var url = app_util.getRemoteUrl() + '/facebook/me?add=false';
            loading_modal.show();

            $.support.cors = true;
            $.ajax({
                type: 'POST',
                url: url,
                data: userData
            }).success(function(actionUserData) { // , text, jqXHR
                loading_modal.hide();
                if(actionUserData) {


                    app.caller = actionUserData;

                    var settings = settings_manager.get();
                    settings.fb_caller = true;
                    settings_manager.save(settings);

                    app.onLogin();
                }else
                {
                    app.caller = {};
                    app.caller.facebook_data = userData;
                    if(typeof(userData.email) != 'undefined')
                    {
                        app.caller.email = userData.email;
                    }
                    if(typeof(userData.first_name) != 'undefined')
                    {
                        app.caller.first_name = userData.first_name;
                    }
                    if(typeof(userData.last_name) != 'undefined')
                    {
                        app.caller.last_name = userData.last_name;
                    }
                    if(typeof(userData.gender) != 'undefined' && userData.gender.length > 0)
                    {
                        app.caller.gender = userData.gender == 'male'?1:2;
                    }
                    if(typeof(userData.birthday) != 'undefined')
                    {
                        var dob = new Date(userData.birthday);
                        app.caller.dob = moment(dob).format('YYYY-MM-DD');//dob.getYear() + '-' + dob.getMonth() + '-' + dob.getDay();
                    }
                    if(general_util.getByDotString(userData, 'picture.data.url'))
                    {
                        app.caller.image_url = userData.picture.data.url;
                    }

                    app_controller.openInternalPage('#register-page');
                }

            }).error(function(data, text) { //
                loading_modal.hide();
                if(navigator.connection.type == "none")
                {
                    alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                    return;
                }
                alert_modal.show('Error', 'Unable to login with Facebook: ' + data.responseText);
            });
        }

        loading_modal.show();
        facebookConnectPlugin.login(permissions,
            fbLoginSuccess,
            function (error) {
                console.log(error);
                loading_modal.hide();
                alert_modal.show("Facebook login error", "Permission denied");
            }
        );
    }

    return {
        init: init,
        login: login
    }
}());

