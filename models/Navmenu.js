    const mongoose = require("mongoose");

    const navmenuSchema = new mongoose.Schema({
        menuitem: {
            type: String,
            required: true
        },
        menuImage: {
            type: String,
            // required: true
        },
        header: {
            type: String,
            // required: true
        },
        children: [
            {
                menuitem: {
                    type: String,
                },
               
                image: {
                    type: String,
                },
                link: {
                    type: String,
                },
                badge: {
                    type:String,
                     
                },
                grandChildren:[
                    {
                        name:{
                            type:String
                        },
                        link:{
                            type:String
                        }
                    }
                ]
            }
        ]
    }, { timestamps: true }); 

    module.exports = mongoose.model("navMenu", navmenuSchema);
