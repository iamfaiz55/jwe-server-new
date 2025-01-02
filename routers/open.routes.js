const router = require("express").Router()
const userController = require("./../controllers/user.controller")
const adminController = require("./../controllers/admin.controller")
const { getSchedules } = require("../controllers/admin/product.schedule")

router
    .get("/carousel", adminController.getAllCarousels)
    .get("/filter", userController.getFilteredProducts)
    .get("/categories", userController.getAllCategory)
    .get("/get-products", userController.getAllProduct)
    
    .post("/post-contact", userController.contact)
    .get("/details/:pId", userController.getDetails)

    .get("/get-tax", adminController.getTax)
    .post("/add-view", adminController.addView)

    .post("/post-history", userController.addHistory)
    .get("/get-company", userController.getCompanyDetails)
    .get("/get-scroll-cards", adminController.getAllScrollCards)
    .get("/get-menu-items", adminController.getAllMenuItems)
    .get("/get-adds-images", adminController.getAddsImages)
    .get("/get-schedules", getSchedules)
    .get("/get-product-material", adminController.getMaterial)
    // .get("/get-adds-images", adminController.)
    // .get("/get-varient/:id", adminController.getVarient)


module.exports = router