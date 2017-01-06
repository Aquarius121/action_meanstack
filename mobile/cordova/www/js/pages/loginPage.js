LoginPage.prototype  = new PageController();
LoginPage.prototype.constructor = LoginPage;

function LoginPage() {

}

LoginPage.prototype.onPageReady = function() {
    this.pageContainer = $('#login');
    //if(device.version == "4.3")
        //this.pageContainer.height(800);
    var loginForm = this.pageContainer.find('form.login');

    loginForm[0].onsubmit = function() {
        var data = {
            email: loginForm.find('input[name="email"]').val(),
            password: loginForm.find('input[name="password"]').val()
        };

        // prepare to "remember me"
        //console.log(loginForm.height());
        if(data.email == "")
        {
            alert_modal.show('Login error', 'Please Enter valid Email Id or Password');
            return false;
        }
        if(data.password == "")
        {
            alert_modal.show('Login error', 'Please Enter valid Email Id or Password');
            return false;
        }
        var settings = settings_manager.get();
        settings.email = data.email;
        settings.password = data.password;
        settings_manager.save(settings);

        app.logIn(function(err_login) {
            if(!err_login) {
                app.onLogin();
            } else {
                alert_modal.show('Login error', 'Please Enter valid Email Id or Password');
            }
        });
        return false;
    };
};

LoginPage.prototype.onPageBeforeShow = function() {
    header_widget.update();
    header_widget.setRightNavVisible(false);
    window.scrollTo(80,0);
};

LoginPage.prototype.onPageShow =function(){
    //alert("show");
    //alert(device.platform);
    //
    $("#login").show(0);
    var loginForm = this.pageContainer.find('form.login');
    //

    //if(device.version == "4.3" || device.version == "4.2.2" || device.version == "4.4.4") {
    if(device.platform == "Android" && document.body.clientHeight < 800) {
        $('#login').bind("touchstart", function (e) {
            if (e.target.name != "email" && e.target.name != "password") {
                setTimeout(function(){$("#login").css({"margin-top": "0px"});},200);
            }
        });
        loginForm.find('input[name="email"]').bind("click", function () {
            //window.scrollTo(0,500);
            $("#login").css({"margin-top": "-200px"});
        });
        loginForm.find('input[name="password"]').bind("click", function () {
            $("#login").css({"margin-top": "-200px"});
        });

    }
}