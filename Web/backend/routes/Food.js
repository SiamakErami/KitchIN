"use strict";
// Food.js - Food routes
// Created on: 10/6/2023

// Import required modules
const crypto = require("crypto");
const Account = require("../models/account");
const { Household, Food } = require("../models/household");

// --- Public Functions ---
// Add Food, Remove Food, Update Food

// Add Food Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id
// - kitchen (fridge, freezer, or pantry)
// - food (owner, barcode, image, name, brand, unit, amount, quantity, count, expiration)
async function addFood(req, res) { 

    // Grab the headers
    const email = req.headers["x-from"].toLowerCase();

    // Grab the body
    const household_id = req.body.household_id;
    const kitchen = req.body.kitchen;
    const food = req.body.food; // Unsure about this

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

        // Generate a unique ID
        return generateUniqueID(household_id, kitchen);

    }).then((id) => {

        // Create the food object
        const newFood = new Food({
            food_id: id,
            owner: email ?? "No Owner",
            barcode: food.barcode ?? "No SKU",
            image: food.image ?? "DEFAULT_IMAGE_URL",
            name: food.name,
            brand: food.brand,
            unit: food.unit,
            amount: food.amount,
            quantity: food.quantity,
            count: food.count,
            expiration: food.expiration ?? null
        });

        // Add the food to the household
        switch (kitchen.toLowerCase()) {

            // Add to the fridge
            case "fridge":
                household.fridge.push(newFood);
                break;

            // Add to the freezer
            case "freezer":
                household.freezer.push(newFood);
                break;
            
            // Add to the pantry
            case "pantry":
                household.pantry.push(newFood);
                break;

            // Invalid kitchen
            default:
                return res.status(400).json({ error: "Invalid kitchen" });
            
        }

        // Save the household
        return household.save();

    }).then(() => {

        // Return success
        return res.status(200).json({ message: "Food added successfully" });

    }).catch((err) => {

        // Return error
        return res.status(500).json({ error: err });

    });

}

// Remove Food Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id
// - kitchen (fridge, freezer, or pantry)
// - food (id, owner, barcode, image, name, brand, unit, amount, quantity, count, expiration)
async function removeFood(req, res) {

    //Get the headers
    const email = req.headers["x-from"].toLowerCase();

    // Get the body
    const household_id = req.body.household_id;
    const kitchen = req.body.kitchen;
    const food = req.body.food;

    // Global variables
    let household = null;

    // Check if the household exists
    Account.findById({ household_id: household_id }).then((house) => {

        // Check if the household exists
        if (!household) return res.status(404).json({ error: "Household not found" });

        // Check if the user is in the household
        if (!household.users.includes(email)) return res.status(401).json({ error: "Unauthorized" });

        // Set the household
        household = house;

        // Remove the food from the household
        switch (kitchen.toLowerCase()) {

            // Remove from the fridge
            case "fridge": // imma look up this
                const indexFridge = findFood(household.fridge, food.food_id);
                if (indexFridge > -1) household.fridge.splice(inindexFridgedex, 1);
                break;

            // Remove from the freezer
            case "freezer":
                const indexFreezer = findFood(household.freezer, food.food_id);
                if (indexFreezer > -1) household.freezer.splice(indexFreezer, 1);
                break;
            
            // Remove from the pantry
            case "pantry":
                const indexPantry = findFood(household.pantry, food.food_id);
                if (indexPantry > -1) household.pantry.splice(indexPantry, 1);
                break;

            // Invalid kitchen
            default:
                return res.status(400).json({ error: "Invalid kitchen" });
            
        }

        // Save the household
        return household.save();

    }).then(() => {

        // Return success
        return res.status(200).json({ message: "Food removed successfully" });

    }).catch((err) => {
        
        // Return error
        return res.status(500).json({ error: err });

    });

}

// Update Food Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id
// - kitchen (fridge, freezer, or pantry)
// - food (id, owner, barcode, image, name, brand, unit, amount, quantity, count, expiration)
async function updateFood(req, res) {

    // Get the headers
    const email = req.headers["x-from"].toLowerCase();

    // Get the body
    const household_id = req.body.household_id;
    const kitchen = req.body.kitchen;
    const food = req.body.food;
    
    //Global variables 
    let household = null;

    // Check if the household exists
    Account.findById({ household_id: household_id }).then((house) => {

        // Check if the household exists
        if (!household) return res.status(404).json({ error: "Household not found" });

        // Check if the user is in the household
        if (!household.users.includes(email)) return res.status(401).json({ error: "Unauthorized" });

        // Set the household
        household = house;

        // Update the food in the household
        switch (kitchen.toLowerCase()) {

            // Update the fridge
            case "fridge":
                // Find index of food in fridge array where food.food_id = food.food_id
                const indexFridge = findFood(household.fridge, food.food_id);
                let newFoodFridge = household.fridge[indexFridge];
                newFoodFridge.owner = food.owner ?? newFoodFridge.owner;
                newFoodFridge.barcode = food.barcode ?? newFoodFridge.barcode;
                newFoodFridge.image = food.image ?? newFoodFridge.image;
                newFoodFridge.name = food.name ?? newFoodFridge.name;
                newFoodFridge.brand = food.brand ?? newFoodFridge.brand;
                newFoodFridge.unit = food.unit ?? newFoodFridge.unit;
                newFoodFridge.amount = food.amount ?? newFoodFridge.amount;
                newFoodFridge.quantity = food.quantity ?? newFoodFridge.quantity;
                newFoodFridge.count = food.count ?? newFoodFridge.count;
                newFoodFridge.expiration = food.expiration ?? newFoodFridge.expiration;
                household.fridge[indexFridge] = newFoodFridge;
                break;

            // Update the freezer
            case "freezer":
                const indexFreezer = findFood(household.freezer, food.food_id);
                let newFoodFreezer = household.freezer[indexFreezer];
                newFoodFreezer.owner = food.owner ?? newFoodFreezer.owner;
                newFoodFreezer.barcode = food.barcode ?? newFoodFreezer.barcode;
                newFoodFreezer.image = food.image ?? newFoodFreezer.image;
                newFoodFreezer.name = food.name ?? newFoodFreezer.name;
                newFoodFreezer.brand = food.brand ?? newFoodFreezer.brand;
                newFoodFreezer.unit = food.unit ?? newFoodFreezer.unit;
                newFoodFreezer.amount = food.amount ?? newFoodFreezer.amount;
                newFoodFreezer.quantity = food.quantity ?? newFoodFreezer.quantity;
                newFoodFreezer.count = food.count ?? newFoodFreezer.count;
                newFoodFreezer.expiration = food.expiration ?? newFoodFreezer.expiration;
                household.freezer[indexFreezer] = newFoodFreezer;
                break;
            
            // Update the pantry
            case "pantry":
                const indexPantry = findFood(household.pantry, food.food_id);
                let newFoodPantry = household.pantry[indexPantry];
                newFoodPantry.owner = food.owner ?? newFoodPantry.owner;
                newFoodPantry.barcode = food.barcode ?? newFoodPantry.barcode;
                newFoodPantry.image = food.image ?? newFoodPantry.image;
                newFoodPantry.name = food.name ?? newFoodPantry.name;
                newFoodPantry.brand = food.brand ?? newFoodPantry.brand;
                newFoodPantry.unit = food.unit ?? newFoodPantry.unit;
                newFoodPantry.amount = food.amount ?? newFoodPantry.amount;
                newFoodPantry.quantity = food.quantity ?? newFoodPantry.quantity;
                newFoodPantry.count = food.count ?? newFoodPantry.count;
                newFoodPantry.expiration = food.expiration ?? newFoodPantry.expiration;
                household.pantry[indexPantry] = newFoodPantry;
                break;

            // Invalid kitchen
            default:
                return res.status(400).json({ error: "Invalid kitchen" });
            
        }

        // Save the household
        return household.save();

    }).then(() => {

        // Return success
        return res.status(200).json({ message: "Food updated successfully" });

    }
    ).catch((err) => {

        // Return error
        return res.status(500).json({ error: err });

    });
    
}

// --- Private Functions ---
// Generate Unique ID Function
async function generateUniqueID(household_id, kitchen) {

    // Return a new Promise
    return new Promise((resolve, reject) => {

        // Generate a unique ID
        const id = crypto.randomBytes(16).toString("hex");

        // Check if the ID is unique
        Household.findById({ household_id: id }).then((household) => {

            // Switch based on the kitchen
            switch (kitchen.toLowerCase()) {

                // Check the fridge
                case "fridge":
                    if (household.fridge.includes(id)) resolve(generateUniqueID(household_id, kitchen));
                    break;

                // Check the freezer
                case "freezer":
                    if (household.freezer.includes(id)) resolve(generateUniqueID(household_id, kitchen));
                    break;

                // Check the pantry
                case "pantry":
                    if (household.pantry.includes(id)) resolve(generateUniqueID(household_id, kitchen));
                    break;

                // Invalid kitchen
                default:
                    reject("INVALID_KITCHEN");

            }

            // Return the ID
            resolve(id);

        }).catch((err) => {

            // Return the error
            reject(err);

        });

    });

}

// Find Food Function
async function findFood(food, food_id) {

    // Return a new Promise
    return new Promise((resolve, reject) => {

        // Create for loop
        for (let i = 0; i < food.length; i++) {

            // Check if the food_id matches
            if (food[i].food_id === food_id) {

                // Return the food
                resolve(food[i]);

            }

        }

        // Return an error
        reject("FOOD_NOT_FOUND");

    });

}

// Export functions
module.exports = { addFood, removeFood, updateFood };