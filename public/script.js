// Define answerGiven globally or in a scope accessible to both functions
let answerGiven = true;

// Initialize firstTimeCome in localStorage if not already set
if (localStorage.getItem("firstTimeCome") === null) {
  localStorage.setItem("firstTimeCome", JSON.stringify(true));
}

let firstTimeCome = JSON.parse(localStorage.getItem("firstTimeCome"));

if (firstTimeCome) {
  localStorage.setItem("firstTimeCome", JSON.stringify(false));
  localStorage.setItem("mode", JSON.stringify({ mode: "darkmode" }));
  location.href = "/login";
  console.log("First Time Come");
} else {
  console.log("Not First Time :)");
}

async function submitInput() {
  const input = document.getElementById("userInput").value;
  const inputBtn = document.getElementById("inputBtn");

  if (input.trim() === "") return;

  inputBtn.disabled = true;

  // Create and append user message
  const userMessage = document.createElement("div");
  userMessage.classList.add("request", "fade-in");
  userMessage.innerHTML = `
      <b style="position:relative;top: 10px;">User:</b>
      <p>${input}</p>
    `;

  const welcomeElement = document.getElementById("welcome");

  if (welcomeElement) {
    welcomeElement.remove();
    answerGiven = false;
  }

  document.querySelector(".response_request").appendChild(userMessage);
  applyMode();

  try {
    // Fetch response from server
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    // Process response
    let text = data.reply.replace(/## (.*?)(\n|$)/g, "<h2>$1</h2>$2");
    text = text.replace(/\*\s\*\*(.*?)\*\*/g, "<br><br><b>$1</b>");
    text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b><br>");
    text = text.replace(/\*/g, "<br>");

    // Create and append chatbot message
    const chatbotMessage = document.createElement("div");
    chatbotMessage.classList.add("response", "fade-in");
    chatbotMessage.innerHTML = `
        <b style="position:relative;top: 10px;">Chatbot:</b>
        <p>${text}</p>
      `;

    document.querySelector(".response_request").appendChild(chatbotMessage);
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  } finally {
    // Reset input field and enable button
    document.getElementById("userInput").value = "";
    applyMode();
    answerGiven = true;
    inputBtn.disabled = false;
  }
}

// Function to add or remove lightmode classes
function updateLightModeClasses(add) {
  const method = add ? "add" : "remove";
  document.body.classList[method]("lightmode");
  document
    .querySelectorAll(
      ".response,#welcome, .request, h1.h1, #userInput, button#inputBtn, aside, a#createChatBtn, .profileDiv > div > a > img, .profileDiv > div > button > i, .chat, .grey, .profileDiv"
    )
    .forEach((el) => {
      el.classList[method]("lightmode");
    });
}

// Light mode switching function
function toggleLightMode() {
  const modeData = JSON.parse(localStorage.getItem("mode"));
  const newMode = modeData.mode === "darkmode" ? "lightmode" : "darkmode";
  modeData.mode = newMode;
  localStorage.setItem("mode", JSON.stringify(modeData));
  updateLightModeClasses(newMode === "lightmode");
}

// Function to apply the mode on page load
function applyMode() {
  const modeData = JSON.parse(localStorage.getItem("mode"));
  updateLightModeClasses(modeData.mode === "lightmode");
}

// Assign onclick event handler to inputBtn
document.getElementById("inputBtn").onclick = submitInput;

// Event listener for pressing Enter key
document
  .getElementById("userInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter" && answerGiven) {
      submitInput();
      answerGiven = false; // Update answerGiven status
    }
  });

// Ensure the DOM is fully loaded before assigning the toggleLightMode handler
document.addEventListener("DOMContentLoaded", function () {
  document.querySelector(".profileDiv button").onclick = toggleLightMode;
  applyMode();
});
