ScanPage.prototype  = new PageController();
ScanPage.prototype.constructor = ScanPage;

function ScanPage(onScanCallback) {
    this.onScanCallback = onScanCallback;
}

ScanPage.prototype.onPageReady = function() {
    this.pageContainer = $('#scan');
};

ScanPage.prototype.onPageBeforeShow = function() {
    window.scrollTo(80,0);
    if(platform_util.isMobile()) {
        loading_modal.show('Loading');
    }

    try {
        var scanned = this.scan();
    } catch (e) {
        console.log('scan failed');
        console.log('that sucks... reloading in 10');
        setTimeout(function() {
            console.log('reloading now...');
            app.onDeviceReady();
        }, 10000);
    }
};

ScanPage.prototype.scan = function() {
    var that = this;

    if(platform_util.isMobile()) {

        console.log('mobile platform detected.  Starting scanner');
        var scanner = window.cordova.require("cordova/plugin/BarcodeScanner");
        scanner.scan(
            function (result) {

                loading_modal.hide();
                console.log('scan process ended');
                if(result.cancelled == 1) {
                    if(app_util.isUsingWeb) {
                        app_controller.openExternalPage(app_util.getRemoteUrl() + '/products/find/view');
                    } else {
                        app_controller.openInternalPage("#index", {hide_from_history: true});
                    }

                } else {
                    console.log("Result: " + result.text + "\n" + "Format: " + result.format);
                    setTimeout(function() {
                        that.searchEAN(result.text, result.format);
                    }, 0);
                }
            },
            function (error) {
                loading_modal.hide();
                alert("Scanning failed: " + error);
            }
            //,[ "scannerOverlay"] // optional parameter to specify overlay style
        );
    } else {
        app_controller.openInternalPage("#index");
    }
};

ScanPage.prototype.searchEAN = function(ean, format) {
    var that = this;

    product_query.query(ean, app_util.isUsingWeb, 'scan', function(results) {
        that.onScanCallback(ean, results);
    });
};