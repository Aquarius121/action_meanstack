
var message_thanks_page = (function() {
	var request_url = '/message';

	function init(caller, product, brand) { 
	    $('button.btn-check-messages').click(function() {
		window.location.href='/user/' + caller._id + '/history/view';
	    });

	    $('button.btn-continue-conversation').click(function() {
	        window.location.href='/product/view/' + product.ean;
	    });

	    $('button.btn-do-lookup').click(function() {
	        window.location.href = '/products/find/view';
	    });
	}


	return {
	    init: init
	}
}());

