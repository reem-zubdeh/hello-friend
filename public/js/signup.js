$('form').on('submit', event => {

    event.preventDefault();
    let formData = {}
    $(event.target).serializeArray().forEach(field => {
        formData[field.name] = field.value;
    });
    
    $.ajax({
        url: '/signup',
        type: 'post',
        data: JSON.stringify(formData),
        contentType: 'application/json',
        processData: false,
    
        success: () => {
            console.log('Signup successful');
            window.location.replace('/');
        },
    
        error: err => {
            if (err.status != 403) {
                console.log(err);
                $("#error1>p").text('Sorry, an unknown error has occurred.').removeClass('d-none');
                return;
            }
            if (err.responseJSON) {
                let err1 = err.responseJSON.email? err.responseJSON.email : err.responseJSON.name;
                let err2 = err.responseJSON.password;

                if (err1) $("#error1>p").text(err1).removeClass('d-none');
                else $("#error1>p").addClass('d-none');

                if (err2) $("#error2>p").text(err2).removeClass('d-none');
                else $("#error2>p").addClass('d-none');
            }
        }
    
    });

})