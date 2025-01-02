const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema({
    code: {
        type:String,
        required: true
    },
    expiry: {
        type:String,
        required: true
    },
    message: {
        type:String,
        required: true
    },
    desc: {
        type:String,
        required: true
    },
    

}, { timestamps: true })


module.exports = mongoose.model("coupon", couponSchema)