const express = require('express');
require('dotenv').config();
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse');
const key = process.env.GEMINI_KEY;
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();

app.use(express.json());
app.use(cors());


app.get('/', (req, res) => {
    res.send('Hello World!');
});

const upload = multer(); // 'uploads/' is the folder for temporary storage
const extractTextFromPdf = async (fileBuffer) => {
    try {
        const data = await pdf(fileBuffer); // Pass the buffer directly to pdf-parse
        return data.text; // Return the extracted text
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw error;
    }
};

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const prompt = req.body.prompt;

        const extractedText = await extractTextFromPdf(req.file.buffer);
        const result = await model.generateContent(prompt + extractedText);
        const text = result.response.text();
        let cleanedText = text.replace(/`/g, '');

        cleanedText = cleanedText.replace(/\bjson\b/g, '');

        res.send(cleanedText);

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error extracting text from the PDF');
    }
});

app.listen(process.env.PORT, () => {
    console.log('server is listening on port ' + process.env.PORT);
})