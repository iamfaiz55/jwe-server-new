    const asyncHandler = require("express-async-handler")
    const jwt = require("jsonwebtoken")
    const { checkEmpty } = require("../utils/checkEmpty")
    const User = require("../models/User");
    const History = require("../models/History");
    const mongoose  = require("mongoose");
    const bcrypt = require("bcryptjs")

    const crypto = require("crypto");
    const sendSms = require("../utils/sendSms");


    exports.registerUser = asyncHandler(async (req, res) => {
        const { email, password, name } = req.body;
    
        // Validate if all required fields are provided
        const { isError, error } = checkEmpty({ email, password, name });
        if (isError) {
            return res.status(400).json({ message: "All Fields are required", error });
        }
    
        // Check if the user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists with this email" });
        }
    
        // Hash the password before saving the user
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // Create a new user instance
        user = new User({
            name,
            email,
            password: hashedPassword
        });
    
        // Save the user to the database
        await user.save();
    
        // Send a success response with the user data (excluding password)
        res.status(201).json({
            message: "User registered successfully",
            result: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });
    });
    
    exports.loginUser = asyncHandler(async (req, res) => {
        const { email, password } = req.body;
    
        // Validate if all required fields are provided
        const { isError, error } = checkEmpty({ email, password });
        if (isError) {
            return res.status(400).json({ message: "All Fields are required", error });
        }
    
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
    console.log("userrrr", user);
    
        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
    
        // Generate a JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, { expiresIn: "1d" });
    
        // Send the token as a cookie
        // res.cookie("user", token, {
        //     maxAge: 86400000, // 1 day
        //     httpOnly: true
        // });
    
        // Send a success response with user data (excluding password)
        res.json({
            message: "Login successful",
            result: {
                mobile:user.mobile,
        _id:user._id,
        name:user && user.name && user.name ,
        email:user && user.email && user.email ,
        image:user && user.image && user.image,

                token
            }
        });
    });
  



    // const asyncHandler = require("express-async-handler");

    exports.logoutUser = asyncHandler(async (req, res) => {
        // Clear the user JWT cookie to log the user out
        res.clearCookie("user");
    
        res.json({ message: "User logged out successfully" });
    });
    