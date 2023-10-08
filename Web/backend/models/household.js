"use strict";
// household.js - Household model
// Created on: 10/6/2023

// Import required modules
const mongoose = require("mongoose");

// Food Object
const Food = {
    food_id: { type: String, required: true }, // Unique ID
    owner: { type: String, required: false }, // Link to account model, owner of food item (claiming)
    barcode: { type: String, required: false }, // Barcode
    type: { type: String, required: true }, // Type (ex: "ingredients", "spices", "leftovers", etc.
    image: { type: String, required: true }, // Image URL
    name: { type: String, required: true }, // Name
    brand: { type: String, required: true }, // Brand
    unit: { type: String, required: true }, // Unit (ex: "oz", "lbs", "g", "kg", "mL", "L")
    amount: { type: Number, required: true }, // Unit amount (ex: 1, 2, 3, 4, 5, etc.)
    count: { type: Number, required: true }, // Count (ex: 1, 2, 3, 4, 5, etc.)
    expiration: { type: Date, required: false }, // Expiration date
    modified: { type: Date, default: Date.now(), required: true }, // Date added/modified
};

// Grocery List Object
const GroceryListItem = {
    grocery_list_item_id: { type: String, required: true }, // Unique ID
    who_added: { type: String, required: true }, // Link to account model, who added the item
    image: { type: String, required: true }, // Image URL
    name: { type: String, required: true }, // Name
    brand: { type: String, required: true }, // Brand
    unit: { type: String, required: true }, // Unit (ex: "oz", "lbs", "g", "kg", "mL", "L")
    amount: { type: Number, required: true }, // Unit amount (ex: 1, 2, 3, 4, 5, etc.)
    count: { type: Number, required: true }, // Count (ex: 1, 2, 3, 4, 5, etc.)
    modified: { type: Date, default: Date.now(), required: true }, // Date added/modified
    is_checked: { type: Boolean, default: false, required: true }, // Is checked off
};

// Recipe Object
const Recipe = {
    recipe_id: { type: String, required: true }, // Unique ID
    who_added: { type: String, required: true }, // Link to account model, who added the item
    image: { type: String, required: true }, // Image URL
    name: { type: String, required: true }, // Name of recipe
    time: { type: Number, required: true }, // Time to make recipe (in seconds)
    ingredients: { type: [String], default: [], required: true }, // List of ingredients
    modified: { type: Date, default: Date.now(), required: true }, // Date added/modified
};

// Define schema
const HouseholdSchema = new mongoose.Schema({
    household_id: { type: String, required: true }, // Unique ID
    household_name: { type: String, required: true }, // Household name
    household_code: { type: String, required: true }, // Public facing code to join
    admin: { type: String, required: true }, // Link to account model
    members: { type: [String], default: [], required: true }, // Link to account model
    kitchen: {
        type: {
            fridge: { type: [Food], default: [], required: true }, // List of food items (barcodes)
            freezer: { type: [Food], default: [], required: true }, // List of food items (barcodes)
            pantry: { type: [Food], default: [], required: true }, // List of food items (barcodes)
        },
        required: true
    },
    grocery_list: { type: [GroceryListItem], default: [], required: true }, // List of grocery list items
    recipes: { type: [Recipe], default: [], required: true }, // List of recipes (by ChatGPT)
    created_at: { type: Date, default: Date.now(), required: true }, // Date created
}, { collection: "households" }, { _id: false });

// Set unique fields
HouseholdSchema.index({ household_id: 1 }, { unique: true });

// Export model
module.exports = { Household: mongoose.model("Household", HouseholdSchema), Food: Food, GroceryListItem: GroceryListItem, Recipe: Recipe };