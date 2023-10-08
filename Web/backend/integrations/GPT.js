"use strict";
// GPT.js - GPT-3.5 Turbo API
// Created on: 10/6/2023

// --- ChatGPT API ---

// Import required modules
const { OpenAI, Configuration } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askChatGPT(message) {
  return new Promise(async (resolve, reject) => {

    try {

      // Ask GPT-3.5 Turbo
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful kitchen assistant. Any nutrition facts, meal ideas/prep, or cooking information needed, you are an expert in and can help." },
          { role: "user", content: message }
        ],
        model: "gpt-3.5-turbo",
      });

      // Return response
      console.log("GPT RESPONSE: " + JSON.stringify(completion.choices[0].message));
      resolve(completion.choices[0].message);
      
    } catch (err) {
      console.log(err);
      reject(err);
    }

  });
}

// curl -X POST http://localhost:3000/api/v1/process -H "Content-Type: application/json" -d '{"message": "Give me instructions on cooking scallops"}'


async function processGPT(req, res) {
  
  const params = req.body;

  if (!params || params == null || params == undefined) {
    return res.status(400).json({ error: "Invalid request body." });
  }

  const message = params.message;
  const ingredients = params.ingredients;

  // USER SENDS MESSAGE
  // message gets forwarded to ChatGPT with the instructions:
    // "You are a helpful kitchen assistant. Any nutrition facts, meal ideas/prep, or cooking information needed, or recipe ideas, you are an expert in and can help.
    //  Place the user's message into one of the following categories:
    //  - Nutrition Facts (e.g. how many calories are in a banana)
    //  - Meal Ideas/Prep (e.g. what to eat for breakfast)
    //  - Cooking Information (e.g. how to cook a steak)
    //  - Recipe Ideas for (insert ingredients, dish, etc.)
    //  - Other" (unsupported or unknown)
  // ChatGPT responds with the categories back here
  // Server sends message to ChatGPT with the instructions:
    // "You are a helpful kitchen assistant. Any nutrition facts, meal ideas/prep, or cooking information needed, or recipe ideas, you are an expert in and can help.
  //  Give me information about the following category:
  // (insert category here)
  // user input: (insert user input here)
  // return back a JSON only with the information laid out like this:
  // {
  //   "category": "Nutrition Facts",
  //   "info": "There are 105 calories in a banana."
  // }
  // or if its something that returns a list of information, like a recipe, then it would be like this:
  // {
  //   "category": "Recipe Ideas",
  //   "info": [
  //     {
  //       "title": "Banana Bread",
  //       "ingredients": [
  //         "1 cup of flour",
  //         "1 banana",
  //         "1 egg",
  //        ],
  //       "instructions": [
  //         "Mix all ingredients together",
  //        ]
  //     },
  //     {
  //       "title": "Scallops",
  //       "ingredients": [
  //         "1 cup of flour",
  //         "Scallops"
  //        ],
  //       "instructions": [
  //         "Mix all ingredients together",
  //        ]
  //     }
  //   ]
  // }

  // Ask GPT-3.5 Turbo
  askChatGPT(`
  You are a helpful kitchen assistant. Any nutrition facts, meal ideas/prep, or cooking information needed, or recipe ideas, you are an expert in and can help.
  Place the user's message into one of the following categories:
  - Nutrition Facts (e.g. how many calories are in a banana)
  - Meal Ideas/Prep (e.g. what to eat for breakfast)
  - Cooking Information (e.g. how to cook a steak)
  - Recipe Ideas for (insert ingredients, dish, etc.)
  - Other
  Return back one word only with the category.
  `).then((responseCategory) => {
      
    // Check if response exists
    if (!responseCategory) {
      return res.status(500).json({ error: "Failed to get response from GPT-3.5 Turbo." });
    }
  
    // Ask GPT-3.5 Turbo
    askChatGPT(`
      You are a helpful kitchen assistant. Any nutrition facts, meal ideas/prep, or cooking information needed, or recipe ideas, you are an expert in and can help.
      Give me information about the following category:
      ${responseCategory.text}
      user input: ${message}
      ingredients: ${ingredients}
      Return back information regarding the category with the user input and ingredients.
      For example, if the category has to do with getting a recipe idea, return back the recipe instructions in a list.
      If the category has to do with nutrition facts, return back the nutrition facts.
      If the category has to do with cooking information, return back the cooking information.

      Give short, yet detailed information.

      Be enthusiastic and helpful.
      `).then((responseInfo) => {
  
      // Check if response exists
      if (!responseInfo) {
        return res.status(500).json({ error: "Failed to get response from GPT-3.5 Turbo." });
      }
        
        let cont = responseInfo.content;
        cont = cont.replace("\n", "").replace("\\", "");
        
      // Return response
      return res.status(200).send(cont);
  
    }).catch((err) => {
      return res.status(500).json({ error: "Failed to get response from GPT-3.5 Turbo. error:" + err });
    });
  
  });

}


// Export functions
module.exports = { askChatGPT, processGPT };