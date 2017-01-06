var product_faq_widget = (function () {

    // pass in {data:[], categories:[]}
    var wilke_template_def =
        '<div class="category-select-container">' +
            '<select class="category-select">' +
                '{{~it.categories :category:index}}' +
                    '<option value="{{=category.code}}" ' +
                        '{{=(it.category_code == category.code ? "selected" : "")}}>{{=category.docTitle}}' +
                    '</option>' +
                '{{~}}' +
            '</select>' +
        '</div>' +
        '{{~it.data.rows :question:index}}' +
            '<div class="question"><a class="faq-link" data-code="{{=question.code}}">{{=question.docTitle}}</a></div>' +
        '{{~}}' +
        '<div style="margin-bottom: 20px;"></div>';

    var astute_knowledge_5_template_def =
        '<div class="ak5-container">' +
            '<form class="form-horizontal">' +
                '<div class="form-group">' +
                    '<input type="text" class="form-control astute-knowledge5-endpoint ak5-question" value="">' +
                    '<button class="ask btn btn-primary btn-sm">ask</button>' +
                '</div>' +
            '</form>' +
        '</div>' +
        '<div class="results">{{?it.dialog_history && it.dialog_history.length > 0}}<hr>{{=it.dialog_history[0]}}{{?}}</div>';

    var astute_knowledge_5_results_template_def =
        '<hr>' +
        '<div class="utterance-container">' +
            '{{~it.data.Utterance :utterance:utterance_index}}' +
                '{{=utterance}}' +
            '{{~}}' +
        '</div>' +
        '<div class="suggestion-container">' +
            '{{~it.data.SuggestedTopics :topic_group:topic_group_index}}' +
                '{{~topic_group.SuggestedTopic :topic:topic_index}}' +
                    '<a class="topic" data-question-id={{=topic.QuestionID}}>{{=topic.Text}}</a>' +
                    '<div class="clearfix"></div>' +
                '{{~}}' +
            '{{~}}' +
        '</div>';

    var wilke_template = doT.template(wilke_template_def);
    var astute_knowledge_5_template = doT.template(astute_knowledge_5_template_def);
    var astute_knowledge_5_results_template = doT.template(astute_knowledge_5_results_template_def);

    function _init(container, base_url, product, brand) {
        if(brand && brand.faq) {
            if(brand.faq.wilke) {
                if(!brand.faq.wilke.enlight_tenant) {
                    container.html('No tenant was configured for this brand');
                    return;
                }
                _initWilke(container, base_url, brand);
                return;
            }

            if(brand.faq.astute_knowledge_5) {

                // TODO: these aren't really needed client-side
                if(!brand.faq.astute_knowledge_5.touchpoint) {
                    container.html('No touchpoint was configured for this brand');
                    return;
                }
                if(!brand.faq.astute_knowledge_5.endpoint) {
                    container.html('No endpoint was configured for this brand');
                    return;
                }
                _initAstuteKnowledge5(container, base_url, product, brand);
                return;
            }
        }

        if(product.faq) {
            container.html(product.faq);
            general_util.makeLinksSafe(container);
            return;
        }
        container.html('No FAQ data was found');
    }

    function _initWilke(container, base_url, brand) {
        wilke_enlight_util.loadCategories(base_url, brand._id, brand.faq.wilke, function(err, categories) {
            if(typeof(err) != 'undefined' && err != null) {
                //alert_modal.show('Error', 'an error occurred: ' + err);
                console.log('an error occurred');
                return;
            }
            wilke_enlight_util.getCategory(base_url, brand.faq.wilke, categories[0].code, function(err_cat, category) {
                if(err_cat) {
                    container.html('An error occurred: ' + err_cat);
                    return;
                }
                _renderWilkeCategory(container, categories[0].code, category, categories);
            });
        });

        function _renderWilkeCategory(container, category_code, data, categories) {
            var html_contents = wilke_template({
                data: data,
                categories: categories,
                category_code: category_code
            });
            container.html(html_contents);

            // set up the category selects
            container.find('select.category-select').change(function() {
                var code = $(this).val();
                wilke_enlight_util.getCategory(base_url, brand.faq.wilke, code, function(err_cat, category) {
                    if(err_cat) {
                        container.html('An error occurred: ' + err_cat);
                        return;
                    }

                    _renderWilkeCategory(container, code, category, categories);
                });
            });

            // handle faq link click events
            container.find('a.faq-link').click(function() {
                var container = $(this).parent();

                var current_answer = container.find('.answer');
                if(current_answer.length > 0) {
                    container.find('.answer').remove();
                    return;
                }

                var code = $(this).data('code');
                var url = base_url + '/faq/enlight/' + brand.faq.wilke.enlight_tenant + '/document/' + code;

                url += '?'
                    + 'view=' + brand.faq.wilke.view_id;

                $.ajax({
                    type: 'GET',
                    url: url
                }).success(function(data) { // , text, jqXHR
                    container.find('.answer').remove();
                    container.append('<div class="answer">' + data.fields.answer + '</div>');
                }).error(function(data) {
                    // TODO: ?
                    console.log(data);
                });
                return false;
            });
        }
    }

    function _initAstuteKnowledge5(container, base_url, product, brand) {
        var init_url = base_url  + '/faq/astute-knowledge/5/session?ean=' + product.ean;
        var get_response_url = base_url + '/faq/astute-knowledge/5/dialog?ean=' + product.ean;

        container.html('<div class="text-center">loading...</div>');

        $.ajax({
            type: 'GET',
            url: init_url
        }).success(function(data) { // , text, jqXHR
            get_response_url += ('&session-id=' + data);

            _getAstuteKnowledge5History(base_url, product, data, function(err, result) {
                var html_contents = astute_knowledge_5_template({
                    dialog_history: result
                });
                container.html(html_contents);

                container.find('button.ask').click(onAskButtonClicked);
            });

            function onAskButtonClicked() {
                var input_box = container.find('input.ak5-question');
                var utterance = input_box.val();

                input_box.trigger('blur');

                $.ajax({
                    type: 'GET',
                    url: get_response_url + '&utterance=' + utterance
                }).success(function(data) { // , text, jqXHR
                    container.find('.results').html(astute_knowledge_5_results_template({
                        data: data,
                        product: product,
                        brand: brand
                    }));

                    container.find('a.topic').click(onTopicClicked);
                    general_util.makeLinksSafe(container.find('.utterance-container'));
                }).error(function(data) {
                    // TODO: better alert
                    //window.alert(data);
                });

                function onTopicClicked() {
                    var question_id = $(this).data('question-id');

                    $.ajax({
                        type: 'GET',
                        url: get_response_url + '&utterance=' + utterance + '&question-id=' + question_id
                    }).success(function(data) { // , text, jqXHR
                        container.find('.results').html(astute_knowledge_5_results_template({
                            data: data,
                            product: product,
                            brand: brand
                        }));

                        container.find('a.topic').click(onTopicClicked);
                        general_util.makeLinksSafe(container.find('.utterance-container'));
                    }).error(function(data) {
                        // TODO: better alert
                        //window.alert(data);
                    });
                    return false;
                }
                return false;
            }

        }).error(function(data) {
            // TODO: better alert
            //window.alert(data);
        });
    }

    function _getAstuteKnowledge5History(base_url, product, session_id, callback2) {
        var get_dialog_history_url = base_url + '/faq/astute-knowledge/5/dialog-history?ean=' + product.ean;
        get_dialog_history_url += ('&session-id=' + session_id);

        $.ajax({
            type: 'GET',
            url: get_dialog_history_url
        }).success(function(data) {
            callback2(null, data);
        }).error(function(error) {
            callback2(error);
        });
    }

    return {
        init: _init
    };
}());