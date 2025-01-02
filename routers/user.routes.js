const router = require("express").Router()

const userController = require("./../controllers/user.controller")
const adminController = require("./../controllers/admin.controller")

router
    .get("/get-orders/:userId", userController.getOrders)
    
    .post("/add-address", userController.addAddress)
    .post("/send-invoice-again", userController.sendInvoiceAgain)
    .delete("/delete-address/:addressId", userController.deleteAddress)
    .get("/get-address/:id", userController.getAddresses)
    .get("/get-cart/:uid", userController.getAllCartItems)
    .put("/update-profile", userController.updateProfile)
    .post("/create-cart", userController.addCart)
    .post("/create-order", userController.createOrder)
    .delete("/delete-cart/:id", userController.deleteItemFromCart)
    .put("/cancel-order/:id", userController.cancelOrder)
    .delete("/delete-all-cart", userController.deleteAllCart)
    .delete("/delete-like/:id", userController.deleteLiked)
    .post("/like", userController.like)
    .get("/getLiked/:uid", userController.getAllLiked)

    .get("/carousel", adminController.getAllCarousels)
    .get("/filter", userController.getFilteredProducts)
    .get("/categories", userController.getAllCategory)


    .post("/razorpay", userController.razorpay)
    .post("/verify-payment", userController.verifyPayment)
    // .post("/payment", userController.usePhonePe)
    // .post("/status/:id", userController.initiatePhonePe)

    .post("/post-review", userController.postReview)
    .put("/update-profile-data/:id", userController.updateProfileData)
    .put("/deactivate/:uId", userController.deactivateMyAccount)
    .post("/update-address", userController.updateAddress)
    .get("/get-profile/:id", userController.getProfile)
    .get("/get-all-reviews/:id", userController.getReviews)
    .get("/get-all-payment-method", userController.getPaymentMethodsUser)


module.exports = router