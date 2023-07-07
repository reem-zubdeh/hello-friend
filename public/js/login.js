$('form').on('submit', event => {

    event.preventDefault();
    let formData = {}
    $(event.target).serializeArray().forEach(field => {
        formData[field.name] = field.value;
    });
    
    $.ajax({
        url: '/login',
        type: 'post',
        data: JSON.stringify(formData),
        contentType: 'application/json',
        processData: false,
    
        success: () => {
            console.log('Login successful');
            window.location.replace('/');
        },
    
        error: err => {
            let error = err.responseJSON?.error;
            if (error) $("#error>p").text(error).removeClass('d-none');
            else  $("#error>p").text('Sorry, an unknown error has occurred.').removeClass('d-none');
            
        }
    
    });

})