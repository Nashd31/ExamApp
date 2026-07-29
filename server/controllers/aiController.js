const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Controller to handle AI-based exam question generation.
 * Generates an array of exam questions based on a natural language prompt.
 */
const generateExam = async (req, res, next) => {
  try {
    const { promptText } = req.body;

    if (!promptText || typeof promptText !== 'string') {
      return res.status(400).json({ error: 'promptText is required and must be a string.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY is not configured on the server.' 
      });
    }

    const aiModel = process.env.GEMINI_API_MODEL || 'gemini-3.5-flash';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: aiModel,
      systemInstruction: "You are an expert exam creator. The user will ask you to generate questions. You MUST return ONLY valid JSON. The JSON must strictly be an ARRAY of question objects. Each object must follow this exact format: { text: 'Question text', type: 'multiple_choice' or 'open_ended', points: integer, options: ['opt1', 'opt2', 'opt3', 'opt4'] (only if multiple_choice), correctAnswers: [integer_array_of_correct_indexes] (only if multiple_choice) }. Distribute exactly 100 points across the generated questions."
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error('Received empty response from Gemini AI.');
    }

    const parsedQuestions = JSON.parse(responseText);

    if (!Array.isArray(parsedQuestions)) {
      throw new Error('AI response is not an array.');
    }

    res.status(200).json(parsedQuestions);
  } catch (err) {
    console.error('Error generating exam questions via Gemini AI:', err);
    res.status(500).json({ error: 'Failed to generate exam questions: ' + err.message });
  }
};

module.exports = {
  generateExam
};
