"use strict";
// Secret.js - GCP Secret Manager Configuration
// Created on: 10/6/2023

// Import required modules
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

// --- Public Functions ---
// (RMS) - Requesting the MongoDB URI from Google Secret Manager
// (CALL) - secret.requestMongoSecret().then((uri) => { }).catch((err) => { });
async function requestMongoSecret() {

	// return process.env.MONGO;

	// Secret Path
	// const name = "projects/kitchen-2023/secrets/mongodb_uri/versions/latest";
	const name = "projects/186114204775/secrets/mongodb_uri/versions/latest";

	// Returning a Promise
	return new Promise((resolve, reject) => {

		// Creating a new Secret Manager Client
		const client = new SecretManagerServiceClient();

		// Accessing the Secret Version
		client.accessSecretVersion({ name: name }).then(([ version ]) => {

			// Fetching the payload
			const payload = version.payload.data.toString();

			// Resolving the Promise
			resolve(payload);
			//resolve(process.env.MONGO);

		}).catch((err) => {
			console.error("RMS.1 - Failed to fetch MongoDB URI from Google Secret Manager due to the following error: " + err);
			reject("RMS.1 - Internal server error");
		});

	});

}

// (RFPK) - Requesting the Firebase Private Key from Google Secret Manager
// (CALL) - secret.requestFirebasePrivateKey().then((key) => { }).catch((err) => { });
async function requestFirebasePrivateKey () {

	// Secret Path
	const name = "projects/186114204775/secrets/auth_firebase/versions/latest";

	// Returning a Promise
	return new Promise((resolve, reject) => {

		// Creating a new Secret Manager Client
		const client = new SecretManagerServiceClient();

		// Accessing the Secret Version
		client.accessSecretVersion({ name: name }).then(([ version ]) => {

			// Fetching the payload (convert to JSON file)
			const payload = JSON.parse(version.payload.data.toString());

			// Resolving the Promise
			resolve(payload);

		}).catch((err) => {
			console.error("RFPK.1 - Failed to fetch Firebase Private Key from Google Secret Manager due to the following error: " + err);
			reject("RFPK.1 - Internal server error");
		});

	});

}

// EXPORTS:
module.exports = { requestMongoSecret, requestFirebasePrivateKey };