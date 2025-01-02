const mongoose = require("mongoose")

const productMaterialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })


module.exports = mongoose.model("productMaterial", productMaterialSchema)