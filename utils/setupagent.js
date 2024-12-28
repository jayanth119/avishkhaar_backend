const openai = require("openai");
const { Configuration, OpenAIApi } = require("openai");
const { ZapierToolkit, ZapierNLAWrapper } = require("langchain/tools/zapier");
const { ConversationBufferMemory } = require("langchain/memory");
const { Tool, AgentExecutor, AgentType } = require("langchain/agents");
const { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder } = require("langchain/prompts");
const { OpenAIEmbeddings } = require("langchain/embeddings");
const { Chroma, FAISS } = require("langchain/vectorstores");
const { RetrievalQA } = require("langchain/chains");
const { SitemapLoader } = require("langchain/document_loaders");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { PromptTemplate } = require("langchain/prompts");

// Load API keys from environment variables
process.env.OPENAI_API_KEY = "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";
process.env.ZAPIER_NLA_API_KEY = "sk-ak-wA7I7L4t4mw1Ru7nRf39v4d0yV";
process.env.ELEVEN_API_KEY = "cb0f79a9ea96b1111f52de2c88a3354f";

async function setupAgent(kbTxtFilePath) {
  // Initialize Zapier toolkit
  const zapier = new ZapierNLAWrapper({ apiKey: process.env.ZAPIER_NLA_API_KEY });
  const toolkit = new ZapierToolkit(zapier);

  // Load knowledge base text
  const docs = fs.readFileSync(kbTxtFilePath, "utf8");

  // Split text into manageable chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    lengthFunction: (text) => text.length,
  });
  const texts = textSplitter.splitText(docs);

  // Initialize vector store with embeddings
  const embeddings = new OpenAIEmbeddings({ openaiApiKey: process.env.OPENAI_API_KEY });
  const vectorStore = await FAISS.fromTexts(texts, embeddings);

  // Set up retriever and QA chain
  const retriever = vectorStore.asRetriever();
  const chat = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    streaming: true,
    callbacks: [new StreamingStdOutCallbackHandler()],
  });
  const qa = RetrievalQA.fromChainType({
    llm: chat,
    chainType: "stuff",
    retriever,
  });

  // Define tools
  const tools = toolkit.getTools();
  const qaTool = new Tool({
    name: "STAWS",
    func: async (input) => await qa.run(input),
    description: "Useful for answering queries regarding traffic incidents for the police department.",
  });
  tools.push(qaTool);

  // Define system and human messages (adjust as needed)
  const systemMessage = "You are an intelligent assistant helping with traffic-related queries.";
  const humanMessage = "What is your question about traffic incidents?";

  // Define conversational agent prompt
  const prompt = ConversationalAgent.createPrompt(tools, {
    prefix: systemMessage,
    suffix: humanMessage,
    inputVariables: ["input", "chat_history", "agent_scratchpad"],
  });

  // Initialize memory and agent executor
  const memory = new ConversationBufferMemory({ memoryKey: "chat_history" });
  const agent = new ConversationalAgent({
    llmChain: {
      llm: chat,
      prompt,
    },
    tools,
    verbose: false,
    returnIntermediateSteps: false,
  });
  const agentChain = AgentExecutor.fromAgentAndTools({
    agent,
    tools,
    verbose: false,
    handleParsingErrors: true,
  });

  return agentChain;
}

module.exports = { setupAgent };
