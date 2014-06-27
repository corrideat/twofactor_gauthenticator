jQuery(function($) {
    if (window.rcmail) {
        rcmail.addEventListener('init', function(evt) {

            // ripped from PHPGansta/GoogleAuthenticator.php	  
            function createSecretBackup(secretLength)
            {
                if(!secretLength) secretLength = 56;

                var LookupTable = new Array(
                    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', //  7
                    'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', // 15
                    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', // 23
                    'Y', 'Z', '2', '3', '4', '5', '6', '7' // 31
                    //'='  // padding char
                );

                var secret = '';
                for (var i = 0; i < secretLength; i++) {
                    secret += LookupTable[Math.floor(Math.random()*LookupTable.length)];
                }
                return secret;
            }

            function createSecret(callback)
            {
                var callcallback = function(data) {
                    var p1 = data.substr(0, 16);
                    var p2 = data.substr(16).replace(/[ABCD]/g, "2").replace(/[DEFG]/g, "3").replace(/[HIJK]/g, "4").replace(/[LMNO]/g, "5").replace(/[PQRS]/g, "6").replace(/[TUVW]/g, "7").replace((/X/g, (Math.random()>=0.5)?"2":"3").replace(/Y/g, (Math.random()>=0.5)?"4":"5").replace((/Z/g, (Math.random()>=0.5)?"6":"7");
                    callback(p1+p2);
                };
                $.ajax({
                    "method": "GET",
                    "url": "./?_action=plugin.twofactor_gauthenticator-generatesecret&length=56",
                    "success": function(data) {callcallback(data)},
                    "error": function() {callcallback(createSecretBackup(56))}
                });
            }
            
            var setup = false;

            // populate all fields
            function setup2FAfields() {
                if(setup || $('#2FA_secret').get(0).value) return;
		setup = true;

                $('#twofactor_gauthenticator-form :input').each(function() {
                    if($(this).get(0).type == 'password') $(this).get(0).type = 'text';
                });

                // secret button
                if ($('#2FA_create_secret').length) {
                    $('#2FA_create_secret').prop('id', '2FA_change_secret');
                    $('#2FA_change_secret').get(0).value = rcmail.gettext('hide_secret', 'twofactor_gauthenticator');
                    $('#2FA_change_secret').click(click2FA_change_secret);
                }

                $('#2FA_activate').prop('checked', true);
                $('#2FA_show_recovery_codes').get(0).value = rcmail.gettext('hide_recovery_codes', 'twofactor_gauthenticator');
                $('#2FA_qr_code').slideDown();

                createSecret(function(secrets) {
                    var base = 0, secret = secrets.substr(base, 16);
                    base += 16;
                    $('#2FA_secret').get(0).value = secret;
                    $("[name^='2FA_recovery_codes']").each(function() {
                        $(this).get(0).value = secrets.substr(base, 10);
                        base += 10;
                    });

                    // add qr-code before msg_infor
                    var url_qr_code_values = 'otpauth://totp/' +$('#prefs-title').html().split(/ - /)[1]+ '?secret=' + secret +'&issuer=RoundCube2FA';
                    $('table tr:last').before('<tr><td>' +rcmail.gettext('qr_code', 'twofactor_gauthenticator')+ '</td><td><input type="button" class="button mainaction" id="2FA_change_qr_code" value="'
                                          +rcmail.gettext('hide_qr_code', 'twofactor_gauthenticator')+ '"><div id="2FA_qr_code" style="display: visible"></div></td></tr>');
                    // add qr-code
                    if ($.isFunction($.fn.qrcode)) {
                        var canvas_test = document.createElement('canvas');
                        var render = (canvas_test.getContext && canvas_test.getContext('2d'))?'canvas':'image';

                        $('#2FA_qr_code').qrcode( {
                            "render": render,
                            "ecLevel": "H",
                            "size": 200,
                            "fill": '#000000',
                            "background": null,
                            "text": url_qr_code_values,
                            "radius": 0.5,
                            "mode": 0,
                        });
                    } else {
                        $('#2FA_qr_code').append($('<img/>').prop('src', 'https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl='+encodeURIComponent(url_qr_code_values)));
                    }

                    $('#2FA_change_qr_code').click(click2FA_change_qr_code);
		});
            }

            $('#2FA_setup_fields').click(function() {
                setup2FAfields(true);
            });


            // to show/hide secret
            var click2FA_change_secret = function() {
                if($('#2FA_secret').get(0).type == 'text') {
                    $('#2FA_secret').get(0).type = 'password';
                    $('#2FA_change_secret').get(0).value = rcmail.gettext('show_secret', 'twofactor_gauthenticator');
                }
                else
                {
                    $('#2FA_secret').get(0).type = 'text';
                    $('#2FA_change_secret').get(0).value = rcmail.gettext('hide_secret', 'twofactor_gauthenticator');
                }
            };
            $('#2FA_change_secret').click(click2FA_change_secret);

            // to show/hide recovery_codes
            $('#2FA_show_recovery_codes').click(function() {

                if($("[name^='2FA_recovery_codes']")[0].type == 'text') {
                    $("[name^='2FA_recovery_codes']").each(function() {
                        $(this).get(0).type = 'password';
                    });
                    $('#2FA_show_recovery_codes').get(0).value = rcmail.gettext('show_recovery_codes', 'twofactor_gauthenticator');
                }
                else {
                    $("[name^='2FA_recovery_codes']").each(function() {
                        $(this).get(0).type = 'text';
                    });
                    $('#2FA_show_recovery_codes').get(0).value = rcmail.gettext('hide_recovery_codes', 'twofactor_gauthenticator');
                }
            });


            // to show/hide qr_code
            var click2FA_change_qr_code = function() {
                if( $('#2FA_qr_code').is(':visible') ) {
                    $('#2FA_qr_code').slideUp();
                    $(this).get(0).value = rcmail.gettext('show_qr_code', 'twofactor_gauthenticator');
                }
                else {
                    $('#2FA_qr_code').slideDown();
                    $(this).get(0).value = rcmail.gettext('hide_qr_code', 'twofactor_gauthenticator');
                }
            }
            $('#2FA_change_qr_code').click(click2FA_change_qr_code);

            // create secret
            $('#2FA_create_secret').click(function() {
                $('#2FA_secret').get(0).value = createSecret();
            });

            // ajax
            $('#2FA_check_code').click(function() {
                var url = "./?_action=plugin.twofactor_gauthenticator-checkcode&code=" +$('#2FA_code_to_check').val() + '&secret='+$('#2FA_secret').val();
                $.post(url, function(data) {
                    alert(data);
                });
            });


            // Define Variables
            var tabtwofactorgauthenticator = $('<span>').attr('id', 'settingstabplugintwofactor_gauthenticator').addClass('tablink');
            var button = $('<a>').attr('href', rcmail.env.comm_path + '&_action=plugin.twofactor_gauthenticator').html(rcmail.gettext('twofactor_gauthenticator', 'twofactor_gauthenticator')).appendTo(tabtwofactorgauthenticator);

            button.bind('click', function(e) {
                return rcmail.command('plugin.twofactor_gauthenticator', this)
            });

            // Button & Register commands
            rcmail.add_element(tabtwofactorgauthenticator, 'tabs');
            rcmail.register_command('plugin.twofactor_gauthenticator', function() {
                rcmail.goto_url('plugin.twofactor_gauthenticator')
            }, true);
            rcmail.register_command('plugin.twofactor_gauthenticator-save', function() {
                if(!$('#2FA_secret').get(0).value) {
                    $('#2FA_secret').get(0).value = createSecret();
                }
                rcmail.gui_objects.twofactor_gauthenticatorform.submit();
            }, true);
        });
    }
});