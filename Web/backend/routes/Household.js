"use strict";
// Household.js - Household routes
// Created on: 10/6/2023

// Import required modules
const crypto = require("crypto");
const Account = require("../models/account");
const { Household } = require("../models/household");

// --- Public Functions ---
// Create Household Function
// HEADERS:
// - x-from: Email
// BODY:
// - name: String
async function createHousehold(req, res) {

    // Grab the headers
    const email = req.headers["x-from"].toLowerCase();

    // Grab the body
    const name = req.body.name;

    // Global Variables
    let user = null;
    let household_id = null;
    let household_code = null;

    // Check if account exists
    Account.findOne({ email: email }).then((account) => {

        if (!account) return res.status(400).json({ message: "Account does not exist" });

        // Set user
        user = account;

        // Generate household_id
        return generateHouseholdID();

    }).then((id) => {

        // Set household_id
        household_id = id;

        // Generate 6 digit code
        return generateHouseholdCode();

    }).then((code) => {

        // Set household_code
        household_code = code;

        const newHouse = new Household({
            household_id: household_id,
            household_name: name,
            household_code: household_code,
            admin: user.account_id,
            members: [user.account_id],
            kitchen: {
                fridge: [],
                freezer: [],
                pantry: [],
            },
            grocery_list: [],
            recipes: [],
        });

        // Save Household Object
        return newHouse.save();

    }).then(() => {

        // Save household_id to account
        user.households.push(household_id);
        return user.save();
        
    }).then(() => {

        // Return Household Object
        return res.status(200).json({ message: "Household created successfully", household_id: household_id, household_code: household_code });

    }).catch((err) => {

        return res.status(500).json({ message: "Internal server error: " + err });

    });

}

// Join Household Function
// HEADERS:
// - x-from: Email
// BODY:
// - code: String
async function joinHousehold(req, res) {

    // Grab the headers
    const email = req.headers["x-from"].toLowerCase();

    // Grab the body
    const code = req.body.code;

    // Global Variables
    let user = null;
    let house = null;
    
    // Check if account exists
    Account.findOne({ email: email }).then((account) => {

        if (!account) return res.status(400).json({ message: "Account does not exist" });

        // Set user
        user = account;

        // Find Household with code
        return Household.findOne({ household_code: code });

    }).then((household) => {

        if (!household) return res.status(400).json({ message: "Household does not exist" });

        // Update Household Object
        household.members.push(user.account_id);

        // Set and save household
        house = household;
        return household.save();

    }).then((household) => {

        // Save household_id to account
        user.households.push(house.household_id);

        // Save account
        return user.save();

    }).then((account) => {

        // Return Household Object
        return res.status(200).json({ message: "Household joined successfully", household_id: house.household_id });

    }).catch((err) => {

        return res.status(500).json({ message: "Internal server error: " + err });

    });

}

// Fetch Household Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id: String
async function fetchHousehold(req, res) {

    // 1) Find Household with household_id
    // 2) Return Household Object

    // Grab the headers
    const email = req.headers["x-from"].toLowerCase();

    // Grab the body
    const household_id = req.body.household_id;

    // Global Variables
    let user = null;

    // Check if account exists
    Account.findOne({ email: email }).then((account) => {

        if (!account) return res.status(400).json({ message: "Account does not exist" });

        // Check if household_id is in account
        if (!account.households.includes(household_id)) return res.status(400).json({ message: "Household does not exist" });

        // Set user
        user = account;

        // Find Household with household_id
        return Household.findOne({ household_id: household_id });

    }).then((house) => {

        if (!house) return res.status(400).json({ message: "Household does not exist" });

        // Check if user is in household
        if (!house.members.includes(user.account_id)) return res.status(400).json({ message: "User is not in household" });

        // Return Household Object
        return res.status(200).json({
            message: "Household fetched successfully",
            household_name: house.household_name,
            members: house.members,
            kitchen: house.kitchen,
            grocery_list: house.grocery_list,
            recipes: house.recipes,
        });

    }).catch((err) => {

        return res.status(500).json({ message: "Internal server error: " + err });

    });

}

// Update Household Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id: String
// - name: String
// - members: [String]
async function updateHousehold(req, res) {

    // Get headers
    const email = req.headers["x-from"].toLowerCase();

    // Get body
    const household_id = req.body.household_id;

    // Global Variables
    let user = null;

    // Check if account exists
    Account.findOne({ email: email }).then((account) => {

        if (!account) return res.status(400).json({ message: "Account does not exist" });

        // Make sure household_id is in account
        if (!account.households.includes(household_id)) return res.status(400).json({ message: "Household does not exist" });

        // Set user
        user = account;

        // Find Household with household_id
        return Household.findOne({ household_id: household_id });

    }).then((house) => {

        if (!house) return res.status(400).json({ message: "Household does not exist" });

        // Check if user is in household and is admin
        if (!house.members.includes(user.account_id) || house.admin != user.account_id) return res.status(400).json({ message: "User is not in household or is not admin" });
        
        // Update Household Object
        house.household_name = req.body.name ?? house.household_name;
        house.members = req.body.members ?? house.members;

        // Save Household Object
        return house.save();

    }).then((household) => {

        // Return Household Object
        return res.status(200).json({ message: "Household updated successfully" });

    }).catch((err) => {

        return res.status(500).json({ message: "Internal server error: " + err });

    });

}

// Leave Household Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id: String
async function leaveHousehold(req, res) {

    //Get headers

    const email = req.headers["x-from"].toLowerCase();

    // Get body
    const household_id = req.body.household_id;

    // Global Variables
    let user = null;

    // Check if account exists
    Account.findOne({ email: email }).then((account) => {

        if (!account) return res.status(400).json({ message: "Account does not exist" });

        // Make sure household_id is in account
        if (!account.households.includes(household_id)) return res.status(400).json({ message: "Household does not exist" });

        // Set user
        user = account;

        // Find Household with household_id
        return Household.findOne({ household_id: household_id });

    }).then((house) => {
        
        if (!house) return res.status(400).json({ message: "Household does not exist" });

        // Check if user is in household
        if (!house.members.includes(user.account_id)) return res.status(400).json({ message: "User is not in household" });

        // Update Household Object
        house.members = house.members.filter((member) => member != user.account_id); // Check if this works

        // Save and set Household Object
        return house.save();
    
    }).then(() => {
            
        // Save household_id to account
        user.households = user.households.filter((household) => household != household_id);

        // Save account
        return user.save();
    
    }).then(() => {
                
        // Return Household Object
        return res.status(200).json({ message: "Household left successfully" });
        
    }).catch((err) => {
            
        return res.status(500).json({ message: "Internal server error: " + err });

    });

}

// Delete Household Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id: String
async function deleteHousehold(req, res) {

    // Get headers
    const email = req.headers["x-from"].toLowerCase();

    // Get body
    const household_id = req.body.household_id;

    // Global Variables
    let user = null;

    // Check if account exists
    Account.findOne({ email: email }).then((account) => {

        if (!account) return res.status(400).json({ message: "Account does not exist" });

        // Make sure household_id is in account
        if (!account.households.includes(household_id)) return res.status(400).json({ message: "Household does not exist" });

        // Set user
        user = account;

        // Find Household with household_id
        return Household.findOne({ household_id: household_id });

    }).then((house) => {

        if (!house) return res.status(400).json({ message: "Household does not exist" });

        // Check if user is in household and is admin
        if (!house.members.includes(user.account_id) || house.admin != user.account_id) return res.status(400).json({ message: "User is not in household or is not admin" });

        // Delete Household Object
        return house.deleteOne();

    }).then(() => {

        // Save household_id to account
        user.households = user.households.filter((household) => household != household_id);

        // Save account
        return user.save();

    }).then(() => {

        // Return Household Object
        return res.status(200).json({ message: "Household deleted successfully" });

    }).catch((err) => {

        return res.status(500).json({ message: "Internal server error: " + err });

    });

}

// --- Private Functions ---
// Generate Household ID Function
async function generateHouseholdID() {

    // Return a new Promise
    return new Promise((resolve, reject) => {

        // Generate 6 digit code
        const code = crypto.randomBytes(6).toString("hex").toUpperCase();

        // Check if code is unique
        Household.findOne({ household_id: code }).then((household) => {

            if (!household) return resolve(code);

            return generateHouseholdID();

        });

    });

}

// Generate Household Code Function
async function generateHouseholdCode() {

    // Return a new Promise
    return new Promise((resolve, reject) => {

        // Generate 6 digit code
        const code = crypto.randomBytes(3).toString("hex").toUpperCase();

        // Check if code is unique
        Household.findOne({ household_code: code }).then((household) => {

            if (!household) return resolve(code);

            return generateHouseholdCode();

        });

    });

}

// Exporting functionsge
module.exports = { createHousehold, joinHousehold, fetchHousehold, updateHousehold, leaveHousehold, deleteHousehold };