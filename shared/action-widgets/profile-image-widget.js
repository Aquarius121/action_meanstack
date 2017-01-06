var profile_image_widget = (function () {

    var modal_template_def =
        '<div class="profile-image-widget">' +
            '<img {{?it.user.image_url}}src="{{=it.user.image_url}}"{{??}}src="img/upload-image.png"{{?}}>' +
        '</div>';

    var modal_template = doT.template(modal_template_def);

    function init(container, user, onSelection) {
        var user_copy = JSON.parse(JSON.stringify(user));

        if(typeof(user.image_url) != 'undefined' && user_copy.image_url != null){
            user_copy.image_url = user_copy.image_url.replace(/^https:\/\//i, 'http://');
        }

        container.html(modal_template({
            user: user_copy
        }));

        container.find('.profile-image-widget').click(function() {
            onSelection($(this).data('type'));
        });
    }

    return {
        init : init
    };
}());
