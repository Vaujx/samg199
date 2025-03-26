/**
 * Customer Service Chat
 * This file handles the chat functionality
 */

// Define CHAT_RESPONSES (or import it if it's in another file)
const CHAT_RESPONSES = {
  delivery: "Delivery usually takes 3-5 business days.",
  payment: "We accept all major credit cards and PayPal.",
  hours: "Our operating hours are 9am to 5pm, Monday to Friday.",
  minimum: "There is no minimum order amount.",
  dietary: "Yes, we have a variety of vegetarian options available.",
  spicy: "You can specify your preferred spice level when ordering.",
  cancel: "You can cancel your order within 1 hour of placing it.",
  location: "We are located at 123 Main Street.",
}

// Toggle chat visibility
function toggleChat() {
  const chatContainer = document.getElementById("chatContainer")
  if (chatContainer) {
    if (chatContainer.style.display === "block") {
      chatContainer.style.display = "none"
    } else {
      chatContainer.style.display = "block"
      // Scroll to bottom of chat
      const chatBody = document.getElementById("chatBody")
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight
      }
    }
  }
}

// Ask a question in the chat
function askQuestion(topic) {
  // Get the question text from the button
  const questionButtons = document.querySelectorAll(".question-button")
  let questionText = ""

  for (const button of questionButtons) {
    if (button.textContent.includes(topic.charAt(0).toUpperCase())) {
      questionText = button.textContent
      break
    }
  }

  if (!questionText) {
    switch (topic) {
      case "delivery":
        questionText = "How long does delivery take?"
        break
      case "payment":
        questionText = "What payment methods do you accept?"
        break
      case "hours":
        questionText = "What are your operating hours?"
        break
      case "minimum":
        questionText = "Is there a minimum order amount?"
        break
      case "dietary":
        questionText = "Do you offer vegetarian options?"
        break
      case "spicy":
        questionText = "Can I adjust the spice level?"
        break
      case "cancel":
        questionText = "How do I cancel my order?"
        break
      case "location":
        questionText = "Where are you located?"
        break
    }
  }

  // Add user question to chat
  const chatMessages = document.getElementById("chatMessages")
  if (chatMessages) {
    const userMessage = document.createElement("div")
    userMessage.className = "chat-message user-message"
    userMessage.textContent = questionText
    chatMessages.appendChild(userMessage)

    // Add bot response after a short delay
    setTimeout(() => {
      const botMessage = document.createElement("div")
      botMessage.className = "chat-message bot-message"
      botMessage.textContent = CHAT_RESPONSES[topic]
      chatMessages.appendChild(botMessage)

      // Scroll to bottom of chat
      const chatBody = document.getElementById("chatBody")
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight
      }
    }, 500)
  }
}

