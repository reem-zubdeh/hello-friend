const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    from: {
        type: Schema.Types.ObjectID,
        required: true,
        index: true
    },
    to: {
        type: Schema.Types.ObjectID,
        required: true,
        index: true
    },
    body: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 2000
    },
    
}, {timestamps: true});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;