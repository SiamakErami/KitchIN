// tailwind.config.js - Tailwind CSS configuration file
// Created on: 10/6/2023

/** @type {import('tailwindcss').Config} */
module.exports = {
	important: true,
	purgeCSS: false,
	content: [
		"./frontend/views/**/*.{ejs,html}",
	],
	theme: {
		extend: {
			fontFamily: {
				CreteRoundItalic: ["CreteRoundItalic", "serif"],
				CreteRoundRegular: ["CreteRoundRegular", "serif"],
			},
			colors: {
				background: "#f5f5f5", // light grey
				backgroundDark: "#191919", // dark grey
				foreground: "#ffffff", // white
				foregroundDark: "#000000", // black

				// TODO: Update these colors
				// -------------------------
				primary: "#24c8b4", // greenish teal - 1st color in gradient
				secondary: "#48a5c8", // light blue - 2nd color in gradient
				tertiary: "#2470ff", // blue - 3rd color in gradient
				accent1: "#6012e6", // purple - for buttons, links, etc
				accent2: "#ffa500", // orange - for alerts, warnings, etc
				// -------------------------

			},
		},
	},
};
