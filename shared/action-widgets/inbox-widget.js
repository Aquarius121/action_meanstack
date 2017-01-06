var inbox_widget = (function() {

    var unread_indicator_def =
        '<div class="unread-indicator pull-left animated swing animated-infinite" style="margin-left: 5px;">' +
            '<i class="glyphicon glyphicon-bell icon icon-bell" style="color: red;"></i>' +
        '</div>';

    var deleted_indicator_def =
        '<div class="deleted-indicator pull-left animated pulse animated-infinite" style="margin-left: 5px;" title="deleted">' +
            '<a data-id="{{=value._id}}">' +
                '<i class="glyphicon glyphicon-remove icon icon-remove" style="color: red;"></i>' +
            '</a>' +
        '</div>';

    var message_header_time_template_def =
        '{{time_to_use = (value.last_update ? value.last_update : value.created);}}' +
        '{{?moment({hour: 0, minute: 0, seconds: 0, milliseconds: 0}).diff(moment(time_to_use)) < 0}}' + // "today"
            '{{=moment(time_to_use).format("h:mm:ss a") + " (" + moment(time_to_use).fromNow()+ ")"}}' +
        '{{??}}' +
            '{{=moment(time_to_use).format("MMMM Do") + " (" + moment(time_to_use).fromNow()+ ")"}}' +
        '{{?}}';

    var message_header_template_def =
        '<div class="panel-heading message_{{=value._id}}">' +

            '<div data-toggle="collapse" data-parent="#inbox_accordion" data-id={{=value._id}} href="#collapse_{{=value._id}}">' +
                '<div class="message-panel-title pull-left">' +

                    '{{? value.responses && value.responses.length > 0}}' +
                        '<strong>' +
                        "{{=value.product_name + ' (' + (value.responses.length + 1) + ')'}}" +
                        '</strong>' +
                    '{{??}}' +
                        '<strong>{{=value.product_name}}</strong>' +
                    '{{?}}' +

                    '{{?value.user_id}}' +
                        '<span style="margin-left: 20px;">{{=value.email}}</span>' +
                    '{{?}}' +
                '</div>' +

                '<span class="unread-container animation-flicker-fix" data-message-id={{=value._id}}>' +
                    '{{?value.contains_unread}}' +
                        unread_indicator_def +
                    '{{?}}' +
                '</span>' +

                '{{?value.state == "archived"}}' +
                    '<div class="animation-flicker-fix">' +
                        deleted_indicator_def +
                    '</div>' +
                '{{?}}' +

                '<div class="pull-right" style="margin-left: 10px;">' +
                    '<div class="dropdown">' +
                        '<button class="btn dropdown-toggle btn-xs" type="button" id="dropdown_{{=value._id}}" data-toggle="dropdown">' +
                            '<i class="glyphicon glyphicon-cog icon icon-cog"></i>' +
                            '<span class="caret"></span>' +
                        '</button>' +
                        '<ul class="dropdown-menu" role="menu" aria-labelledby="dropdown_{{=value._id}}">' +
                            '<li role="presentation"><a role="menuitem" tabindex="-1" class="delete-message" data-id={{=value._id}}>Delete</a></li>' +
                        '</ul>' +
                    '</div>' +
                '</div>' +

                '<div class="pull-right">' +
                    message_header_time_template_def +
                '</div>' +

                '<div class="clearfix"></div>' +

            '</div>' +
        '</div>';

    var crm_message_template_def =
        '<div class="well response{{?response_value.unread}} crm unread{{?}} col-xs-11 col-xs-offset-1 col-md-8 col-md-offset-4" data-id={{=response_value.id}}>' +
            '{{?response_value.subject}}' +
                '<div class="pull-left">{{=response_value.subject}}</div>' +
            '{{??}}' +
                '<div class="pull-left">Response {{?response_value.case_id}}to Case {{=response_value.case_id}}{{?}}</div>' +
            '{{?}}' +
            '<div class="pull-right">' +
                '{{?response_value.created}}' +
                  '{{=moment(response_value.created).format("MMMM Do, h:mm:ss a") + " (" + moment(response_value.created).fromNow() + ")"}}' +
                '{{?}}' +
            '</div>' +

            '<span class="unread-container animation-flicker-fix" data-message-id={{=value._id}} data-response-id="{{=response_value.id}}">' +
                '{{?response_value.unread}}' +
                    unread_indicator_def +
                '{{?}}' +
            '</span>' +

            '<div class="pull-right" style="margin-right: 10px;">' +
                '<div class="dropdown" data-id={{=response_value.id}}>' +
                    '<button class="btn dropdown-toggle btn-xs" type="button" id="dropdown_{{=response_value.id}}" data-toggle="dropdown">' +
                        '<i class="glyphicon glyphicon-cog icon icon-cog"></i>' +
                        '<span class="caret"></span>' +
                    '</button>' +
                    '<ul class="dropdown-menu" role="menu" aria-labelledby="dropdown_{{=response_value.id}}">' +
                        '<li role="presentation"><a role="menuitem" tabindex="-1" class="mark-unread" data-id={{=response_value.id}} data-parent-id={{=value._id}}>Mark unread</a></li>' +
                        '<li role="presentation"><a role="menuitem" tabindex="-1" class="reply-to-crm" data-id={{=response_value.id}} data-parent-id={{=value._id}}>Reply</a></li>' +
                    '</ul>' +
                '</div>' +
            '</div>' +

            '<div class="clearfix"></div>' +
            '<hr>' +
            'Agent responded:<div class="clearfix"></div>' +
            '<div class="clearfix"></div>' +
            '<div class="response-body" style="word-wrap: break-word;">{{=response_value.body}}</div>' +
        '</div>';

    var reply_template_def =
        '<div class="well reply {{?response_value.unread}} unread{{?}} col-xs-11 col-md-8" style="word-wrap: break-word;" data-id={{=response_value._id}}>' +
            '{{?response_value.subject}}' +
                '<div class="pull-left">RE: {{=response_value.subject}}</div>' +
            '{{??}}' +
                '<div class="pull-left">Reply {{?response_value.case_id}}to Case {{=response_value.case_id}}{{?}}</div>' +
            '{{?}}' +
            '<div class="pull-right">' +
                '{{?response_value.created}}' +
                  '{{=moment(response_value.created).format("MMMM Do, h:mm:ss a") + " (" + moment(response_value.created).fromNow() + ")"}}' +
                '{{?}}' +
            '</div>' +

            '<div class="clearfix"></div>' +
            '<hr>' +
            'You replied:' +
            '<div class="clearfix"></div>' +
            '<div style="word-wrap: break-word;">{{=response_value.text}}</div>' +
        '</div>';

    var message_template_def =
        '<div class="well">' +
            '<div class="pull-right">' +
                '{{?value.created}}' +
                    '{{=moment(value.created).format("MMMM Do, h:mm:ss a") + " (" + moment(value.created).fromNow() + ")"}}' +
                '{{?}}' +
            '</div>' +
            '<div class="clearfix"></div>' +
            '<hr>' +
            'You said:<div class="clearfix"></div>' +
            '<div class="clearfix"></div>' +
            '<div style="margin-bottom: 10px; word-wrap: break-word;" class="message-body pull-left">{{=value.text}}</div>' +
            '<div class="clearfix"></div>' +
            '{{? value.files && value.files.length > 0}}' +
                '<div class="inbox-attachment-count">' +
                    '<i class="icon icon-paperclip glyphicon glyphicon-paperclip"></i>{{=value.files.length}} attachment(s)' +
                '</div>' +
            '{{?}}' +
        '</div>' +
        '{{? value.responses && value.responses.length > 0 }}' +
            '{{~ value.responses :response_value:response_index}}' +
                '{{?!response_value.type}}' + // response is not a reply
                    crm_message_template_def +
                '{{??}}' +
                    reply_template_def +
                '{{?}}' +
                '<div class="clearfix"></div>' +
            '{{~}}' +
            '{{?!value.resolved}}' +
                '<div class="text-center">' +
                    'Have we resolved this issue?' +
                    '<div class="clearfix"></div>' +
                    '<button class="btn btn-xs btn-info unresolved" data-id={{=value._id}}>No, I\'d like to reply</button>' +
                    '<button class="btn btn-xs btn-info resolved" data-id={{=value._id}}>Yes, this is resolved</button>' +
                '</div>' +
            '{{?}}' +
        '{{?}}';

    var collapse_template_def =
        '<div id="collapse_{{=value._id}}" class="message_{{=value._id}} panel-collapse collapse {{=value.state == "unread" ? "in" : ""}}">' +
            '<div class="panel-body" data-id={{=value._id}}>' +
                message_template_def +
            '</div>' +
        '</div>';

    var inbox_template_def =
        '{{?it.messages.length == 0}}' +
            '<div class="no-messages-text">You have not sent or received messages.</div>' +
        '{{??}}' +
            '<div class="panel-group" id="inbox_accordion">' +
                '<div class="panel panel-default" style="overflow: visible;">' +
                    '{{~it.messages :value:index}}' +
                        '{{?value.type != "reply"}}' + // replies get their own spot inside of the collapse widget (not here)
                            message_header_template_def +
                            collapse_template_def +
                        '{{?}}' +
                    '{{~}}' +
                '</div>' +
            '</div>' +
        '{{?}}';


    function init(root_url, container, user_id, is_mark_read, callbacks) {
        $.ajax({
            type: 'GET',
            url: root_url + 'messages?id=' + user_id
        }).error(function() { // e
            if(typeof(alert_modal) != "undefined") {
                alert_modal.show('Error', 'Could not get user history');
            }
        }).success(function(result) {
            _onMessages(root_url, container, result, is_mark_read, callbacks);
        });
    }

    function _onMessages(root_url, container, messages, is_mark_read, callbacks) {
        $.ajax({
            type: 'GET',
            url: root_url + 'messages/unread'
        }).error(function() { // e
            if(typeof(alert_modal) != "undefined") {
                alert_modal.show('Error', 'Could not get unread messages');
            }
        }).success(function(result) {
            _onUnread(root_url, container, messages, is_mark_read, result, callbacks);
        });
    }

    function _onUnread(root_url, container, messages, is_mark_read, result, callbacks) {
        var pagefn = doT.template(inbox_template_def);
        var unread = result.map(function(value) { return value._id; });

        // sort messages
        messages.sort(function(a, b) {
            return (a.last_update < b.last_update ? 1 : (a.last_update > b.last_update ? -1 : 0));
        });

        // split messages into roots and replies
        var root_messages = messages.filter(function(message) { return message.type != 'reply'; });
        var reply_messages = messages.filter(function(message) { return message.type == 'reply'; });

        // put replies into the proper thread
        reply_messages.forEach(function(reply) {
            var root_message = root_messages.filter(function(message) {
                return message._id == reply.root_message;
            });

            if(root_message.length > 0) {
                root_message[0].responses.push(reply);
            }
        });

        // go through the messages and mark any unread responses, then sort
        root_messages.forEach(function(message) {
            if(!message.responses) {
                return;
            }

            // mark unread
            message.responses.forEach(function(response) {
                if(unread.indexOf(response.id) != -1) {
                    response.unread = true;
                    message.contains_unread = true;
                }
            });

            // sort responses
            message.responses.sort(function(a, b) {
                return (a.created > b.created ? 1 : (a.created < b.created ? -1 : 0));
            });
        });

        try {
            container.html(pagefn({
                messages: messages,
                unread: unread
            }));
        } catch(ex) {

        }

        if(is_mark_read) {
            container.find('[data-toggle="collapse"]').click(function(){

                // grab the id of the user's message
                var id = $(this).data('id');

                // detect whether the body is being shown or hidden
                var panel_body = container.find('.panel-body[data-id=' + id + ']:visible');
                if(panel_body.length > 0) {
                    return;
                }

                // get a list of responses for the given user message
                panel_body = container.find('.panel-body[data-id=' + id + ']');
                var unread_responses = panel_body.find('.unread');

                if(unread_responses.length > 0) {
                    var unread_response_id_list = [];
                    for(var i=0; i<unread_responses.length; i++) {
                        unread_response_id_list.push($(unread_responses[i]).data('id'));
                    }

                    $.ajax({
                        type: 'POST',
                        url: root_url + 'messages/responses?state=read&idList=' + unread_response_id_list
                    }).error(function(e) {
                        console.log('an error occurred while marking messages as read: ' + e);
                        //alert_modal.show('Error', 'Could not get unread messages');
                    }).success(function() { // result
                        // TODO: update gui to remove "unread" indicators

                        setTimeout(function() {
                            _markAsReadInGUI(container, id);
                        }, 2000);
                    });
                }
            });
        }

        container.find('.mark-unread').click(function() {
            var thisFromEvent = $(this);
            var id = $(this).data('id');

            $.ajax({
                type: 'POST',
                url: root_url + 'messages/responses?state=unread&idList=' + id
            }).error(function() { // e
                alert_modal.show('Error', 'Could not mark message as unread');
            }).success(function() { // result
                _markAsUnreadInGUI(container, thisFromEvent.data('parent-id'), id);
            });
        });

        container.find('.delete-message').click(function() {
            var id = $(this).data('id');

            $.ajax({
                type: 'POST',
                url: root_url + 'message/' + id + '?state=archived'
            }).error(function(e) {
                alert_modal.show('Error', 'Could not delete message');
            }).success(function() { // result
                container.find('.message_' + id).remove();
                alert_modal.show('Success', 'Message deleted');
            });
        });

        container.find('.reply-to-crm').click(function() {
            var id = $(this).data('id');
            if(typeof(callbacks) != 'undefined') {
                callbacks.onReply(id);
            }
        });

        container.find('button.resolved').click(function() {
            var id = $(this).data('id');

            $.ajax({
                type: 'POST',
                url: root_url + 'message/' + id + '?resolved=true'
            }).error(function(e) {
                alert_modal.show('Error', 'Could not resolve message');
            }).success(function() { // result
                container.find('.message_' + id).remove();
                alert_modal.show('Thank you', 'Thank you for contacting us');
            });
        });

        container.find('button.unresolved').click(function() {
            var id = $(this).data('id');

            messages.forEach(function(message) {
                if(message._id == id) {
                    if(message.responses.length == 0) {
                        return;
                    }
                    var responding_to;
                    for(var i=message.responses.length - 1; i>=0; i--) {
                        responding_to = message.responses[i];
                        if((!responding_to.type || responding_to.type != 'reply') && typeof(callbacks) != 'undefined') {
                            callbacks.onReply(responding_to.id);
                            return;
                        }
                    }
                    return;
                }
            });
        });

        container.find('.deleted-indicator').find('a').click(function() {
            var id = $(this).data('id');

            $.ajax({
                type: 'POST',
                url: root_url + 'message/' + id + '?state=sent'
            }).error(function(e) {
                alert_modal.show('Error', 'Could not un-delete message');
            }).success(function() { // result
                container.find('.message_' + id).remove();
                alert_modal.show('Success', 'Message un-deleted');
            });
        });
    }

    function _markAsUnreadInGUI(container, message_id, response_id) {
        container.find('.panel-heading').find('.unread-container[data-message-id=' + message_id + ']').html(unread_indicator_def);
        container.find('.unread-container[data-response-id=' + response_id + ']').html(unread_indicator_def);
        container.find('.response[data-id=' + response_id + ']').addClass('unread');
    }

    function _markAsReadInGUI(container, message_id) {
        container.find('.unread-container[data-message-id=' + message_id + ']').html('');
        container.find('.panel-body[data-id=' + message_id + ']').find('.unread').removeClass('unread');
    }

    return {
        init: init
    }
}());