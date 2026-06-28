import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { ChatOpenRouter } from "@langchain/openrouter";
import { config } from "dotenv";
config();
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const _originalFetch = globalThis.fetch;
globalThis.fetch = (url, opts) => {
  if (opts?.dispatcher) {
    const { dispatcher, ...cleanOpts } = opts;
    return _originalFetch(url, cleanOpts);
  }
  return _originalFetch(url, opts);
};

const llm = new ChatOpenRouter({
  //   model: "openai/gpt-oss-120b:free",
  model: "openrouter/free",
  //   extraArgs: { thinking: false },
  //   apiKey: process.env.API_KEY,
  apiKey: process.env.OPEN_ROUTER,
  maxTokens: 2000,
  //   streaming: true,
});

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text-v2-moe",
  baseUrl: "http://localhost:11434",
});

const queue = new Queue("file-upload-queue", {
  connection: {
    host: "localhost",
    port: "6379",
  },
});

const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix} - ${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// const queue = new Queue("file-upload-queue", {
//   connection: {
//     host: "localhost",
//     port: 6379,
//   },
// });

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  return res.json({ Hello: "This is Dwaipayan" });
});

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  await queue.add(
    "file-ready",
    JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    }),
  );

  return res.json({ message: "uploaded" });
});

app.get("/chat", async (req, res) => {
  try {
    // const userQuery = "What is this?";
    const userQuery = req.query.message;

    if (!userQuery) {
      return res.status(400).json({
        error: "Please provide ?message=your question",
      });
    }

    const embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text-v2-moe",
      baseUrl: "http://localhost:11434",
    });

    const qdrantClient = new QdrantClient({
      url: "http://localhost:6333",
      checkCompatibility: false,
    });

    console.log("Qdrant client created, connecting to vector store...");

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        client: qdrantClient,
        collectionName: "langchainjs-testing",
      },
    );

    const ret = vectorStore.asRetriever({
      k: 2,
    });

    const result = await ret.invoke(userQuery);

    const SYSTEM_PROMPT = `
  You are helpful AI Assistant who answers the user query based on the available from the PDF file.
  Context: ${result.map((d) => d.pageContent).join("\n\n")}
`;

    const chatResult = await llm.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(userQuery),
    ]);

    return res.json({
      answer: chatResult.content,
      docs: result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
});

app.listen(8000, () => {
  console.log(`Server started on PORT:${8000}`);
});
