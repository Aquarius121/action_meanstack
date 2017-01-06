var confirmation_util = (function() {

    var custom_modal_id = '#custom-modal';
    var custom_modal_page = $(custom_modal_id);

    function showYesNo(html_contents, onYes, onNo) {
        var button_container_html =
            '<a class="confirm-no"><img src="img/no.png"></a>' +
            '<a class="confirm-yes"><img src="img/yes.png"></a>';

        var modal = showCustomModal(html_contents, button_container_html);

        modal.find('.confirm-no').click(onNo);
        modal.find('.confirm-yes').click(onYes);

        return modal;
    }

    function showCustomModal(html_contents, button_container_html) {
        var prompt_container = custom_modal_page.find('.prompt');
        custom_modal_page.find('.prompt').html(html_contents);
        custom_modal_page.find('.button-container').html(button_container_html);

        app_controller.openInternalPage(custom_modal_id, {
            //hide_from_history: true
        });

        return custom_modal_page;
    }

    return {
        showYesNo: showYesNo,
        showCustomModal: showCustomModal
    }
}());