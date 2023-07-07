const mongoose = require('mongoose');
const { isEmail, isStrongPassword } = require('validator');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: [true, 'Please enter an email!'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [isEmail, 'Make sure your email is valid!'],
        maxlength: [256, 'Email too long!']
    },
    password: {
        type: String,
        required: [true, 'Please create a password!'],
        validate: [(pass) => isStrongPassword(pass, {minSymbols: 0}), 'Please create a stronger password!'],
        maxlength: [256, 'Password too long!']
    },
    name: {
        type: String,
        required: [true, 'Please enter a display name. What should others see you as?'],
        minlength: [2, 'Display name too short!'],
        maxlength: [50, 'Display name too long!']
    },
    avatar: {
        type: String,
        required: true,
        default: 'avatar_default.png'
    },
    contacts: {
        type: [ {
            userID: {
                type: Schema.Types.ObjectID,
                required: true
            },
            lastMessage: {
                type: String,
                required: false
            },
            lastMessageDate: {
                type: Date,
                required: false
            }

        } ],
        default: [],
        id: false,
        _id: false
    },
    theme: {
        type: String,
        required: true,
        default: 'blue',
        enum: ['blue', 'green', 'orange', 'red', 'yellow']
    }
});

userSchema.pre('save', function (next) {

    if (this.isNew) {
        bcrypt.hash(this.password, 10)
        .then(hash => {
            this.password = hash;
            next();
        })
        .catch(err => {
            console.log(err);
            next();
        });
    }
    else next();

});

const User = mongoose.model('User', userSchema);

module.exports = User;