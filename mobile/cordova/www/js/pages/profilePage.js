ProfilePage.prototype  = new PageController();
ProfilePage.prototype.constructor = ProfilePage;

function ProfilePage() {
    this.profileFormOptions = {
        show_email: true,
        password_required: false,
        email_enabled: false,
        show_role: false,
        is_profile: true,
        show_password: true
    };
    this.max_image_size = 15 * 1000000;             //image file size limit 15 megabyte
    this.startingState = null;
}

ProfilePage.prototype.onPageReady = function() {
    this.pageContainer = $('#profile');
    this.formContainer = this.pageContainer.find('.profile-form-container');

    var that = this;
    var saveButton = this.pageContainer.find('button.save-button');

    saveButton.unbind('click');
    saveButton.click(function() {
        var validation_errors = profile_form.validate(that.formContainer, that.profileFormOptions, that.form_context);
        if(validation_errors.length == 0) {
            var data = profile_form.getData(that.formContainer, that.form_context);
            var url = app_util.getRemoteUrl() + '/user/' + app.caller._id;
            data.image_url = app.caller.image_url;
            if(app.caller.role == 'admin' && typeof(app.caller.managed_brands) != 'undefined') {
                data.managed_brands = app.caller.managed_brands;
            }

            app_util.makeRequest('POST', url, data, 'Updating',
                function() { // response_data, text, jqXHR
                    // TODO: this whole section is ugly.  We need something like _.pick

                    app.caller.address = app.caller.address ? app.caller.address : {};
                    app.caller.address.street = data.street;
                    app.caller.address.city = data.city;
                    app.caller.address.state = data.state;
                    app.caller.address.zip = data.zip;
                    app.caller.address.country = data.country;

                    app.caller.first_name = data.first_name;
                    app.caller.last_name = data.last_name;
                    app.caller.email = data.email;
                    app.caller.phone = data.phone;
                    app.caller.age_range = data.age_range;
                    app.caller.gender = data.gender;
                    app.caller.dob = data.dob;

                    alert_modal.show('Success', 'User profile successfully updated.', function() {
                        that.saveState();

                        if(app.redirect) {
                            var redirect = app.redirect;
                            delete app.redirect;


                            app_controller.openInternalPage(redirect, {
                                hide_from_history: (redirect == 'share')
                            });
                        }
                        else
                        {
                            app_controller.openInternalPage('#index');
                        }
                    });

                }, function(e) {
                    alert_modal.show('Error', 'an error occurred: ' + e.responseText);
                }
            );
        } else {
            alert_modal.show('Errors', validation_errors[0]);
        }
        return false;
    });
};

ProfilePage.prototype.onPageBeforeShow = function() {
    var that = this;
    var modal_instance;
    window.scrollTo(80,0);
    header_widget.update('my profile');

    if(this.startingState == null) {
        this.form_context = profile_form.init(this.formContainer, app.caller, this.profileFormOptions);
        profile_form.clear(this.formContainer, this.form_context);
        profile_image_widget.init(this.pageContainer.find('.profile-image-container'), app.caller, onProfileWidgetClicked);

        function onProfileWidgetClicked() {

            // show selection dialog (fb, gallery, etc)
            modal_instance = generic_modal.init({
                container: $('body'),
                headerHtml: 'Choose image from source',
                showFooter: false,
                bodyHtml: '<div class="picker-contents"></div>'
            });

            user_image_selection_widget.init(modal_instance.selector.find('.picker-contents'), {
                user: app.caller,
                size : this.max_image_size,
                onSelection: function(img_url) {
                    modal_instance.hide();
                },
                onComplete: function(img_url) {
                    profile_image_widget.init(that.pageContainer.find('.profile-image-container'), app.caller, onProfileWidgetClicked);
                    //console.log(img_url + ' has been set as the profile picture');
		    alert_modal.show('Success', 'Your profile image has been saved');
                },
                onError: function(err_text) {
                    modal_instance.hide();
                    alert_modal.show('Error', err_text, function(){});
                }
            });
        }

        // TODO: clean up app reference
        if(app.caller) {
            profile_form.setValues(this.formContainer, app.caller, this.form_context);
        }

        this.saveState();
    }



};

ProfilePage.prototype.onPageBeforeHide = function() {
    var that = this;
    var original_target = window.location.href;

    if(this.startingState && this.startingState != JSON.stringify(profile_form.getData(this.formContainer, this.form_context))) {
        confirm_modal.show('Unsaved changes', 'Are you sure you would like to leave this page before saving your changes?', function() {

            // do nothing - user is aware of changes
            that.startingState = null;
            window.location.href = original_target;
        }, function() {

            // make them go back to the form
        });

        app_controller.openInternalPage('#profile');
        return;
    }
    this.startingState = null;
};

ProfilePage.prototype.saveState = function() {
    this.startingState = JSON.stringify(profile_form.getData(this.formContainer, this.form_context));
};

