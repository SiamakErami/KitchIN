"use strict";
// Grocery.js - Grocery routes
// Created on: 10/6/2023

// Import required modules
const Account = require("../models/account");
const { Household, GroceryListItem } = require("../models/household");

//--- Public Functions ---
// Add Grocery List Item, Remove Grocery List Item, Update Grocery List Item

// Add Grocery List Item Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id
// - grocery_list_item (image, name, brand, unit, amount, quantity, count)
async function addGroceryListItem(req, res) { 

    // Grab the headers
    const email = req.headers["x-from"].toLowerCase();

    // Grab the body
    const household_id = req.body.household_id;
    const grocery_list_item = req.body.grocery_list_item;

    // Global variables
    let account = null;
    let household = null;

    // Find user
    Account.findOne({ email: email }).then((user) => {

        // Check if the user exists
        if (!user) return res.status(404).json({ error: "User not found" });

        // Set the account
        account = user;

        // Check if the household exists
        return Household.findById({ household_id: household_id });
            
    }).then((house) => {

        // Check if the household exists
        if (!household) return res.status(404).json({ error: "Household not found" });

        // Check if the user is in the household
        if (!household.users.includes(email)) return res.status(401).json({ error: "Unauthorized" });

        // Set the household
        household = house;

        // Generate a unique ID
        return generateUniqueID(household_id, "grocery_list");

    }).then((id) => {

        // Create the grocery list item object
        const newGroceryListItem = new GroceryListItem({
            grocery_list_item_id: id,
            who_added: account.account_id ?? "No Owner",
            image: grocery_list_item.image ?? "DEFAULT_IMAGE_URL",
            name: grocery_list_item.name,
            brand: grocery_list_item.brand,
            unit: grocery_list_item.unit,
            amount: grocery_list_item.amount,
            quantity: grocery_list_item.quantity,
            count: grocery_list_item.count,
        });

        // Add the grocery list item to the household
        household.grocery_list.push(newGroceryListItem);

        // Save the household
        return household.save();

    }).then(() => {

        // Return a success
        return res.status(200).json({ success: true });

    }).catch((err) => {

        // Return an error
        return res.status(500).json({ error: err });

    });

}

// Remove Grocery List Item Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id
// - grocery_list_item_id    
async function removeGroceryListItem(req, res) {

    // Grab the headers
    const email = req.headers["x-from"].toLowerCase();

    // Grab the body
    const household_id = req.body.household_id;
    const grocery_list_item_id = req.body.grocery_list_item_id;

    // Global variables
    let household = null;

    // Check if the household exists
    Household.findById({ household_id: household_id }).then((house) => {

        // Check if the household exists
        if (!household) return res.status(404).json({ error: "Household not found" });

        // Check if the user is in the household
        if (!household.users.includes(email)) return res.status(401).json({ error: "Unauthorized" });

        // Set the household
        household = house;

        // Remove the grocery list item from the household
        const index = findGrocery(household.grocery_list, grocery_list_item_id);
        household.grocery_list = household.grocery_list.splice(index, 1);

        // Save the household
        return household.save();

    }).then(() => {

        // Return a success
        return res.status(200).json({ success: true });

    }).catch((err) => {

        //Return an error
        return res.status(500).json({ error: err });

    });

}

// Update Grocery List Item Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id
// - grocery_list_item_id
// - grocery_list_item (image, name, brand, unit, amount, quantity, count)
async function updateGroceryListItem(req, res) {

    // Grab the headers
    const email = req.headers["x-from"].toLowerCase();

    // Grab the body
    const household_id = req.body.household_id;
    const grocery_list_item_id = req.body.grocery_list_item_id;
    const grocery_list_item = req.body.grocery_list_item;

    // Global variables
    let household = null;

    // Check if the household exists
    Household.findById({ household_id: household_id }).then((house) => {

        // Check if the household exists
        if (!household) return res.status(404).json({ error: "Household not found" });

        // Check if the user is in the household
        if (!household.users.includes(email)) return res.status(401).json({ error: "Unauthorized" });

        // Set the household
        household = house;

        // Find the grocery list item
        const index = findGrocery(household.grocery_list, grocery_list_item_id);
        const item = household.grocery_list[index];

        // Update the grocery list item
        item.image = grocery_list_item.image ?? item.image;
        item.name = grocery_list_item.name ?? item.name;
        item.brand = grocery_list_item.brand ?? item.brand;
        item.unit = grocery_list_item.unit ?? item.unit;
        item.amount = grocery_list_item.amount ?? item.amount;
        item.quantity = grocery_list_item.quantity ?? item.quantity;
        item.count = grocery_list_item.count ?? item.count;

        // Save the household
        return household.save();

    }).then(() => {

        // Return a success
        return res.status(200).json({ success: true });

    }).catch((err) => {

        // Return an error
        return res.status(500).json({ error: err });

    });

}

//--- Private Functions ---

// Generate Unique ID Function
// Parameters:
// - household_id: Household ID
// - type: Type of ID (grocery_list)
async function generateUniqueID(household_id, type) {

    // Generate a random ID
    const id = crypto.randomBytes(16).toString("hex");

    // Check if the ID exists
    Household.findById({ household_id: household_id }).then((house) => {

        // Check if the household exists
        if (!house) return res.status(404).json({ error: "Household not found" });

        // Check if the ID exists
        if (type === "grocery_list") {

            // Find the grocery list item
            const grocery_list_item = household_id.grocery_list.find((item) => item.grocery_list_item_id === id);

            // Check if the grocery list item exists
            if (grocery_list_item) return generateUniqueID(household_id, type);

        } else {
                
            // Return an error
            return res.status(500).json({ error: "Invalid type" });

        }

        // Return the ID
        return id;

    }).catch((err) => {

        // Return an error
        return res.status(500).json({ error: err });

    });

}

// Find Grocery Function
async function findGrocery(grocery_list, grocery_list_item_id) {

    // Return a new Promise
    return new Promise((resolve, reject) => {

        // Create for loop
        for (let i = 0; i < grocery_list.length; i++) {

            // Check if the grocery list item ID matches
            if (grocery_list[i].grocery_list_item_id === grocery_list_item_id) {

                // Resolve the promise
                resolve(i);

            }

        }

        // Reject the promise
        reject("Grocery list item not found");

    });

}
// 
// Export the functions
module.exports = { addGroceryListItem, removeGroceryListItem, updateGroceryListItem }; 
