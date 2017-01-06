$(function() {
    var settings = settings_manager.get();
    if(settings.logged_in == true)
    {
        window.location.href = "/";
        var settings = settings_manager.get();
        settings.logged_in = false;
        settings.from_login = true;
        settings_manager.save(settings);
        return;
    }
    var url = purl();
    var redirect_url = url.param('redirect');
    var err = url.param('error');

    if(typeof(err) != 'undefined' && err == 'facebook')
        alert_modal.show("Facebook Login Error","Permission denied");
    redirect_url = (typeof(redirect_url) != 'undefined' ? redirect_url : '/');

    var reset = url.param('reset');
    if(typeof(reset) != 'undefined' && reset == 'true') {
        set_password_modal.show();
    }

    // TODO: must this be url.param instead of redirect_url?
    $('a.facebook-login').attr('href', '/facebook/login?redirect=' + redirect_url);
    $('a.google-login').attr('href', '/google/plus/login?redirect=' + redirect_url);

    $('form.login-form').ajaxForm({
        success: function() { // data, responseText, jqXHR
            window.location.href = redirect_url;
        },
        error: function(err) {
            alert_modal.show('Login Error', "Please Enter valid Email Id or Password");
        }
    });

    var forgot_param = url.param('forgot');
    if(forgot_param && forgot_param == 'true') {
        forgot_password_modal.show();
    }
    $('a.forgot-password').click(function() {
        forgot_password_modal.show();
    });

});
function valid()
{
    if($('#input_email').val() == "")
    {
        alert_modal.show('Login Error', "Please Enter valid Email Id or Password");
        return false;
    }
    if($('#input_password').val() == "")
    {
        alert_modal.show('Login Error', "Please Enter valid Email Id or Password");
        return false;
    }
    return true;
}