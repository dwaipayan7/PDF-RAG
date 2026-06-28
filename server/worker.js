import { Worker } from "bullmq";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { log } from "node:console";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    console.log(`Job:`, job.data);
    const data = JSON.parse(job.data);

    // const data = job.data;

    if (!data.path) {
      throw new Error("Missing file path in job payload.");
    }

    // Load the PDF
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();

    console.log("The Docs are: ", docs);

    // Split the documents into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    //splitText

    const splitDocs = await splitter.splitDocuments(docs);

    console.log("The Split Docs are: ", splitDocs);

    const embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text-v2-moe",
      baseUrl: "http://localhost:11434",
    });

    const qdrantClient = new QdrantClient({
      url: "http://localhost:6333",
      checkCompatibility: false,
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        client: qdrantClient,
        collectionName: "langchainjs-testing",
      },
    );
    await vectorStore.addDocuments(splitDocs);
    console.log(`All docs are added to vector store`);
  },
  {
    concurrency: 100,
    connection: {
      host: "localhost",
      port: 6379,
    },
  },
);
