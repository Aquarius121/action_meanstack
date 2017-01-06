
var product_faq_page = (function() {

    function init(caller, product, brand) {
        initSurvey($('.rating-container'), '', 'faq');
        product_faq_widget.init($('.faq-container'), '', product, brand);
        product_summary_widget.init('', product, brand, $('.product-result'), caller);
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


$(function() {
    $( ".ui-tooltip" ).tooltip({});
});
