/**
 * Created by pro on 8/11/15.
 */
$(function() {
    var settings = settings_manager.get();
    if(settings.from_login)
    {
        settings.from_login = false;
        settings_manager.save(settings);
        window.location.href = "/login";
        return;
    }
});