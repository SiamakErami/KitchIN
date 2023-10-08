"use strict";
// account.js - Account model
// Created on: 10/6/2023

// Import required modules
const mongoose = require("mongoose");

// Define schema
const AccountSchema = new mongoose.Schema({
    account_id: { type: String, required: true }, // Unique ID
    households: { type: [String], default: [], required: true }, // Households - array of household IDs
    notification_token: { type: String, required: false }, // Notification token
    profile_picture: { type: String, default: "https://storage.googleapis.com/kitchin-2023.appspot.com/profile_pictures/default.png", required: true }, // Profile picture - link to image in storage
    first_name: { type: String, required: true }, // First name
    last_name: { type: String, required: true }, // Last name
    email: { type: String, required: true }, // Email
    hash: { type: String, required: false }, // Hash
    salt: { type: String, required: false }, // Salt
    session: { type: String, required: true }, // Session Cookie
    created_at: { type: Date, default: Date.now(), required: true }, // Date created
    last_modified: { type: Date, default: Date.now(), required: true }, // Date modified
}, { collection: "accounts" }, { _id: false });

// Set unique fields
AccountSchema.index({ account_id: 1, email: 1 }, { unique: true });

// Export model
module.exports = mongoose.model("Account", AccountSchema);