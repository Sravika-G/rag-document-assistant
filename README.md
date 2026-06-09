# RAG Document Assistant

A full-stack web application that allows users to upload PDF documents, automatically summarizes them, and lets users chat with the document content using RAG (Retrieval-Augmented Generation) powered by Gemini AI.

> [!IMPORTANT]
> **Data Persistence Notice:** 
> When deploying this application to cloud-hosting platforms (such as Render, Heroku, or Docker-based container services), the default local SQLite database (`database.sqlite`) will reset whenever the instance restarts or redeploys because container filesystems are ephemeral. 
> To ensure your **user accounts, uploaded documents, and chat history persist permanently**, you **MUST** configure a PostgreSQL database (like Supabase, Neon, or Render PostgreSQL) and provide the connection string via the `DATABASE_URL` environment variable.

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
- **Database:** PostgreSQL (Metadata, chunks, embeddings, & Chat history), Persistent Retrieval.
- **AI:** Google Gemini API (Generation & Embeddings).

## How it Works

1. **Upload:** When a PDF is uploaded, the backend extracts the raw text.
2. **Analysis:** Gemini 3.5 Flash analyzes the text to generate a structured summary.
3. **Chunking & Indexing:** The text is split into chunks. Each chunk is embedded using `gemini-embedding-2-preview` and indexed in PostgreSQL.
4. **Retrieval (RAG):** When you ask a question, the query is embedded, and the most similar chunks are retrieved from the database.
5. **Generation:** The retrieved sections are provided as context to Gemini to generate a grounded answer.

## Render Deployment Instructions

This project is fully designed and optimized to be deployed on **Render** with a persistent PostgreSQL database.

### Prerequisites on Render

1. **Create a PostgreSQL Database on Render:**
   - Go to your Render Dashboard and click **New > Database**.
   - Set a name and region, and choose the Free tier.
   - Once created, copy the **Internal Database URL** (if deploying the server on Render) or the **External Database URL**. Use this as your `DATABASE_URL`.

2. **Create a Web Service on Render:**
   - Click **New > Web Service**.
   - Connect your GitHub repository.
   - Configure the Web Service settings as follows:
     - **Runtime:** `Node`
     - **Build Command:** `npm run build`
     - **Start Command:** `npm start`
     - **Port:** Render will automatically detect or default to `3000`.

### Environment Variables on Render

In your Web Service settings under the **Environment** tab, add the following variables:

| Key | Value | Description |
|---|---|---|
| `DATABASE_URL` | *your_postgresql_database_url* | Your Render PostgreSQL connection string. |
| `GEMINI_API_KEY` | *your_gemini_api_key* | Your Google Gemini API Key from Google AI Studio. |
| `JWT_SECRET` | *your_random_string* | A long random string used to secure user auth tokens. |
| `NODE_ENV` | `production` | Enables compilation optimization and production static file serving. |

### Free Tier Sleep Handling
Render's Free Tier web services spin down after 15 minutes of inactivity. When a new request arrives, Render will spin the service back up automatically. Since we are using PostgreSQL, all registered users, their uploaded documents, chunks, embeddings, and chat histories will remain **100% persistent** and will not be deleted when the instance spins down.

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
