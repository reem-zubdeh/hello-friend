$(function(){

    'use strict';
    let page = 0;
    let loadMoreMessages = true;

    loadUserData();

    fetchContacts();
    
    $('#contactscontainer').on('click', '.contacts-item', event => {
        selectContact($(event.currentTarget));
    });

    $('#back').on('click', () => {
        goBack();
    });

    $('#send').on('click', () => {
        send();
    });

    $('#msgtextbox').on('keypress', event => {
        if(event.which == '13'){
            send();
        }
    });

    $('#chatbox>.card-body').on('scroll', event => {
        if(event.target.scrollTop == 0 && loadMoreMessages) {
            buildMessages($('#chatbox').data('chatbox'), true);
        }
    });

    $('#settingsmodal').on('keypress', event => {
        if(event.which == '13'){
            event.preventDefault();
            submitSettings();
        }
    });

    $('#settingssubmit').on('click', () => {
        submitSettings();
    });

    $('#settingscancel').on('click', () => {
        $('#settingsdisplayname').val('');
        $('#settingsmodal').modal('hide');
    });

    $('#contactmodal').on('keypress', event => {
        if(event.which == '13'){
            event.preventDefault();
            addContact();
        }
    });

    $('#contactsubmit').on('click', () => {
        addContact();
    });

    $('#contactcancel').on('click', () => {
        $('#contactemail').val('');
        $('#contactmodal').modal('hide');
    });

    function loadUserData() {
        $.ajax({
            method: 'get',
            url: 'user-data',
            dataType: 'json'
        })
        .done(data => {
            loadName(data.name)
            loadAvatar(data.avatar)
            loadTheme(data.theme)
        })
        .fail(() => {
            console.log('Error: could not fetch user data');
        });
    }

    function fetchContacts() {
        $.ajax({
            method: 'get',
            url: '/contacts',
            dataType: 'json'
        })
        .done(data => {

            data.forEach(contact => {

                let newElement = $('.contacts-item').first().clone();
    
                newElement.removeClass('d-none');
    
                newElement.attr('data-contactID', contact.userID);
                newElement.attr('data-name', contact.name);
                newElement.attr('data-avatar', contact.avatar);
    
                newElement.find('h5>span').text(contact.name);
                newElement.find('.miniprofpic').attr('src', `images/${contact.avatar}`);
                
                newElement.find('small').text(formatDatePreview(new Date(contact.lastMessageDate)));
                newElement.find('p.preview').text(contact.lastMessage);
                
                $('#contactscontainer').append(newElement);
    
            });
    
            $('.contacts-item').first().addClass('activecontact');

        })
        .fail(() => {
            console.log('Error: could not fetch contacts');
        });
    }

    function selectContact(contact) {
        
        loadMoreMessages = true;
        page = 0;

        $('.activecontact').removeClass('activecontact');
        contact.addClass('activecontact');

        $('.contacts').addClass('d-none').addClass('d-lg-block');
        $('#empty-chatbox').addClass('d-none').removeClass('d-lg-flex');

        let target = $('#chatbox');
        target.addClass('d-lg-flex').removeClass('d-none');

        let contactID = contact.attr('data-contactID');

        target.attr('data-chatbox', contactID);

        let header = target.children('.card-header');
        header.find('.miniprofpic').attr('src', 'images/' + contact.data('avatar'));
        header.find('span').text(contact.data('name'));

        $('#msgtextbox').focus();

        buildMessages(contactID, false);

    }

    function buildMessages(contactID, isSameChatbox) {

        let chatBody = $('#chatbox>.card-body');

        loadMoreMessages = false;
        if (!isSameChatbox) chatBody.text('');
        $('.loading').removeClass('d-none');

        $.ajax({
            method: 'get',
            url: '/messages',
            data: {user: contactID, page},
            dataType: 'json'
        })
        .done(data => {

            $('.loading').addClass('d-none');

            if (!data.length || $('.activecontact').attr('data-contactid') != contactID) return;

            loadMoreMessages = true;

            page++;

            data.forEach(message => {
                
                let date = formatDate(new Date(message.createdAt));
                let incoming = message.incoming;
                let body = message.body;

                let newMessage = $('.msg').first().clone();
                newMessage.removeClass('d-none').addClass(incoming ? 'left' : 'right');
                newMessage.find('span').first().text(body);
                newMessage.find('.msgdate').text(date.date);
                newMessage.find('.msgtime').text(date.time);
                
                chatBody.prepend(newMessage);

            });            

            if (!isSameChatbox) scrollBottom(chatBody);

        })
        .fail(() => {
            console.log('Error: could not fetch message data for ' + contactemail);
        });

    }
    
    function send() {
        
        let contactID = $('#chatbox').data('chatbox');
        let chatBody = $('#chatbox>.card-body');
        let message = $('#msgtextbox').val();
        $('#msgtextbox').val('');

        message = message.trim();
        if (message.length == 0) return;

        let msgobj = {
            to: contactID,
            body: message
        };

        $.ajax({
            method: 'post',
            url: '/send-message',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(msgobj)
        })
        .fail(() => {
            console.log('Error: could not send message');
        });

        let newMessage = $('.msg').first().clone();
        newMessage.removeClass('d-none').addClass('right');
        newMessage.find('span').first().text(message);

        let date = formatDate(new Date());

        newMessage.find('.msgdate').text(date.date);
        newMessage.find('.msgtime').text(date.time);
        
        chatBody.append(newMessage);
        
        scrollBottom(chatBody);

        let contact = $(`.contacts-item[data-contactID="${contactID}"]`);
        contact.find('small').text(date.time);
        let preview = message.slice(0,30);
        if (message.length > 30) preview += '...';
        contact.find('.preview').text(preview);

        $('#contactscontainer').prepend(contact);
        
    }

    function addContact() {

        let emailfield = $('#contactemail').val().trim();

        if (emailfield.length > 0) {

            let addcontactmsg = $('#addcontactmsg');

            $.ajax({
                method: 'post',
                url: '/add-contact',
                contentType: 'application/json',
                processData: false,
                data: JSON.stringify({email: emailfield})
            })
            .done(data => {
                
                let newElement = $('.contacts-item').first().clone();

                newElement.removeClass('d-none');

                newElement.attr('data-contactID', data.contact.userID);
                newElement.attr('data-name', data.contact.name);
                newElement.attr('data-avatar', data.contact.avatar);

                newElement.find('h5>span').text(data.contact.name);
                newElement.find('.miniprofpic').attr('src', `images/${data.contact.avatar}`);
                newElement.find('small').text('');
                newElement.find('p.preview').text('');
                
                $('#contactscontainer').prepend(newElement);

                addcontactmsg.text('Successfully added ' + data.contact.name + '!');
                addcontactmsg.css('color', 'green');
                addcontactmsg.fadeIn(200);
                setTimeout(() => {
                    $('#contactemail').val('');
                    $('#contactmodal').modal('hide');
                    addcontactmsg.fadeOut(10);
                    selectContact(newElement);
                }, 2000);

            })
            .fail((req, status, err) => {

                let errormsg;

                if (req.status == 404) {
                    errormsg = 'That Friend does not exist. Please try again.';
                } 
                else if (req.status == 409) {
                    errormsg = 'That Friend is already on your list!';
                } 
                else {
                    errormsg = 'Sorry, an unexpected error occurred.'
                    console.log('Error: could not send message', err);
                }

                addcontactmsg.text(errormsg);
                addcontactmsg.css('color', 'red');
                addcontactmsg.fadeIn(400);
                setTimeout(() => {
                    addcontactmsg.fadeOut(700);
                }, 2000);

            });

        }

    }

    function formatDate(d) {
        let year = d.getFullYear();
        let month = d.getMonth() + 1;
        let day = d.getDate();
        let hour = d.getHours();
        let minutes = d.getMinutes();

        let time = '';
        
        if (hour == 0) {
            time += '12:' + ((minutes>=10)? minutes : '0' + minutes) + ' AM';
        }
        else if (hour <= 12) {
            time += hour + ':' + ((minutes>=10)? minutes : '0' + minutes) + ' AM';
        }
        else {
            time += (hour-12) + ':' + ((minutes>=10)? minutes : '0' + minutes) + ' PM';
        }
        
        let date = day + '/' + month + '/' + year;

        return {
            date: date,
            time: time
        };

    }

    function formatDatePreview(d) {

        let now = new Date();
        let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

        if (today < d) { //more than 1 day since last message
            return formatDate(d).time;
        }
        else if (weekAgo < d) {
            let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return days[d.getDay()];
        }
        else {
            return formatDate(d).date;
        }
    
    }

    function goBack() {
        $('.activecontact').removeClass('activecontact');
        $('.chatbox').removeClass('d-lg-flex').addClass('d-none');
        $('#empty-chatbox').addClass('d-lg-flex').addClass('d-none');
        $('.contacts').removeClass('d-none');

    }

    function scrollBottom(target, duration) {

        if(!duration) duration = 0;
        
        let height = target[0].scrollHeight;
        target.animate({
            scrollTop: height
        }, duration);
    
    }

    
    function submitSettings() {

        setName();
        setAvatar();
        setTheme();
        $('#settingsmodal').modal('hide');
    
    }

    let currentName;

    function setName() {

        let name = $('#settingsdisplayname').val().trim();
        if (!name || name == currentName) return;

        $.ajax({
            method: 'post',
            url: '/display-name',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify({name})
        })
        .done(() => {
            loadName(name);
        })
        .fail(() => {
            console.log('Error: could not set name');
        });

    }

    function loadName(name) {
        $('#displayname').text(name);
        $('#settingsdisplayname').val(name);
        currentName = name;
    }

    function setAvatar() {

        const fileInput = $('#settingspicupload')[0].files;
        if(!fileInput.length) return; 

        const file = fileInput[0];

        const formData = new FormData();
        formData.append('avatar', file);

        $.ajax({
            method: 'post',
            url: '/avatar',
            contentType: false,
            processData: false,
            data: formData
        })
        .done(data => {
            loadAvatar(data);
        })
        .fail(() => {
            console.log('Error: could not upload avatar');
        });

    }

    function loadAvatar(avatarPath) {
        $('#profilepicnav').attr('src', `images/${avatarPath}`);
    }

    function setTheme() {

        let color = $('.colorradio:checked').val();

        $.ajax({
            method: 'post',
            url: '/theme',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify({color})
        })
        .done(() => {
            loadTheme(color);
        })
        .fail(() => {
            console.log('Error: could not set theme');
        });

    }

    function loadTheme(color) {

        $(`.colorradio:checked`).attr('checked', false);
        $(`.colorradio[value='${color}']`).attr('checked', true);

        $('#colorsheet').remove();

        let url= `css/color-${color}.css`;
        let link  = `<link href="${url}" id="colorsheet" rel="stylesheet">`;
        $("head").append(link);
        
    }

});