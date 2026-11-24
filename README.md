# AI Text Analyzer

AI Text Analyzer is a lightweight web app for analyzing typed text or readable PDF documents. It reports the total word count, the five most frequent words, and an AI-generated summary.

## Features

- Paste text directly into the text area.
- Upload a PDF file and extract its text in the browser.
- Count words locally in the browser.
- Show the five most frequent words, ignoring tokens of two characters or fewer.
- Generate a concise summary through OpenRouter.
- Display clear loading and error states.

## Technology and AI model

- **Frontend:** HTML, CSS, and vanilla JavaScript.
- **PDF extraction:** PDF.js 2.10.377, loaded from cdnjs. The app reads text layers from each PDF page; scanned/image-only PDFs are not OCR-processed.
- **Backend:** Python Flask, with `requests` for the OpenRouter HTTP request and `python-dotenv` for environment variables.
- **Production server:** Gunicorn, configured in `Procfile`.
- **AI gateway/model selection:** OpenRouter's Chat Completions API at `https://openrouter.ai/api/v1/chat/completions`. The configured model is `openrouter/free`, which lets OpenRouter select an available free model. The exact underlying model can therefore vary by request and availability.

## Project structure

```text
app.py          Flask server and /api/summarize endpoint
index.html      User interface
app.js          PDF extraction, local statistics, and API calls
style.css       Responsive dark interface styling
requirements.txt Python dependencies
Procfile        Gunicorn deployment command
```

## Setup

1. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate       # Windows: venv\\Scripts\\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the same directory as `app.py`:

   ```env
   OPENROUTER_KEY=your_openrouter_api_key
   ```

4. Start the development server:

   ```bash
   python app.py
   ```

5. Open `http://localhost:5000`.

For deployment, use the included command:

```bash
gunicorn app:app
```

## How it works

1. The user enters text or selects a PDF.
2. For a PDF, PDF.js reads each page's text content and combines the pages.
3. JavaScript lowercases the text, tokenizes words with `\\b\\w+\\b`, counts all tokens, and ranks words longer than two characters for the frequency list.
4. The browser sends the text to Flask as JSON at `POST /api/summarize`.
5. Flask sends a system instruction and the text to OpenRouter, then returns the model response as `summary`.
6. The frontend displays the statistics and summary.

## API

### `POST /api/summarize`

Request:

```json
{"text": "Text to summarize"}
```

Successful response:

```json
{"summary": "A concise summary..."}
```

The endpoint returns an error if the API key is missing, the request has no text, or OpenRouter returns an error.

## Notes and limitations

- Only `.pdf` uploads are accepted by the file picker.
- PDF extraction supports selectable text, not scanned images; OCR is not included.
- Word statistics are calculated locally and are not sent to the AI model separately.
- The OpenRouter key must remain in `.env` and should never be committed. `.env` is ignored by Git.
- Large documents may exceed the selected model's context limits or take longer to summarize.

## License

Add the project's intended license before public distribution.
