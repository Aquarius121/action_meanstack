RegisterPage.prototype  = new PageController();
RegisterPage.prototype.constructor = RegisterPage;

function RegisterPage() {
    this.profileFormOptions = {
        show_email: true,
        password_required: true,
        email_enabled: true,
        show_role: false,
        show_password: true
    };
}

RegisterPage.prototype.onPageReady = function() {
    var that = this;

    this.pageContainer = $('#register-page');
    this.formContainer = this.pageContainer.find('.profile-form-container');

    this.pageContainer.find('.create-button').click(function() {

        var validation_messages = profile_form.validate(that.formContainer, that.profileFormOptions, that.form_context);
        if (validation_messages.length > 0) {
            alert_modal.show('Errors', validation_messages[0]);
            return;
        }

        var data = profile_form.getData(that.formContainer, that.form_context);
        if (typeof(app.caller) != 'undefined') {
            if(typeof(app.caller.facebook_data) != 'undefined')
            {
                data.facebook_data = app.caller.facebook_data;
            }
            if(typeof(app.caller.google_data) != 'undefined')
            {
                data.google_data = app.caller.google_data;
            }
        }
        if(!data.opt) {
            var opt_in_body = 'Are you sure you don\'t want to opt in to communications from The Action App?';
            confirm_modal.setButtonText('Sign me up!', 'Yes, I decline');
            confirm_modal.show('Opt-in', opt_in_body, function() {
                confirm_modal.setButtonText('Cancel', 'Ok');
                createUser(data);
            }, function() {
                data.opt = true;
                confirm_modal.setButtonText('Cancel', 'Ok');
                createUser(data);
            });
            return false;
        }
        createUser(data);
        return false;
    });

    function createUser(data) {
        var url = app_util.getRemoteUrl() + '/user';
        app_util.makeRequest('PUT', url, data, 'Registering',
            function(response_data) { // , text, jqXHR
                alert_modal.show('Welcome', 'Welcome to Action!', function() {
                    app.caller = response_data[0];
                    app.onLogin();
                });
            },function(error) {
                alert_modal.show('Error', 'an error occurred: ' + error.responseText);
            }
        );
    }
};

RegisterPage.prototype.onPageBeforeShow = function() {
    window.scrollTo(80,0);
    // update the header title
    header_widget.update('register');

    // prepare the profile form
    this.profileFormOptions.show_password = !app.caller;

    // clear the form unless we came from the terms of service page
    var visited_pages = app_controller.getVisitedPages();
    if(visited_pages.length < 2 || visited_pages[visited_pages.length - 2] != "#terms-and-conditions") {
        this.form_context = profile_form.init(this.formContainer, app.caller, this.profileFormOptions);
        profile_form.clear(this.formContainer, this.form_context);
    }
};

RegisterPage.prototype.onPageShow = function() {

};