const asyncHandler = require("express-async-handler")
const { checkEmpty } = require("../utils/checkEmpty")
const Order = require("../models/Order")
const UserAddress = require("../models/UserAddress")
const Product = require("../models/Product")
const Cart = require("../models/Cart")
const User = require("../models/User")
const upload = require("../utils/upload")
const cloudinary = require("../utils/uploadCloud.config")
const Liked = require("../models/Liked")
const Categories = require("../models/Categories")
const Contact = require("../models/Contact")
require("dotenv").config({path:""})
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { v4: uuid } = require("uuid");
const sendEmail = require("../utils/email")
const PDFDocument = require('pdfkit-table');
// require('pdfkit-table');
const fs = require('fs');
const https = require('https');
// const crypto= require('crypto');
const path = require('path');
const mongoose= require("mongoose")
const CompanyAddress = require("../models/CompanyAddress")
const Tax = require("../models/Tax")
const Review = require("../models/Review")
const PaymentMethod = require("../models/PaymentMethod")
const History = require("../models/History")
const axios = require('axios');
const redisClient = require("../utils/redisClient")
const { setCache } = require("../utils/redis")
// const { payment } = require("..")
// const Liked = require("../models/Liked")

// const Ordre = require("../models/Ordre")

exports.getOrders = asyncHandler(async(req, res)=> {
const {userId}=req.params
    const result = await Order.find({userId}).populate("orderItems.productId")
    // console.log(result, userId);
    
    res.json({message:"All Orders Fetch Success", result})
}) 

exports.createOrder = asyncHandler(async (req, res) => {

        const { deliveryAddressId, paymentMethod, orderItems, userId } = req.body;


        const {isError, error}= checkEmpty( { deliveryAddressId, paymentMethod, orderItems, userId })
       if (isError) {
            return res.status(400).json({ message: 'All fields Required.',error });
        }

        const productDetails = await getProductDetails(orderItems);
        console.log("product details ",productDetails);
        console.log("req.body",req.body);
        console.log("orderItems",orderItems);
        
        if (!productDetails || productDetails.length === 0) {
            return res.status(404).json({ message: 'Products not found.' });
        }

        const userData = await User.findById(userId);
        const deliveryAddressData = await UserAddress.findById(deliveryAddressId);
        const companyAddressData = await CompanyAddress.findOne();
        const taxes = await Tax.find();

        if (!userData || !deliveryAddressData || !companyAddressData) {
            return res.status(404).json({ message: 'User or address data not found.' });
        }

        const salesTax = taxes.find(tax => tax.taxName === "Sales Tax")?.percent || 0;
        const makingCharges = taxes.find(tax => tax.taxName === "Making Charges")?.percent || 0;
        const discount = taxes.find(tax => tax.taxName === "Discount")?.percent || 0;

        let subtotal = 0;
        let totalDiscountAmount = 0;
        let totalSalesTaxAmount = 0;
        let totalMakingChargesAmount = 0;

        const discountedProducts = productDetails.map(item => {
            const selectedVarient = item.product.varient.find(vari => vari._id == item.varientId )

            // console.log("selectedVarient", selectedVarient);
            // console.log("varientId",item.varientId);
            
            const originalPrice = selectedVarient.price;
            const discountAmount = (discount / 100) * originalPrice;
            const discountedPrice = originalPrice - discountAmount;

            const makingChargesAmount = (makingCharges / 100) * discountedPrice;
            const salesTaxAmount = (salesTax / 100) * discountedPrice;

            const totalPrice = discountedPrice * item.quantity;

            subtotal += totalPrice;
            totalDiscountAmount += discountAmount * item.quantity;
            totalSalesTaxAmount += salesTaxAmount * item.quantity;
            totalMakingChargesAmount += makingChargesAmount * item.quantity;

            return {
                ...item,
                varient:selectedVarient,
                discountedPrice,
                makingChargesAmount,
                salesTaxAmount,
                totalPrice
            };
        });

        const total = Math.round((subtotal + totalMakingChargesAmount + totalSalesTaxAmount) * 100);

        const orderItemsFormatted = orderItems.map(item => ({
            productId: item._id,
            quantity: item.quantity || 1,
            varientId: item.varientId
        }));
        const trackingId = `RISTEL-${Math.floor(10000 + Math.random() * 90000)}`;
        // console.log("tracking id", trackingId);
        let totalForDB = (subtotal + totalMakingChargesAmount + totalSalesTaxAmount).toFixed(2);

        const newOrder = await Order.create({
            userId,
            deliveryAddressId,
            paymentMethod,
            orderItems: orderItemsFormatted,
            total:totalForDB,
            trackingId
        });

        for (const item of discountedProducts) {
            const product = await Product.findById(item.product._id);
            const variant = product.varient.id(item.varient._id); 
        
            if (variant) {
                variant.quantity -= item.quantity; 
                if (variant.quantity < 0) {
                    variant.quantity = 0; 
                }
        
                await product.save(); 
            }
        }
        
        const notoSansFontPath = path.join(__dirname, '..', 'font', 'font.ttf');
        const pdfPath = path.join(__dirname, '../pdfs', `OrderDetails-${uuid()}.pdf`);
        const doc = new PDFDocument({ margin: 50 });

        doc.pipe(fs.createWriteStream(pdfPath));
        doc.registerFont('NotoSans', notoSansFontPath);

        doc.font('NotoSans');
        doc.fontSize(20).text('Order Invoice', { align: 'center' });
        doc.moveDown(1.5);
        const startY = doc.y;
        const columnWidth = 180;
        const gap = 20;
        const maxTextWidth = columnWidth - 10;  // Set the maximum width for text (subtract a little padding)
        
        // Billing Address
        const companyAddressX = 50;
        doc.fontSize(12).text('Billing Address:', companyAddressX, startY, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`${companyAddressData.buildingNo}`, companyAddressX, doc.y, { width: maxTextWidth });
        doc.text(`${companyAddressData.city}`, companyAddressX, doc.y, { width: maxTextWidth });
        doc.text(`${companyAddressData.state}, ${companyAddressData.country}, ${companyAddressData.pincode}`, companyAddressX, doc.y, { width: maxTextWidth });
        doc.text(`GST No: ${companyAddressData.gst}`, companyAddressX, doc.y, { width: maxTextWidth });
        
        // Shipping Address
        const deliveryAddressX = companyAddressX + columnWidth + gap;
        doc.fontSize(12).text('Shipping Address:', deliveryAddressX, startY, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`${userData.name}`, deliveryAddressX, doc.y, { width: maxTextWidth });
        doc.text(`${deliveryAddressData.addressType}, ${deliveryAddressData.city}`, deliveryAddressX, doc.y, { width: maxTextWidth });
        doc.text(`${deliveryAddressData.state}, ${deliveryAddressData.country}, ${deliveryAddressData.pincode}`, deliveryAddressX, doc.y, { width: maxTextWidth });
        doc.text(`Mobile: ${deliveryAddressData.mobile}`, deliveryAddressX, doc.y, { width: maxTextWidth });
        
        // Order Information
        const orderInfoX = deliveryAddressX + columnWidth + gap;
        doc.fontSize(12).text('Order Information:', orderInfoX, startY, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Order Tracking ID: ${trackingId}`, orderInfoX, doc.y, { width: maxTextWidth });
        doc.text(`Payment Method: ${newOrder.paymentMethod}`, orderInfoX, doc.y, { width: maxTextWidth });
        doc.text(`Order Date: ${newOrder.createdAt.toDateString()}`, orderInfoX, doc.y, { width: maxTextWidth });
        

        doc.moveDown(4);
        doc.text('', 50, doc.y);

        doc.fontSize(14).text('Product Details:', { align: 'left', underline: true });
        doc.moveDown(0.5);

        const tableData = {
            headers: ['Name', 'Title', 'Material', 'Size', 'Weight', 'Purity', 'Qty', 'Price', 'Discounted Price', 'Total'],
            rows: discountedProducts.map(item => [
                item.product.name,
                item.varient.desc,
                item.product.material,
                `${item.varient.height} x ${item.varient.width}`,
                item.product.prductWeight,
                item.product.purity,
                item.quantity,
                item.varient.price,
                item.discountedPrice,
                item.totalPrice
            ])
        };

        doc.table(tableData, {
            prepareHeader: () => doc.fontSize(10).font('Helvetica-Bold').fillColor('black'),
            prepareRow: (row, i) => doc.fontSize(10).font('Helvetica').fillColor(i % 2 === 0 ? 'black' : 'gray'),
        });

        doc.moveDown(1.5);

        doc.fontSize(12).font('NotoSans').text(`Subtotal: ₹${(subtotal ).toFixed(2)}`, { align: 'right' });
        // doc.text(`Discount (${discount}%): -₹${totalDiscountAmount.toFixed(2)}`, { align: 'right' });
        doc.text(`Making Charges (${makingCharges}%): ₹${totalMakingChargesAmount.toFixed(2)}`, { align: 'right' });
        doc.text(`Sales Tax (${salesTax}%): ₹${totalSalesTaxAmount.toFixed(2)}`, { align: 'right' });
        doc.text(`Total Items: ${orderItems.length}`, { align: 'right' });
        doc.text(`Total Price: ₹${(total / 100).toFixed(2)}`, { align: 'right' });
        doc.moveDown(2);

        doc.fontSize(16).text('Thank you for shopping with us!', { align: 'center' });
        doc.fontSize(14).text('We hope to see you again soon!', { align: 'center' });

        doc.end();

        // Send email with PDF attachment
        doc.on('end', async () => {
            try {
                const emailSent = await sendEmail({
                    to: userData.email,
                    subject: 'Your Order Receipt',
                    message: '<p>Thank you for your order. Please find the attached receipt for your records.</p>',
                    attachments: [
                        {
                            filename: path.basename(pdfPath),
                            path: pdfPath
                        }
                    ]
                });

                if (emailSent) {
                    console.log('Email sent successfully.');
                } else {
                    console.log('Failed to send email.');
                }
            } catch (error) {
                console.error('Error sending email:', error);
            }
        });

        res.json({ message: "Order created successfully, payment verified, and receipt sent to email." });
   
});


exports.addAddress = asyncHandler(async (req, res) => {
    const {
        email,
        pincode,
        city,
        state,
        country,
        addressType,
        mobile,
        userId,
        address,
        firstname,
        lastName
    } = req.body;

    const { isError, error } = checkEmpty({
        pincode,
        city,
        state,
        country,
        addressType,
        mobile,
        userId,
        address

    });

    if (isError) {
        return res.status(400).json({ message: "All Fields Required" , error});
    }

    let user = await User.findById(userId);
// console.log(user);

    if (!user) {
        return res.status(505).json({message:"user not found"})
    }

if(!user.email){
   const updated= await User.findByIdAndUpdate(userId, {email})
   console.log("updated", updated);
   
}
    await UserAddress.create({
        city,
        state,
        pincode,
        country,
        addressType,
        mobile,
        address,
        userId: user._id,
        lastName,
        firstname
    });

    res.json({ message: "Address Created Successfully" });
});

exports.updateAddress = asyncHandler(async (req, res) => {
    // console.log(req.ody);
    
    const {
        _id,  // ID of the address to update
        email,      // Optional: Update user email if provided
        pincode,
        city,
        state,
        country,
        addressType,
        mobile,
        address,
        firstname,
        lastName
    } = req.body;

    const { isError, error } = checkEmpty({
        // addressId,/ // Ensure addressId is provided
        pincode,
        city,
        state,
        country,
        addressType,
        mobile,
        address,
        firstname,
        lastName,
    });

    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error });
    }

    let existingAddress = await UserAddress.findById(_id);

    if (!existingAddress) {
        return res.status(404).json({ message: "Address not found" });
    }

    let user = await User.findById(existingAddress.userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // If email is provided and the user's email is empty, update the email
    if (email && !user.email) {
        user.email = email;
        await user.save();
    }

    // Update the address fields
    existingAddress.city = city;
    existingAddress.state = state;
    existingAddress.pincode = pincode;
    existingAddress.country = country;
    existingAddress.addressType = addressType;
    existingAddress.mobile = mobile;
    existingAddress.address = address;
    existingAddress.firstname = firstname;
    existingAddress.lastName = lastName;

    // Save the updated address
    await existingAddress.save();

    res.json({ message: "Address Updated Successfully", updatedAddress: existingAddress });
});



exports.getAddresses = asyncHandler(async(req, res)=> {
    const {id} = req.params
    const result = await UserAddress.find({userId:id})
    // if(!result){
    //     return res.json({message : "No Address"})
    // }
    // console.log(result, id);
    
    res.json({message:"All Addresses Fetch Success", result})
})

exports.deleteAddress = asyncHandler(async(req, res)=> {
    const {addressId}=req.params
    await UserAddress.findByIdAndDelete(addressId)
    res.json({message:"Address Delete Success"})
})
exports.getDetails = asyncHandler(async(req, res)=>{
    const {pId}= req.params
    const result = await Product.findOne({_id:pId})
    res.json({message:"Details Fetch Success", result})
})




exports.addCart = asyncHandler(async (req, res) => {
    const { pId, uId, varientId } = req.body;
// console.log(req.body);

    let result = await Cart.findOne({ userId: uId, productId: pId, varientId });

    if (result) {
       await Cart.findByIdAndUpdate(
            result._id,
            { $inc: { quantity: 1 } }
        );
    } else {
       await Cart.create({userId:uId, productId:pId, quantity:1, varientId})
    }

    res.json({ message: 'Cart Add successfully' });
});
exports.like = asyncHandler(async (req, res) => {
    const { pId, uId , varientId} = req.body;
// console.log(req.body);

    let result = await Liked.findOne({ userId: uId, productId: pId });

    if (result) {
     return res.status(400).json({message:" This Product is AlReady In Liked "})
    } else {
       await Liked.create({userId:uId, productId:pId, varientId})
    }

    res.json({ message: 'Liked successfully' });
});
exports.deleteLiked = asyncHandler(async (req, res) => {
    const {id} = req.params;
// console.log(req.body);

  await Liked.findByIdAndDelete(id)

    res.json({ message: 'product Deleted From Liked  ' });
});
exports.getAllLiked = asyncHandler(async (req, res) => {
    const { uid } = req.params;
    console.log(uid);
    
    const result = await Liked.find({ userId: uid }).populate("productId")
    // console.log();
    
    res.json({ message: 'Liked Items Get Success', result });
});





exports.getAllCartItems = asyncHandler(async (req, res) => {
    const { uid } = req.params;
    const result = await Cart.find({ userId: uid }).populate("productId")
    
    res.json({ message: 'Cart Items Get Success', result });
});


 
exports.deleteItemFromCart = asyncHandler(async(req, res)=> {
    const {id}=req.params
    await Cart.findByIdAndDelete(id)
    res.json({message:"Cart Iterm Delete Success"})
})


exports.deleteAllCart = asyncHandler(async(req, res)=> {
    const {userId}= req.body
     await Cart.deleteMany({ userId} );


    res.status(200).json({ message: "All cart items deleted successfully" });
})
exports.getAllProduct = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const redisKey = `allProducts:page=${page}:limit=${limit}`;

    try {
        const cachedData = await redisClient.get(redisKey);

        if (cachedData) {
            console.log('Getting Productsfrom Redis');
            return res.json(JSON.parse(cachedData));
        }

        const result = await Product.find().skip(skip).limit(limit);

        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        const responseData = {
            message: "All Products Fetch Success",
            result,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
            },
        };

        await redisClient.setEx(redisKey, 3600, JSON.stringify(responseData)); 
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

exports.cancelOrder = asyncHandler(async(req, res)=> {
    const {id}= req.params
    await Order.findByIdAndUpdate(id, {status:"cancelled"})
    res.json({message:"Order Cancel Success"})
})

exports.getFilteredProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const { material } = req.query;

    // Cache key for all products
    const allProductsCacheKey = `allProducts`;

    try {
        // Step 1: Check if all products are cached
        let allProducts = await redisClient.get(allProductsCacheKey);

        if (!allProducts) {

            allProducts = await Product.find();
            await redisClient.setEx(allProductsCacheKey, 3600, JSON.stringify(allProducts)); 
        } else {
            console.log('Getting from Redis ');
            allProducts = JSON.parse(allProducts);
        }

        let filteredProducts = allProducts;
        if (material) {
            filteredProducts = filteredProducts.filter(product => product.material === material);
        }

        // Step 3: Apply pagination
        const totalProducts = filteredProducts.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const paginatedProducts = filteredProducts.slice(skip, skip + limit);

        // Step 4: Return response
        res.json({
            message: "Filtered Products Fetch Success",
            result: paginatedProducts,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
            },
        });
    } catch (error) {
        console.error('Error fetching filtered products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});



exports.updateProfile = asyncHandler(async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error uploading file' });
        }
        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
            if (user.image) {
                const existing = user.image.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(existing);
            }  
        const {secure_url} = await cloudinary.uploader.upload(req.files[0].path);
        // console.log(req.body.userId);
        const updated = await User.findByIdAndUpdate(req.body.userId, {image:secure_url})
        const x = await User.findById(updated._id)
        
    //    console.log(updated);
       
        res.json({ message: "Profile image upload successfully", result:x });
    });
});

exports.updateProfileData = asyncHandler(async (req, res) => {
    const {id}=req.params
    const result = await User.findByIdAndUpdate(id, req.body)
    const x = await User.findById(id)
    res.json({messaege:"User Update Success", result:x})
});
exports.getProfile = asyncHandler(async(req, res)=> {
   const {id}=req.params
   const result = await User.findById(id)
   res.json({message:"User Get Success", result})
})
exports.getAllCategory = asyncHandler(async(req, res)=> {
    //   const {cId}= req.params  
      const result = await Categories.find()
      res.json({message:"Categories Get Success", result })
    })



exports.contact = asyncHandler(async(req, res)=> {
    const {name, email, subject, message} = req.body
    const {isError, error}= checkEmpty({name, email, subject, message})
    
    if(isError){
        return res.status(400).json({message :"All Fields Required"})
    }
    await Contact.create({name, email, message, subject})

    res.json({message:"Message Sent Success"})
})

exports.getContacts = asyncHandler(async(req, res)=> {
    // const {name, email, subject, message} = req.body
  
    const result = await Contact.find()

    res.json({message:"Messages Get Success", result})
})

const razorpay = new Razorpay({
    key_id:"rzp_test_8g7frJOzzN5wml",
    key_secret:"TmMcFsowpC7bQCKy5wedym1W"
})
exports.razorpay = asyncHandler(async (req, res) => {

       if(!req.body){
           return res.status(400).json({message:"body me nhi aaya"})
        }
        console.log("raz amount", req.body.subtotal );
        
    const options = {amount:req.body.subtotal *100, receipt:req.body.receipt, currency:req.body.currency}
    // console.log(req.body.subtotal);
    
    const order = await razorpay.orders.create(options)
    res.json({message:"initiate ", result:order})
});


const getProductDetails = async (orderItems) => {
   
    
    const productDetails = await Promise.all(orderItems.map(async (item) => {
      try {
        const product = await Product.findById(new mongoose.Types.ObjectId(item._id));
        if (!product) {
          console.error(`Product not found for productId: ${item._id}`);
          return null;
        }
        return {
          ...item,
          product
        };
      } catch (error) {
        console.error(`Error fetching product for productId: ${item._id}`, error);
        return null;
      }
    }));
  
    return productDetails.filter(detail => detail !== null); 
  };



  exports.verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, deliveryAddressId, paymentMethod, orderItems, userId } = req.body;

    const productDetails = await getProductDetails(orderItems);
    const userData = await User.findById(userId);
    const deliveryAddressData = await UserAddress.findById(deliveryAddressId);
    const companyAddressData = await CompanyAddress.findOne();
    const taxes = await Tax.find();

    const salesTax = taxes.find(tax => tax.taxName === "Sales Tax")?.percent || 0;
    const makingCharges = taxes.find(tax => tax.taxName === "Making Charges")?.percent || 0;
    const discount = taxes.find(tax => tax.taxName === "Discount")?.percent || 0;

    let subtotal = 0;
    let totalDiscountAmount = 0;
    let totalSalesTaxAmount = 0;
    let totalMakingChargesAmount = 0;

    const discountedProducts = productDetails.map(item => {
        const selectedVarient = item.product.varient.find(vari => vari._id == item.varientId);
        const originalPrice = selectedVarient.price;
        const discountAmount = (discount / 100) * originalPrice;
        const discountedPrice = originalPrice - discountAmount;

        const makingChargesAmount = (makingCharges / 100) * discountedPrice;
        const salesTaxAmount = (salesTax / 100) * discountedPrice;

        subtotal += discountedPrice * item.quantity;
        totalDiscountAmount += discountAmount * item.quantity;
        totalSalesTaxAmount += salesTaxAmount * item.quantity;
        totalMakingChargesAmount += makingChargesAmount * item.quantity;

        return {
            ...item,
            varient: selectedVarient,
            discountedPrice,
            makingChargesAmount,
            salesTaxAmount,
        };
    });

    const total = Math.round((subtotal + totalMakingChargesAmount + totalSalesTaxAmount) * 100);
    let totalForDB = (subtotal + totalMakingChargesAmount + totalSalesTaxAmount).toFixed(2);

    const OrderItems2 = orderItems.map(item => ({
        productId: item._id,
        quantity: item.quantity || 1,
        varientId: item.varientId
    }));

    // Updated tracking ID format
    const trackingId = `RISTEL-${Math.floor(10000 + Math.random() * 90000)}`;
console.log("tracking id", trackingId);

    const newOrder = await Order.create({
        userId,
        deliveryAddressId,
        paymentMethod,
        orderItems: OrderItems2,
        total: totalForDB,
        razorpay_payment_id,
        razorpay_order_id,
        trackingId
    });

    await razorpay.orders.create({
        amount: total,
        currency: "INR",
        receipt: trackingId,
    });

    for (const item of discountedProducts) {
        const product = await Product.findById(item.product._id);
        const variant = product.varient.id(item.varient._id);

        if (variant) {
            variant.quantity -= item.quantity;
            if (variant.quantity < 0) {
                variant.quantity = 0;
            }

            await product.save();
        }
    }

    const notoSansFontPath = path.join(__dirname, '..', 'font', 'font.ttf');
    const pdfPath = path.join(__dirname, '../pdfs', `OrderDetails-${trackingId}.pdf`);
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(fs.createWriteStream(pdfPath));
    doc.registerFont('NotoSans', notoSansFontPath);

    doc.font('NotoSans').fontSize(20).text('Order Invoice', { align: 'center' });
    doc.moveDown(1.5);

    const startY = doc.y;  // Initial Y position for the top of the page
const columnWidth = 180;
const gap = 20;

// Billing Address Section
const companyAddressX = 50;  // X position for Billing Address
doc.fontSize(12).text('Billing Address:', companyAddressX, startY, { underline: true });
doc.moveDown(0.5);
doc.fontSize(10)
    .text(`${companyAddressData.buildingNo}`, companyAddressX, doc.y, { width: columnWidth })
    .text(`${companyAddressData.city}`, companyAddressX, doc.y, { width: columnWidth })
    .text(`${companyAddressData.state}, ${companyAddressData.country}, ${companyAddressData.pincode}`, companyAddressX, doc.y, { width: columnWidth })
    .text(`GST No: ${companyAddressData.gst}`, companyAddressX, doc.y, { width: columnWidth });

// Shipping Address Section
const deliveryAddressX = companyAddressX + columnWidth + gap;  // X position for Shipping Address
const deliveryAddressStartY = startY;  // Start the Shipping Address at the same Y position
doc.fontSize(12).text('Shipping Address:', deliveryAddressX, deliveryAddressStartY, { underline: true });
doc.moveDown(0.5);
doc.fontSize(10)
    .text(`${userData.name}`, deliveryAddressX, doc.y, { width: columnWidth })
    .text(`${deliveryAddressData.addressType}, ${deliveryAddressData.city}`, deliveryAddressX, doc.y, { width: columnWidth })
    .text(`${deliveryAddressData.state}, ${deliveryAddressData.country}, ${deliveryAddressData.pincode}`, deliveryAddressX, doc.y, { width: columnWidth })
    .text(`Mobile: ${deliveryAddressData.mobile}`, deliveryAddressX, doc.y, { width: columnWidth });

// Order Information Section
const orderInfoX = deliveryAddressX + columnWidth + gap;  // X position for Order Information
const orderInfoStartY = startY;  // Start the Order Information at the same Y position
doc.fontSize(12).text('Order Information:', orderInfoX, orderInfoStartY, { underline: true });
doc.moveDown(0.5);
doc.fontSize(10)
    .text(`Order Tracking ID: ${trackingId}`, orderInfoX, doc.y, { width: columnWidth })
    .text(`Payment ID: ${newOrder.razorpay_payment_id}`, orderInfoX, doc.y, { width: columnWidth })
    .text(`Payment Method: ${newOrder.paymentMethod}`, orderInfoX, doc.y, { width: columnWidth })
    .text(`Order Date: ${newOrder.createdAt.toDateString()}`, orderInfoX, doc.y, { width: columnWidth });

    doc.moveDown(2);
    doc.text('', 50, doc.y);

    // Product Details Table
    doc.fontSize(14).text('Product Details:', { align: 'left', underline: true });
    doc.moveDown(0.5);

    const tableData = {
        headers: ['Name', 'Title', 'Material', 'Size', 'Weight', 'Purity', 'Qty', 'Price', 'Discounted Price', 'Total'],
        rows: discountedProducts.map(item => {
            return [
                item.product.name,
                item.varient.desc,
                item.product.material,
                `${item.varient.height} x ${item.varient.width}`,
                item.varient.prductWeight,
                item.product.purity,
                item.quantity,
                item.varient.price,
                item.discountedPrice,
                item.discountedPrice * item.quantity,
            ];
        }),
    };

    doc.table(tableData, {
        prepareHeader: () => doc.fontSize(10).font('Helvetica-Bold').fillColor('black'),
        prepareRow: (row, i) => doc.fontSize(10).font('Helvetica').fillColor(i % 2 === 0 ? 'black' : 'gray'),
    });

    doc.moveDown(1.5);

    // Totals Section
    doc.fontSize(12).font('NotoSans').text(`Subtotal: ₹${subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`Making Charges (${makingCharges}%): ₹${totalMakingChargesAmount.toFixed(2)}`, { align: 'right' });
    doc.text(`Sales Tax (${salesTax}%): ₹${totalSalesTaxAmount.toFixed(2)}`, { align: 'right' });
    doc.text(`Total Items: ${orderItems.length}`, { align: 'right' });
    doc.text(`Total Price: ₹${(total / 100).toFixed(2)}`, { align: 'right' });
    doc.moveDown(2);

    doc.fontSize(16).text('Thank you for shopping with us!', { align: 'center' });
    doc.fontSize(14).text('We hope to see you again soon!', { align: 'center' });

    doc.end();

    // Send Email on Document End
    doc.on('end', async () => {
        const emailSent = await sendEmail({
            to: userData.email,
            subject: 'Your Order Receipt',
            message: '<p>Thank you for your order. Please find the attached receipt for your records.</p>',
            attachments: [
                {
                    filename: path.basename(pdfPath),
                    path: pdfPath,
                },
            ],
        });

        if (emailSent) {
            console.log('Email sent successfully.');
        } else {
            console.log('Failed to send email.');
        }
    });

    res.json({ message: "Payment verified, order successful, and receipt sent on email." });
});

exports.postReview = asyncHandler(async(req, res)=>{
    const {rating, review, pId, uId} = req.body
    await Review.create({rating, review, pId, uId})
    res.json({message:"Review Create Success"})
})

exports.getReviews = asyncHandler(async(req, res)=>{
    const {id} = req.params
    const result = await Review.find({pId:id}).populate("uId")
    res.json({message:"All Reviews Fetch Success", result})
})

exports.getPaymentMethodsUser = asyncHandler(async(req, res)=> {
    const result = await PaymentMethod.find()
    res.json({message:"all Payment Methods Get Success ", result})
})
exports.getCompanyDetails = asyncHandler(async(req, res)=> {
    const result = await CompanyAddress.findOne()
    res.json({message:"Company Details Fetch Success", result})

})

exports.addHistory = asyncHandler(async(req, res)=> {
    const {userId, type, productId, cartId, ordersId}=req.body
    const {isError, error}= checkEmpty({userId, type})
    if(isError){
        return res.status(410).json({message:"all fields required", error})
    }
    const device = req.useragent.isMobile || req.useragent.isTablet ? "mobile" : "computer";
    console.log(device);
    
  await History.create({...req.body,  device})
  res.json({message:"history create successs"})
})





// exports.usePhonePe = asyncHandler(async (req, res) => {

//     const { name, number, amount, transactionId, MUID } = req.body;
//     const merchantTransactionId = transactionId;
// // console.log("req.body",req.body );

//     const data = {
//         "merchantId":process.env.PHONEPE_MERCHANT_ID, 
//         "merchantTransactionId": merchantTransactionId,
//         "merchantUserId": MUID,
//         "amount": amount * 100,  
//         // "redirectUrl": `http://localhost:5000/api/user/status/${merchantTransactionId}`,
//         "redirectMode": "POST",
//         "mobileNumber": number, 
//         "paymentInstrument": {
//             "type": "PAY_PAGE"
//         }
//     };

 
//     const payload = Buffer.from(JSON.stringify(data)).toString('base64');

//     const saltKey = process.env.PHONEPE_SALT_KEY;  
//     const saltIndex = 1;  

//     const string = payload +  "/pg/v1/pay" + saltKey;

//     // console.log("String to hash for checksum:", string);

//     const sha256Hash = crypto.createHash('sha256').update(string).digest('hex');

//     const checkSum = sha256Hash + '###' + saltIndex;
// // 	SHA256(base64 encoded payload + “/pg/v1/pay” +salt key) + ### + salt index
//     console.log("Generated Checksum:", checkSum);

//     console.log("Base64 Payload:", payload);

//     const options = {
//         method: 'post',
//         url: 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay',
//         headers: {
//             accept: 'text/plain',
//             'Content-Type': 'application/json',
//             'X-VERIFY': checkSum 
//         },
//  HEAD
//         data: { 
//             request: payload 
//         }

//     };



//         data:{
//               request: payload
//              }  
//     };

    /**
     * 
     * 
     * 
const axios = require('axios');
const options = {
  method: 'post',
  url: 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay',
  headers: {
        accept: 'text/plain',
        'Content-Type': 'application/json',
				},
data: {
}
};
axios
  .request(options)
      .then(function (response) {
      console.log(response.data);
  })
  .catch(function (error) {
    console.error(error);
  });
     */
// >>>>>>> 3e3f81b2c8cb676bfa0e3d9b8401218d81c6fab3
//     const response = await axios.request(options);

//     try {
//         console.log("Payment Response:", response.data);

//         res.json({ message: "done", result: response.data.data.instrumentResponse.redirectInfo.url });
//     } catch (error) {
//         console.log("Payment error:", error.message);
//         res.status(500).json({ message: "Error processing payment", error: error.message });
//     }
// })


// exports.initiatePhonePe = asyncHandler(async(req, res)=> {
//     const {id}= req.params
//      console.log("initiate status id", id);
//       const merchantTransactionId =id

//     const saltKey = process.env.PHONEPE_SALT_KEY;  
//     const saltIndex = 1;  

//     const string =  `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}` + saltKey;


//     const sha256Hash = crypto.createHash('sha256').update(string).digest('hex');  
//     const checkSum = sha256Hash + '###' + saltIndex;

//     console.log("checksum:", checkSum);

//     console.log("payload:", payload);

//     const options = {
//         method: 'GET',
//         url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
//         headers: {
//             accept: 'application/json',  
//             'Content-Type': 'application/json',
//             'X-VERIFY': checkSum ,
//             'X-MERCHANT-ID': process.env.PHONEPE_MERCHANT_ID ,
//         } 
//     };

    


//     const result = await axios.request(options)
//      if(result.data.success  == true){
//         return res.json({message:"paument Success"})
//      }else{
//         return res.status(505).json({message:"payment Failed"})
//      }
     
// // <<<<<<< HEAD
// })



exports.sendInvoiceAgain = asyncHandler(async (req, res) => {
    const { orderId } = req.body;  // Get orderId from the route parameter

    // Fetch the order and related details
    const order = await Order.findById(orderId).populate('userId deliveryAddressId orderItems.productId');
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
// console.log("orderssss", order);

    const userData = await User.findById(order.userId);
    const deliveryAddressData = await UserAddress.findById(order.deliveryAddressId);
    const companyAddressData = await CompanyAddress.findOne();
    const taxes = await Tax.find();

    const salesTax = taxes.find(tax => tax.taxName === "Sales Tax")?.percent || 0;
    const makingCharges = taxes.find(tax => tax.taxName === "Making Charges")?.percent || 0;
    const discount = taxes.find(tax => tax.taxName === "Discount")?.percent || 0;

    let subtotal = 0;
    let totalDiscountAmount = 0;
    let totalSalesTaxAmount = 0;
    let totalMakingChargesAmount = 0;

    // Recalculate discounted product details with correct variant handling
    const discountedProducts = await Promise.all(order.orderItems.map(async (item) => {
        const product = await Product.findById(new mongoose.Types.ObjectId(item.productId));
        // console.log("product---", product);
        
        if (!product) {
            console.error(`Product not found for productId: ${item.productId}`);
            return null;
        }

        // Find the correct variant based on varientId 

        const selectedVariant = product.varient.find(vari => vari._id.toString() === item.varientId.toString());
        if (!selectedVariant) {
            console.error(`Variant not found for varientId: ${item.varientId}`);
            return null;
        }
// console.log("selected varient", selectedVariant);

        const originalPrice = selectedVariant.price;
        const discountAmount = (discount / 100) * originalPrice;
        const discountedPrice = originalPrice - discountAmount;

        const makingChargesAmount = (makingCharges / 100) * discountedPrice;
        const salesTaxAmount = (salesTax / 100) * discountedPrice;

        subtotal += discountedPrice * item.quantity;
        totalDiscountAmount += discountAmount * item.quantity;
        totalSalesTaxAmount += salesTaxAmount * item.quantity;
        totalMakingChargesAmount += makingChargesAmount * item.quantity;

        return {
            ...product,
            varient: selectedVariant,
            discountedPrice,
            makingChargesAmount,
            salesTaxAmount,
            quantity:item.quantity
        };
    }));
// console.log("product det",discountedProducts );

    // Filter out any null values due to errors in product or variant lookup
    const validDiscountedProducts = discountedProducts.filter(item => item !== null);

    const total = Math.round((subtotal + totalMakingChargesAmount + totalSalesTaxAmount) * 100);
    let totalForDB = (subtotal + totalMakingChargesAmount + totalSalesTaxAmount).toFixed(2);

    // Generate the PDF Invoice
    const notoSansFontPath = path.join(__dirname, '..', 'font', 'font.ttf');
    const pdfPath = path.join(__dirname, '../pdfs', `OrderDetails-${uuid()}.pdf`);
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(fs.createWriteStream(pdfPath));
    doc.registerFont('NotoSans', notoSansFontPath);

    doc.font('NotoSans');
    doc.fontSize(20).text('Order Invoice', { align: 'center' });
    doc.moveDown(1.5);

    const startY = doc.y;
    const columnWidth = 180;
    const gap = 20;
    
    // Billing Address Section
    const companyAddressX = 50;
    doc.fontSize(12).text('Billing Address:', companyAddressX, startY, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`${companyAddressData.buildingNo}`, companyAddressX, doc.y, { width: columnWidth });
    doc.text(`${companyAddressData.city}`, companyAddressX, doc.y, { width: columnWidth });
    doc.text(`${companyAddressData.state}, ${companyAddressData.country}, ${companyAddressData.pincode}`, companyAddressX, doc.y, { width: columnWidth });
    doc.text(`GST No: ${companyAddressData.gst}`, companyAddressX, doc.y, { width: columnWidth });
    
    // Shipping Address Section
    const deliveryAddressX = companyAddressX + columnWidth + gap;
    doc.fontSize(12).text('Shipping Address:', deliveryAddressX, startY, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`${userData.name}`, deliveryAddressX, doc.y, { width: columnWidth });
    doc.text(`${deliveryAddressData.addressType}, ${deliveryAddressData.city}`, deliveryAddressX, doc.y, { width: columnWidth });
    doc.text(`${deliveryAddressData.state}, ${deliveryAddressData.country}, ${deliveryAddressData.pincode}`, deliveryAddressX, doc.y, { width: columnWidth });
    doc.text(`Mobile: ${deliveryAddressData.mobile}`, deliveryAddressX, doc.y, { width: columnWidth });
    
   // Order Information Section
const orderInfoX = deliveryAddressX + columnWidth + gap;
doc.fontSize(12).text('Order Information:', orderInfoX, startY, { underline: true });
doc.moveDown(0.5);

// Always print order tracking ID and payment method
doc.fontSize(10).text(`Order Tracking ID: ${order.trackingId}`, orderInfoX, doc.y, { width: columnWidth });

// Conditionally display Payment ID if the payment method is not "COD"
if (order.paymentMethod !== 'cod') {
    doc.text(`Payment ID: ${order.razorpay_payment_id}`, orderInfoX, doc.y, { width: columnWidth });
}

// Display payment method and order date
doc.text(`Payment Method: ${order.paymentMethod}`, orderInfoX, doc.y, { width: columnWidth });
doc.text(`Order Date: ${order.createdAt.toDateString()}`, orderInfoX, doc.y, { width: columnWidth });

    doc.moveDown(2);
    doc.text('', 50, doc.y);

    doc.fontSize(14).text('Product Details:', { align: 'left', underline: true });
    doc.moveDown(0.5);

    const tableData = {
        headers: ['Name', 'Title', 'Material', 'Size', 'Weight', 'Purity', 'Qty', 'Price', 'Discounted Price', 'Total'],
        rows: validDiscountedProducts.map(item => {
            return [
                item._doc.name,
                item.varient.desc,
                item._doc.material,
                `${item.varient.height} x ${item.varient.width}`,
                item.varient.prductWeight,
                item._doc.purity,
                item.quantity,
                item.varient.price,
                item.discountedPrice,
                item.discountedPrice * item.quantity,
            ];
        }),
    };

    doc.table(tableData, {
        prepareHeader: () => doc.fontSize(10).font('Helvetica-Bold').fillColor('black'),
        prepareRow: (row, i) => doc.fontSize(10).font('Helvetica').fillColor(i % 2 === 0 ? 'black' : 'gray'),
    });

    doc.moveDown(1.5);

    // Total Calculation
    doc.fontSize(12).font('NotoSans').text(`Subtotal: ₹${(subtotal).toFixed(2)}`, { align: 'right' });
    doc.text(`Making Charges (${makingCharges}%): ₹${(totalMakingChargesAmount).toFixed(2)}`, { align: 'right' });
    doc.text(`Sales Tax (${salesTax}%): ₹${(totalSalesTaxAmount).toFixed(2)}`, { align: 'right' });
    doc.text(`Total Items: ${order.orderItems.length}`, { align: 'right' });
    doc.text(`Total Price: ₹${(total / 100).toFixed(2)}`, { align: 'right' });
    doc.moveDown(2);

    doc.fontSize(16).text('Thank you for shopping with us!', { align: 'center' });
    doc.fontSize(14).text('We hope to see you again soon!', { align: 'center' });

    doc.end();

    doc.on('end', async () => {
        const emailSent = await sendEmail({
            to: userData.email,
            subject: 'Your Order Receipt',
            message: '<p>Thank you for your order. Please find the attached receipt for your records.</p>',
            attachments: [
                {
                    filename: path.basename(pdfPath),
                    path: pdfPath,
                },
            ],
        });

        if (emailSent) {
            console.log('Invoice resent successfully.');
            res.json({ message: 'Invoice resent successfully.' });
        } else {
            console.log('Failed to resend invoice.');
            res.status(500).json({ message: 'Failed to resend invoice.' });
        }
    });
});



exports.deactivateMyAccount = asyncHandler(async(req, res)=> {
    const {uId}= req.params
    const result = await User.findById(uId)
    console.log(uId);
    console.log(result);
    
    if(!result){
        return res.json({message:"No Have Data"})
    }
   
    const x = await User.findByIdAndUpdate(uId, {isDelete:true})

    res.json({message:"Account Deleted Successfuly"})

})
// =======
    // })
// >>>>>>> 3e3f81b2c8cb676bfa0e3d9b8401218d81c6fab3
