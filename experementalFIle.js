let text = `Please provide me with the text you would like me to format.
 I need the content to work with! 😊
 For example, you can tell me: * **"Format this text:"** followed by the text you want me to format. * **"I want you to format this text as a bulleted list:"** followed by the text. * **"Can you make this into a table?"** followed by the text. I can help you with formatting in a variety of ways, such as: * **Lists:** Bulleted, numbered, or nested. * **Tables:** With rows and columns. * **Code:** Highlighting syntax for different programming languages. * **Quotes:** Indentation and attribution. * **Headings:** Different levels for organization. Let me know how I can help!`;

// Replace ** with <b> and </b>
text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

// Replace * with <br>
text = text.replace(/\*/g, "<br>");

console.log(text);
