
async function runAgentChain(input, chatHistory) {
    try {
      // Pass input and chat history to the agent chain
      const response = await agentChain.call({ input, chat_history: chatHistory });
  
      // Update the chat history with the new interaction
      const updatedChatHistory = 
        chatHistory + `Human: ${input}\nAI: ${response.output}\n`;
  
      // Return the updated chat history and the AI response
      return { updatedChatHistory, aiResponse: response.output };
    } catch (error) {
      console.error("Error running agent chain:", error);
      return { updatedChatHistory: chatHistory, aiResponse: "An error occurred." };
    }
  }
  
  module.exports = { runAgentChain };
  