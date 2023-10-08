"use strict";
// FoodFacts.js - Open Food Facts API
// Created on: 10/6/2023

// --- Open Food Facts API ---

// Get data from barcode
async function getFromBarcode(req, res) {
  
    // Get barcode from request
    const barcode = req.body.barcode;
  
    // Send GET request to API
    fetch("https://world.openfoodfacts.net/api/v2/product/" + barcode, {
  
      // Set headers
      headers: {
        UserAgent: "KitchIN/1.0.0",
        Accept: "application/json",
      }
  
    }).then((response) => {
  
      // Return response
      return res.status(200).json({ response: response });
  
    }).catch((error) => {
  
      // Return error
      return res.status(500).json({ error: error });
  
    });
  
  }

module.exports = { getFromBarcode };
  