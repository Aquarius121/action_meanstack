

var app = {

    initialize: function() {
        settings_manager.init();
        this.setupPages();

        var settings = settings_manager.get();
        app.logIn(function(err_login) {
            if(err_login) {
                console.log('could not log in: ' + err_login);
                return;
            }
            app.onLogin();
        });

        // we require re-auth for facebook each time the app is inited
        if(typeof(settings.fb_caller) != 'undefined') {
            //console.log('setting app.caller to fb_caller');
            //app.caller = settings.fb_caller;
            delete settings.fb_caller;
            settings_manager.save(settings);
            app.onLogout();
            app_controller.openInternalPage("#login");
        }

        // we require re-auth for google each time the app is inited
        if(typeof(settings.goog_caller) != 'undefined') {
            //console.log('setting app.caller to fb_caller');
            //app.caller = settings.fb_caller;
            delete settings.goog_caller;
            settings_manager.save(settings);
            app.onLogout();
            app_controller.openInternalPage("#login");
        }

        this.bindEvents();

        polling_util.init();
        app.is_paused = false;

        app_util.getAppVersion(0, function(error, version) {
            if(typeof(version) != 'undefined') {
                $('.sidebar').find('.version').html('v' + version);
            }
        });
    },
    
    setupPages: function () {
        console.log('setting up of pages BEGAN');

        //header_widget.init($('div[data-role="header"]'));
        var footer_container = $('div[data-role="footer"].default-footer');
        footer_widget.init(footer_container);
        footer_container.find('.back-btn').click(function() {
            if(window.location.hash == "#product-menu")
            {
                var settings = settings_manager.get();
                settings.back_product_flag = true;
                settings_manager.save(settings);
            }
            if(window.location.hash != "#index" && window.location.hash != "#login")
                window.history.back();
        });

        header_widget.init();

        $('li.logged-out').css('display', 'none');
        //$( "[data-role='footer']" ).toolbar();

        this.setupSidebar();

        app_controller.addPage('#login', new LoginPage(this));
        app_controller.addPage('#index', new IndexPage());
        app_controller.addPage('#user-info', new UserInfoPage());
        app_controller.addPage('#product-results', new ProductResultsPage());
        app_controller.addPage('#product-confirm', new ProductConfirmPage(productConfirmCallback, onProductDenied));
        app_controller.addPage('#product-menu', new ProductMenuPage());
        app_controller.addPage('#scan', new ScanPage(onProductScanned));
        app_controller.addPage('#find', new FindPage(productConfirmCallback));
        app_controller.addPage('#share', new SharePage());
        app_controller.addPage('#profile', new ProfilePage());
        app_controller.addPage('#not-participating', new NotParticipatingPage());
        app_controller.addPage('#where-to-buy', new WhereToBuyPage());
        app_controller.addPage('#faq-page', new FAQPage());
        app_controller.addPage('#history-page', new HistoryPage());
        app_controller.addPage('#favorite-brands', new FavoriteBrandsPage());
        app_controller.addPage('#brand-messaging', new BrandMessagingPage());
        app_controller.addPage('#custom-modal', new CustomModalPage());
        app_controller.addPage('#register-page', new RegisterPage());
        app_controller.addPage('#thanks-share', new ThanksSharePage());
        app_controller.addPage('#intro', new IntroPage());
        app_controller.addPage('#how-can-we-help', new HowCanWeHelpPage());
        app_controller.addPage('#terms-and-conditions', new TermsAndConditionsPage());
        app_controller.addPage('#brand', new BrandPage(productConfirmCallback));
        app_controller.addPage('#opt-ins', new OptInsPage());
        //app_controller.addPage('#video-chat', new VideoChatPage());

        console.log('setting up of pages COMPLETE');

        var pages_requiring_login = ['#share', '#find', '#scan', '#favorite-brands', '#history-page', '#opt-ins'];
        app_controller.init(pages_requiring_login);

        var settings = settings_manager.get();
        if(!settings.saw_intro)
        {
            settings.saw_intro = true;
            settings_manager.save(settings);
            app_controller.openInternalPage("#intro", "none");
        }
    },

    setupSidebar: function() {
        var that = this;

        var content_div = $('body > .content');
        var trigger = $('body > .nav-trigger');
        var sidebar = $('body > .sidebar');
        var trigger_label = content_div.find('.hamburger-label');

        var bind_events = "click";

        if(platform_util.isMobile() && platform_util.isApple()) {
            bind_events = "touchstart";
        }

        trigger_label.bind(bind_events, function(e) {
            that.toggleSidebar();
            return false;
        });

        content_div.bind(bind_events, function(e) {

            // when you click on the nav-trigger or the label for it, we get a body click event we don't care about
            if(e.target.htmlFor != "nav-trigger" && e.target.id != 'nav-trigger') {

                if(trigger.hasClass('expanded')) {
                    that.minimizeSidebar();
                    return false;
                }
            }
        });

        // if any menu items are pressed, hide the sidebar
        sidebar.find('a').click(function() {
            that.minimizeSidebar();
        });
    },

    minimizeSidebar: function() {
        var hamburgerMenu = $('body > .nav-trigger');
        var content_div = $('body > .content');

        hamburgerMenu.removeClass('expanded');
        content_div.removeClass('expanded');
        //hamburgerMenu.prop('checked', false);

        //setTimeout(function() {
        //    app_util.redrawElement($('body'));
        //}, 500);
    },

    toggleSidebar: function() {
        var hamburgerMenu = $('body > .nav-trigger');
        var content_div = $('body > .content');

        hamburgerMenu.toggleClass('expanded');
        content_div.toggleClass('expanded');
    },

    pause: function() {
        console.log('the app has been put into the background');
        app.is_paused = true;
        polling_util.pause();
    },

    resume: function() {
        console.log('the app has been restored from the background');
        app.is_paused = false;
        polling_util.resume();
    },

    // Bind Event Listeners
    // Common events are: 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        console.log('binding events BEGAN');

        var thisModule = this;
        document.addEventListener('deviceready', function(){
            if(device.platform == "Android" || window.device.platform == "Android") {
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, FileIO.gotFS, FileIO.errorHandler);
            }
        }, false);

        $(document).ready(function () {
            thisModule.onDeviceReady();
        });

        document.addEventListener('pause', app.pause, false);

        document.addEventListener('resume', app.resume, false);

        console.log('binding events COMPLETE');
    },

    logIn: function(callback2) {
        var settings = settings_manager.get();
        if(typeof(settings.email) != 'undefined' && typeof(settings.password) != 'undefined') {
            app_util.doLogin(settings.email, settings.password,
                function(data, text, jqXHR) { //
                    app.login_time = moment();
                    app.caller = data;

                    //console.log(jqXHR.getAllResponseHeaders());
                    //app.cookie = jqXHR.getResponseHeader('Set-Cookie');

                    callback2(null, data);
                }, function(jqXHR, error) {
                    app_controller.openInternalPage('#login', 'none');
                    console.log('failed to log in: ' + jqXHR.statusText + ' (code=' + jqXHR.status + ')');
                    callback2(error);
                }
            );
            return;
        }
        callback2('login info not found');
        $("input").blur();
    },

    onLogin: function() {
        $('li.logged-out').css('display', 'none');
        $('li.logged-in').css('display', '');
        $('li.admin-only').css('display', app.caller && app.caller.role == 'admin' ? '' : 'none');
        $('span.user-name').html(app.caller.first_name + ' ' +  app.caller.last_name)
        var settings = settings_manager.get();
        settings.back_term = "";
        settings.back_products = [];
        settings_manager.save(settings);
        if(app.login_referrer) {
            app_controller.openInternalPage(app.login_referrer);
            app.login_referrer = null;
            return;
        }
        app_controller.openInternalPage("#index");
    },

    onLogout: function() {
        $('li.admin-only').css('display', 'none');
        $('li.logged-out').css('display', '');
        $('li.logged-in').css('display', 'none');
        delete app.caller;

        var settings = settings_manager.get();
        if(typeof(settings.email) != 'undefined') {
            delete settings.email;
        }
        if(typeof(settings.password) != 'undefined') {
            delete settings.password;
        }
        if(typeof(settings.fb_caller) != 'undefined') {
            delete settings.fb_caller;
        }
        if(typeof(settings.fb_data) != 'undefined') {
            delete settings.fb_data;
            facebookConnectPlugin.logout();
        }
        if(typeof(settings.goog_caller) != 'undefined') {
            delete settings.goog_caller;

        }

        settings_manager.save(settings);

        app_controller.openInternalPage("#login");
    },

    confirmProduct: productConfirmCallback,

    doPlatformSpecificStuff: function() {
        if(platform_util.isMobile()) {

            console.log('applying platform style to body');
            if(platform_util.isApple()) {
                $("body").addClass('ios');
                $("body").addClass('ios-' + platform_util.iOSversion()[0]);
            } else if(platform_util.isAndroid()) {
                $("body").addClass('android');
            }

            console.log('applying bootstrap dropdown fix');
            $('a.dropdown-toggle').unbind('click');
            $('a.dropdown-toggle').click(function(e) {
                e.stopPropagation();
                var ul = $(this).parent();

                if(ul.hasClass('open')) {
                    ul.removeClass("open");
                } else {
                    ul.addClass("open");
                }
            });
        }

        app.tryIOS7HeaderPatch();

    	console.log('feature#Image: ' + document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1"));
    	console.log('feature#BasicPaintAttribute: ' + document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicPaintAttribute", "1.1"));
    	
        // handle lack of SVG support
        if(!platform_util.supportsSvg()) {
            console.log('system does not support SVG!');
        } else {
            console.log('system supports SVG!');
        }
        this.swapSVGs();

        app.applyIOSFooterPositionFix();
    },

    applyIOSFooterPositionFix: function() {
        if(platform_util.isMobile() && platform_util.isApple()) {
            $(document).on('blur', 'input, textarea', function() {

                setTimeout(function() {
                    console.log('scrolling to top');
                    window.scrollTo(window.pageXOffset ? window.pageXOffset : 0, window.pageYOffset ? window.pageYOffset : 0);
                }, 300);
            });
        }
    },

    onDeviceReady: function () {

        facebook_util.init();
        google_util.init();
        app_util.init(app);

        // these elements are on the headers/footers and such
        $('.find-redirect').unbind('click');
        $('.find-redirect').click(function() {
            app.minimizeSidebar();
            if(app_util.isUsingWeb) {
                app_controller.openExternalPage(app_util.getRemoteUrl() + '/products/find/view');
            } else {
                app_controller.openInternalPage("#find");
            }
            return false;
        });

        $('.scan-link').unbind('click');
        $('.scan-link').click(function() {
            app.minimizeSidebar();
            app_controller.openInternalPage("#scan");
            return false;
        });

        $('.brand-logo').unbind('click');
        $('.brand-logo').click(function() {
            app.minimizeSidebar();
            app_controller.openInternalPage("#index");
            return false;
        });

        app.doPlatformSpecificStuff();

        app_controller.onReady();

        if(app_util.isLoggedIn(app)) {
            $('li.logged-out').css('display', 'none');
            $('li.logged-in').css('display', '');
            if(app.caller.role == 'admin') {
                $('li.admin-only').css('display', '');
            }
        } else {
            $('li.admin-only').css('display', 'none');
            $('li.logged-out').css('display', '');
            $('li.logged-in').css('display', 'none');
        }

        app_controller.openInternalPage(window.location.hash ? window.location.hash : '#login');

        $('body').removeClass('hidden');

        $('ul.dropdown-menu > li > a').click(function(e) {
            $(this).parent().parent().parent().removeClass('open');
        });
        var settings = settings_manager.get();
        settings.modal_instance = undefined;
        settings_manager.save(settings);
        document.addEventListener("backbutton", function(e){
            //if($.mobile.activePage.is('#profile')){
            //navigator.app.backHistory();

            e.preventDefault();
            var settings = settings_manager.get();
            if(settings.modal_instance != undefined)
            {
                $(settings.modal_instance).modal("hide");
                settings.modal_instance = undefined;
                settings_manager.save(settings);
            }
            else{
                if(window.location.hash == "#history-page")
                {
                    domElements = document.getElementsByClassName('tab-content message-detail-view animated bounceInRight active');
                    if(domElements.length > 0)
                        $(".back-icon").click();
                }
                $(".back-btn").click();
                //if(window.location.hash != "#index" && window.location.hash != "#login")
                //    window.history.back();
            }

            //}
            //else {
            //
            //}
        }, false);
    },

    tryIOS7HeaderPatch: function() {
        console.log('checking for iOS, user agent = ' + navigator.userAgent);


        if(platform_util.isApple() && platform_util.isMobile()) {
            $("body").addClass('ios');
            $("body").addClass('ios-' + platform_util.iOSversion()[0]);

            console.log('checking for iOS version >= 7');

            if(platform_util.iOSversion()[0] >= '7') {
                console.log('patching iOS 7 header issue');

                $("div[data-role='header']").css('margin-top', function (index, curValue) {
                    console.log('increasing header margin-top from ' + curValue);
                    return parseInt(curValue, 10) + 20 + 'px';
                });
                $("div[data-role='content']").css('margin-top', function (index, curValue) {
                    console.log('increasing content margin-top from ' + curValue);
                    return parseInt(curValue, 10) + 20 + 'px';
                });

            }
        }
    },

    tryIOS7HeaderPatchV1: function() {

        if(!window.device || !window.device.platform || !window.device.version) {
            console.log('retrying iOS patch in 1 second');
            setTimeout(app.tryIOS7HeaderPatchV1, 30);
            return;
        }

        console.log('checking for iOS <= 7 (actual=' + window.device.version + ')');
        if (window.device.platform == 'iOS' && parseInt(window.device.version, 10) >= 7) {
            console.log('patching iOS 7 header issue');

            $("div[data-role='header']").css('margin-top', function (index, curValue) {
                console.log('increasing header margin-top from ' + curValue);
                return parseInt(curValue, 10) + 20 + 'px';
            });
            $("div[data-role='content']").css('margin-top', function (index, curValue) {
                console.log('increasing content margin-top from ' + curValue);
                return parseInt(curValue, 10) + 20 + 'px';
            });
            $('.sidebar-offcanvas > ul').css('margin-top', function (index, curValue) {
                console.log('increasing sidebar margin-top from ' + curValue);
                return parseInt(curValue, 10) + 20 + 'px';
            });
            $("body > .spacer").addClass('ios-spacer');
        }
    },

    swapSVGs: function() {
        var svgs = $('.brand > svg');
        var img_element = '<img src="img/logo-horizontal-large.png">';
        $.each(svgs, function() {
            var parent = $(this).parent();
            $(this).remove();
            parent.html(img_element);
        });
    },

    onReplyBegan: function(product_info, reply_id) {
        console.log('processing reply BEGAN');
        app_controller.forEachPage(function(page) {
            page.onReplyBegan(product_info, reply_id);
        });
        console.log('processing reply COMPLETE');

        app_controller.openInternalPage('#share');
    }
};

function productConfirmCallback(product_info) {
    /*
    if(typeof(product_info.brand) != 'undefined' &&
        !app_util.meetsBrandAgeRequirements(product_info.brand, app.caller)) {
        app_controller.openInternalPage('#age-restricted-product');
        return;
    }
    */

    console.log('processing product confirmation BEGAN');
    app_controller.forEachPage(function(controller) {
        controller.onProductConfirmed(product_info);
    });
    console.log('processing product confirmation COMPLETE');

    //if((!app_util.isParticipating(product_info) && ("undefined" != typeof product_info.brand && "undefined" != typeof product_info.brand.auto_message && product_info.brand.auto_message && product_info.brand.auto_message.trim().length > 0))
   // || (!auto_message_utils.hasProductInfo(product_info.product) && ("undefined" != typeof product_info.brand && "undefined" != typeof product_info.brand.auto_message && product_info.brand.auto_message && product_info.brand.auto_message.trim().length > 0)))

    if(!app_util.isParticipating(product_info))
        app_controller.openInternalPage('#not-participating');
    else
        app_controller.openInternalPage('#product-menu');

}

function onProductDenied(results) {
    app_controller.openInternalPage('#index');
}

function onProductScanned(code, results) {

    if(results == null) {
        alert_modal.show('Not found', 'Product ' + code + ' not found', function() {
            app_controller.openInternalPage('#index', {hide_from_history: true});
        });
        return;
    }
    console.log('processing product scan BEGAN');
    app_controller.forEachPage(function(page) {
        page.onProductScanned(results);
    });
    console.log('processing product scan COMPLETE');

    app_controller.openInternalPage('#product-confirm', {hide_from_history: true});
}

// this is called when back is pushed or an href is specified
// http://benalman.com/projects/jquery-hashchange-plugin/ might be needed
window.onhashchange = function(evt) {
    app_controller.onPageChanged(app_controller.getActivePage());
};