const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

dotenv.config();

const registerValidators = [
  body("companyName").trim().notEmpty().withMessage("Company name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("gstin").optional().isString().withMessage("GSTIN must be a string"),
  body("address").notEmpty().withMessage("Address is required"),
  body("pincode").isNumeric().withMessage("Pincode must be a number").toInt(),
];

const loginValidators = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isString().withMessage("Password is required"),
];

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyName, gstin, email, password, address, pincode } = req.body;
    
    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = await User.create({ 
      companyName, 
      gstin, 
      email, 
      password: hashed, 
      address,
      pincode: Number(pincode) // Ensure pincode is a number
    });

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "yogesh123",
      { expiresIn: "7d" }
    );

    // Return response without password
    res.status(201).json({
      token,
      user: { 
        id: user._id, 
        companyName: user.companyName, 
        gstin: user.gstin, 
        email: user.email,
        address: user.address,
        pincode: user.pincode
      },
    });
  } catch (e) {
    next(e);
  }
}

// Add your login function here
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "yogesh123",
      { expiresIn: "7d" }
    );

    // Return response without password
    res.json({
      token,
      user: { 
        id: user._id, 
        companyName: user.companyName, 
        gstin: user.gstin, 
        email: user.email,
        address: user.address,
        pincode: user.pincode
      },
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  registerValidators,
  loginValidators,
  register,
  login
};