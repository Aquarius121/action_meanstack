var inbox_widget2 = (function() {

    var unread_indicator_def =
        '<div class="unread-indicator animated swing animated-infinite" style="margin-left: 5px;">' +
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
            '{{=moment(time_to_use).fromNow()}}' +
        '{{??}}' +
            '{{=moment(time_to_use).fromNow()}}' +
        '{{?}}';

    var message_header_template_def =
        '<div class="message message-header" data-id="{{=value._id}}" >'+
            '<div class="brand-img-container">' +
                '<img {{?value.brand_logo_url}}src="{{=value.brand_logo_url}}" {{?}}class="circle" />' +
            '</div>' +
            '<div class="message-summary">' +
            '<div class="product-name">' +
                    '{{?value.contains_unread}}' +
                        unread_indicator_def +
                    '{{?}}' +
                    '{{? value.responses && value.responses.length > 0}}' +
                        '<strong>' +
                        "{{=value.product_name + ' (' + (value.responses.length + 1) + ')'}}" +
                        '</strong>' +
                    '{{??}}' +
                        '<strong>{{=value.product_name}}</strong>' +
                    '{{?}}' +
            '</div>' +
            '<div class="message-text">' +
                '{{?value.text}}' +
                    '{{=value.text}}' +
                '{{?}}'+
                '{{?value.user_id}}' +
                    '<span style="margin-left: 20px;">{{=value.email}}</span>' +
                '{{?}}' +
            '</div>' +
            '</div>' +
            '<div class="message-time">' +
                    message_header_time_template_def +
                    '{{?value.state == "archived"}}' +
                        '<div class="animation-flicker-fix">' +
                            deleted_indicator_def +
                        '</div>' +
                    '{{?}}' +
            '</div>'+
        '</div>';

    var message_template_def =
        '<div id="{{=value._id}}" class="tab-content hidden message-detail-view" class="tab-pane" style="background-color: white; padding-bottom:40px">'+
            '<div>'+
                '<div class="product-image-header">'+
                    '<div class="crop" style="background-image: url({{=general_util.safeEncodeURI(value.brand_logo_url)}})"><div class="overlay"></div></div>' + // jshint ignore:line
                        '<div class="circle" style="background-image: url({{=general_util.safeEncodeURI(value.brand_logo_url)}})">' + // jshint ignore:line
                        '</div>' +
                    '<div class="back-icon"><a href="#" class="fa fa-arrow-left" style="color:white"></a></div>'+
                '</div>' +
                '<div class="message-thread">' +
                    '<div class="brand-image-container">' +
                            '{{?app.caller.image_url}}' +
                                '<img src="{{=app.caller.image_url}}"  class="circle" />' +
                            '{{??}}' +
                                '<div class="circle no-user-image">{{= app.caller.first_name.substring(0,1).toUpperCase() + app.caller.last_name.substring(0,1).toUpperCase() }}</div>' +
                            '{{?}}' +
                    '</div>' +
                    '<div class="message-container">' +
                        '<div class="message-text">' +
                            '{{? value.text }}' +
                                '{{=value.text}}' +
                            '{{?}}' +
                        '</div>' +
                        '<div class="message-time">' +
                            '{{? value.files && value.files.length > 0}}' +
                                '<div class="inbox-attachment-count">' +
                                    '<a class="attachments-view" data-id="{{=value._id}}">' +
                                        '<i class="icon icon-paperclip glyphicon glyphicon-paperclip"></i>{{=value.files.length}} attachment{{?value.files.length != 1}}s{{?}}' +
                                    '</a>' +
                                '</div>' +
                            '{{?}}' +
                            '{{?value.created}}' +
                                '{{=moment(value.created).fromNow()}}' +
                            '{{?}}' +
                        '</div>' +
                    '</div>' +

                    '{{? value.responses && value.responses.length > 0 }}' +
                        '{{~ value.responses :response_value:response_index}}' +
                            '{{?!response_value.type}}' + // response is not a reply
                                '<div class="message-thread col-sm-12{{?response_value.unread}} unread{{?}}" data-id={{=response_value.id}}>' +
                                    '<div class="message-user-container">' +
                                        '<div class="blob">' +
                                            '{{?response_value.subject}}' +
                                                '<div class="" style="font-weight: bold">{{=response_value.subject}}</div>' +
                                            '{{??}}' +
                                                '<div class="">Response {{?response_value.case_id}}to Case {{=response_value.case_id}}{{?}}</div>' +
                                            '{{?}}' +
                                            '{{=response_value.body}}' +
                                        '</div>' +
                                        '<div class="message-time">' +
                                            '<a role="menuitem" tabindex="-1" class="mark-unread" data-id={{=response_value.id}} data-parent-id={{=value._id}}>mark unread</a>   |   ' +
                                            '<a role="menuitem" tabindex="-1" class="reply-to-crm" data-id={{=response_value.id}} data-parent-id={{=value._id}}>reply</a>   ' +
                                            '{{?value.created}}' +
                                                '{{=moment(response_value.created).fromNow()}}' +
                                             '{{?}}' +
                                        '</div>' +
                                    '</div>' +
                                    '<div style="display: block; position: absolute; right:0px; top:0px; width: 90px;">' +
                                        '<img src="{{=value.brand_logo_url}}" class="circle" />' +
                                    '</div>' +
                                '</div>' +
                            '{{??}}' +
                                '<div class="message-thread">' +
                                    '<div class="brand-image-container">' +
                                        '{{?app.caller.image_url}}' +
                                            '<img src="{{=app.caller.image_url}}"  class="circle" />' +
                                        '{{??}}' +
                                            '<div class="circle no-user-image">{{= app.caller.first_name.substring(0,1).toUpperCase() + app.caller.last_name.substring(0,1).toUpperCase() }}</div>' +
                                        '{{?}}' +
                                    '</div>' +
                                    '<div class="message-container">' +
                                        '<div class="message-text">' +
                                            '{{=response_value.text}}' +
                                        '</div>' +
                                        '<div class="message-time">' +
                                            '{{? response_value.files && response_value.files.length > 0}}' +
                                                '<div class="inbox-attachment-count">' +
                                                    '<a class="attachments-view" data-id="{{=response_value._id}}">' +
                                                        '<i class="icon icon-paperclip glyphicon glyphicon-paperclip"></i>{{=response_value.files.length}} attachment{{?value.files.length != 1}}s{{?}}' +
                                                    '</a>' +
                                                '</div>' +
                                            '{{?}}' +
                                            '{{?response_value.created}}' +
                                                '{{=moment(response_value.created).fromNow()}}' +
                                            '{{?}}' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                            '{{?}}' +
                            '<div class="clearfix"></div>' +
                        '{{~}}' +
                        '{{?!value.resolved}}' +
                            '<div class="text-center">' +
                            'Have we resolved this issue?' +
                            '<div class="clearfix"></div>' +
                                '<button class="btn btn-success button-black unresolved btn-xs" data-id={{=value._id}}>No, I\'d like to reply</button>' +
                                '<button class="btn btn-success button-black resolved btn-xs" data-id={{=value._id}}>Yes, this is resolved</button>' +
                            '</div>' +
                            '<br/>' +
                        '{{?}}' +
                    '{{?}}' +
                '</div>' +
            '</div>' +
        '</div>';

    var inbox_template_def =
        '{{?it.messages.length == 0}}' +
            '<div class="no-messages-text">You have not sent or received messages.</div>' +
        '{{??}}' +
            '{{~it.messages :value:index}}' +
                '{{?value.type != "reply"}}' + // replies get their own spot inside of the collapse widget (not here)
                    message_header_template_def +
                '{{?}}' +
            '{{~}}' +
            '{{~it.messages :value:index}}' +
                '{{?value.type != "reply"}}' + // replies get their own spot inside of the collapse widget (not here)
                    message_template_def +
                '{{?}}' +
            '{{~}}' +
        '{{?}}';

    var server_root_url = "";
    var selectedMessage = "";

    function init(root_url, container, user_id, allow_mark_as_read, callbacks) {
        server_root_url = root_url;
        $.ajax({
            type: 'GET',
            url: root_url + 'messages?id=' + user_id
        }).error(function() { // e
            if(typeof(alert_modal) != "undefined") {
                alert_modal.show('Error', 'Could not get user history');
            }
        }).success(function(result) {
            _onMessages(root_url, container, result, allow_mark_as_read, callbacks);
        });
    }

    function _onMessages(root_url, container, messages, allow_mark_as_read, callbacks) {
        $.ajax({
            type: 'GET',
            url: root_url + 'messages/unread'
        }).error(function() { // e
            if(typeof(alert_modal) != "undefined") {
                alert_modal.show('Error', 'Could not get unread messages');
            }
        }).success(function(result) {
            _onUnread(root_url, container, messages, allow_mark_as_read, result, callbacks);
        });
    }

    function _onUnread(root_url, container, messages, allow_mark_as_read, result, callbacks) {
        var pagefn = doT.template(inbox_template_def);
        var unread = result.map(function(value) { return value._id; });

        // prepare to build an id -> message/reply/response map
        var inbox_items_map = {};

        // sort messages by last_update time
        messages.sort(function(a, b) {
            return (a.last_update < b.last_update ? 1 : (a.last_update > b.last_update ? -1 : 0));
        });

        // split messages into roots and replies
        var root_messages = messages.filter(function(message) { return message.type != 'reply'; });
        var reply_messages = messages.filter(function(message) { return message.type == 'reply'; });

        // put replies into the proper thread, along with crm responses
        reply_messages.forEach(function(reply) {

            // find the root message ("thread") for the reply
            var root_message = root_messages.filter(function(message) {
                return message._id == reply.root_message;
            });

            // if this reply has a root message defined
            if(root_message.length > 0) {
                root_message[0].responses.push(reply);
            }

            // add the reply to the inbox items map
            inbox_items_map[reply._id] = reply;
        });

        // go through the messages and mark any unread responses, then sort
        root_messages.forEach(function(message) {

            // add the root message to the inbox items map
            inbox_items_map[message._id] = message;

            if(!message.responses) {
                return;
            }

            // mark unread responses and continue building inbox map
            message.responses.forEach(function(response) {

                // add the root message to the inbox items map
                inbox_items_map[response._id] = response;

                // if we've found our unread response, mark it as so
                if(unread.indexOf(response.id) != -1) {
                    response.unread = true;
                    message.contains_unread = true;
                }
            });

            // sort responses/replies by creation time
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
            console.log('an exception occurred: ' + ex);
        }

        container.find('.attachments-view').click(function() {
            var inbox_item = inbox_items_map[$(this).data('id')];

            if(typeof(inbox_item) != 'undefined') {

                var modal_instance = generic_modal.init({
                    container: $('body'),
                    headerHtml: 'Message attachments',
                    showFooter: false
                });

                view_attachments_widget.init({
                    container: modal_instance.getBody(),
                    files: inbox_item.files
                });
            }
        });

        container.find('.message-header').click(function() {
            selectTab(container, $(this).data('id'), callbacks);
            if($('#default-footer')) {
                $('#default-footer').addClass("hidden");
            }
        });

        container.find('.back-icon').click(function() {
            clearSelectedTab(container, callbacks);
            if($('#default-footer')) {
                $('#default-footer').removeClass("hidden");
            }
        });

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
            var id = $(this).data('parent-id');

            if(typeof(callbacks) != 'undefined') {
                messages.forEach(function(message) {
                    if(message._id == id) {
                        if (typeof(message.responses) == 'undefined' || message.responses.length == 0) {
                            return;
                        }
                        var responding_to;
                        for (var i = message.responses.length - 1; i >= 0; i--) {
                            responding_to = message.responses[i];
                            if ((!responding_to.type || responding_to.type != 'reply') &&
                                typeof(callbacks) != 'undefined') {

                                callbacks.onReply(responding_to.id, message.ean);
                                return;
                            }
                        }
                    }
                });
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
                    if(typeof(message.responses) == 'undefined' || message.responses.length == 0) {
                        return;
                    }
                    var responding_to;
                    for(var i=message.responses.length - 1; i>=0; i--) {
                        responding_to = message.responses[i];
                        if((!responding_to.type || responding_to.type != 'reply') && typeof(callbacks) != 'undefined') {
                            callbacks.onReply(responding_to.id, message.ean);
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

    function clearSelectedTab(container, callbacks) {
        container.find('.message').removeClass('hidden');

        var selected_message_container = container.find("#"+selectedMessage);
        selected_message_container.removeClass("active");
        selected_message_container.removeClass("bounceInRight");
        selected_message_container.addClass("animated bounceOutRight");
        selected_message_container.addClass("hidden");

        selectedMessage = "";

        if(callbacks && callbacks.onBack) {
            callbacks.onBack();
        }
    }

    function selectTab(container, name, callbacks) {
        container.find('.message').addClass('hidden');

        var selected_tab_container = container.find("#"+name);
        selected_tab_container.removeClass("hidden");
        selected_tab_container.removeClass("animated bounceOutRight");
        selected_tab_container.addClass("animated bounceInRight");

        selectedMessage = name;

        selected_tab_container.addClass('active');

        if(callbacks && callbacks.onViewMessage) {
            callbacks.onViewMessage(name);
        }

        // get a list of responses for the given user message
        var unread_responses = selected_tab_container.find('.unread');

        if (unread_responses.length > 0) {
            var unread_response_id_list = [];
            for (var i = 0; i < unread_responses.length; i++) {
                unread_response_id_list.push($(unread_responses[i]).data('id'));
            }

            $.ajax({
                type: 'POST',
                url: server_root_url + 'messages/responses?state=read&idList=' + unread_response_id_list
            }).error(function (e) {
                console.log('an error occurred while marking messages as read: ' + e);
                //alert_modal.show('Error', 'Could not get unread messages');
            }).success(function () { // result

                // update gui to remove "unread" indicators
                setTimeout(function () {
                    _markAsReadInGUI(container, id);
                }, 2000);
            });
        }
    }

    function _markAsUnreadInGUI(container, message_id, response_id) {
        //container.find('.panel-heading').find('.unread-container[data-message-id=' + message_id + ']').html(unread_indicator_def);
        //container.find('.unread-container[data-response-id=' + response_id + ']').html(unread_indicator_def);
        container.find('.response[data-id=' + response_id + ']').addClass('unread');
    }

    function _markAsReadInGUI(container, message_id) {
        //container.find('.unread-container[data-message-id=' + message_id + ']').html('');
        container.find('.unread').removeClass('unread');
    }

    return {
        init: init
    }
}());