# RAG Document Assistant

A full-stack web application that allows users to upload PDF documents, automatically summarizes them, and lets users chat with the document content using RAG (Retrieval-Augmented Generation) powered by Gemini AI.

## Features

- **JWT Authentication:** Secure signup and login.
- **PDF Upload:** Extract text from uploaded PDF files.
- **AI Summarization:** Automatically generate summaries, key points, and action items using Gemini 3 Flash.
- **RAG Chat:** Ask questions about your documents and get answers grounded in the document text.
- **Vector Search:** Efficient local vector retrieval using Gemini Embeddings and cosine similarity.
- **Chat History:** Persistent chat history for every document.
- **Dashboard:** Manage multiple documents with ease.

## Tech Stack

- **Frontend:** React, Tailwind CSS, Motion, Lucide React, React Router.
- **Backend:** Node.js, Express.
- **Database:** SQLite (Metadata & Chat history), Local Vector Search.
- **AI:** Google Gemini API (Generation & Embeddings).

## How it Works

1. **Upload:** When a PDF is uploaded, the backend extracts the raw text.
2. **Analysis:** Gemini 3 Flash analyzes the full text to generate a structured summary.
3. **Chunking & Indexing:** The text is split into chunks. Each chunk is embedded using `gemini-embedding-2-preview`.
4. **Retrieval (RAG):** When you ask a question, the query is embedded, and the most similar chunks are retrieved from the local database.
5. **Generation:** The retrieved sections are provided as context to Gemini 3 Flash to generate a grounded answer.

## Local Setup

### Prerequisites

- Node.js (v18+)
- A Gemini API Key (get one at [aistudio.google.com](https://aistudio.google.com/))

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```env
   GEMINI_API_KEY="your-api-key"
   JWT_SECRET="your-secret-key"
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Running with Docker

You can also run the entire stack using Docker:

```bash
docker build -t rag-assistant .
docker run -p 3000:3000 -e GEMINI_API_KEY="your-key" rag-assistant
```

## License

Apache-2.0
