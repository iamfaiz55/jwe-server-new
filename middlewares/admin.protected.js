// const jwt = require("jsonwebtoken")


// exports.adminProtected = (req, res, next) => {
//     const { admin } = req.cookies
//     console.log(admin,"cookiee");
    
//     if (!admin) {
//         return res.status(409).json({ message: "Session Expired" })
//     }
//     jwt.verify(admin, process.env.JWT_KEY, (err, decode) => {
//         if (err) {
//             console.log(err)
//             return res.status(406).json({ message: "JWT Error", error: err.message })
//         }
//         req.loggedInadmin = decode.adminId
//         next()
//    })
// }
const adminProtected = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];  // Get the token from Authorization header (Bearer token)

    if (!token) {
        res.status(401).json({ message: "No token provided, access denied!" });
        return; // Stop the function execution after sending the response
    }

    // Verify the token
    jwt.verify(token, "secretKey", (err, decoded) => {
        if (err) {
            res.status(403).json({ message: "Invalid or expired token!" });
            return; // Stop the function execution after sending the response
        }

        // Add the decoded user to the request object
        req.loggedInadmin = decoded.adminId;
        next(); // Proceed to the next middleware or route handler
    });
};

export default adminProtected;