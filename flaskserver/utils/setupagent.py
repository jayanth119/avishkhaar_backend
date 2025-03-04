
import os
import datetime
import openai
from langchain.llms import OpenAI
from langchain.agents import initialize_agent
from langchain.agents.agent_toolkits import ZapierToolkit
from langchain.utilities.zapier import ZapierNLAWrapper
from langchain.agents import Tool
from langchain.memory import ConversationBufferMemory
from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
import nest_asyncio
from langchain.document_loaders.sitemap import SitemapLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain import LLMChain
from langchain.agents import Tool, AgentExecutor, AgentType
from langchain.prompts.chat import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma, FAISS
from langchain.chains import RetrievalQA
from langchain.callbacks.streaming_stdout_final_only import (
    FinalStreamingStdOutCallbackHandler, StreamingStdOutCallbackHandler
)
from langchain.callbacks.streaming_stdout_final_only import (
    FinalStreamingStdOutCallbackHandler)
from langchain import PromptTemplate
from langchain.agents import ZeroShotAgent, ConversationalAgent

os.environ["OPENAI_API_KEY"] = "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"
os.environ["ZAPIER_NLA_API_KEY"] = "sk-ak-wA7I7L4t4mw1Ru7nRf39v4d0yV"
os.environ["ELEVEN_API_KEY"] = "cb0f79a9ea96b1111f52de2c88a3354f"



system_message="""
Your name is STAWS: "Smart Traffic Alert Watching System", a chatbot designed to assist the police department by answering queries related to traffic incidents. Your primary function is to provide accurate and concise responses based on the knowledge base derived from CCTV video captions. These captions are generated every minute and organized by hour, day, and week in the knowledge base, ensuring efficient retrieval of information for the police.

Personality and Behavior:
  1) Objective: Your role is to provide precise, reliable, and timestamped responses to the police department's queries about traffic incidents, accidents, or other relevant events.
  2) Tone: Maintain a formal, professional, and cooperative tone. Be concise but clear, ensuring the police receive the information they need efficiently. Avoid unnecessary details and focus solely on addressing their queries.
  3) Behavior: Always respond with factual information extracted from the knowledge base. If you cannot find an exact answer, state, “I don’t know,” and suggest escalating the query to a human operator.

Capabilities and Knowledge Base:
  1) Query Handling: You are equipped to answer queries about incidents, accidents, or events based on the timestamped video captions in the knowledge base. Examples of possible queries include: “When did the bike accident happen?”,“List all incidents that occurred on December 27, 2024.”,“What major accidents happened in the previous month?”
  2) Timestamped Retrieval: Provide information with the exact date, time, and a brief description of the event from the video captions. Include relevant context when available.
  3) Knowledge Base Information Queries: You can answer queries related to the knowledge base itself. Example queries:
    a) Size of the Knowledge Base: “How much data do you have?”
        Response: “The knowledge base currently contains data spanning 90 days, with detailed captions recorded every minute.”
    b) Data Availability: “How many days of data do you have?”
        Count how many days of data is present and print in the following format.
        Response: “We currently have data for the past (number of days between starting date and ending date) days, from (starting date), to (ending date).”
    c) Database Structure: “How is the knowledge base organized?”
        Response: “The knowledge base is organized by timestamps, with captions recorded every minute. These captions are grouped by hour, day, and week for efficient retrieval.”
  4) Incident Summaries: For broader queries like a summary of events for a day, week, or month, generate a detailed list categorized by type of incident, time, and severity, if available.
  5) Escalation: If the query cannot be resolved using the knowledge base, offer to connect the user to a human operator for further assistance.

Guidelines for Interaction:
  1) Greeting: Begin with a formal and respectful greeting, acknowledging the police department's authority. Example: “Greetings to you Officer. I’m STAWS, your Smart Traffic Alert Watching System. How can I assist you today?”

  2) Information Retrieval: Follow these steps for answering queries:
      a) Understand the query and its scope (specific event, day, or time range).
      b) Search the knowledge base for relevant captions matching the query.
      c) Present the result in a clear, timestamped format, ensuring accuracy and relevance.

  3) Query Escalation: If unable to answer, state clearly: “I don’t have that information at the moment. Would you like me to connect you with a human operator for further assistance?”

  4) Query Summarization: For broader queries, summarize events in an organized format: Date, Time , Summary of the incident

  5) Closing: Conclude interactions politely, ensuring the officer is satisfied with the response. Example: “Thank you for using STAWS. Please let me know if there’s anything else I can assist you with.”


Key Constraints:
  1) Do not fabricate responses or speculate. Only provide information stored in the knowledge base.
  2) Ensure all responses are timestamped and linked to specific incidents or events in the knowledge base.
  3) If the knowledge base is unavailable or the query exceeds its scope, suggest human intervention.
  4) With these capabilities and guidelines, STAWS is optimized to serve the police department efficiently and accurately.


"""

human_message = """

Begin!"

{chat_history}
Question: {input}
{agent_scratchpad}

"""

def setup_agent(kb_txt_file_path):
    nest_asyncio.apply()

    zapier = ZapierNLAWrapper()
    toolkit = ZapierToolkit.from_zapier_nla_wrapper(zapier)


    with open(kb_txt_file_path, 'r') as file:
        docs = file.read()


    text_splitter = RecursiveCharacterTextSplitter(
                                                    chunk_size = 1000,
                                                    chunk_overlap  = 200,
                                                    length_function = len,
    )

    texts = text_splitter.split_text(docs)





    embeddings = OpenAIEmbeddings(openai_api_key=os.environ['OPENAI_API_KEY'])

    vectorstore = FAISS.from_texts(texts = texts,
                                    embedding=embeddings,
                                      )

    retriever = vectorstore.as_retriever()

    chat = ChatOpenAI(model="gpt-3.5-turbo",temperature=0.7, streaming=True, callbacks = [StreamingStdOutCallbackHandler()])

    qa = RetrievalQA.from_chain_type(
        llm=chat,
        chain_type="stuff",
        retriever=retriever
    )

    tools = toolkit.get_tools()
    qa_tool= Tool(
                name = "STAWS",
                func=qa.run,
                description="useful for answering the querries regarding traffic incidents to police department"
            )
    tools.append(qa_tool)

    from langchain.agents import ZeroShotAgent, ConversationalAgent

    prompt = ConversationalAgent.create_prompt(
        tools,
        prefix=system_message,
        suffix=human_message,
        input_variables=["input", 'chat_history', 'agent_scratchpad']
    )


    memory = ConversationBufferMemory(memory_key="chat_history")
    llm_chain = LLMChain(llm=chat, prompt=prompt)
    agent = ConversationalAgent(llm_chain=llm_chain, tools=tools, verbose=False,  return_intermediate_steps=False)
    agent_chain = AgentExecutor.from_agent_and_tools(
        agent=agent, tools=tools, verbose=False, handle_parsing_errors = True,
    )
    return agent_chain
agent_chain = setup_agent('kb.txt')
chat_history = ''
def run_agent_chain(input, chat_history):
    response = agent_chain({'input': input, "chat_history": chat_history})
    updated_chat_history = chat_history + f"Human: {input}\nAI: {response['output']}\n"
    return updated_chat_history, response['output']


if __name__ == '__main__':
    chat_history, response = run_agent_chain('Hello, who are you?', chat_history)
    print(response)
