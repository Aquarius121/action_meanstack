// application-level utilities ("app-specific" utilities)

var app_util = (function() {

    var environments = [
        { name: 'production',   ip: 'http://54.86.190.45:5000'},
        { name: 'demo',         ip: 'http://54.221.200.68'},
        { name: 'dev',          ip: 'http://107.20.226.120'}
        //,{ name: 'localhost',    ip: 'http://127.0.0.1:3000'}
    ];
    var environment_index = 0;
    var remote_url = environments[environment_index].ip;

    function init(app) {

        // TODO: put this somewhere else?
        $('a.log-out').click(function() {
            logOut();

            return false;
        });

        $('a.switch-environment').click(function() {
            switchEnvironment();
        });

        $('a.clear-storage').click(function() {
            settings_manager.clear();
            logOut();
        });
    }

    function isLoggedIn(app) {
        return !!app.caller;
    }

    function isParticipating(product_info) {
        if(!!product_info.brand && product_info.brand.name != "")
            return true;
        else
            return (!!product_info.brand && !!product_info.brand.crm_email_endpoint);
    }

    function getRemoteUrl() {
        return remote_url;
    }

    function setRemoteUrl(url) {
        remote_url = url;
    }

    function setNonReplyMode(mode) {
        app_controller.getPage('#share').setNonReplyMode(mode);
    }

    function redrawElement(element) {
        element.hide().show(0);
    }

    // NOTE: requires app version plugin
    // cordova plugin add https://github.com/whiteoctober/cordova-plugin-app-version.git
    function getAppVersion(iteration, callback2) {
        if(typeof(cordova) != 'undefined' && typeof(cordova.getAppVersion) != 'undefined') {
            console.log('getting app version');
            cordova.getAppVersion(function (version) {
                callback2(null, version);
            });
            return;
        }
        // eventually, stop asking for the version
        if(iteration > 500) {
            callback2('could not get app version');
            return;
        }
        setTimeout(function() {
            getAppVersion(iteration + 1, callback2);
        }, 1000);
    }

    function addCustomStyle(css) {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.id = 'custom_brand_style';

        if (style.styleSheet) { // IE
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        document.getElementsByTagName('head')[0].appendChild(style);
    }

    function removeCustomStyling() {
        var element = document.getElementById('custom_brand_style');
        if(element) {
            element.parentNode.removeChild(element);
        }
    }

    function meetsBrandAgeRequirements(brand, user) {

        // no age restriction for brand -> can view
        if(typeof(brand.minimum_age) == 'undefined' || brand.minimum_age.trim().length == 0) {
            return true;
        }

        // there's no caller -> can't view
        if(typeof(user) == 'undefined') {
            return false;
        }

        // caller doesn't have an age range defined -> can't view
        if(typeof(user.age_range) == 'undefined' || user.age_range == '1') {
            return false;
        }

        var min_age_from_settings = 0;

        // 12, 17, 20, 34, 54, INF
        switch(user.age_range) {
            case "2": min_age_from_settings = 12; break;
            case "3": min_age_from_settings = 13; break;
            case "4": min_age_from_settings = 18; break;
            case "5": min_age_from_settings = 21; break;
            case "6": min_age_from_settings = 35; break;
            case "7": min_age_from_settings = 55; break;
        }
        return min_age_from_settings >= brand.minimum_age;
    }

    function makeRequest(type, url, data, loading_message, onSuccess, onFailure) {
        $.support.cors = true;
        data.platform = platform_util.getPlatformString();
        
        $.ajax({
            type: type,
            url: url,
            data: data,
            crossDomain: true,
            beforeSend : function() {if(loading_message.length > 0) { loading_modal.show(loading_message); }},
            complete   : function() {if(loading_message.length > 0) { loading_modal.hide();}}
        }).success(function(data, text, jqXHR) { //
            onSuccess(data, text, jqXHR);
        }).error(function(jqXHR, text) {
            if(navigator.connection.type == "none")
            {
                alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                return;
            }
            onFailure(jqXHR, text);
        });
    }

    function doLogin(email, password, onSuccess, onFailure) {
        var data = {
            email: email,
            password: password
        };

        var url = getRemoteUrl() + '/login';
        makeRequest('POST', url, data, 'Logging in', onSuccess, onFailure);
    }

    function logOut() {
        var url = app_util.getRemoteUrl() + '/logout';

        makeRequest('GET', url, {}, 'Logging out',
            function() { // data, text, jqXHR
                var settings = settings_manager.get();
                if(settings.goog_caller)
                    google_util.logout();

                app.onLogout();
            }, function() { // data
                alert('failed to log out ');
            }
        );
    }

    function switchEnvironment() {
        environment_index = ((environment_index + 1) % environments.length);

        logOut();

        var new_environment = environments[environment_index];
        remote_url = new_environment.ip;

        alert_modal.show('Success', 'Now pointed to ' + new_environment.name + ' environment', function() {
        });
        return false;
    }

    function applyBootstrapDropdownFix(container) {
        console.log('applying bootstrap dropdown fix');

        var selector = null;

        if(typeof(container) == 'undefined') {
            selector = $('a.dropdown-toggle');
        } else {
            selector = container.find('a.dropdown-toggle');
        }

        selector.unbind('click');
        selector.click(function(e) {
            e.stopPropagation();
            var ul = $(this).parent();

            if(ul.hasClass('open')) {
                ul.removeClass("open");
            } else {
                ul.addClass("open");
            }
        });
    }

    return {
        init: init,
        addCustomStyle: addCustomStyle,
        removeCustomStyling: removeCustomStyling,
        makeRequest: makeRequest,
        doLogin: doLogin,
        meetsBrandAgeRequirements: meetsBrandAgeRequirements,
        switchEnvironment: switchEnvironment,
        getAppVersion: getAppVersion,

        getRemoteUrl: getRemoteUrl,
        setRemoteUrl: setRemoteUrl,
        isParticipating: isParticipating,
        isLoggedIn: isLoggedIn,
        redrawElement: redrawElement,
        applyBootstrapDropdownFix: applyBootstrapDropdownFix,

        setNonReplyMode: setNonReplyMode, // TODO: setReply should go under here

        isUsingWeb: false,
        environmentIndex: environment_index
    }
}());