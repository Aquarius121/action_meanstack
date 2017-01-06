IntroPage.prototype  = new PageController();
IntroPage.prototype.constructor = IntroPage;

function IntroPage() {

}

function exit_tour(){
    if(!app.caller)
    {
        app_controller.openInternalPage('#login');
    }
    else
    {
        app_controller.openInternalPage('#index');
    }
}

IntroPage.prototype.onPageReady = function() {
    this.accessed = 0;
    //$("#intro").height("100%");

    /*
    this.pageContainer = $('#intro');

    var options = {
        $FillMode: 0,
        $Loop : 0,
        $BulletNavigatorOptions: {                                //[Optional] Options to specify and enable navigator or not
            $Class: $JssorBulletNavigator$,                       //[Required] Class to create navigator instance
            $ChanceToShow: 2,                               //[Required] 0 Never, 1 Mouse Over, 2 Always
            $AutoCenter: 1,                                 //[Optional] Auto center navigator in parent container, 0 None, 1 Horizontal, 2 Vertical, 3 Both, default value is 0
            $Steps: 1,                                      //[Optional] Steps to go for each navigation request, default value is 1
            $Lanes: 1,                                      //[Optional] Specify lanes to arrange items, default value is 1
            $SpacingX: 30,                                  //[Optional] Horizontal space between each item in pixel, default value is 0
            $SpacingY: 30,                                  //[Optional] Vertical space between each item in pixel, default value is 0
            $Orientation: 1                                 //[Optional] The orientation of the navigator, 1 horizontal, 2 vertical, default value is 1
        }

    };

    this.slider = new $JssorSlider$('slider1_container', options);
    */
};

IntroPage.prototype.onPageBeforeShow = function() {
    this.pageContainer = $('#intro');
    window.scrollTo(80,0);
    //$("#swiper-wrapper").css("transform","translate3d(0px, 0px, 0px);");
    that = this
    header_widget.setVisible(false);
    $('.default-footer').addClass('hidden');

    $('#intro').height(document.body.clientHeight);
    $('#intro').width(document.body.clientWidth);
    $('.swiper-container').width(document.body.clientWidth);
    $('.swiper-container').height(document.body.clientHeight);
    $('.swiper-slide').width(document.body.clientWidth);
    $('.swiper-slide > img').width(document.body.clientWidth);


    if(this.accessed == 0) {
        this.swiper = new Swiper('.swiper-container', {
            pagination: '.swiper-pagination',
            paginationClickable: true,
            nextButton : '.buttonNext'
        });
    }
    this.swiper.slideTo(0);

    setTimeout(function(){ if (document.createEvent) { // W3C
        var ev = document.createEvent('Event');
        ev.initEvent('resize', true, true);
        window.dispatchEvent(ev);
    }
    else { // IE
        element=document.documentElement;
        var event=document.createEventObject();
        element.fireEvent("onresize",event);
    } }, 3);
    this.accessed = 1;
};

IntroPage.prototype.onPageBeforeHide = function() {
    header_widget.setVisible(true);
    $('.default-footer').removeClass('hidden');
};


