
$(function() {
    var coupon_ean = '';
    /*
    if(caller.firstVisit == true)
    {
        var settings = settings_manager.get();
        settings.back_term = "";
        settings.back_text = "";
        settings.back_products = undefined;
        settings.recent_products = undefined;
        settings_manager.save(settings);
        caller.firstVisit = false
    }
    */
    var settings = settings_manager.get();
    settings.logged_in = true;
    settings_manager.save(settings);
    $('.dash-button').click(function() {
        window.location.href = $(this).data('link');
    });

    $('.database-backup').click(function() {
        loading_modal.show('Removing...');
        $.ajax({
            type: 'POST',
            url: '/admin/database?action=backup'
        }).done(function(result) {
            loading_modal.hide();
            alert_modal.show('Success', 'Started job to backup database.');
        });
    });

    $('.coupon-fileinput-button').click(function() {
        coupon_ean = $('input.ean-input').val();
        $('input.coupon-fileupload').fileupload({
            url: '/coupon/' + coupon_ean + '/' + $('input[name=coupon_type]:checked').val(),
            dataType: 'json',
            error: function(e) {
                // WTF - the stupid lib returns error for a 200 status...
                if(e.status == 200) {
                    onCouponUploadSuccess(e);
                } else {
                    loading_modal.hide();
                    alert_modal.show('Error', 'An error occurred: ' + e.responseText);
                }

            },
            done: function (e, data) {
                onCouponUploadSuccess(data);
            }
        });
    });

    $('input.coupon-fileupload').bind('change', function (e) {
        loading_modal.show('Uploading...');
    });

    $('button.dotify').click(function() {
        single_input_modal.show('Enter HTML', 'Enter HTML contents - I will format it for you for doT', 'text', function(text) {
            var results = html_beautify(single_input_modal.getValue($('body')), {});
            results = results.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
            results = results.replace(/\n/g, '\' +\n');


            var final_results = '';
            var results_lines = results.split('\n');
            results_lines.forEach(function(line, index) {
                final_results += line.replace('<', '\'<') + (index == results_lines.length - 1 ? '\';' : '') + '\n';
            });
            results = final_results;

            $('body').html('<textarea style="width: 100%; height: 100%;">');
            $('body > textarea').text(results);
        });
    });

    $('button.recompute-brand-product-counts').click(function() {
        loading_modal.show('Removing...');
        $.ajax({
            type: 'POST',
            url: '/admin/brands?action=recompute-product-counts'
        }).done(function(result) {
            loading_modal.hide();
            alert_modal.show('Success', 'Started job to recalculate product counts for all brands.');
        });
    });

    function onCouponUploadSuccess(result) {
        loading_modal.hide();
        alert_modal.show('Success', 'Successfully created coupon entry');
    }

    $('button.btn-submit-nlp').click(function() {
        loading_modal.show('Training...');
        $.ajax({
            type: 'POST',
            url: '/nlp/train',
            data: {
                text: $('input.nlp-phrase-input').val(),
                sentiment: $('input[name=sentiment]:checked').val()
            }
        }).error(function(e) {
            onNLPTrainResult(null);
            console.log('an error occurred with sentiment analysis: ' + e);
        }).done(function(result) {
            onNLPTrainResult(result);
        });
    });

    function onNLPTrainResult(result) {
        loading_modal.hide();
        alert_modal.show('Success', 'Training succeeded');
    }

    $('button.optimize-solr').click(function() {
        loading_modal.show('Optimizing...');
        $.ajax({
            type: 'POST',
            url: '/admin/products?action=optimize-solr'
        }).done(function(result) {
            loading_modal.hide();
            alert_modal.show('Success', 'Began solr optimization');
        });
    });

    $('button.manual-report-process').click(function() {
        loading_modal.show('Processing...');
        $.ajax({
            type: 'POST',
            url: '/admin/reports?action=process'
        }).done(function(result) {
            loading_modal.hide();
            alert_modal.show('Success', 'Started report-processing job');
        });
    });

    $('button.remove-unbranded').click(function() {
        loading_modal.show('Removing...');
        $.ajax({
            type: 'POST',
            url: '/admin/products?action=remove-unbranded'
        }).done(function(result) {
            loading_modal.hide();
            alert_modal.show('Success', 'Started job to remove unbranded products.  Please rebuild SOLR indices when complete');
        });
    });

    $('button.rebuild-solr-indices').click(function() {
        loading_modal.show('Rebuilding...');
        $.ajax({
            type: 'POST',
            url: '/admin/products?action=rebuild-indices'
        }).done(function(result) {
            loading_modal.hide();
            alert_modal.show('Success', 'Started job to rebuild search indices.');
        }).error(function(xhr) {
            loading_modal.hide();
            alert_modal.showFromXHR('Error', xhr);
        });
    });

    $('.postal-fileupload').fileupload({
        dataType: 'json',
        url: '/reference/postal-code',
        error: function(e) {
            loading_modal.hide();
        },
        done: function (e, data) {
            loading_modal.hide();
        }
    });

    $('button.delete-data').click(function() {
        confirm_modal.show('Confirm Deletion', 'Are you sure you want to delete ALL DATA?<BR>This cannot be undone!<BR>I mean, we take backups, but what a pain it is to restore!', function() {
            loading_modal.show('Deleting...');
            $.ajax({
                type: 'DELETE',
                url: '/admin/database'
            }).done(function (result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Began deleting EVERYTHING.');
            }).error(function (xhr) {
                loading_modal.hide();
                alert_modal.showFromXHR('Error', xhr);
            });
        });
    });

    $('button.delete-reports').click(function() {
        var message = 'Date must be in DD/MM/YYYY form.  The reports since the provided date (most recent) are removed.';

        single_input_modal.show('Enter start date for removal', message, 'text', function() {
            var since_text = single_input_modal.getValue($('body')).trim();
            var since = moment.utc(since_text).valueOf(); // .subtract(1, 'weeks')

            $.ajax({
                type: 'DELETE',
                url: '/reports?since=' + since
            }).done(function (result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Began deleting reports.');
            }).error(function (xhr) {
                loading_modal.hide();
                alert_modal.showFromXHR('Error', xhr);
            });
        });
    });

    $('button.calculate-ages').click(function() {
        confirm_modal.setButtonClasses('btn-success', 'btn-warning');
        confirm_modal.setButtonText('No', 'Yes');
        confirm_modal.show('Recalculate ages', 'Are you sure you wish to recalculate user ages?', function() {
            loading_modal.show('Recalculating...');
            $.ajax({
                type: 'POST',
                url: '/admin/user?action=calculate-ages'
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).success(function(result) {
                window.location.href = '/';
            });
        });
    });
});
