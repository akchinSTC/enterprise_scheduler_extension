define([
    'base/js/namespace',
    'jquery',
    'base/js/utils',
    'base/js/dialog'
], function(Jupyter, $, utils, dialog) {

    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    function submit_notebok_to_scheduler() {

        var tr = '<tr style="padding: 1px;">'
        var td = '<td style="padding: 1px;">'
        var td_colspan2 = '<td style="padding: 1px;" colspan=2>'
        var td_colspan3 = '<td style="padding: 1px;" colspan=3>'
        var content = '<p/>'
        +'<table><tbody>'

        + tr
        + td
        +'<label for="platform">Platform:</label>'
        +'<br/>'
        +'<select id="platform"><option value="jupyter">Jupyter</option><option value="docker">Docker</option><option value="dlaas">DLAAS</option><option value="ffdl" selected>FfDL</option></select>'
        +'</td>'

        + td_colspan2
        +'<label for="endpoint">Platform API Endpoint:</label>'
        +'<br/>'
        +'<input type="text" id="endpoint" name="endpoint" placeholder="##########" value="##############" size="60"/>'
        +'</td>'
        +'</tr>'

        + tr
        + td_colspan3
        +'<label for="framework">Deep Learning Framework:</label>'
        +'<br/>'
        +'<select id="framework"><option value="tensorflow" selected>Tensorflow</option><option value="caffe">Caffe</option><option value="pytorch">PyTorch</option><option value="caffe2">Caffe2</option></select>'
        +'</td>'
        +'</tr>'

        + tr
        + td
        +'<label for="framework-user">User:</label>'
        +'<br/>'
        +'<input type="text" id="framework-user" name="framework-user" placeholder="##########" value="##############"/>'
        +'</td>'

        + td_colspan2
        +'<label for="framework-userinfo">User/Instance information:</label>'
        +'<br/>'
        +'<input type="text" id="framework-userinfo" name="framework-userinfo" placeholder="##########" value="##############" size="35"/>'
        +'</td>'
        +'</tr>'

        + tr
        + td
        +'<label for="framework-cpus">CPUs:</label>'
        +'<br/>'
        +'<input type="text" id="framework-cpus" name="framework-cpus" placeholder="1" value="1"/>'
        +'</td>'

        + td
        +'<label for="framework-gpus">GPUs:</label>'
        +'<br/>'
        +'<input type="text" id="framework-gpus" name="framework-gpus" placeholder="0" value="0"/>'
        +'</td>'

        + td
        +'<label for="framework-memory">Memory:</label>'
        +'<br/>'
        +'<input type="text" id="framework-memory" name="framework-memory" placeholder="1Gb" value="1Gb"/>'
        +'</td>'
        +'</tr>'

        + tr
        + td_colspan3
        +'<label for="cos_endpoint">COS Endpoint:</label>'
        +'<br/>'
        +'<input type="text" id="cos_endpoint" name="cos_endpoint" placeholder="##########" value="##############" size="35"/>'
        +'</td>'
        +'</tr>'

        + tr
        + td
        +'<label for="cos_user">COS User:</label>'
        +'<br/>'
        +'<input type="text" id="cos_user" name="cos_user" placeholder="##########" value="##############t" size="20"/>'
        +'</td>'

        + td
        +'<label for="cos_password">COS Password:</label>'
        +'<br/>'
        +'<input type="password" id="cos_password" name="cos_password" placeholder="##########" value="##############" size="20"/>'
        +'</td>'
        +'</tr>'

        +'</tbody></table>'


        var htmlContent = $.parseHTML(content);

        Jupyter.keyboard_manager.register_events( htmlContent );

        dialog.modal({
            title: 'Submit Options ...',
            body: htmlContent,
            buttons: {
                Cancel: {
                    'class': 'btn-danger'
                },
                Publish: {
                    'class': 'btn-primary',
                    'click': function() {

                        // ---
                        var csrftoken = getCookie('_xsrf');
                        var schedulerUrl = utils.url_path_join(utils.get_body_data('baseUrl'), 'scheduler')

                        $.ajaxSetup({
                            crossDomain: false, // obviates need for sameOrigin test
                            beforeSend: function(xhr, settings) {
                                if (!csrfSafeMethod(settings.type)) {
                                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                                }
                            }
                        });

                        options = {}
                        options['platform'] = $('#platform option:selected').text().toLowerCase();
                        options['framework'] = $('#framework option:selected').text().toLowerCase();
                        options['endpoint'] = $('#endpoint').val();
                        options['user'] = $('#framework-user').val();
                        options['userinfo'] = $('#framework-userinfo').val();
                        options['cpus'] = Number($('#framework-cpus').val());
                        options['gpus'] = Number($('#framework-gpus').val());
                        options['memory'] = $('#framework-memory').val();

                        options['cos_endpoint'] = $('#cos_endpoint').val();
                        options['cos_user'] = $('#cos_user').val();
                        options['cos_password'] = $('#cos_password').val();

                        options['kernelspec'] = 'python3'
                        options['notebook'] = Jupyter.notebook.toJSON()

                        $.ajax({
                            type: "POST",
                            url: "/scheduler",
                            // The key needs to match your method's input parameter (case-sensitive).
                            data: options_string = JSON.stringify(options),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            success: function(data){
                                console.log('Inside ui extension callback')
                                console.log("Data: ", data)
                                dialog.modal({
                                    sanitize: false,
                                    title: 'Job submitted to ' + options['platform'] + JSON.parse(JSON.stringify(data))['title'],
                                    body: JSON.parse(JSON.stringify(data))['message'] + '<br><br> Check details on submitted jobs at : <br> <a href=' + JSON.parse(JSON.stringify(data))['job_url'] + ' target="_blank">Console & Job Status</a>',
                                    buttons: {
                                        'OK': {}
                                    }
                                });

                            },
                            failure: function(errMsg) {
                                console.log('Inside ui extension error callback')
                                console.log("Error: ", errMsg)
                                dialog.modal(errMsg)
                            }
                        });
                        // ---


                    }
                }
            }
        });

    }

    function place_button() {
	if (!Jupyter.toolbar) {
	    $([Jupyter.events]).on("app_initialized.NotebookApp", place_button);
	    return;
	}

	Jupyter.toolbar.add_buttons_group([{
	    label: 'Submit notebook...',
	    icon: 'fa-send',
	    callback: submit_notebok_to_scheduler,
        id: 'submit-notebook-to-scheduler-button'
	}])
    }
    
    function load_ipython_extension() {
        console.log('Loading scheduler extension')
	    place_button();
    }

    return {
	    load_ipython_extension: load_ipython_extension
    };

});
