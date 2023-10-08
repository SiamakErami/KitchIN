"use strict";
// server.js - Node.js entry point
// Created on: 10/6/2023

// Import required modules
require("dotenv").config(); // Environment Variables
const os = require("os"); // Operating System
const express = require("express"); // Express for HTTP requests
const cookieParser = require("cookie-parser"); // Cookie Parser for cookies
const expressFileUpload = require("express-fileupload"); // Express File Upload for file uploads
const cors = require("cors"); // CORS for Cross-Origin Resource Sharing
const hpp = require("hpp"); // HPP for HTTP Parameter Pollution
const path = require("path"); // Path for file paths
const helmet = require("helmet"); // Helmet for security
const bodyParser = require("body-parser"); // Body Parser for parsing request bodies
const multer = require("multer"); // Multer for parsing multipart/form-data

// Custom Modules
const { requestMongoSecret, requestFirebasePrivateKey } = require("./backend/config/Secret");
const { connectDB } = require("./backend/config/Database");
// const { generateSitemap } = require("./middleware/Sitemap"); // <-- Maybe add?

/*
        "@tensorflow/tfjs": "^4.11.0",
        "@tensorflow/tfjs-node": "^4.11.0",
*/

// SERVER SETUP:
const backend = path.join(__dirname, "/backend"); // backend folder
const frontend = path.join(__dirname, "/frontend"); // frontend folder
const middleware = path.join(__dirname, "/middleware"); // middleware folder
const app = express(); // create express app
app.set("views", path.join(__dirname, "frontend/views")); // set the views directory
app.set("view engine", "ejs"); // set the view engine to ejs
app.set("trust proxy", 2); // set to true to get the client's IP address
app.use(express.static(frontend)); // include frontend folder
app.use(express.static(backend)); // include backend folder
app.use(express.static(middleware)); // include middleware folder
app.use(express.json()); // parse the request body as JSON
app.use(express.urlencoded({ extended: true })); // parse the request body as url encoded data
app.use(bodyParser.json({ limit: "50mb" })); // parse the request body as JSON limited to 50mb
app.use(expressFileUpload()); // parse the request body as multipart/form-data
app.use(cookieParser()); // parse cookies
app.use(cors({ origin: process.env.NODE_ENV == "development" ? ["https://www.kitchenkinnekt.com" || "https://kitchenkinnekt.com"] : "*" })); // enable CORS
app.use(hpp()); // enable HPP
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true })); // sets Strict-Transport-Security header to max-age=31536000 (1 year), includeSubDomains, and preload (for HTTPS)
app.use(helmet.frameguard({ action: "deny" })); // sets X-Frame-Options header to deny (for frames and iframes)
app.use(helmet.xssFilter()); // sets X-XSS-Protection header to 0; mode=block (for cross-site scripting)
app.use(helmet.noSniff()); // sets X-Content-Type-Options header to nosniff (for MIME types)
app.use(helmet.ieNoOpen()); // sets X-Download-Options header to noopen (for IE8+)
app.use(helmet.xPoweredBy({ setTo: "Nenya" })); // sets X-Powered-By header to Nenya (Business, lol)

let multerMiddleware = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 20 * 1024 * 1024, // 5 MB
	},
});

// let fileUploadMiddleware = multerMiddleware.single("file");

// app.use(fileUploadMiddleware);

// Frontend Routes:
// (/) - Index
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/about", (req, res) => {
    res.render("about");
});

// Backend Routes:
const { verifySession } = require("./middleware/Session");

// API Routes
const GPTIntegration = require('./backend/integrations/GPT');
const FoodFacts = require('./backend/integrations/FoodFacts');
app.post("/api/v1/process", (req, res) => {
    return GPTIntegration.processGPT(req, res);
});



app.post("/api/v1/barcode", (req, res) => {
    return FoodFacts.getFromBarcode(req, res);
});

// Account Routes
const { signUp, signIn, signOut, loadIn, updateAccount, deleteAccount } = require("./backend/routes/Account");
app.post("/api/v1/account/signup", (req, res) => {
	return signUp(req, res);
});

app.post("/api/v1/account/signin", (req, res) => {
	return signIn(req, res);
});

app.post("/api/v1/account/signout", verifySession, (req, res) => {
	return signOut(req, res);
});

app.post("/api/v1/account/loadin", verifySession, (req, res) => {
	return loadIn(req, res);
});

app.post("/api/v1/account/update", verifySession, (req, res) => {
	return updateAccount(req, res);
});

app.post("/api/v1/account/delete", verifySession, (req, res) => {
	return deleteAccount(req, res);
});

// Household Routes
const { createHousehold, joinHousehold, fetchHousehold, updateHousehold, leaveHousehold, deleteHousehold } = require("./backend/routes/Household");

app.post("/api/v1/household/create", verifySession, (req, res) => {
	return createHousehold(req, res);
});

app.post("/api/v1/household/join", verifySession, (req, res) => {
	return joinHousehold(req, res);
});

app.put("/api/v1/household/load", verifySession, (req, res) => {
	return fetchHousehold(req, res);
});

app.post("/api/v1/household/update", verifySession, (req, res) => {
	return updateHousehold(req, res);
});

app.post("/api/v1/household/leave", verifySession, (req, res) => {
	return leaveHousehold(req, res);
});

app.post("/api/v1/household/delete", verifySession, (req, res) => {
	return deleteHousehold(req, res);
});

// Food Routes
const { createFood, fetchFood, updateFood, deleteFood } = require("./backend/routes/Food");

app.post("/api/v1/food/create", verifySession, (req, res) => {
	return createFood(req, res);
});

app.put("/api/v1/food/load", verifySession, (req, res) => {
	return fetchFood(req, res);
});

app.post("/api/v1/food/update", verifySession, (req, res) => {
	return updateFood(req, res);
});

app.post("/api/v1/food/delete", verifySession, (req, res) => {
	return deleteFood(req, res);
});

// Recipe Routes
const { createRecipe, fetchRecipe, updateRecipe, deleteRecipe } = require("./backend/routes/Recipe");

app.post("/api/v1/recipe/create", verifySession, (req, res) => {
	return createRecipe(req, res);
});

app.put("/api/v1/recipe/load", verifySession, (req, res) => {
	return fetchRecipe(req, res);
});

app.post("/api/v1/recipe/update", verifySession, (req, res) => {
	return updateRecipe(req, res);
});

app.post("/api/v1/recipe/delete", verifySession, (req, res) => {
	return deleteRecipe(req, res);
});

// Grocery List Routes
const { addGroceryList, fetchGroceryList, updateGroceryList, deleteGroceryList } = require("./backend/routes/Grocery");

app.post("/api/v1/grocerylist/add", verifySession, (req, res) => {
	return addGroceryList(req, res);
});

app.put("/api/v1/grocerylist/load", verifySession, (req, res) => {
	return fetchGroceryList(req, res);
});

app.post("/api/v1/grocerylist/update", verifySession, (req, res) => {
	return updateGroceryList(req, res);
});

app.post("/api/v1/grocerylist/delete", verifySession, (req, res) => {
	return deleteGroceryList(req, res);
});

const engine = require("./backend/tensor/engine");

app.post('/api/ml', (req, res) => {
	console.log("Received image file");
	return engine.predictImage(req, res);

});

app.get("/", (req, res) => {
	res.render("index");
});

app.post("/test", (req, res) => {
	return res.send("Hello World!");
});
// Listen to the App Engine-specified port, or process.env.LOCAL_PORT for local development... default to 8080 if neither is set or dotenv fails
const PORT = process.env.NODE_ENV == "production" ? process.env.PORT : process.env.LOCAL_PORT ?? 8080;
// Scripts to run in terminal:
// - "npm run build:css", --> build CSS from Tailwind CSS
// - "npm run dev", --> run the server in development mode (localhost)
// - "npm start" --> start the server (production)
app.listen(PORT, () => {

	// Check if we are in development mode or production mode
	if (process.env.NODE_ENV == "development") {

		// Generate Sitemap
		// generateSitemap("http://localhost:" + PORT, true);

		// We are in development mode on localhost
        console.log("Server listening locally on http://localhost:" + PORT);


	} else {

		// We are in production mode on GCP
        console.log("Server listening on https://www.kitchenkinnekt.com, PORT: " + PORT);

	}

});