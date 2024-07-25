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


async function deleteChat(chatId) {
  try {
    const response = await fetch(`/delete-chat/${chatId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    if (data.success) {
      // Remove the chat item from the DOM
      document.querySelector(`li[data-id='${chatId}']`).remove();
      document.querySelector(`div[data-id='${chatId}']`).remove();
      alert('Chat deleted successfully');
    } else {
      alert('Failed to delete chat');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('There was a problem deleting the chat.');
  }
}

function display(el) {
  const li = el.closest("li");
  const div = li.nextElementSibling;

  const isDivVisible = div.classList.contains('display');

  document.querySelectorAll('.liDiv').forEach(d => d.classList.remove('display'));

  if (!isDivVisible) {
    div.classList.add('display');
  }
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
    document.getElementById("userInput").value = "";
    applyMode();
    answerGiven = true;
    inputBtn.disabled = false;
  }
}

function updateLightModeClasses(add) {
  const method = add ? "add" : "remove";
  document.body.classList[method]("lightmode");
  document
    .querySelectorAll(
      ".response, #welcome, .request, h1.h1, #userInput, button#inputBtn, aside, a#createChatBtn, .profileDiv > div > a > img, .profileDiv > div > button > i, .chat, .grey, .profileDiv"
    )
    .forEach((el) => {
      el.classList[method]("lightmode");
    });
}

function toggleLightMode() {
  const modeData = JSON.parse(localStorage.getItem("mode"));
  const newMode = modeData.mode === "darkmode" ? "lightmode" : "darkmode";
  modeData.mode = newMode;
  localStorage.setItem("mode", JSON.stringify(modeData));
  updateLightModeClasses(newMode === "lightmode");
}

function applyMode() {
  const modeData = JSON.parse(localStorage.getItem("mode"));
  updateLightModeClasses(modeData.mode === "lightmode");
}

document.getElementById("inputBtn").onclick = submitInput;

document
  .getElementById("userInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter" && answerGiven) {
      submitInput();
      answerGiven = false; 
    }
  });

document.addEventListener("DOMContentLoaded", function () {
  document.querySelector(".profileDiv button").onclick = toggleLightMode;
  applyMode();
});
