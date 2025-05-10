// src/component/GeminiAPI.js
import axios from 'axios';

const API_KEY = 'AIzaSyA5JT5v7VuGVNPAdEyh6jUjYrifVSFbJ9Q'; // Replace with your API key

const VistoAPI = async (userInput) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: userInput }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return (
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Sorry, I didn’t understand that.'
    );
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

export default VistoAPI;
