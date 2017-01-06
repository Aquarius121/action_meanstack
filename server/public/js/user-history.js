
$(function() {
    $( ".ui-tooltip" ).tooltip({});
});

var user_history_page = (function() {

    function init(user_id, mark_unread) {
        var container = $('.user-message-container');

        initSurvey($('.rating-container'), '', 'messages');
        initUserSurveys($('.resolved-survey-container'), '', user_id, 'messages');

        inbox_widget.init('/', container, user_id, mark_unread, {
            onReply: function(reply_id) {
                window.location.href = '/message/send/view?reply-to=' + reply_id;
            }
        });
    }

    function initUserSurveys(container, remote_url, user_id, page) {
        $.ajax({
            type: 'GET',
            url: remote_url + '/survey?user=' + user_id + '&active=true' + (page ? '&page=' + page : '')
        }).success(function(data) { // , text, jqXHR

            if(typeof(data) == 'undefined' || data.length == 0) {
                return;
            }

            survey_widget.init(container, {
                surveys: data,
                remoteUrl: remote_url,
                onAnswered: function(survey) {
                    container.html('');
                    //alert_modal.show('Survey Complete', survey.submission_response);
                }
            });

        }).error(function(data, text) {
            console.log('failed to get app sentiment survey details: ' + text);
        });
    }

    function initSurvey(container, remote_url, page) {
        $.ajax({
            type: 'GET',
            url: remote_url + '/survey?type=app-sentiment' + (page ? '&page=' + page : '')
        }).success(function(data) { // , text, jqXHR

            if(typeof(data) == 'undefined' || data.length == 0) {
                return;
            }

            survey_widget.init(container, {
                surveys: data,
                remoteUrl: remote_url,
                onAnswered: function(survey) {
                    //alert_modal.show('Survey Complete', survey.submission_response);
                }
            });

        }).error(function(data, text) {
            console.log('failed to get app sentiment survey details: ' + text);
        });
    }

    return {
        init: init
    }
}());
