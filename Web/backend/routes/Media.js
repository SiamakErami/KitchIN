"use strict";
// Media.js - Handles media uploads and downloads for the application
// Created on: 10/6/2023

// IMPORTS:
const { Storage } = require("@google-cloud/storage");
const { randomBytes } = require("crypto");

// Set up storage
const storage = new Storage({ projectId: "kitchen-2023" });

// --- Public Functions ---
// Upload Media
// HEADERS:
// - x-from: Email
// BODY:
// - file
// - type (profile_picture, food?)
async function uploadMedia(req, res) {

    // Try/Catch
	try {

		// Get file from request
		req.file = Object.values(req.files)[0];

		// Check if file or type exists
		if (!req.file || !req.body.type) {
			reject("U.1: No file or type provided");
		}
        
		// Check if type is valid
		if (!req.body.type.match(/^(profile_picture|food)$/)) {
			reject("U.2: Invalid type");
		}

		// Check if file is valid
		if (!req.file.mimetype || !req.file.mimetype.match(/^(image\/jpeg|image\/png)$/)) {
			reject("U.3: Invalid file type");
		}

		// Check if file size is valid
		if (req.file.mimetype.match(/^(image\/jpeg|image\/png)$/)) {

			// Check if req.file size is less than 500KB
			if (req.file.size > 500000) {
			    reject("U.4: File size is too large");
			}

		} else {

			// Invald file type
            reject("U.5: Invalid file type");

		}

		// Generate unique file name
		let fileName = null;
		if (req.body.type === "profile_picture") {

			// Set file name to user email
			fileName = req.body.type + "s/" + req.headers["x-from"];

		} else {

			// Loop variable
			let loop = true;

			// Loop until unique file name is generated
			while (loop) {

				// Generate random file name
				fileName = req.body.type + "s/" + randomBytes(16).toString("hex");

				// Check if file name exists
				if (await storage.bucket("kitchen-2023.appspot.com").file(req.body.type + "s/" + fileName).exists() === true)
					fileName = req.body.type + "s/" + randomBytes(16).toString("hex");
				else
					loop = false;

			}

		}

		// Create a new blob in the bucket and upload the file data.
		storage.bucket("kitchen-2023.appspot.com").file(fileName).save(req.file.data, { 
            contentType: req.file.mimetype,
            public: true // CHECK IF THIS WORKS
         }).then(() => {

			// Get route for file
			const route = "https://storage.googleapis.com/kitchen-2023.appspot.com/" + (req.body.type === "profile_picture" ? req.body.type + "s/" + req.headers["x-from"] : req.body.type + "s/" + fileName);

			// Send response
			resolve({ message: "Uploaded the file successfully: " + fileName, url: route });

		}).catch((err) => {
			 reject("U.6: " + err);
		});

	} catch (err) {
		 reject("U.7: " + err);
	}

}

// EXPORTS:
module.exports = { uploadMedia };