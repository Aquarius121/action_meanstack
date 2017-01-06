var survey_widget = (function () {

    function init(container, options) {
        var _options = {
            remoteUrl: '',
            surveys: [], // assumes most important survey is listed first
            onBeforeAnswer: function(survey) {},
            onAnswered: function(survey, answers) { },
            onDeclined: function(survey) { }
        };

        _options = $.extend({}, _options, options);

        // filter out surveys outside the current time range
        var now_utc = moment.utc().valueOf();
        _options.surveys = _options.surveys.filter(function(survey) {
            if(survey.after && now_utc < survey.after) {
                return false;
            } else if(survey.before && now_utc > survey.before) {
                return false;
            }
            return true;
        });

        // just exit early if there are no surveys to process
        if(_options.surveys.length == 0) {
            return;
        }

        // start routing survey types to methods that handle them

        if(_options.surveys[0].type == 'app-sentiment') {
            _options.survey = _options.surveys[0];

            _initAppSentimentSurvey(container, _options);
            return;
        }

        if(_options.surveys[0].type == 'resolved-sentiment') {
            _options.survey = _options.surveys[0];

            _initResolvedSentimentSurvey(container, _options);
            return;
        }

        // other survey types go here
    }

    function _initAppSentimentSurvey(container, options) {

        container.html('<div class="title-text text-center"></div><div class="rating-contents"></div>');

        if(options.survey.questions.length == 0) {
            return;
        }

        var title_text = '';
        if(options.survey.title) {
            title_text = options.survey.title.trim();
        }
        container.find('.title-text').html(title_text);

        var emoticon_questions = options.survey.questions.filter(function(question) {
            return question.type == 'emoticons';
        });

        if(emoticon_questions.length > 0) {

            rating_widget.init(container.find('.rating-contents'), {
                stars: [
                    {
                        rating_classes: 'fa fa-frown-o fa-2x',
                        rating_style: 'color: red; text-shadow: 0 0 1px #333' //'color: #ff0; text-shadow: 0 0 1px #000; margin-right: 5px;',
                    },
                    {
                        rating_classes: 'fa fa-meh-o fa-2x',
                        rating_style: 'color: #ffdd00; text-shadow: 0 0 1px #333;' //'color: #ff0; text-shadow: 0 0 1px #000; margin-right: 5px;',
                    },
                    {
                        rating_classes: 'fa fa-smile-o fa-2x',
                        rating_style: 'color: #00dd00; text-shadow: 0 0 1px #333' //'color: #ff0; text-shadow: 0 0 1px #000; margin-right: 5px;',
                    }
                ],
                onSelected: function(star_index) {

                    container.html('');

                    single_input_modal.show('Thank you!', emoticon_questions[0].text, 'text', function(value) {
                        // ok button pushed
                        _sendSentimentSurvey(options, star_index, value);

                    }, function() {
                        // cancelled
                        _sendSentimentSurvey(options, star_index, '');

                    }, function() {
                        // hidden
                        //_sendAppSentimentSurvey(options, star_index, '');
                    });
                }
            });
        }
    }

    function _sendSentimentSurvey(options, value, text) {
        var answers = [
            {
                extra: value,
                text: text
            }
        ];

        options.onBeforeAnswer(answers);

        $.ajax({
            type: 'PUT',
            url: options.remoteUrl + '/survey/' + options.survey._id + '/response',
            data: {
                answers: answers
            }
        }).success(function(data) { // , text, jqXHR
            options.onAnswered(options.survey, answers);
        }).error(function(data, text) {
            alert_modal.show('Error', 'An error occurred: ' + data.responseText);
        });
    }

    function _initResolvedSentimentSurvey(container, options) {
        container.html('<div class="title-text text-center"></div><div class="rating-contents  text-center"></div>');

        if(options.survey.questions.length == 0) {
            return;
        }

        var title_text = '';
        if(options.survey.title) {
            title_text = options.survey.title.trim();
        }
        container.find('.title-text').html(title_text);

        var emoticon_questions = options.survey.questions.filter(function(question) {
            return question.type == 'emoticons';
        });

        if(emoticon_questions.length > 0) {

            rating_widget.init(container.find('.rating-contents'), {
                stars: [
                    {
                        rating_classes: 'fa fa-frown-o fa-2x',
                        rating_style: 'margin-right: 5px; color: red; text-shadow: 0 0 1px #333' //'color: #ff0; text-shadow: 0 0 1px #000; margin-right: 5px;',
                    },
                    {
                        rating_classes: 'fa fa-meh-o fa-2x',
                        rating_style: 'margin-right: 5px; color: #ffdd00; text-shadow: 0 0 1px #333;' //'color: #ff0; text-shadow: 0 0 1px #000; margin-right: 5px;',
                    },
                    {
                        rating_classes: 'fa fa-smile-o fa-2x',
                        rating_style: 'margin-right: 5px; color: #00dd00; text-shadow: 0 0 1px #333' //'color: #ff0; text-shadow: 0 0 1px #000; margin-right: 5px;',
                    }
                ],
                onSelected: function(star_index) {

                    single_input_modal.show('Thank you!', 'Please share more to help action! improve', 'text', function(value) {
                        // ok button pushed
                        _sendSentimentSurvey(options, star_index, value);

                    }, function() {
                        // cancelled
                        _sendSentimentSurvey(options, star_index, '');

                    }, function() {
                        // hidden
                        //_sendAppSentimentSurvey(options, star_index, '');
                    });
                }
            });
        }
    }

    return {
        init: init
    };

}());
