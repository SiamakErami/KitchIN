"use strict";
// Database.js - MongoDB Database Connection
// Created on: 10/6/2023



// Import required modules
const mongoose = require("mongoose"), Admin = mongoose.mongo.Admin;

// Connect to MongoDB
// BODY:
// - uri
// - database
async function connectDB(uri, database) {

	try {

		mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, dbName: process.env.NODE_ENV == "production" ? "prod" : "test" }); // dbName will override current connection in MongoDB URI

		mongoose.connection.on("error", (err) => {
			console.log("Mongoose Connection Error: " + err);
		});

		// Log the connection state
		mongoose.connection.on("connected", () => {

			// Log the database
			if (database) {
				console.log("DATABASE DETECTED");
				console.log("Successfully Connected to MongoDB '" + database + "' Database.");
			}
			else {
				console.log("NO DATABASE ");
				console.log("Successfully Connected to MongoDB. No Database Specified.");
			}

			// Log the connection name
			console.log("Connection Name: " + mongoose.connection.name);

			// Log the connection state
			console.log("Connection State: " + mongoose.connection.readyState);

			return true;

		});

	} catch (error) {
		synapseError("CDB.1", 500, error, "Failed to connect to MongoDB", null, null, true);
	}

}

// Export the module
module.exports = { connectDB };