"use strict";
// Recipe.js - Recipe routes
// Created on: 10/6/2023

// Import required modules
const Account = require("../models/account");
const { Household, Recipe } = require("../models/household");

// --- Public Functions ---

// Add Recipe Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id
// - recipe (image, name, ingredients, instructions)
async function addRecipe(req, res) {

    // Grab the headers
    const email = req.headers["x-from"].toLowerCase();

    // Grab the body
    const household_id = req.body.household_id;
    const recipe = req.body.recipe;

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
        return generateUniqueID(household_id, "recipes");

    }).then((id) => {

        // Create the recipe object
        const newRecipe = new Recipe({
            recipe_id: id,
            who_added: email ?? "No Owner",
            image: recipe.image ?? "DEFAULT_IMAGE_URL",
            name: recipe.name,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
        });

        // Add the recipe to the household
        household.recipes.push(newRecipe);

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

// Remove Recipe Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id
// - recipe_id
async function removeRecipe(req, res) {

    // Grab the headers
    const email = req.headers["x-from"].toLowerCase();

    // Grab the body
    const household_id = req.body.household_id;
    const recipe_id = req.body.recipe_id;

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

        // Find the recipe
        const recipe = household.recipes.find((recipe) => recipe.recipe_id === recipe_id);

        // Check if the recipe exists
        if (!recipe) return res.status(404).json({ error: "Recipe not found" });

        // Remove the recipe from the household
        const index = findRecipe(household.recipes, recipe_id);
        household.recipes = household.recipes.splice(index, 1);

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

// Update Recipe Function
// HEADERS:
// - x-from: Email
// BODY:
// - household_id
// - recipe_id
// - recipe (image, name, ingredients, instructions)
async function updateRecipe(req, res) {

    // Grab the headers
    const email = req.headers["x-from"].toLowerCase();

    // Grab the body
    const household_id = req.body.household_id;
    const recipe_id = req.body.recipe_id;
    const recipe = req.body.recipe;

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

        // Find the recipe
        const oldRecipe = household.recipes.find((recipe) => recipe.recipe_id === recipe_id);

        // Check if the recipe exists
        if (!oldRecipe) return res.status(404).json({ error: "Recipe not found" });

        // Update the recipe

        oldRecipe.image = recipe.image ?? oldRecipe.image;

        oldRecipe.name = recipe.name ?? oldRecipe.name;

        oldRecipe.ingredients = recipe.ingredients ?? oldRecipe.ingredients;

        oldRecipe.instructions = recipe.instructions ?? oldRecipe.instructions;

        // Save the household
        return household.save();
    
    }).then(() => {

        // Return a success
        return res.status(200).json({ success: true });

    }).catch((err) => {

        // Return an error
        return res.status(500).json({ error: err });

    });
    // pull up session chat

}

// --- Private Functions ---
// Generate Unique ID
async function generateUniqueID(household_id, type) {

    // Generate a random ID
    const id = crypto.randomBytes(16).toString("hex");

    // Check if the ID exists
    Household.findById({ household_id: household_id }).then((house) => {

        // Check if the household exists
        if (!household_id) return res.status(404).json({ error: "Household not found" });

        // Check if the ID exists
        if (house.recipes.find((recipe) => recipe.recipe_id === id)) return generateUniqueID(household_id, type);

        // Return the ID
        return id;

    }).catch((err) => {

        // Return an error
        return err;

    });

}

// Find Recipe Function
async function findRecipe(recipes, recipe_id) {

    // For each recipe
    recipes.forEach((recipe) => {

        // Check if the recipe is the one we are looking for
        if (recipe.recipe_id === recipe_id) return recipe;

    });

}

module.exports = { addRecipe, removeRecipe, updateRecipe };
