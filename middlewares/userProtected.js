const jwt = require("jsonwebtoken");
const User = require("../models/User");

// exports.userProtected = async (req, res, next) => {
//     const { user } = req.cookies;
//     console.log("check protected", user);
    
//     if (!user) {
//         return res.status(409).json({ message: "Session Expired Re Login Please" });
//     }

//     jwt.verify(user, process.env.JWT_KEY, async (err, decode) => {
//         if (err) {
//             console.log(err);
//             return res.status(400).json({ message: "JWT Error", error: err.message });
//         }


//             const loggedInUser = await User.findById(decode.userId);

//             if (!loggedInUser) {
//                 return res.status(405).json({ message: "User not found" });
//             }

//             if (loggedInUser.isBlock) {
//                 return res.status(406).json({ message: "You are blocked From Admin" });
//             }
//             console.log("loggedinUser", loggedInUser);
            
//             if (loggedInUser.isDelete === true) {
//                 return res.status(410).json({ message: "Account Is Deactivated" });
//             }

//             req.loggedInUser = loggedInUser._id;
//             next();
  
//     });
// };


exports.userProtected = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Get the token from Authorization header (Bearer token)

        console.log(token);
        if (!token) {
            return res.status(401).json({ message: "No token provided, access denied!" });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_KEY); // Decode the token

        if (!decoded || !decoded.userId) {
            return res.status(403).json({ message: "Invalid or expired token!" });
        }

        // Fetch the user from the database
        const loggedInUser = await User.findById(decoded.userId);

        if (!loggedInUser) {
            return res.status(405).json({ message: "User not found" });
        }

        if (loggedInUser.isBlock) {
            return res.status(406).json({ message: "You are blocked by Admin" });
        }

        if (loggedInUser.isDelete) {
            return res.status(410).json({ message: "Account is deactivated" });
        }

        req.loggedInUser = loggedInUser._id; // Add the user ID to the request object

        // Proceed to the next middleware
        next();
    } catch (error) {
        console.error("Error in userProtected middleware:", error.message);
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(403).json({ message: "Invalid or expired token!" });
        }

        // Handle other potential errors
        res.status(500).json({ message: "Internal server error" });
    }
};
