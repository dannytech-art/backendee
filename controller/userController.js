const { User } = require('../models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

exports.SignupUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Always lowercase the email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token (6-digit OTP)
    const verificationToken = crypto.randomInt(100000, 999999);

    // Create user
    const createUser = await User.create({
      fullName,
      email: normalizedEmail, // always save in lowercase
      password: hashedPassword,
      verificationToken,
      verifiedAt: null
    });

    res.status(201).json({
      message: 'User created successfully. Please check your email to verify your account.',
      user: {
        id: createUser.id,
        fullName: createUser.fullName,
        email: createUser.email,
      }
    });

    // 🚀 TODO: Send verificationToken via email service

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error?.errors?.[0]?.message || error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await User.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullName, email } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email) user.email = email.toLowerCase().trim(); // normalize
    if (fullName) user.fullName = fullName;

    await user.save();

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password", "verificationToken"] } // hide sensitive info
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password", "verificationToken"] }
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

