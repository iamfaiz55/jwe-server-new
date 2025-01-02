const asyncHandler = require("express-async-handler")
const { checkEmpty } = require("../utils/checkEmpty")
const Product = require("../models/Product")
const Order = require("../models/Order")
const upload = require("../utils/upload")
const cloudinary = require("../utils/uploadCloud.config")
const User = require("../models/User")
const Carousel = require("../models/Carousel")
const Categories = require("../models/Categories")
const PaymentMethod = require("../models/PaymentMethod")
const CompanyAddress = require("../models/CompanyAddress")
const Tax = require("../models/Tax")
const Navmenu = require("../models/Navmenu")
const ScrollCards = require("../models/ScrollCards")
const upload2 = require("../utils/upload2")
const AddImages = require("../models/AddImages")
const History = require("../models/History")
const MostViewed = require("../models/MostViewed")
const ProductType = require("../models/ProductType")
const ProductMaterial = require("../models/ProductMaterial")
const ProductPurity = require("../models/ProductPurity")


exports.addProduct = asyncHandler(async (req, res) => {
    // console.log(req.body);
    
    upload(req, res, async err => {
        if (err) {
            return res.status(400).json({ message: "File upload failed", error: err.message });
        }

        const file = req.files[0];

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const files = req.files; 
        // console.log("Uploaded files:", files);
        // console.log("req.body:", req.body);

        // const { secure_url } = await cloudinary.uploader.upload(file.path);
        const imageUploads = await Promise.all(files.map(file => 
            cloudinary.uploader.upload(file.path)
        ));
        
        const imageUrls = imageUploads.map(upload => upload.secure_url);
        
        // const { name, mrp, price, discount, height, width, prductWeight, material, productType, desc, purity } = req.body;
        const { name, varient, material, productType, mainDesc, purity, slug } = req.body;

       
            
        
        await Product.create({
            name,
            varient,
            // mrp,
            images: imageUrls,
            // price,
            // discount,
            // height,
            // width,
            // prductWeight,
            material,
            productType,
            mainDesc,
            purity,
            slug
        });

        res.json({ message: "Product Add Success" });
    });
});

// exports.getVarient=  asyncHandler(async(req, res)=> {
//     const {id} = req.params
//     const result = await Product.findById({_id:id})
//     console.log("result",result);
//     console.log("id", id);
    
//     res.json({message:"VArient get Success", result})
// })


exports.updateProduct = asyncHandler(async (req, res) => {
    const { pUId } = req.params;

    const product = await Product.findById(pUId);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    upload(req, res, async err => {
        if (err) {
            return res.status(400).json({ message: "File upload failed", error: err.message });
        }

        let secure_urls = product.images;
        let public_ids = product.cloudinary_ids;

        if (req.files && req.files.length > 0) {
            if (public_ids && public_ids.length > 0) {
                for (const public_id of public_ids) {
                    await cloudinary.uploader.destroy(public_id);
                }
            }


            const imageUploads = await Promise.all(
                req.files.map(file => cloudinary.uploader.upload(file.path))
            );

            secure_urls = imageUploads.map(upload => upload.secure_url);

        }

        const {
            name, material, productType, desc, purity, varient
        } = req.body;

        if (varient && Array.isArray(varient)) {
            product.varient.forEach((variant, index) => {
                const updatedVariant = varient[index];

                if (updatedVariant) {
                    variant.price = updatedVariant.price || variant.price;
                    variant.mrp = updatedVariant.mrp || variant.mrp;
                    variant.discount = updatedVariant.discount || variant.discount;
                    variant.height = updatedVariant.height || variant.height;
                    variant.width = updatedVariant.width || variant.width;
                    variant.prductWeight = updatedVariant.prductWeight || variant.prductWeight;
                    variant.quantity = updatedVariant.quantity || variant.quantity;
                }
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            product._id,
            {
                name,
                images: secure_urls,
                material,
                productType,
                desc,
                purity,
                varient: product.varient}
           
        );

        res.json({ message: "Product updated successfully", updatedProduct });
    });
});


exports.deleteProduct = asyncHandler(async(req, res)=> {
    const {pDId}= req.params
    await Product.findByIdAndUpdate(pDId, {isDelete:true})
    res.json({message:"Product Delete Success"})
})
exports.recycleProduct = asyncHandler(async(req, res)=> {
    const {pId}= req.params
    await Product.findByIdAndUpdate(pId, {isDelete:false})
    res.json({message:"Product Recycle Success"})
})
exports.permanentDeleteProduct = asyncHandler(async(req, res)=> {
    const {pId}= req.params
    await Product.findByIdAndDelete(pId)
    res.json({message:"Product Permanent Delete Success"})
})


exports.getAllOrders = asyncHandler(async(req, res)=> {
    const result = await Order.find().populate("orderItems.productId").populate("userId").populate("deliveryAddressId")
    res.json({message:"All Orders Fetch Success", result})
})

exports.updateOrderStatus =asyncHandler(async(req, res)=> {
    const {status, orderId}= req.body
    const {isError, error}= checkEmpty({status, orderId})

    if(isError){
        return res.status(400).json({message:"All Fields Required", error})
    }

    await Order.findByIdAndUpdate(orderId, {status})
    res.json({message:"Order Update Success"})
})


exports.getAllUsers = asyncHandler(async(req, res)=> {
    const result = await User.find()
    res.json({message:"All Users Fetch Success", result})
})



exports.addCarousel = asyncHandler(async (req, res) => {

   
    upload(req, res, async err => {
        if (err) {
            return res.status(400).json({ message: "File upload failed", error: err.message });
        }
        const file = req.files[0]; 
        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const { secure_url } = await cloudinary.uploader.upload(file.path);
        const { mainHeading, paragraph } = req.body;
        await Carousel.create({mainHeading, paragraph, image:secure_url});
        res.json({ message: "Product Carousel Success" });
    });
  
});

exports.getAllCarousels = asyncHandler(async(req, res)=> {
        const result = await Carousel.find().exec();
        const cleanResult = result.map(item => ({
            _id: item._id,
            image: item.image,
            mainHeading: item.mainHeading,
            paragraph: item.paragraph
        }));

        res.json({ message: "All Carousel Items Get Success", result: cleanResult });
})

exports.deleteCarousel = asyncHandler(async (req, res) => {
    const { id } = req.params;
        const carouselItem = await Carousel.findById(id);
        if (carouselItem.image) {
            const publicId = carouselItem.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }
        await Carousel.findByIdAndDelete(id);
        res.json({ message: 'Carousel deleted successfully' });
});

exports.updateCarousel = asyncHandler(async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: 'File upload failed', error: err.message });
        }

        const { carouselId, mainHeading, paragraph } = req.body;

        const carouselItem = await Carousel.findById(carouselId);
        if (!carouselItem) {
            return res.status(404).json({ message: 'Carousel item not found' });
        }

        let imageUrl = carouselItem.image;

        if (req.files && req.files.length > 0) {
            const file = req.files[0];

            try {
                const publicId = carouselItem.image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);

                const result = await cloudinary.uploader.upload(file.path);

                imageUrl = result.secure_url;
            } catch (error) {
                return res.status(500).json({ message: 'Failed to upload new image', error: error.message });
            }
        }

        await Carousel.findByIdAndUpdate(
            carouselId,
            { mainHeading, paragraph, image: imageUrl },
        );

        res.status(200).json({ message: 'Carousel item updated successfully', image: imageUrl });
    });
})
exports.blockUser = asyncHandler(async(req, res)=> {
  const {uId}= req.params
 const updated= await User.findByIdAndUpdate(uId, {isBlock:true})
  
  res.json({message:"User Blocked Success", result:{
    isBlock:true,
    name:updated.name,
    email:updated.email,
    _id:updated._id,
    image:updated.image,
  }})
})
exports.unblockUser = asyncHandler(async(req, res)=> {
  const {uId}= req.params  

  const updated = await User.findByIdAndUpdate(uId, {isBlock:false})
  res.json({message:"User Unblocked Success", result:{
    isBlock:false,
    name:updated.name,
    email:updated.email,
    _id:updated._id,
    image:updated.image,
  }})
})
exports.addCategory = asyncHandler(async(req, res)=> {
  await Categories.create(req.body)
  res.json({message:"Category Added Success"})
})
exports.deleteCategory = asyncHandler(async(req, res)=> {
  const {cId}= req.params  
  await Categories.findByIdAndDelete(cId)
  res.json({message:"Category Delete Success"})
})

exports.getPaymentMethods = asyncHandler(async(req, res)=> {
    const result = await PaymentMethod.find()
    res.json({message:"all Payment Methods Get Success ", result})
})

exports.disableMethod = asyncHandler(async(req, res)=> {
    const {methodId}= req.params
    const result = await PaymentMethod.findByIdAndUpdate(methodId, {active:false})
    res.json({message:"Method Disabled Success"})
})
exports.enableMethod = asyncHandler(async(req, res)=> {
    const {methodId}= req.params
    const result = await PaymentMethod.findByIdAndUpdate(methodId, {active:true})
    res.json({message:"Method Enabled Success"})
})

// single use only
exports.createTax= asyncHandler(async(req, res)=> {
// const {salesTax,makingCharges,discount}= req.body
await Tax.create(req.body)
res.json({message:"tax Added Success"})
})
exports.updateTax= asyncHandler(async(req, res)=> {
const {taxId}= req.params
await Tax.findByIdAndUpdate(taxId, req.body)
res.json({message:"tax Update Success"})
})
exports.getTax = asyncHandler(async(req, res)=> {
const result = await Tax.find()
res.json({message:"All Taxes and Discount And Charges Fetch Succcess", result})
})

// exports.disableRazorpay = asyncHandler(async(req, res)=> {
//     const {razId}= req.params
//     const result = await PaymentMethod.findByIdAndUpdate(razId, {razorpay:false})
//     res.json({message:"Razorpay Disabled Success"})
// })

exports.getAllProductsAdmin = asyncHandler(async(req, res)=> {
    const result = await Product.find()
    res.json({message:"All Products Get Success For Admin", result})

})


// use nhi karna hai👇
exports.createPaymentMethod = asyncHandler(async(req, res)=> {
    await PaymentMethod.create(req.body)
    res.json({message:"Payment Method Create Success"})
})


// use nhi karna hai👇
exports.addAddress = asyncHandler(async (req, res) => {
    upload(req, res, async (err) => {
    if (err) {
        return res.status(400).json({ message: "File upload failed", error: err.message });
    }
    const { pincode, buildingNo, city, state, country, gst } = req.body;

    const { isError, error } = checkEmpty({ pincode, buildingNo, city, state, country, gst });
    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error });
    }

    const {secure_url} = await cloudinary.uploader.upload(req.files[0].path);
          
        await CompanyAddress.create({
            ...req.body,
            logo: secure_url, 
        });
        res.json({ message: "Address Created Successfully" });
   })

});



exports.updateCompanyAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    upload(req, res, async (err) => {
   
        if (err) {
            return res.status(400).json({ message: "File upload failed", error: err.message });
        }

        let currentLogoUrl 
            const company = await CompanyAddress.findById(id);
            if (!company) {
                return res.status(404).json({ message: "company not found" });
            }
            currentLogoUrl = company.logo;
    

        if (currentLogoUrl) {
            const x = currentLogoUrl.split('/').pop().split('.')[0]; 
            await cloudinary.uploader.destroy(x);
        }

        let secure_url2
        if (req.files[0]) {
                const {secure_url} = await cloudinary.uploader.upload(req.files[0].path);
                secure_url2 = secure_url;  
        }
          await CompanyAddress.findByIdAndUpdate(id, {...req.body,logo: secure_url2});
          res.json({ message: "Company Details updated successfully" });
     
    });
});


exports.getCompanyAddress = asyncHandler(async(req, res)=> {
    const result = await CompanyAddress.find()

    res.json({message:"Company address get Success", result})
})

// exports.addMenuItem = asyncHandler(async (req, res) => {
//     upload2(req, res, async (err) => {
//         if (err) {
//             return res.status(400).json({ message: "File upload failed", error: err.message });
//         }

//         const { menuitem } = req.body; 
//         const newChildren = [];


//         let menuImageFile = req.files.menuImage && req.files.menuImage[0]; 
//         let menuImageUrl = null;

//         if (menuImageFile) {
//             const menuImagePath = menuImageFile.path;
//             const uploadResult = await cloudinary.uploader.upload(menuImagePath);
//             menuImageUrl = uploadResult.secure_url; 
//         }
 

//         for (let i = 0; ; i++) {
//             const childMenuItem = req.body[`children[${i}].menuitem`];
//             const childSubtitle = req.body[`children[${i}].subtitle`];
//             const childLink = req.body[`children[${i}].link`];
//             const childImageFile = req.files[`children[${i}].image`] && req.files[`children[${i}].image`][0];

//             if (!childMenuItem) break;

//         const childImagePath = childImageFile ? childImageFile.path : null;
//         let secure_url = null;
//             if (childImagePath) {
//                 const uploadResult = await cloudinary.uploader.upload(childImagePath);
//                 secure_url = uploadResult.secure_url;
//             }

//             newChildren.push({
//                 menuitem: childMenuItem,
//                 subtitle: childSubtitle,
//                 link: childLink,
//                 image: secure_url 
//             });
//         }

//         const { isError, error } = checkEmpty({ menuitem });
//         if (isError) {
//             return res.status(400).json({ message: "All Fields Required", error });
//         }

//         let existingMenuItem = await Navmenu.findOne({ menuitem });

//         if (existingMenuItem) {
//       const updatedChildren = [...existingMenuItem.children, ...newChildren];
//       existingMenuItem.children = updatedChildren;

//       if (menuImageUrl) {
//           existingMenuItem.menuImage = menuImageUrl;
//       }

//       await existingMenuItem.save();

//       return res.json({ message: "Menu Item updated successfully" });
//         } else {
//             await Navmenu.create({
//                 menuitem,
//                 menuImage: menuImageUrl,
//                 children: newChildren
//             });

//             res.json({ message: "Menu Item created successfully" });
//         }
//     });
// });
// const asyncHandler = require("express-async-handler");
// const cloudinary = require("cloudinary").v2;
// const Navmenu = require("../models/navmenuModel"); // Assuming the path to your model is correct

exports.addMenuItem = asyncHandler(async (req, res) => {
    upload2(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: "File upload failed", error: err.message });
        }

        const { menuitem, header } = req.body;
        const newChildren = [];

        let menuImageFile = req.files.menuImage && req.files.menuImage[0];
        let menuImageUrl = null;

        // Handle menu image upload
        if (menuImageFile) {
            const menuImagePath = menuImageFile.path;
            const uploadResult = await cloudinary.uploader.upload(menuImagePath);
            menuImageUrl = uploadResult.secure_url;
        }

        // Iterate over each child menu item
        for (let i = 0; ; i++) {
            const childMenuItem = req.body[`children[${i}].menuitem`];
            const childLink = req.body[`children[${i}].link`];
            const childBadge = req.body[`children[${i}].badge`];
            const childImageFile = req.files[`children[${i}].image`] && req.files[`children[${i}].image`][0];

            // Break the loop if no more child menu items are found
            if (!childMenuItem) break;

            const childImagePath = childImageFile ? childImageFile.path : null;
            let childImageUrl = null;
            if (childImagePath) {
                const uploadResult = await cloudinary.uploader.upload(childImagePath);
                childImageUrl = uploadResult.secure_url;
            }

            const newGrandChildren = [];
            
            // Handle grandchildren data
            for (let j = 0; ; j++) {
                const grandChildName = req.body[`children[${i}].grandChildren[${j}].name`];
                const grandChildLink = req.body[`children[${i}].grandChildren[${j}].link`];

                if (!grandChildName) break;  // If no more grandchildren, exit the loop

                newGrandChildren.push({
                    name: grandChildName,
                    link: grandChildLink
                });
            }

            // Push the new child menu item along with grandchildren if any
            newChildren.push({
                menuitem: childMenuItem,
                link: childLink,
                badge: childBadge,
                image: childImageUrl,
                grandChildren: newGrandChildren
            });
        }

        // Check for any empty required fields
        const { isError, error } = checkEmpty({ menuitem });
        if (isError) {
            return res.status(400).json({ message: "All Fields Required", error });
        }

        // Check if menu item already exists
        let existingMenuItem = await Navmenu.findOne({ menuitem });
        if (existingMenuItem) {
            // If exists, update the menu item
            const updatedChildren = [...existingMenuItem.children, ...newChildren];
            existingMenuItem.children = updatedChildren;

            if (menuImageUrl) {
                existingMenuItem.menuImage = menuImageUrl;
            }

            if (header) {
                existingMenuItem.header = header;
            }

            await existingMenuItem.save();
            return res.json({ message: "Menu Item updated successfully" });
        } else {
            // If doesn't exist, create a new menu item
            console.log({   menuitem,
                menuImage: menuImageUrl,
                header,  
                children: newChildren});
            
            await Navmenu.create({
                menuitem,
                menuImage: menuImageUrl,
                header,  // Add header if available
                children: newChildren
            });

            res.json({ message: "Menu Item created successfully" });
        }
    });
});





exports.getAllMenuItems = asyncHandler(async(req, res)=> {
    const result = await Navmenu.find()
    res.json({message:"all Menu Items Fetch Success", result})
})

exports.updateMenuItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    upload2(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: "File upload failed", error: err.message });
        }

        try {
            const menuItem = await Navmenu.findById(id);

            if (!menuItem) {
                return res.status(404).json({ message: "Menu item not found" });
            }

            const { menuitem, header } = req.body;
            const updatedChildren = [];
            
            let menuImageFile = req.files.menuImage && req.files.menuImage[0];
            let menuImageUrl = menuItem.menuImage; // Retain the old image if no new image is uploaded

            // Handle menu image update
            if (menuImageFile) {
                // Remove the old menu image if it exists
                if (menuImageUrl) {
                    const publicId = menuImageUrl.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(publicId);
                }
                const uploadResult = await cloudinary.uploader.upload(menuImageFile.path);
                menuImageUrl = uploadResult.secure_url;
            }

            // Iterate over each child menu item from the request body
            for (let i = 0; ; i++) {
                const childMenuItem = req.body[`children[${i}].menuitem`];
                const childLink = req.body[`children[${i}].link`];
                const childBadge = req.body[`children[${i}].badge`];
                const childImageFile = req.files[`children[${i}].image`] && req.files[`children[${i}].image`][0];

                if (!childMenuItem) break; // Stop loop if no more children are present

                let childImageUrl = null;

                if (childImageFile) {
                    const uploadResult = await cloudinary.uploader.upload(childImageFile.path);
                    childImageUrl = uploadResult.secure_url;
                }

                const newGrandChildren = [];
                for (let j = 0; ; j++) {
                    const grandChildName = req.body[`children[${i}].grandChildren[${j}].name`];
                    const grandChildLink = req.body[`children[${i}].grandChildren[${j}].link`];

                    if (!grandChildName) break; // Stop loop if no more grandchildren are present

                    newGrandChildren.push({
                        name: grandChildName,
                        link: grandChildLink,
                    });
                }

                updatedChildren.push({
                    menuitem: childMenuItem,
                    link: childLink,
                    badge: childBadge,
                    image: childImageUrl,
                    grandChildren: newGrandChildren,
                });
            }

            // Update the menu item
            menuItem.menuitem = menuitem || menuItem.menuitem;
            menuItem.header = header || menuItem.header;
            menuItem.menuImage = menuImageUrl;
            menuItem.children = updatedChildren.length > 0 ? updatedChildren : menuItem.children;

            await menuItem.save();

            res.json({ message: "Menu Item updated successfully", updatedData: menuItem });
        } catch (error) {
            res.status(500).json({ message: "Failed to update menu item", error: error.message });
        }
    });
});


exports.addScrollCard = asyncHandler(async(req, res)=> {
    upload(req, res, async err => {
        if (err) {
            return res.status(400).json({ message: "File upload failed", error: err.message });
        }

        const {title,  link, mentorRole}=req.body
// console.log(req.body);

const {isError, error}= checkEmpty({title,  link ,mentorRole})
if(isError){
    return res.status(400).json({message:"All Filds Required", error})
} 
const {secure_url}=await cloudinary.uploader.upload(req.files[0].path)
// console.log(await img);
         await ScrollCards.create({mentorRole, title, link, image:secure_url})

         res.json({message:"ScrollCard Create Sucecss"})
    })

})
exports.getAllScrollCards = asyncHandler(async(req, res)=>{
    const result = await ScrollCards.find()
    res.json({message:"All SScroll Cards Fetch Success", result})
})
exports.updateScrollCard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    upload(req, res, async err => {
        if (err) {
            return res.status(400).json({ message: "File upload failed" });
        }

        const result = await ScrollCards.findOne({_id:id});
        if (!result) {
            return res.status(404).json({ message: "Scroll Card not found" });
        }

        if (result.image) {
            const x = result.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(x);
        }

        let imageNew = result.image; 
        if (req.files[0]) {
            const { secure_url } = await cloudinary.uploader.upload(req.files[0].path);
            imageNew = secure_url;
        }

        await ScrollCards.findByIdAndUpdate(id, { ...req.body, image: imageNew });

        res.json({ message: "Scroll Card Update Success" });
    });
});


exports.deleteScrollCard = asyncHandler(async(req, res)=> {
    const {id}= req.params
    const result = await ScrollCards.findById(id)

    if(result.image){
        const x = result.image.split('/').pop().split('.')[0]; 
        await cloudinary.uploader.destroy(x);
   }
   await ScrollCards.findByIdAndDelete(id)
   res.json({message:"Scroll Card Delete Success"})
   
})
exports.deleteMenuItem = asyncHandler(async (req, res) => {
    const { id, menuId } = req.params;
    const result = await Navmenu.findById(id);
    if (!result) {
        return res.status(408).json({ message: "No Have Menu Item " });
    }
    const childIndex = result.children.findIndex(child => child._id.toString() === menuId);
    if (childIndex === -1) {
        return res.status(414).json({ message: "Child Menu Item not found" });
    }
    result.children.splice(childIndex, 1);
    await result.save();

    res.json({ message: "Child Menu Item deleted successfully" });
});

exports.addImage = asyncHandler(async(req, res)=> {
    upload(req, res, async err => {
        if (err) {
            return res.status(400).json({ message: "File upload failed", error: err.message });
        }
        // console.log(req.files[0]);

        if(!req.files[0]){
            return res.status(501).json({message:"please add image"})
        }

        const {secure_url}=await cloudinary.uploader.upload(req.files[0].path)

        const result = await AddImages.create({image:secure_url})
        res.json({message:"Add Image Create Success"})
    })
})

exports.deleteImage = asyncHandler(async(req, res)=> {
    const {id}=req.params
    const result = await AddImages.findById(id)

    if(result.image){
        const x = result.image.split('/').pop().split('.')[0]; 
        await cloudinary.uploader.destroy(x);
   }
   await AddImages.findByIdAndDelete(id)
   res.json({message:"Image Delete Success"})
})

exports.getAddsImages = asyncHandler(async(req, res)=> {
    const result = await AddImages.find()
    res.json({message:"Adds Images feTCH success", result})
})

exports.getHistory = asyncHandler(async(req, res)=> {
const {uId}=req.params
    const result =await History.find({userId:uId}).populate("userId").populate("productId").populate("ordersId").populate("cartId")
// const result = [{userId:12343}]
    // console.log("result",result);
    
    res.json({message:"history feTCH success", result})
})
exports.getMonthlyAvgIncome = asyncHandler(async (req, res) => {


    // for adding missing months 
    function fillMissingMonths(monthlyIncome, startDate, endDate) {
        const filledIncome = [];
        
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
    
    console.log(year);
    
            const existingEntry = monthlyIncome.find(item => item.year === year && item.month === month);
    
            if (existingEntry) {
                filledIncome.push(existingEntry);
            } else {
                filledIncome.push({
                    year: year,
                    month: month,
                    totalAmount: 0,
                    orderCount: 0
                });
            }
    
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
    
        return filledIncome;
    }
    
    
    


    
        const currentDate = new Date();
        const startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 12);

        const monthlyIncome = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: currentDate } 
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalAmount: { $sum: "$total" }, 
                    orderCount: { $sum: 1 } 
                }
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    totalAmount: 1,
                    orderCount: 1
                }
            },
            {
                $sort: { year: 1, month: 1 } 
            }
        ]);
        

        const monthlyIncomeWithPrevYear = fillMissingMonths(monthlyIncome, startDate, currentDate);

        

        res.json({
            message: "All Monthly Amount Get Success",
            result: monthlyIncomeWithPrevYear
        });
   
});


exports.addView = asyncHandler(async (req, res) => {
    const { type } = req.body;
    
    let result = await MostViewed.findOne({ type });    
    if (!result) {
        result = await MostViewed.create({ type });
        return res.json({ message: "type added successfully"});
    }
    result.views += 1;    
    await result.save();
    
    return res.json({ message:"view updated successfully"});
});

exports.getViews = asyncHandler(async(req, res)=> {
    const result = await MostViewed.find()
    res.json({message:"all Viewed pages get succeess", result})
})


// TODO: purity / material / type CRUD
exports.addPurity = asyncHandler(async (req, res) => {
    const { name } = req.body
    const { error, isError } = checkEmpty({ name })
    if (isError) {
        return res.status(400).json({ message: "Error", error })
    }
    await ProductPurity.create({ name });
    res.json({ message: "Product Purity Create Success" });
})
exports.updatePurity = asyncHandler(async (req, res) => {
    const { name } = req.body
    const { error, isError } = checkEmpty({ name })
    if (isError) {
        return res.status(400).json({ message: "Error", error })
    }
    await ProductPurity.findByIdAndUpdate(req.params.id, { name });
    res.json({ message: "Product Purity Update Success" });
})
exports.deletePurity = asyncHandler(async (req, res) => {
    await ProductPurity.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: "Product Purity Delete Success" });
})
exports.getPurity = asyncHandler(async (req, res) => {
    const result = await ProductPurity.find()
    res.json({ message: "Product Purity fetch Success", result })
})

// material
exports.addMaterial = asyncHandler(async (req, res) => {
    const { name } = req.body
    const { error, isError } = checkEmpty({ name })
    if (isError) {
        return res.status(400).json({ message: "Error", error })
    }
    await ProductMaterial.create({ name });
    res.json({ message: "Product Material Create Success" });
})
exports.updateMaterial = asyncHandler(async (req, res) => {
    const { name } = req.body
    const { error, isError } = checkEmpty({ name })
    if (isError) {
        return res.status(400).json({ message: "Error", error })
    }
    await ProductMaterial.findByIdAndUpdate(req.params.id, { name });
    res.json({ message: "Product Material Update Success" });
})
exports.deleteMaterial = asyncHandler(async (req, res) => {
    await ProductMaterial.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: "Product Material Delete Success" });
})
exports.getMaterial = asyncHandler(async (req, res) => {
    const result = await ProductMaterial.find()
    res.json({ message: "Product Material fetch Success", result })
})

// type
exports.addProductType = asyncHandler(async (req, res) => {
    const { name } = req.body
    const { error, isError } = checkEmpty({ name })
    if (isError) {
        return res.status(400).json({ message: "Error", error })
    }
    await ProductType.create({ name });
    res.json({ message: "Product Type Create Success" });
})
exports.updateProductType = asyncHandler(async (req, res) => {
    const { name } = req.body
    const { error, isError } = checkEmpty({ name })
    if (isError) {
        return res.status(400).json({ message: "Error", error })
    }
    await ProductType.findByIdAndUpdate(req.params.id, { name });
    res.json({ message: "Product Type Update Success" });
})


exports.deleteProductType = asyncHandler(async (req, res) => {
    await ProductType.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: "Product Type Delete Success" });
})


exports.getProductType = asyncHandler(async (req, res) => {
    const result = await ProductType.find()
    res.json({ message: "Product Type fetch Success", result })
})




exports.getProductGeneralSettings = asyncHandler(async (req, res) => {
    const productTypeResult = await ProductType.find({ isDeleted: false })
    const productMaterialResult = await ProductMaterial.find({ isDeleted: false })
    const productPurityResult = await ProductPurity.find({ isDeleted: false })
    res.json({
        message: "Product General Setting fetch Success", result: {
            type: productTypeResult,
            material: productMaterialResult,
            purity: productPurityResult
        }
    })
})