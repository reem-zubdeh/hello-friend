const express = require('express');
const multer  = require('multer')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('./models/user');
const Message = require('./models/message');

const app = express();
const port = 3000;

app.use(express.static('public'));
// app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const TOKEN_SECRET = 'c6b44c6a1fec9d943b114bc389c53f2fb5b9ed14f09e1142d7542487a3f1f3e07378215bf18f2dccacad7fd75212aa933579af316218a1542123589c29d559fc';

mongoose.connect('mongodb://127.0.0.1:27017/HelloFriendDB', { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    app.listen(port, () => {
        console.log(`HelloFriend listening at port ${port}`);
    });
})
.catch(err => console.log(err));

app.get('/logout', (req, res) => {
    res.locals.auth = false;
    res.locals.user = undefined;
    res.cookie('authToken', '', { maxAge: 3, httpOnly: true});
    res.redirect('/')
});

//auth
app.use(async (req, res, next) => {

    await new Promise(resolve => setTimeout(resolve, 1000)); //wait 1 second to simulate network delay

    res.locals.auth = false;
    res.locals.user = undefined;
    if(!req.cookies?.authToken){
        return next();
    }
    try {
        tokenBody = jwt.verify(req.cookies.authToken, TOKEN_SECRET);
        res.locals.auth = true;
        res.locals.user = tokenBody.user;
        return next();
    } 
    catch (err) {
        return res.redirect('/logout');
    }
});

app.get('/', (req, res) => {
    if (res.locals.auth) return res.redirect('/chat');
    res.sendFile('./pages/index.html', {root: __dirname});
});

app.get('/signup', (req, res) => {
    if (res.locals.auth) return res.redirect('/chat');
    res.sendFile('./pages/signup.html', {root: __dirname});
});

app.get('/chat', (req, res) => {
    if (!res.locals.auth) return res.redirect('/');
    res.sendFile('./pages/chat.html', {root: __dirname});
});

app.post('/signup', async (req, res) => {

    const user = new User({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        contacts: []
    });

    user.save()
    .then(() => {
        res.status(201).send();
    })
    .catch(err => {
        if (err.code != 11000 && !err.errors?.email?.message && !err.errors?.password?.message && !err.errors?.name?.message) {
            return res.status(500).send();
        }
        const errorCodes = {
            email: err.code === 11000 ? 'An account already exists with this email!' : err.errors?.email?.message,
            password: err.errors?.password?.message,
            name: err.errors?.name?.message
        }
        if (err.code === 11000) res.status(409);
        else res.status(403);
        res.json(errorCodes);
    });

});

app.post('/login', async (req, res) => {

    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            res.status(401).json({error: 'No account exists with this email.'});
            return;
        }
        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) {
            res.status(401).json({error: 'Incorrect password! Please try again.'});
        } else {
            const token = jwt.sign({ user: user.id }, TOKEN_SECRET, { expiresIn:  30 * 24 * 60 * 60 * 1000});
            res.cookie('authToken', token, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly : true });
            res.send()
        }
    } 
    catch (err) {
        console.log(err);
        res.status(500).json({error: 'Sorry! An error has occurred, please try again.'});
        
    }

});

app.get('/user-data', async (req, res) => {

    if (!res.locals.auth) return res.status(401).send();

    const user = await User.findById(res.locals.user);
    
    return res.json({
        name: user.name,
        avatar: user.avatar,
        theme: user.theme
    });

});

app.get('/contacts', async (req, res) => {

    if (!res.locals.auth) return res.status(401).send();

    try {
        const user = await User.findById(res.locals.user);
        if (!user) return res.status(403).send();

        const contacts = [];
        for (let contact of user.contacts) {
            let userInfo = await User.findById(contact.userID, {email: 1, name: 1, avatar: 1});
            contacts.push({
                userID: contact.userID,
                lastMessage: contact.lastMessage,
                lastMessageDate: contact.lastMessageDate,
                email: userInfo.email,
                name: userInfo.name,
                avatar: userInfo.avatar
            });
        }

        contacts.sort((a, b) => b.lastMessageDate - a.lastMessageDate);

        res.json(contacts);
    }
    catch (err) {
        console.log(err);
        res.status(500).send();
    }

});

app.get('/messages', async (req, res) => {

    if (!res.locals.auth) return res.status(401).send();
    
    try {
    
        let self = new mongoose.Types.ObjectId(res.locals.user);
        let other= new mongoose.Types.ObjectId(req.query.user);

        result = await Message.find(
            { $or: [{to: self, from: other}, {to: other, from: self}] }, 
            { _id: 0, body: 1, createdAt: 1, incoming: { $cond: [ {$eq: ["$to", self]}, 1, 0 ] } },
            { skip: 10 * req.query.page, limit: 10 }
        ).sort({createdAt: -1});

        return res.json(result);

    }
    catch (err) {
        return res.status(500).send();
    }


});

app.post('/add-contact', async (req, res) => {

    if (!res.locals.auth) return res.status(401).send();

    try {
        const user = await User.findById(res.locals.user);

        const contact = await User.findOne({email: req.body.email});
        if (!contact) return res.status(404).json({error: 'We couldn\'t find anyone with this email address.'});

        if (user.contacts.findIndex(existingContact => existingContact.userID == contact.id) != -1) {
            return res.status(409).json({error: 'That Friend is already on your contact list!'});
        } else {
            user.contacts.push({
                userID: contact.id,
                lastMessage: '',
                lastMessageDate: ''
            });
            await user.save();
            return res.json({contact: {
                userID: contact.id,
                email: contact.email,
                name: contact.name,
                avatar: contact.avatar
            }, error: ''});
        }

    }
    catch (err) {
        console.log(err);
        res.status(500).send();
    }

});

app.post('/send-message', async (req, res) => {

    if (!res.locals.auth) return res.status(401).send();

    let senderID = res.locals.user;
    let recipientID = req.body.to;
    let preview = req.body.body.slice(0,30);
    if (req.body.body.length > 30) preview += '...';
    let date = new Date();

    try {

        const message = new Message({
            from: senderID,
            to: recipientID,
            body: req.body.body,
        });
        await message.save();

        let sender = await User.findById(senderID);
        if (!sender) return res.status(403).send();
        let recipientIndex = sender.contacts.findIndex(contact => contact.userID == recipientID);
        if (recipientIndex == -1) {
            sender.contacts.push({
                userID: recipientID,
                lastMessage: preview,
                lastMessageDate: date
            });
        } else {
            sender.contacts[recipientIndex].lastMessage = preview;
            sender.contacts[recipientIndex].lastMessageDate = date;
        }
        await sender.save();

        let recipient = await User.findById(recipientID);
        if (!recipient) return res.status(403).send();
        let senderIndex = recipient.contacts.findIndex(contact => contact.userID == senderID);
        if (senderIndex == -1) {
            recipient.contacts.push({
                userID: senderID,
                lastMessage: preview,
                lastMessageDate: date
            });
        } else {
            recipient.contacts[senderIndex].lastMessage = preview;
            recipient.contacts[senderIndex].lastMessageDate = date;
        }
        await recipient.save();

        res.send();

    }
    catch(err) {
        console.log(err);
        res.send('not ok');
    }

});


app.post('/avatar', (req, res) => {

    if (!res.locals.auth) return res.status(401).send();

    let fileName = '';

    const upload = multer( {
        storage: multer.diskStorage({
            destination: (req, file, cb) => { 
                cb(null, 'public/images/')
            },
            filename: (req, file, cb) => {
                fileName += 'avatar_' + req.res.locals.user + '_' + Date.now()
                + file.originalname.substring(file.originalname.lastIndexOf('.')); //file extension
                cb(null, fileName);
            }
        })
    } ).single('avatar');
    
    upload(req, res, async (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send();
        }
        else {
            try {
                const user = await User.findById(res.locals.user);
                user.avatar = fileName;
                await user.save();
                res.send(fileName);
            } 
            catch (err) {
                console.log(err);
                return res.status(500).send();
            }

        }
    });
    
    
});

app.post('/theme', async (req, res) => {

    if (!res.locals.auth) return res.status(401).send();

    try {
        const user = await User.findById(res.locals.user);
        user.theme = req.body.color;
        await user.save();
        return res.send();
    }
    catch (err) {
        console.log(err);
        return res.status(500).send();
    }
    
});

app.post('/display-name', async (req, res) => {

    if (!res.locals.auth) return res.status(401).send();
    try {
        const user = await User.findById(res.locals.user);
        user.name = req.body.name;
        await user.save();
        return res.send();
    }
    catch (err) {
        console.log(err);
        return res.status(500).send();
    }
    
});
