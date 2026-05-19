import express, { Request, Response, NextFunction } from "express";
import path from "path";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { getDb } from "./database";
import { extractTextFromBuffer, chunkText } from "./services/pdfService";
import { generateSummary, getEmbedding, generateAnswer } from "./services/geminiService";
import { findRelevantChunks } from "./services/vectorService";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";

async function startServer() {
  console.log("Starting server initialization...");
  const app = express();
  const PORT = 3000;

  app.get("/health", (req, res) => res.send("OK"));

  app.use(express.json());

  // Database initialization
  console.log("Initializing database...");
  const db = await getDb();
  console.log("Database initialized.");

  // Multer setup
  const upload = multer({ storage: multer.memoryStorage() });

  // Auth Middleware
  const authenticateToken = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword]);
      res.status(201).json({ message: "User created" });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Signup failed" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(400).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user.id, email: user.email } });
  });

  // --- Document Routes ---
  app.post("/api/documents/upload", authenticateToken, upload.single('file'), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const text = await extractTextFromBuffer(req.file.buffer);
      const { summary, key_points, action_items } = await generateSummary(text);
      
      const docResult = await db.run(
        "INSERT INTO documents (user_id, name, content, summary, key_points, action_items) VALUES (?, ?, ?, ?, ?, ?)",
        [req.user.id, req.file.originalname, text, summary, JSON.stringify(key_points), JSON.stringify(action_items)]
      );
      
      const docId = docResult.lastID;

      // Processing chunks in background or now
      const chunks = chunkText(text);
      for (const chunk of chunks) {
        const embedding = await getEmbedding(chunk);
        await db.run("INSERT INTO chunks (doc_id, text, embedding) VALUES (?, ?, ?)", [docId, chunk, JSON.stringify(embedding)]);
      }

      res.status(201).json({ id: docId, name: req.file.originalname });
    } catch (err: any) {
      console.error('Upload error details:', err);
      res.status(500).json({ error: err.message || "Failed to process document" });
    }
  });

  app.get("/api/documents", authenticateToken, async (req: any, res) => {
    const docs = await db.all("SELECT id, name, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
    res.json(docs);
  });

  app.get("/api/documents/:id", authenticateToken, async (req: any, res) => {
    const doc = await db.get("SELECT * FROM documents WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    
    doc.key_points = JSON.parse(doc.key_points);
    doc.action_items = JSON.parse(doc.action_items);
    res.json(doc);
  });

  app.delete("/api/documents/:id", authenticateToken, async (req: any, res) => {
    await db.run("DELETE FROM documents WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json({ message: "Document deleted" });
  });

  // --- Q&A Routes ---
  app.post("/api/documents/:id/ask", authenticateToken, async (req: any, res) => {
    const { question } = req.body;
    const docId = req.params.id;

    const doc = await db.get("SELECT id FROM documents WHERE id = ? AND user_id = ?", [docId, req.user.id]);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const chunks = await db.all("SELECT text, embedding FROM chunks WHERE doc_id = ?", [docId]);
    const relevantChunks = await findRelevantChunks(question, chunks);
    const context = relevantChunks.map(c => c.text).join("\n\n---\n\n");
    
    const answer = await generateAnswer(question, context);

    // Store chat history
    await db.run(
      "INSERT INTO chat_history (doc_id, role, message, sources) VALUES (?, ?, ?, ?)",
      [docId, "user", question, JSON.stringify([])]
    );
    await db.run(
      "INSERT INTO chat_history (doc_id, role, message, sources) VALUES (?, ?, ?, ?)",
      [docId, "assistant", answer, JSON.stringify(relevantChunks.map(c => c.text))]
    );

    res.json({ answer, sources: relevantChunks.map(c => c.text) });
  });

  app.get("/api/documents/:id/history", authenticateToken, async (req: any, res) => {
    const history = await db.all("SELECT * FROM chat_history WHERE doc_id = ? ORDER BY created_at ASC", [req.params.id]);
    history.forEach(h => {
      h.sources = JSON.parse(h.sources);
    });
    res.json(history);
  });

  // --- Vite / Static Files ---
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server startup error:", err);
  process.exit(1);
});
