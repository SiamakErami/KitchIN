"use strict";
// Password.js - Password Middleware for the application
// Created on: 10/6/2023

// Import required modules
const crypto = require("crypto");

// Generate hash
function generateHash(password, salt) {

    // Return a new Promise
    return new Promise((resolve, reject) => {

        // Generate salt
        if (!salt)
            salt = crypto.randomBytes(16).toString("hex");

        // Append salt to password
        password = password + "." + salt;

        // Hash password
        const hash = crypto.createHash('sha256', password);

        // Return hash and salt
        resolve({ hash: hash, salt: salt });

    });

}

// Verify password
function verifyPassword(password, hashed, salt) {

    // Return a new Promise
    return new Promise((resolve, reject) => {
    
        // Generate hash
        generateHash(password, salt).then(({ hash: passwordHash, salt: salt }) => {

            // Compare hashes
            resolve(passwordHash === hashed);

        }).catch((err) => {
            reject(err);
        });

    });

}

// Exporting modules
module.exports = { generateHash, verifyPassword };