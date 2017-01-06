var error_message_accordion = (function () {

    var template_def =
        '<div class="panel-group" id="message_errors_accordion">' +
            '<div class="panel panel-default">' +
                '{{~it.messages :value:index}}' +
                    '<div class="panel-heading">' +
                        '<h4 class="panel-title pull-left">' +
                            '<a data-toggle="collapse" data-parent="#message_errors_accordion" href="#collapse_{{=value._id}}">' +
                              '{{=value.message.subject}}' +
                            '</a>' +
                        '</h4>' +

                        '<div class="pull-right">' +
                            "{{=moment(value.processed_at).format('MMMM Do, h:mm:ss a') + ' (' + moment(value.processed_at).fromNow()+ ')'}}" +
                        '</div>' +
                        '<div class="pull-right" style="margin-right: 10px;">' +
                            '<a class="delete-message" data-id="{{=value._id}}">' +
                                '<i class="icon icon-trash glyphicon glyphicon-trash" style="color: #ff0000;"></i>' +
                            '</a>' +
                        '</div>' +
                      '<div class="clearfix"></div>' +
                    '</div>' +
                    '<div id="collapse_{{=value._id}}" class="panel-collapse collapse {{=value.state == "unread" ? "in" : ""}}">' +
                        '<div class="panel-body">' +
                            '<h4>Error</h4>' +
                            '{{=value.error}}' +
                            '<h4>Header</h4>' +
                            '{{=value.message.header}}' +
                            '<h4>Content Type (header field)</h4>' +
                            '{{=value.message.content_type ? value.message.content_type : "not supplied"}}' +
                            '<h4>Encoding (header field)</h4>' +
                            '{{=value.message.encoding ? value.message.encoding : "not supplied"}}' +
                            '<h4>Body</h4>' +
                            '{{=value.message.body}}' +
                            '<h4>Attributes</h4>' +
                            '{{=value.message.attributes ? JSON.stringify(value.message.attributes) : "none"}}' +
                        '</div>' +
                    '</div>' +
                '{{~}}' +
            '</div>' +
        '</div>';

    var template = doT.template(template_def);

    function init(container, messages, onDeleteRequested) {
        container.html(template({
            messages: messages
        }));

        container.find('.delete-message').click(function() {

            var id = $(this).data('id');
            confirm_modal.setButtonClasses("btn-success", "btn-success"), confirm_modal.setButtonText("No", "Yes"), void confirm_modal.show("Delete Message?", "Are you sure you want to delete?", function() {

                onDeleteRequested(id);
            }, function() {

            }, function() {

            })
        });
    }

    return {
        init : init
    };
}());

