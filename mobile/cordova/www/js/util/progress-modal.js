var progress_modal = (function() {

    // TODO: remove inline styles, though I think they are only undefined on server
    var loading_modal_template_def =
        '<div class="modal-progress modal" style="height:165px; width: 165px; margin-left: -82px; left: 50%; top: 50%; margin-top: -75px; overflow: visible;">' +
            '<div class="modal-content">' +
                '<div class="modal-body" style="border-radius: 10px;">' +
                    '<div class="progress-content">Initializing...</div>' +
                    '<div class="progress-meter"><span class="meter-inner"></span></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    function init(container) {
        container.append(doT.template(loading_modal_template_def)({}));
    }

    function show() {
        var loadingMessage = $('.modal-progress');
        loadingMessage.modal({ show : false, keyboard : false, backdrop : 'static' });

        loadingMessage.modal('show');
    }

    function hide() {
        $('.modal-progress').modal('hide');
        if(typeof(this.spinner) != 'undefined') {
            this.spinner.stop();
        }
    }

    function setProgress(progress) {
        var percent = (100 * progress.loaded / progress.total).toFixed(0);
        var body = $('.modal-progress').find('.modal-body');
        var text = body.find('.progress-content');
        var meter = body.find('.progress-meter');
        text.html(percent + '% uploaded<br>(' + general_util.bytesToSize(progress.total) + ' total)');
        meter.find('.meter-inner').css('width', percent + '%');
    }

    return {
        show: show,
        hide: hide,
        setProgress: setProgress,
        init: init
    }
}());

$(function() {
    progress_modal.init($('body'));
});