$(function() {
    $('.btn-logout').click(function() {
        var settings = settings_manager.get();
        settings.logged_in = false;
        settings.back_products = undefined;
        settings.back_term = "";
        settings.recent_products = undefined;
        settings_manager.save(settings);
        window.location.href = "/logout?redirect=true";
    });

    auto_message_utils.saveHistory(""+window.location.href);
});