"use strict";
// Account.js - Account routes
// Created on: 10/6/2023

// Import required modules
const crypto = require("crypto");
const Account = require("../models/account");
const { generateHash, verifyPassword } = require("../../middleware/Password");
const { uploadMedia } = require("./Media");
const { issueSession } = require("../../middleware/Session");

// --- Public Functions ---

// Sign Up Function
// HEADERS:
// - x-from: Email
// - x-authentication: Password
// BODY:
// - first_name
// - last_name
async function signUp(req, res) {

    // Get headers from request
    const headers = req.headers
    const email = headers["x-from"].toLowerCase();
    const password = headers["x-authentication"];

    // Get parameters from request
    const params = req.body;

    console.log("Request Body: " + JSON.stringify(req.body));
    console.log("Request File: " + JSON.stringify(req.file));

    // Global variables
    let account_id = null;
    let hash = null;
    let salt = null;

    // Check if account exists
    Account.findOne({ email: email }).then((account) => {

        // If account exists
        if (account)
            return res.status(400).json({ message: "Account already exists" });

        // Generate account ID
        return generateAccountID();

    }).then((account_id) => {

        // Set account ID
        account_id = account_id;

        // Hash password
        return generateHash(password);

    }).then(({ hash, salt }) => {

        // Set hash and salt
        hash = hash;
        salt = salt;

        // Upload profile picture to storage
        if (req.file) {
            return uploadMedia(req, res);
        } else {
            return null;
        }

    }).then((profile_picture) => {

        // Create new account object
        const newAccount = new Account({
            account_id: account_id,
            notification_token: params.notification_token,
            profile_picture: profile_picture ? profile_picture : "https://storage.googleapis.com/kitchin-2023.appspot.com/profile_pictures/default.png",
            first_name: params.first_name,
            last_name: params.last_name,
            email: email,
            hash: hash, 
            salt: salt
        });

        // Save the account
        return newAccount.save();

    }).then(() => {

        return issueSession(req, res);

    }).then(({ account_id, cookie }) => {

        // Return success message
        return res.status(200).json({ message: "Account successfully created!", account_id: account_id, cookie: cookie });

    }).catch((err) => {

        // Log error
        console.log("Error Signing Up: " + err)

        // Return error
        return res.status(500).json({ message: "Internal Server Error: " + err });

    });

}

// Sign In Function
// HEADERS:
// - x-from: Email
// - x-authentication: Password
async function signIn(req, res, next) {

    // Get headers from request
    const headers = req.headers
    const email = headers["x-from"].toLowerCase();
    const password = headers["x-authentication"];

    // Global variables
    let account = null;

    // Find account
    Account.findOne({ email: email }).then((account) => {

        // If account does not exist
        if (!account)
            return res.status(400).json({ message: "Account does not exist" });

        // If password does not match
        if (!verifyPassword(password, account.hash, account.salt))
            return res.status(400).json({ message: "Password does not match" });

        // Set account
        account = account;
        
        // Issue session
        return issueSession(req, res);

    }).then(({ account_id, cookie }) => {

        // Add cookie to headers
        req.setHeader("x-bearer", cookie);

        // Set session cookie and notification token
        account.session = cookie;
        account.notification_token = req.body.notification_token;

        // Save account
        return account.save();

    }).then(() => {

        // Return next (load in)
        return next();

    }).catch((err) => {

        // Log error
        console.log("Error Signing In: " + err)

        // Return error
        return res.status(500).json({ message: "Internal Server Error: " + err });

    });

}

// Sign Out Function
// HEADERS:
// - x-from: Email
async function signOut(req, res) {

    // Get headers from request
    const headers = req.headers
    const email = headers["x-from"].toLowerCase();

    // Find account
    Account.findOne({ email: email }).then((account) => {

        // If account does not exist
        if (!account)
            return res.status(400).json({ message: "Account does not exist" });

        // Update session
        account.session = null;

        // Save account
        return account.save();

    }).then(() => {

        // Return success message
        return res.status(200).json({ message: "Account successfully signed out!" });

    }).catch((err) => {

        // Log error
        console.log("Error Signing Out: " + err)

        // Return error
        return res.status(500).json({ message: "Internal Server Error: " + err });

    });

}

// Load In Function
// HEADERS:
// - x-from: Email
async function loadIn(req, res) {

    // Get headers from request
    const headers = req.headers
    const email = headers["x-from"].toLowerCase();

    // Find account
    Account.findOne({ email: email }).then((account) => {

        // If account does not exist
        if (!account)
            return res.status(400).json({ message: "Account does not exist" });

        // Return success message and account info
        return res.status(200).json({ 
            message: "Account successfully loaded in!",
            account_id: account.account_id,
            households: account.households,
            profile_picture: account.profile_picture,
            first_name: account.first_name,
            last_name: account.last_name,
            cookie: account.session
        });

    }).catch((err) => {

        // Log error
        console.log("Error Loading In: " + err)

        // Return error
        return res.status(500).json({ message: "Internal Server Error: " + err });

    });

}

// Update Account Function
// HEADERS:
// - x-from: Email
// BODY: (optional)
// - first_name
// - last_name
// - profile_picture
async function updateAccount(req, res) {

    // Get headers from request
    const headers = req.headers
    const email = headers["x-from"].toLowerCase();

    // Get parameters from request
    const params = req.body;

    // Check parameters not null
    if (!params.first_name && !params.last_name && !req.file)
        return res.status(400).json({ message: "No parameters provided" });

    // Find account
    Account.findOne({ email: email }).then((account) => {

        // If account does not exist
        if (!account)
            return res.status(400).json({ message: "Account does not exist" });

        // Update account
        account.first_name = params.first_name ? params.first_name : account.first_name;
        account.last_name = params.last_name ? params.last_name : account.last_name;
        account.profile_picture = req.file ? uploadMedia(req, res) : account.profile_picture;

        // Save account
        return account.save();

    }).then((updated) => {

        // Return success message
        return res.status(200).json({ message: "Account successfully updated!", profile_picture: updated.profile_picture });

    }).catch((err) => {

        // Log error
        console.log("Error Updating Account: " + err)

        // Return error
        return res.status(500).json({ message: "Internal Server Error: " + err });

    });

}

// Delete Account Function
// HEADERS:
// - x-from: Email
async function deleteAccount(req, res) { // TODO: Delete household if last member

    // Get headers from request
    const headers = req.headers
    const email = headers["x-from"].toLowerCase();

    // Find account
    Account.findOne({ email: email }).then((account) => {

        // If account does not exist
        if (!account)
            return res.status(400).json({ message: "Account does not exist" });

        // Delete account
        return account.delete();

    }).then(() => {

        // Return success message
        return res.status(200).json({ message: "Account successfully deleted!" });

    }).catch((err) => {

        // Log error
        console.log("Error Deleting Account: " + err)

        // Return error
        return res.status(500).json({ message: "Internal Server Error: " + err });

    });

}

// --- Private Functions ---

// Generate Account ID
async function generateAccountID() {

    // Return a new Promise
    return new Promise((resolve, reject) => {

        // Generate account ID
        const account_id = crypto.randomBytes(16).toString("hex");

        // Check if account ID exists
        Account.findOne({ account_id: account_id }).then((account) => {

            // If account exists
            if (account)
                return generateAccountID();

            // Return account ID
            return account_id;

        }).catch((err) => {

            // Log error
            console.log("Error Generating Account ID: " + err);

            // Return error
            return err;

        });

    });

}

// Exporting modules
module.exports = { signUp, signIn, signOut, loadIn, updateAccount, deleteAccount };