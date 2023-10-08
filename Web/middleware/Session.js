"use strict";
// Session.js - Session Middleware for the application
// Created on: 10/6/2023

// Import required modules
const crypto = require("crypto");
const Account = require("../backend/models/account");

// Issue Session
// HEADERS:
// - x-from: Email
async function issueSession(req, res) {

    // Return a new Promise
    return new Promise((resolve, reject) => {

        // Get headers from request
        const headers = req.headers
        const email = headers["x-from"].toLowerCase();

        // Create session cookie
        const cookie = crypto.randomBytes(75).toString("hex");

        // Find account and update session
        Account.findOneAndUpdate({ email: email }, { session: cookie }).then((account) => {

            // If account does not exist
            if (!account)
                reject("Account does not exist");

            // Return cookie
            resolve({ account_id: account.account_id, cookie: cookie });

        }).catch((err) => {
            reject(err);
        });

    });

}

// Verify Session
// Headers:
// - x-from: email
// - x-authentication: password
// - x-bearer: session
async function verifySession(req, res, next) {

    // Find account
    Account.findOne({ email: req.headers["x-from"].toLowerCase() }).then((account) => {

        // If account does not exist
        if (!account)
            return res.status(400).json({ message: "Account does not exist" });

        // If session does not match
        if (account.session !== req.headers["x-bearer"])
            return res.status(400).json({ message: "Session does not match" });

        // If password does not match
        if (!verifyPassword(req.headers["x-authentication"], account.hash, account.salt))
            return res.status(400).json({ message: "Password does not match" });

        // Return next
        next();

    }).catch((err) => {
        return res.status(400).json({ message: err });
    });

}

// Exporting modules
module.exports = { issueSession, verifySession };