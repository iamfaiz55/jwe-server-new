const router = require("express").Router()
const adminSchedule = require("../controllers/admin/product.schedule")
const apexController= require("../controllers/apex.controller/apex.contrller")
const adminController = require("./../controllers/admin.controller")
const userController = require("./../controllers/user.controller")

router
    .get("/all-orders", adminController.getAllOrders)

    .get("/avg-of-mmonth", adminController.getMonthlyAvgIncome)
    .get("/all-user", adminController.getAllUsers)
    .get("/get-contact", userController.getContacts)
    .get("/get-all-products", adminController.getAllProductsAdmin)
    .get("/get-company-addresses", adminController.getCompanyAddress)
    .get("/get-all-payment-method", adminController.getPaymentMethods)
    .get("/get-history/:uId", adminController.getHistory)
    .get("/get-views", adminController.getViews)

    .put("/update-order-status", adminController.updateOrderStatus)
    .put("/unblock-user/:uId", adminController.unblockUser)
    .put("/delete-products/:pDId", adminController.deleteProduct)
    .put("/update-product/:pUId", adminController.updateProduct)
    .put("/recycle-product/:pId", adminController.recycleProduct)
    .put("/block-user/:uId", adminController.blockUser)
    .put("/disable-method/:methodId", adminController.disableMethod)
    .put("/enable-method/:methodId", adminController.enableMethod)
    .put("/update-company-address/:id", adminController.updateCompanyAddress)
    .put("/update-tax/:taxId", adminController.updateTax)
    .put("/update-menu-item/:id", adminController.updateMenuItem)
    .put("/update-scroll-card/:id", adminController.updateScrollCard)

    .post("/add-category", adminController.addCategory)
    .post("/schedule", adminSchedule.addSchedule)
    .post("/add-carousel", adminController.addCarousel)
    .post("/create-method", adminController.createPaymentMethod)
    .post("/add-company-address", adminController.addAddress)
    .post("/add-tax", adminController.createTax)
    .post("/add-menu-item", adminController.addMenuItem)
    .post("/add-image", adminController.addImage)
    .post("/add-scroll-card", adminController.addScrollCard)
    .post("/add-product", adminController.addProduct)
    .post("/update-carousel", adminController.updateCarousel)
    
    .delete("/delete-category/:cId", adminController.deleteCategory)
    .delete("/permanent-delete-product/:pId", adminController.permanentDeleteProduct)
    .delete("/delete-carousel/:id", adminController.deleteCarousel)
    .delete("/delete-scroll-card/:id", adminController.deleteScrollCard)
    .delete("/delete-add-image/:id", adminController.deleteImage)
    .delete("/delete-menu-item/:id/:menuId", adminController.deleteMenuItem)




    // product purity
    .get("/get-product-purity", adminController.getPurity)
    .post("/add-product-purity", adminController.addPurity)
    .put("/udpate-product-purity/:id", adminController.updatePurity)
    .delete("/delete-product-purity/:id", adminController.deletePurity)

    // product material
    .get("/get-product-material", adminController.getMaterial)
    .post("/add-product-material", adminController.addMaterial)
    .put("/udpate-product-material/:id", adminController.updateMaterial)
    .delete("/delete-product-material/:id", adminController.deleteMaterial)

    // product type
    .get("/get-product-type", adminController.getProductType)
    .post("/add-product-type", adminController.addProductType)
    .put("/udpate-product-type/:id", adminController.updateProductType)
    .delete("/delete-product-type/:id", adminController.deleteProductType)

    // product general settings
    .get("/get-product-general-settings", adminController.getProductGeneralSettings)
    .get("/all-orders-on-stat", apexController.getAllOrdersOnStat)
.get('/products/count-by-material', apexController.getProductsCountByMaterial)
                .get('/user/statistics', apexController.getUserStatics)

module.exports = router