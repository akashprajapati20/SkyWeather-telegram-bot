const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
    telegramId: {type:Number,
               },
            name: {
                type: String,
             
            },
            city: {
                type: String,
                
            },
            country: {
                type: String,
                
            },
});

const schema = mongoose.model("schema", Schema);

module.exports = schema;
