// const asyncHandler = require("express-async-handler")
// const Product = require("../../models/Product");
// const upload = require("../../utils/upload");

// exports.addProduct = asyncHandler(async (req, res) => {
//     // console.log(req.body);
    
//     upload(req, res, async err => {
//         if (err) {
//             return res.status(400).json({ message: "File upload failed", error: err.message });
//         }

//         const file = req.files[0];

//         if (!file) {
//             return res.status(400).json({ message: "No file uploaded" });
//         }
//         const files = req.files; 
//         // console.log("Uploaded files:", files);
//         // console.log("req.body:", req.body);

//         // const { secure_url } = await cloudinary.uploader.upload(file.path);
//         const imageUploads = await Promise.all(files.map(file => 
//             cloudinary.uploader.upload(file.path)
//         ));
        
//         const imageUrls = imageUploads.map(upload => upload.secure_url);
        
//         // const { name, mrp, price, discount, height, width, prductWeight, material, productType, desc, purity } = req.body;
//         const { name, varient, material, productType, mainDesc, purity } = req.body;

       
            
        
//         await Product.create({
//             name,
//             varient,
//             // mrp,
//             images: imageUrls,
//             // price,
//             // discount,
//             // height,
//             // width,
//             // prductWeight,
//             material,
//             productType,
//             mainDesc,
//             purity,
//         });

//         res.json({ message: "Product Add Success" });
//     });
// });
// exports.updateProduct = asyncHandler(async (req, res) => {
//     const { pUId } = req.params;

//     const product = await Product.findById(pUId);
//     if (!product) {
//         return res.status(404).json({ message: "Product not found" });
//     }

//     upload(req, res, async err => {
//         if (err) {
//             return res.status(400).json({ message: "File upload failed", error: err.message });
//         }

//         let secure_urls = product.images;
//         let public_ids = product.cloudinary_ids;

//         if (req.files && req.files.length > 0) {
//             if (public_ids && public_ids.length > 0) {
//                 for (const public_id of public_ids) {
//                     await cloudinary.uploader.destroy(public_id);
//                 }
//             }


//             const imageUploads = await Promise.all(
//                 req.files.map(file => cloudinary.uploader.upload(file.path))
//             );

//             secure_urls = imageUploads.map(upload => upload.secure_url);
//             public_ids = imageUploads.map(upload => upload.public_id);
//         }

//         const {
//             name, mrp, price, discount, height, width, prductWeight, material,
//             productType, desc, purity
//         } = req.body;

//         const updatedProduct = await Product.findByIdAndUpdate(
//             pUId,
//             {
//                 name,
//                 mrp,
//                 images: secure_urls,
//                 cloudinary_ids: public_ids,
//                 price,
//                 discount,
//                 height,
//                 width,
//                 prductWeight,
//                 material,
//                 productType,
//                 desc,
//                 purity,
//             },
//             { new: true } 
//         );

//         res.json({ message: "Product updated successfully", updatedProduct });
//     });
// });
// exports.deleteProduct = asyncHandler(async(req, res)=> {
//     const {pDId}= req.params
//     await Product.findByIdAndUpdate(pDId, {isDelete:true})
//     res.json({message:"Product Delete Success"})
// })
// exports.recycleProduct = asyncHandler(async(req, res)=> {
//     const {pId}= req.params
//     await Product.findByIdAndUpdate(pId, {isDelete:false})
//     res.json({message:"Product Recycle Success"})
// })
// exports.permanentDeleteProduct = asyncHandler(async(req, res)=> {
//     const {pId}= req.params
//     await Product.findByIdAndDelete(pId)
//     res.json({message:"Product Permanent Delete Success"})
// })
// exports.getAllProductsAdmin = asyncHandler(async(req, res)=> {
//     const result = await Product.find()
//     res.json({message:"All Products Get Success For Admin", result})

// })
