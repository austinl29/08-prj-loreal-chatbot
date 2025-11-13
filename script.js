/* ===============================
   L'Oréal Chatbot Front-End Logic
   =============================== */

/**
 * IMPORTANT:
 * Replace the empty string below with YOUR actual Cloudflare Worker URL
 * (from the Worker "Overview" page — it ends in `.workers.dev`).
 * Example:
 * const WORKER_URL = "https://loreal-chatbot-austin.username.workers.dev";
 */
const WORKER_URL = "https://frosty-pine-ef28.austeeny29.workers.dev";


/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const currentQuestionEl = document.getElementById("currentQuestion");

/* ===== System prompt to enforce L'Oréal-only answers (AI Relevance) ===== */
const systemPrompt = `
You are "L'Oréal Smart Routine Advisor", a helpful beauty expert.
Your job is to ONLY answer questions related to:
- L'Oréal brands and products (makeup, skincare, haircare, fragrance),
- ingredients, shade matching, skin/hair types,
- product comparisons, tips, and routines.

Guidelines:
- If the user asks about anything unrelated to beauty or L'Oréal
  (math, homework, random trivia, other companies, etc.),
  politely refuse and redirect them back to L'Oréal or beauty topics.
  Example: "I'm designed to focus on L'Oréal products and beauty routines…"

- Remember details from earlier in the conversation such as the user's name,
  skin or hair concerns, and favorite products, and use them to personalize
  later answers.

- Keep responses concise, friendly, and professional. Use bullet points
  when it helps with routines or product steps.
`;

/* ===== Conversation history (LevelUp: Maintain Conversation History) ===== */
const messages = [
  { role: "system", content: systemPrompt.trim() }
];

/* ===== Utility: append a message bubble to the chat window ===== */
function appendMessage(role, content) {
  const row = document.createElement("div");
  row.classList.add("msg-row", role === "user" ? "user" : "ai");

  const bubble = document.createElement("div");
  bubble.classList.add("msg", role === "user" ? "user" : "ai");
  bubble.textContent = content;

  row.appendChild(bubble);
  chatWindow.appendChild(row);

  // Scroll to bottom whenever a new message appears
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* ===== Utility: show the latest user question above the response ===== */
function updateCurrentQuestion(questionText) {
  if (!questionText) {
    currentQuestionEl.textContent = "";
    return;
  }
  currentQuestionEl.textContent = `Latest question: “${questionText}”`;
}

/* ===== Show initial greeting from the chatbot ===== */
function initChat() {
  const welcome = `
Bonjour! I’m your L'Oréal Smart Routine Advisor. ✨

Ask me anything about:
• L'Oréal makeup, skincare, haircare, or fragrance
• Building a routine for your skin or hair type
• Picking shades or products for a specific occasion
  `;
  const aiWelcome = welcome.trim();
  messages.push({ role: "assistant", content: aiWelcome });
  appendMessage("ai", aiWelcome);
  updateCurrentQuestion(""); // nothing yet
}

initChat();

/* ===== Handle form submit ===== */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  // Add user message to UI and history
  appendMessage("user", text);
  messages.push({ role: "user", content: text });

  // LevelUp: display user question above response
  updateCurrentQuestion(text);

  // Clear input field
  userInput.value = "";
  userInput.focus();

  // Show temporary "typing" indicator
  const loadingRow = document.createElement("div");
  loadingRow.classList.add("msg-row", "ai");
  const loadingBubble = document.createElement("div");
  loadingBubble.classList.add("msg", "ai");
  loadingBubble.textContent =
    "Let me check the best L'Oréal options for you…";
  loadingRow.appendChild(loadingBubble);
  chatWindow.appendChild(loadingRow);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });

    const data = await response.json();

    if (!response.ok) {
      const workerError =
        data?.error ||
        data?.message ||
        data?.error?.message ||
        `HTTP ${response.status}`;
      throw new Error(workerError);
    }

    // Remove loading bubble
    loadingRow.remove();

    const aiMessage =
      data.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response right now.";

    messages.push({ role: "assistant", content: aiMessage });
    appendMessage("ai", aiMessage);
  } catch (err) {
    console.error("Chat error:", err);
    loadingRow.remove();

    const errorMsg =
      "Oops—something went wrong connecting to the L'Oréal advisor. " +
      "If you're testing the project, double-check that your Worker URL " +
      "and OPENAI_API_KEY secret are set correctly.";
    appendMessage("ai", errorMsg);
    messages.push({ role: "assistant", content: errorMsg });
  }
});

