function PageController() {
}

PageController.prototype = {
    setId: function(pageId) { this._pageId = pageId; },
    getId: function() { return this._pageId; },

    onPageReady: function() {},
    onPageBeforeShow: function() {},
    onPageBeforeHide: function() {},
    onPageHide: function() {},
    onPageShow: function() {},

    onProductScanned: function(product_and_brand_info) {},
    onProductConfirmed: function(product_and_brand_info) {},
    onReplyBegan: function(product_info, reply_id) {},

    tryApplyStyling: function(product_info) {
        if(product_info && product_info.brand && product_info.brand.styling) {
            app_util.addCustomStyle(product_info.brand.styling);
        }
    },

    applyProductImages: function(product_info, container) {
        general_util.applyBestProductImage(product_info, container);
    }
};

PageController.prototype.initEmoticonSurvey = function(container, remote_url, page) {
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
};

PageController.prototype.initUserSurveys = function(container, remote_url, user_id, page) {
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
                //alert_modal.show('Survey Complete', survey.submission_response);
                container.html('');
            }
        });

    }).error(function(data, text) {
        console.log('failed to get app sentiment survey details: ' + text);
    });
};
