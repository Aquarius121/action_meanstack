UserInfoPage.prototype  = new PageController();
UserInfoPage.prototype.constructor = UserInfoPage;

function UserInfoPage() {
}

UserInfoPage.prototype.onPageReady = function() {
    this.pageContainer = $('#user-info');

    var that = this;
    var submitButton = this.pageContainer.find('button.submit-button');
    var laterButton = this.pageContainer.find('button.later-button');

    submitButton.unbind('click');
    submitButton.click(function() {
        var settings = settings_manager.get();
        settings.first_name = that.pageContainer.find('.first-name-field').val();
        settings.last_name = that.pageContainer.find('.last-name-field').val();
        settings.birth_year = that.pageContainer.find('.birth-year-field').val();
        settings_manager.save(settings);

        app_controller.openInternalPage("#index");
        return false;
    });

    laterButton.unbind('click');
    laterButton.click(function() {
        app_controller.openInternalPage("#index");
        return false;
    });
};

UserInfoPage.prototype.onPageBeforeShow = function() {
    var settings = settings_manager.get(), that = this;
    window.scrollTo(80,0);
    // enforce "show instructions once"
    if(settings.show_instructions_once && settings.has_entered_basic_info) {
        app_controller.openInternalPage("#index", "none");
        return;
    }

    // mark that we've seen the instructions
    if(settings.has_entered_basic_info === false) {
        settings.has_entered_basic_info = true;
        settings_manager.save(settings);
    }

    this.pageContainer.find("div[data-role='content']").removeClass('hidden');
};