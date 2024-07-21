// Function to add or remove lightmode classes
function updateLightModeClasses(add) {
    const method = add ? 'add' : 'remove';
    document.body.classList[method]("lightmode");
    document
      .querySelectorAll(
        ".blur, .newchat,.response,#welcome, .request, h1.h1, #userInput, button#inputBtn, aside, a#createChatBtn, .profileDiv > div > a > img, .profileDiv > div > button > i, .chat, .grey, .profileDiv"
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
  
  // Apply the mode when the page loads
  document.addEventListener("DOMContentLoaded", applyMode);
  