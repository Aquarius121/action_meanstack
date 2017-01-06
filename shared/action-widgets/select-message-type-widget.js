var select_message_type_widget = (function () {

    var modal_template_def =
        '<div class="btn-group">' +
            '<button type="button" class="btn btn-action" data-type="comment">Comment</button>' +
            '<button type="button" class="btn btn-action" data-type="complaint">Complaint</button>' +
            '<button type="button" class="btn btn-action" data-type="question">Question</button>' +
        '</div>';

    var modal_template = doT.template(modal_template_def);

    function init(container, onSelection) {
        container.html(modal_template({}));

        container.find('button').click(function() {
            container.find('button').removeClass('active');
            $(this).addClass('active');
            if(onSelection) {
                onSelection($(this).data('type'));
            }
        });
    }

    function getSelected(container) {
        var selected = container.find('button.active');
        if(selected.length == 0) {
            return undefined;
        }
        return selected.data('type');
    }

    function clearSelection(container) {
        container.find('button').removeClass('active');
    }

    return {
        init : init,
        getSelected: getSelected,
        clearSelection: clearSelection
    };
}());
