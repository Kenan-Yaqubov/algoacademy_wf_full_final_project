// Define answerGiven globally or in a scope accessible to both functions
let answerGiven = true;
document.getElementById("userInput").disabled = true;

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
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    if (data.success) {
      // Remove the chat item from the DOM
      document.querySelector(`li[data-id='${chatId}']`).remove();
      document.querySelector(`div[data-id='${chatId}']`).remove();
      alert("Chat deleted successfully");
    } else {
      alert("Failed to delete chat");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("There was a problem deleting the chat.");
  }
}

function display(el) {
  const li = el.closest("li");
  if (!li) return; 

  const div = li.nextElementSibling;
  if (!div) return; 

  const isDivVisible = div.classList.contains("display");
  document.querySelectorAll(".liDiv").forEach(d => d.classList.remove("display"));

  if (!isDivVisible) {
    div.classList.add("display");
  }

  if (li.parentElement.classList.contains('respAside')) {
    li.parentElement.style.display = 'block';
  }
}


function display2(el, divClass, divClass2) {
  const div = el.nextElementSibling;

  const isDivVisible = div.classList.contains("display");

  document
    .querySelectorAll(`.${divClass}, .${divClass2}`)
    .forEach((d) => d.classList.remove("display"));

  document.querySelector("main").style.zIndex = "-1";

  if (!isDivVisible) {
    div.classList.add("display");
  }
}

async function switchChat(chatId) {
  try {
    document.getElementById("userInput").disabled = false;

    localStorage.setItem("chatId", chatId);
    const response = await fetch(`/get-chat/${chatId}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    displayChatMessages(data.chat);
  } catch (error) {
    console.error("Error:", error);
    alert("There was a problem loading the chat.");
  }
}
function displayChatMessages(chat) {
  const chatMessagesContainer = document.querySelector(".response_request");
  chatMessagesContainer.innerHTML = ""; // Clear current messages

  if (chat.messages.length === 0) {
    const startMessage = document.createElement("h1");
    startMessage.classList.add("startMessage");
    startMessage.textContent = "Start your legendary chat!";
    chatMessagesContainer.appendChild(startMessage);
  } else {
    chatMessagesContainer.innerHTML = "";
    chat.messages.forEach((message) => {
      const messageDiv = document.createElement("div");
      messageDiv.classList.add(
        message.sender === "user" ? "request" : "response",
        "fade-in"
      );

      let formattedContent = message.content.replace(/## (.*?)(\n|$)/g, "<h2>$1</h2>$2");
      formattedContent = formattedContent.replace(/\*\s\*\*(.*?)\*\*/g, "<br><br><b>$1</b>");
      formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, "<b>$1</b><br>");
      formattedContent = formattedContent.replace(/\*/g, "<br>");

      messageDiv.innerHTML = `
        <b style="position:relative;top: 10px;">${message.sender === "user" ? "User" : "Chatbot"}:</b>
        <p>${formattedContent || "No content"}</p> <!-- Handle undefined content -->
      `;
      chatMessagesContainer.appendChild(messageDiv);
    });
    chatMessagesContainer.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' }); // Scroll to the last message
  }

  applyMode(); // Apply the current mode (light/dark)
}

// Add event listeners for chat items
document.querySelectorAll(".chat").forEach((chat) => {
  chat.addEventListener("click", function () {
    const chatId = this.getAttribute("data-id");
    switchChat(chatId);
  });
});

async function submitInput() {
  const input = document.getElementById("userInput").value;
  const inputBtn = document.getElementById("inputBtn");
  const chatMessagesContainer = document.querySelector(".response_request");

  if (input.trim() === "") return;

  inputBtn.disabled = true;

  // Remove the start message if it exists
  const startMessage = document.querySelector(".startMessage");
  if (startMessage) {
    startMessage.remove();
  }

  const userMessage = document.createElement("div");
  userMessage.classList.add("request", "fade-in");
  userMessage.innerHTML = `
      <b style="position:relative;top: 10px;">User:</b>
      <p>${input}</p>
    `;

  chatMessagesContainer.appendChild(userMessage);
  applyMode();

  userMessage.scrollIntoView({ behavior: 'smooth', block: 'end' }); // Scroll to user message

  let chatId = localStorage.getItem("chatId");

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input, chatId }),
    });

    if (!response.ok) {
      const errorText = await response.text(); // Read the error response
      throw new Error(
        `Network response was not ok: ${response.statusText}. ${errorText}`
      );
    }

    const data = await response.json();

    let text = data.reply.replace(/## (.*?)(\n|$)/g, "<h2>$1</h2>$2");
    text = text.replace(/\*\s\*\*(.*?)\*\*/g, "<br><br><b>$1</b>");
    text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b><br>");
    text = text.replace(/\*/g, "<br>");

    const chatbotMessage = document.createElement("div");
    chatbotMessage.classList.add("response", "fade-in");
    chatbotMessage.innerHTML = `
        <b style="position:relative;top: 10px;">Chatbot:</b>
        <p>${text || "No response"}</p> <!-- Handle undefined response -->
      `;

    chatMessagesContainer.appendChild(chatbotMessage);
    chatbotMessage.scrollIntoView({ behavior: 'smooth', block: 'end' }); // Scroll to chatbot message
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  } finally {
    document.getElementById("userInput").value = "";
    applyMode();
    answerGiven = true;
    inputBtn.disabled = false;
  }
}

function toggleFavourite(chatId, element) {
  fetch(`/toggle-favourite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chatId }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Toggle the icon class based on the new favourite status
        const icon = element.querySelector("i");
        if (data.favourite) {
          icon.classList.add("fav");
        } else {
          icon.classList.remove("fav");
        }
      } else {
        alert("Failed to toggle favourite status");
      }
    })
    .catch((error) => console.error("Error updating favourite status:", error));
}

function searchChats() {
  const input = document.getElementById("searchBar").value.toLowerCase();
  const chats = document.querySelectorAll("#chats .chat");

  chats.forEach((chat) => {
    const title = chat.textContent.toLowerCase();
    if (title.includes(input)) {
      chat.style.display = "block";
    } else {
      chat.style.display = "none";
    }
  });
}

function displayRespAsideFn() {
  let respAside = document.querySelector(".respAside");
  respAside.classList.toggle("displayAside");
}

function twofn(arg) {
  switchChat(arg);
  displayRespAsideFn();
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
