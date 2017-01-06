
$(function() {
    // Page uses stuff that is generated from server-scoped values, so look at product.jade

    $( ".ui-tooltip" ).tooltip({});
    brand_select.init($('.brand-select-widget'));
});


var product_create_page = (function() {

    function init(brand) {

        var body = $('body');
        //single_input_modal.init(body);
	
	// disable the create button until validation is complete
	$('button.btn-create-product').prop('disabled', 'true');

        // add save button handler
        $('button.btn-create-product').click(function() {

            // get form fields
            var form_data = {};

            // get name, enforce need for a name
            form_data.name = $('input.product-name').val();
            if(form_data.name.trim().length == 0) {
                alert_modal.show('Error', 'You must enter a name');
                return false;
            }

            // get ean and upc values - need to validate here?
            form_data.ean8 = $('input.product-ean8').val();
	    form_data.ean13 = $('input.product-ean13').val();
            form_data.upca = $('input.product-upca').val();
	    form_data.upce = $('input.product-upce').val();

	    form_data.ean = form_data.ean13;
	    form_data.upc = form_data.upca;

	    if(!form_data.ean8 && !form_data.ean13 && !form_data.upca && !form_data.upce) {
	        alert_modal.show('Error', 'You must have at least one ean or upc value');
		return false;
	    }	


            if(typeof(brand) != 'undefined') {
                form_data.brand = brand._id;
            }

            loading_modal.show('Saving...');
            $.ajax({
                type: 'PUT',
                url: '/product',
                data: form_data
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                window.location.href = '/product/view/' + result[0].ean + '?mode=edit';
            });

            return false;
        });

	// add cancel button handler  
        $('button.btn-cancel-product').click(function() {
            var p_name = $('input.product-name').val();
            var p_ean8 = $('input.product-ean8').val();
	    var p_ean13 = $('input.product-ean13').val();
            var p_upca = $('input.product-upca').val();
	    var p_upce = $('input.product-upce').val();

            if(p_name.trim().length != 0 || p_ean8.trim().length != 0 || p_ean13.trim().length != 0 || p_upca.trim().length != 0 || p_upce.trim().length != 0) {
                confirm_modal.setButtonClasses('btn-success', 'btn-danger');
                confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Your changes have not been saved.', function() {
                        window.location.href = '/brand/view/' + brand._id;
                });
            } else {
	        window.location.href = '/brand/view/' + brand._id;
	    }
        });

        $('a.barcode-compute').click(function() {
            var text = 'Enter whichever format you have an we will do our best to convert it to EAN-13';
            single_input_modal.show('Enter barcode', text, 'text', function() {
                var upcX = single_input_modal.getValue(body).trim();

		if(upcX.length < 8) {
		    while(upcX.length < 8) {
                           upcX  = '0' + upcX;
                       }
		}	    
                
		if(upcX.length == 10) {
                    var upc = '0' + upcX;
                    upc = upc + general_util.computeCheckDigit(upc);

                    $('input.product-upca').val(upc);
		    $('input.product-upce').val(_convertUPCAtoUPCE(upc));
                    $('input.product-ean13').val('0' + upc);
                    return;
                }

                if(upcX.length == 11) {
                    var upc = upcX + general_util.computeCheckDigit(upcX);

                    $('input.product-upca').val(upc);
		    $('input.product-upce').val(_convertUPCAtoUPCE(upc));
                    $('input.product-ean13').val('0' + upc);
                    return;
                }

                if(upcX.length == 12) {
                    $('input.product-upca').val(upcX);
		    $('input.product-upce').val(_convertUPCAtoUPCE(upcX));
                    $('input.product-ean13').val('0' + upcX);
                    return;
                }

                if(upcX.length == 13) {
                    $('input.product-ean13').val(upcX);
		    var upca = upcX.substring(1, upcX.length);
                    $('input.product-upca').val(upca);
		    $('input.product-upce').val(_convertUPCAtoUPCE(upca));
                    return;
                }

                alert_modal.show('Unknown', 'We do not recognize that format.');

            }, function() {

            });
        });

	$('button.btn-barcode-validate').click(function() {
		var p_ean8 = $('input.product-ean8').val().trim();
		var p_ean13 = $('input.product-ean13').val().trim();
		var p_upca = $('input.product-upca').val().trim();
		var p_upce = $('input.product-upce').val().trim();

		var success = false;
		
		var generate = $('input.generate').is(':checked');
		var errors = [];
		if(p_ean8) {
		    if(p_ean8.length < 8) {
		       while(p_ean8.length < 8) {
		           p_ean8 = '0' + p_ean8;
		       }
		    }

		    if(!_isNumeric(p_ean8)) {
		        alert_modal.show('Error', 'The value for EAN-8 is not valid');
		        return;
		    }

		    $('input.product-ean8').val(p_ean8);
		}
		
	        if(p_ean13) {
		    if(generate == true) {
		        if(p_ean13.length == 13) {
			    errors.push('ean13 check digit already exists');
			} else {
		            p_ean13 = p_ean13.substring(0, p_ean13.length)  + general_util.computeCheckDigit(p_ean13);
		            $('input.product-ean13').val(p_ean13);
		    	}
		    }

		    if(!_validateCheckDigit(p_ean13)) {
		        alert_modal.show('Error', 'The value for EAN-13 is not valid');
			return;
		    } else {
			if(!upca) {
			    var upca = p_ean13.substring(1, p_ean13.length);
			    $('input.product-upca').val(upca);
			    $('input.product-upce').val(_convertUPCAtoUPCE(upca));
			}
		    }
		} else if(p_upca) {
		    if(generate == true) {
		        if(p_upca.length == 12) {
			    errors.push('upca check digit already exists');
			} else {
			    p_upca = p_upca + general_util.computeCheckDigit(p_upca);
			    $('input.product-upca').val(p_upca);
			}
		    }

		    if(!_validateCheckDigit(p_upca)) {
		        alert_modal.show('Error', 'The value for UPC-A is not valid');
			return;
		    } else {
			if(!p_ean13) {    
			    var ean13 = '0' + p_upca;
			    $('input.product-ean13').val(ean13);
			}
			$('input.product-upce').val(_convertUPCAtoUPCE(p_upca.substring(1, p_upca.length)));
		    }
		} else if(p_upce) {
			if(!upca) {
		            var upca = _convertUPCEtoUPCA(p_upce);
			    if(_validateCheckDigit(upca)) {
		            	$('input.product-upca').val(upca);
			    }
			}
			if(!p_ean13) {
			    if(upca) {
			        var ean13 = '0' + upca;
				if(_validateCheckDigit(ean13)) {
		            	    $('input.product-ean13').val('0' + upca);
				}
			    }
			}
		}

		if(errors.length > 0) {
		    alert_modal.show('warning', 'check digit already exists');
	        }


		// now one final validation
		
		p_ean8 = $('input.product-ean8').val().trim(); 
		p_ean13 = $('input.product-ean13').val().trim();
		p_upca = $('input.product-upca').val().trim();
		p_upce = $('input.product-upce').val().trim();

		if(!p_ean8 || p_ean13 || !p_upca && !p_upce) {
		       alert_modal.show('Warning', 'some valid conversions could not be created');
		}
		    
		var canEnable = true;
		if(!p_ean8 && !p_ean13 && !p_upca && !p_upce) {
			alert_modal.show('Error', 'for validation to succeed, you must have at least one value');
			canEnable = false;
		} else if (!p_ean8 || p_ean13 || !p_upca && !p_upce) {
			alert_modal.show('Warning', 'some valid conversions could not be created');
		}
		    
		if(canEnable) {
		    $('button.btn-create-product').removeAttr('disabled');
		    $('button.btn-barcode-validate').prop('class', 'btn btn-success btn-barcode-validate');
		}
	});
    }

    function _validateCheckDigit(barcode) {
	if(barcode.length != 6 && barcode.length != 8 && barcode.length != 12 && barcode.length != 13) {
	    console.log('validate.. barcode is the wrong length of ' + barcode.length);
	    return false;
	}

	var lastDigit = Number(barcode.substring(barcode.length - 1));
	var checkSum = 0;
	
	if (isNaN(lastDigit)) { 
	    return false; 
	}

	var arr = barcode.substring(0,barcode.length - 1).split("").reverse();
	var oddTotal = 0, evenTotal = 0;

	for (var i = 0; i < arr.length; i++) {
	    if (isNaN(arr[i])) { 
		return false; 
	    }

	    if (i % 2 == 0) { 
		oddTotal += Number(arr[i]) * 3; 
	    } else { 
		evenTotal += Number(arr[i]); 
	    }
	}
				    
	checkSum = (10 - ((evenTotal + oddTotal) % 10)) % 10;
	return checkSum == lastDigit;
    }

    function _calcCheckDigit(upc) {
        var check = 0;           
	for(var X = 1; X <= 11; X++){
	    var Test = upc.substr(X-1, 1);
	    if (!(X % 2)) {
	        check = check + parseInt(Test) * 7;       // odd position digits multiplied by 7
	    } else { 
		check = check + parseInt(Test)  * 9;       // even position digits multiplied by 
	    }
	}
	    check = (check % 10) + 48;  	// convert value to ASCII character value;
	    return _charFromCharCode (check);    // check character
    }

    // should move these to product general utils
    function _convertUPCAtoUPCE(upca) {
	var upce;

	if(upca.length < 12 ) {
	    var holdString = '000000000000' + upca;
	    upca = holdString.substring(holdString.length - 12, holdString.length);
	}

	if(upca.substring(0,1) != '0' && upca.substring(0,1) != '1') {
	   console.log('Invalid Number System (only 0 & 1 are valid)');
	} else {
	   if(upca.substring(3,6) == '000' || upca.substring(3,6) == '100' || upca.substring(3,6) == '200' ) {
	        upce = upca.substring(1,3) + upca.substring(8,11) + upca.substring(3,4);
	    } else if( upca.substring(4,6) == '00' ) {
	        upce = upca.substring(1,4) + upca.substring(9,11) + '3';
	    } else if( upca.substring(5,6) == '0' ) {
  	        upce = upca.substring(1,5) + upca.substring(10,11) + '4';
	    } else if( upca.substring(10,11) >= '5' ) {
	        upce = upca.substring(1,6) + upca.substring(10,11);
	    } else {
	        //Invalid product code (00005 to 00009 are valid)
	        alert_modal.show('Conversion error', 'Unable to generate valid upce value');
	    }
	}   	  	    
	
	return upce;
    }

    function _convertUPCEtoUPCA(upce) {
	var upca = new String();
	var upceString = new String();
	var manufacturerNumber = new String();
	var itemNumber = new String();
	var msg = new String();

	if(_isNumeric(upce)) {
	    switch (upce.length) {
	        case 6:
		    upceString = upce;	
		    break;
		case 7:
		    upceString = upce.substring(1, 6);	
		    break;																						    case 8: 
		    upceString = upce.substring(2, 6);
		    break;																						    default:
	   	    console.log('Error');
	     }

	     var digit1 = upceString.substr(0, 1);
	     var digit2 = upceString.substr(1, 1);
	     var digit3 = upceString.substr(2, 1);
	     var digit4 = upceString.substr(3, 1);
	     var digit5 = upceString.substr(4, 1);
	     var digit6 = upceString.substr(5, 1);

	     switch (digit6) {
	         case "0":
	             manufacturerNumber = manufacturerNumber.concat(digit1, digit2, digit6, "00");
	             itemNumber = itemNumber.concat("00", digit3, digit4, digit5);
	             break;
	         case "1":
		     manufacturerNumber = manufacturerNumber.concat(digit1, digit2, digit6, "00");
		     itemNumber = "00" + digit3 + digit4 + digit5;
	             break;
	         case "2":
		     manufacturerNumber = digit1 + digit2 + digit6 + "00";
		     itemNumber = "00" + digit3 + digit4 + digit5;
		     break;
    	         case "3":
		     manufacturerNumber = digit1 + digit2 + digit3 + "00";
		     itemNumber = "000" + digit4 + digit5;	
		     break;
	         case "4":
		     manufacturerNumber = digit1 + digit2 + digit3 + digit4 + "0";
		     itemNumber = "0000" + digit5;
		     break;
	         default:
		     manufacturerNumber = manufacturerNumber.concat(digit1, digit2, digit3, digit4, digit5);
		     itemNumber = itemNumber.concat("0000", digit6);
		     break;
	     }
	
	     // put the number system digit "0" together with the manufacturer code and Item number
	     msg = msg.concat("0", manufacturerNumber, itemNumber);
	     var checkChar = _calcCheckDigit(msg);
	     if (!isNaN(checkChar)) {
	         upca = upca + msg.concat(checkChar);
	     }
	} else {
	     console.log('UPCs must contain numeric data only!');
	}
			
	return upca;
    }

    function _isNumeric(x) {
        var numbers=".0123456789";
	if(x.length>1) { 
	    // remove negative sign 
	    x = Math.abs(x) + "";
	    for(var j = 0; j < x.length; j++) { 
		// call isNumeric recursively for each character 
	       var number = _isNumeric(x.substring(j, j+1)); 
	       if(!number) {
	           return number; 
	       } 
	
	       return number;
	    } 
	} else {
	    if(numbers.indexOf(x) >= 0) { 
	        return true; 
	    }
    		
	    return false; 
    	} 		
    }

    function _charFromCharCode (charCode) { 
        return unescape('%' + charCode.toString(16)); 
    }   

    function _getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    return {
        init: init
    }
}());
