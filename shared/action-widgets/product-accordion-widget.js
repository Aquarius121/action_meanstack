var product_accordion_widget = (function() {

    var ingredient_group_def =
        '{{? it.ingredients}}' +
            '<div class="accordion-group">' +
                '<div class="accordion-heading"><a data-toggle="collapse" href="#ingredientsCollapse" data-parent="#product-accordion" class="accordion-toggle plus">Ingredients</a></div>' +
                '<div id="ingredientsCollapse" class="accordion-body collapse">' +
                    '<div class="accordion-inner">' +
                        '<div id="ingredients">' +
                            '<div class="contents" style="white-space: pre-wrap;"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '{{?}}';

    var instruction_group_def =
        '{{? it.instructions}}' +
            '<div class="accordion-group">' +
                '<div class="accordion-heading"><a data-toggle="collapse" href="#instructionsCollapse" data-parent="#product-accordion" class="accordion-toggle plus">Instructions</a></div>' +
                '<div id="instructionsCollapse" class="accordion-body collapse">' +
                    '<div class="accordion-inner">' +
                        '<div id="instructions">' +
                            '<div class="contents" style="white-space: pre-wrap;"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '{{?}}';

    var nutrition_group_def =
        '{{? it.nutrition_labels}}' +
            '<div class="accordion-group">' +
                '<div class="accordion-heading"><a data-toggle="collapse" href="#nutritionCollapse" data-parent="#product-accordion" class="accordion-toggle plus">Product Label</a></div>' +
                '<div id="nutritionCollapse" class="accordion-body collapse">' +
                    '<div class="accordion-inner">' +
                        '<div id="nutrition_labels">' +
                            '<div class="contents"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '{{?}}';

    var promo_group_def =
        '{{? it.promo_images}}' +
            '<div class="accordion-group">' +
                '<div class="accordion-heading"><a data-toggle="collapse" href="#promoCollapse" data-parent="#product-accordion" class="accordion-toggle plus">Promos</a></div>' +
                '<div id="promoCollapse" class="accordion-body collapse">' +
                    '<div class="accordion-inner">' +
                        '<img src="{{=it.promo_images[0]}}">' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '{{?}}';

    var brand_group_def =
        '{{? it.brand_message}}' +
            '<div class="accordion-group">' +
                '<div class="accordion-heading"><a data-parent="#product-accordion" class="accordion-toggle plus brand-messaging">Brand Message</a></div>' +
            '</div>' +
        '{{?}}';

    var faq_group_def =
        '{{? it.faq}}' +
            '<div class="accordion-group">' +
                '<div class="accordion-heading"><a data-toggle="collapse" href="#faqCollapse" data-parent="#product-accordion" class="accordion-toggle plus">FAQ</a></div>' +
                '<div id="faqCollapse" class="accordion-body collapse">' +
                    '<div class="accordion-inner">' +
                        '<div id="faq" style="overflow-y: auto;">' +
                            '<div class="contents" style="white-space: pre-wrap;">' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '{{?}}';

    var template_def =
        '<div id="product-accordion" class="product-accordion accordion">' +
            ingredient_group_def +
            instruction_group_def +
            nutrition_group_def +
            brand_group_def +
            promo_group_def +

            //promo_group_def +
            //brand_group_def +
        '</div>';

    function init(product, brand, container) {
        var template = doT.template(template_def);

        var html = template(product);
        container.html(html);

        _initAccordion(product, brand, container);
    }

    function _initAccordion(product, brand, container) {
        var attribute_count = 0, accordion = container;
        if(typeof(product.ingredients) != 'undefined' && product.ingredients.length > 0) {
            attribute_count++;

            if(general_util.validateURL(product.ingredients)) {
                accordion.find('#ingredients > .contents').html('<img src="' + product.ingredients + '">');
            } else {
                accordion.find('#ingredients > .contents').html(product.ingredients);
            }
        }

        if(typeof(product.instructions) != 'undefined' && product.instructions.length > 0) {
            attribute_count++;
            accordion.find('#instructions > .contents').html(product.instructions);
        }

        if(typeof(product.nutrition_labels) != 'undefined' && product.nutrition_labels.length > 0) {
            attribute_count++;
            var nutrition_contents = '';
            product.nutrition_labels.forEach(function(label_or_html) {
                var as_url = encodeURI(label_or_html);
                if(general_util.validateURL(as_url)) {
                    nutrition_contents += '<img style="max-width: 100%;" src="' + label_or_html + '">';
                } else {
                    nutrition_contents += label_or_html;
                }
            });
            accordion.find('#nutrition_labels > .contents').html(nutrition_contents);

            general_util.makeLinksSafe(accordion.find('#nutrition_labels > .contents'));
        }

        if(typeof(product.promo_videos) != 'undefined' && product.promo_videos.length > 0) {
            attribute_count++;
            var video_contents = '';
            product.promo_videos.forEach(function(video_link) {
                video_contents += '<iframe width="420" height="315" src="' + video_link + '" frameborder="0" allowfullscreen></iframe>';
            });
            accordion.find('#video').html(video_contents);
        }

        container.find('a.brand-messaging').click(function() {
            if(typeof(app) == 'undefined') {
                window.location.href = "/product/brand-message/view/" + product.ean;
            } else {
                app_controller.openInternalPage('#brand-messaging');
            }
        });

        container.find('a[data-toggle=collapse]').click(function() {
            $(this).toggleClass('plus');
        });

        /*
        if(typeof(product.faq) != 'undefined' && product.faq.length > 0) {
            accordion.find('#faq').html(product.faq);
        }
        */

        return attribute_count;
    }

    return {
        init: init
    }
}());