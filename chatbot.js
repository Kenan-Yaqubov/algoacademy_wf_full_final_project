const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = 3000;

mongoose
  .connect("mongodb://localhost:27017/user_authentication", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

app.use(bodyParser.urlencoded({ extended: true }));

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
let model;

async function init() {
  model = await genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
}

async function getAIResponse(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return response;
  } catch (error) {
    console.error("Error generating content:", error);
    return "Sorry, I encountered an error.";
  }
}

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("chatbot");
});

app.get("/profile", (req, res) => {
  res.render("profile");
});

app.get("/create", (req, res) => {
  res.render("newchat");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/chat", async (req, res) => {
  const userInput = req.body.input;
  const aiResponse = await getAIResponse(userInput);
  res.json({ reply: aiResponse });
});

app.post("/register", async (req, res) => {
  try {
    console.log("Received data:", req.body);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });
    await newUser.save();
    console.log("User saved:", newUser);
    res.redirect('/')
  } catch (err) {
    console.error("Error registering user:", err);
  }
});

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({email: req.body.email});
    if (user && await bcrypt.compare(req.body.password, user.password)) {
      res.redirect('/')
    }
} catch (err) {
    console.log(err)
}
});


app.listen(port, async () => {
  await init();
  console.log(`Server is running on http://127.0.0.1:${port}`);
});
