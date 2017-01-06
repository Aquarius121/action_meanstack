var intro_page_module = (function() {


    function init() {
        var options = {
            $FillMode: 0,
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
        var jssor_slider1 = new $JssorSlider$('slider1_container', options);

        $('.buttonNext').click(function () {
            if(jssor_slider1.$CurrentIndex() < jssor_slider1.$SlidesCount()-1)
                jssor_slider1.$Next();
        });

    }

    return {
        init: init
    }
}());

$(function() {
    intro_page_module.init();
});
