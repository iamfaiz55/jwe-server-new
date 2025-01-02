const Order = require("../../models/Order");
const Product = require("../../models/Product");
const User = require("../../models/User");
const asyncHandler = require("express-async-handler")

//controller
exports.getProductsCountByMaterial = async (req, res) => {
    try {
        const result = await Product.aggregate([
            {
                $group: {
                    _id: "$material",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    material: "$_id",
                    count: 1
                }
            }
        ]);


        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error during aggregation:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching product counts',
            error: error.message,
        });
    }
};

exports.getUserStatics = asyncHandler(async (req, res) => {
    const date30DaysAgo = new Date();
    date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
    console.log("Date 30 Days Ago: ", date30DaysAgo);

    try {
        const result = await User.aggregate([
            {
                $facet: {
                    totalUsers: [{ $count: "count" }],
                    deletedUsers: [
                        { $match: { isDeleted: true } },
                        { $count: "count" }
                    ],
                    blockedUsers: [
                        { $match: { isBlock: true } },
                        { $count: "count" }
                    ],
                    usersLoggedInLast30Days: [
                        { $match: { lastLogin: { $gte: date30DaysAgo }, isDeleted: false } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        console.log("Aggregation Result: ", result);

        const totalUsers = result[0].totalUsers[0]?.count || 0;
        const deletedUsers = result[0].deletedUsers[0]?.count || 0;
        const blockedUsers = result[0].blockedUsers[0]?.count || 0;
        const usersLoggedInLast30Days = result[0].usersLoggedInLast30Days[0]?.count || 0;

        res.json({
            message: "User statistics fetched successfully",
            totalUsers,
            deletedUsers,
            blockedUsers,
            usersLoggedInLast30Days
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch user statistics" });
    }
});

exports.getAllOrdersOnStat = asyncHandler(async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const orders = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${year + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    orderCount: { $sum: 1 },
                    totalRevenue: { $sum: "$total" }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);


        const months = [
            { month: 'January', orderCount: 0, totalRevenue: 0 },
            { month: 'February', orderCount: 0, totalRevenue: 0 },
            { month: 'March', orderCount: 0, totalRevenue: 0 },
            { month: 'April', orderCount: 0, totalRevenue: 0 },
            { month: 'May', orderCount: 0, totalRevenue: 0 },
            { month: 'June', orderCount: 0, totalRevenue: 0 },
            { month: 'July', orderCount: 0, totalRevenue: 0 },
            { month: 'August', orderCount: 0, totalRevenue: 0 },
            { month: 'September', orderCount: 0, totalRevenue: 0 },
            { month: 'October', orderCount: 0, totalRevenue: 0 },
            { month: 'November', orderCount: 0, totalRevenue: 0 },
            { month: 'December', orderCount: 0, totalRevenue: 0 }
        ];


        orders.forEach(order => {
            months[order._id - 1].orderCount = order.orderCount;
            months[order._id - 1].totalRevenue = order.totalRevenue;
        });


        const monthsWithData = months.filter(month => month.orderCount > 0);
        const hasData = monthsWithData.length > 0;

        res.json({
            message: "Monthly order count and revenue fetch success",
            hasData,
            monthsWithData,
            orders: months
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching monthly order data", error });
    }
});


//api

// getUserStatics: builder.query({
//     query: pData => {
//         return {
//             url: "/user/statistics",
//             method: "GET",

//         }
//     },

//     providesTags: ["admin"]
// }),
//     getAllOrders: builder.query({
//         query: pData => {
//             return {
//                 url: "/all-orders",
//                 method: "GET",

//             }
//         },

//         providesTags: ["admin"]
//     }),


//         getProductsCountByMaterial: builder.query({
//             query: pData => {
//                 return {
//                     url: "/products/count-by-material",
//                     method: "GET",

//                 }
//             },
//             transformResponse: data => data.data,
//             providesTags: ["admin"]
//         }),

// //route

// .get("/all-orders", adminController.getAllOrders),
// .get('/products/count-by-material', adminController.getProductsCountByMaterial)
//                 .get('/user/statistics', adminController.getUserStatics)