const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const session = require("express-session");
const multer = require("multer");

dotenv.config();

const app = express();
const port = 3000;

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("profilePicture");

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// Connect to multiple databases
const userDbUri = "mongodb://localhost:27017/user_authentication";
const chatsDbUri = "mongodb://localhost:27017/chats";

const userDb = mongoose.createConnection(userDbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const chatsDb = mongoose.createConnection(chatsDbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

userDb.on("error", console.error.bind(console, "UserDB connection error:"));
chatsDb.on("error", console.error.bind(console, "ChatsDB connection error:"));

userDb.once("open", () => {
  console.log("Connected to user_authentication database");
});

chatsDb.once("open", () => {
  console.log("Connected to chats database");
});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  profilePicture: {
    type: String,
    default:
      "https://cdn.business2community.com/wp-content/uploads/2017/08/blank-profile-picture-973460_640.png",
  },
});

const chatSchema = new mongoose.Schema({
  id: Number,
  title: String,
  description: String,
  favourite: Boolean,
  messages: [{
    sender: String, // 'user' or 'ai'
    content: String,
    timestamp: { type: Date, default: Date.now },
  }],
  userId: mongoose.Schema.Types.ObjectId,
});


const User = userDb.model("User", userSchema);
const Chat = chatsDb.model("Chat", chatSchema);

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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
        res.locals.user = user;
      } else {
        delete req.session.userId;
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  }
  next();
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
  const { input, chatId } = req.body; // Extract chatId

  console.log("Received input:", input);
  console.log("Chat ID:", chatId); // Check if chatId is undefined

  if (!chatId) {
    return res.status(400).send("Chat ID is required.");
  }

  try {
    // Fetch the current chat (if applicable)
    const chat = await Chat.findOne({ userId: req.session.userId, id: chatId });

    if (chat) {
      chat.messages.push({
        sender: 'user',
        content: input,
      });

      const aiResponse = await getAIResponse(input);
      chat.messages.push({
        sender: 'ai',
        content: aiResponse,
      });

      await chat.save();
      res.json({ reply: aiResponse });
    } else {
      console.log("Chat not found.");
      res.status(404).send("Chat not found.");
    }
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).send("Error saving message.");
  }
});



app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user && (await bcrypt.compare(req.body.password, user.password))) {
      req.session.userId = user._id;
      res.redirect("/create");
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
});

app.post("/register", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });
    await newUser.save();
    req.session.userId = newUser._id;
    res.redirect("/profile");
  } catch (err) {
    console.error("Error registering user:", err);
    res.redirect("/register");
  }
});

app.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect("/login");
    }
    res.render("profile", { user });
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.redirect("/login");
  }
});

app.post("/profile", upload, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (req.file) {
      console.log("File uploaded:", req.file);
      user.profilePicture = `/uploads/${req.file.filename}`;
      console.log(user.profilePicture);
    }

    if (req.body.newName) {
      user.username = req.body.newName;
    }

    if (req.body.newEmail) {
      user.email = req.body.newEmail;
    }

    if (req.body.newPassword) {
      user.password = await bcrypt.hash(req.body.newPassword, 10);
    }

    await user.save();
    res.redirect("/profile");
  } catch (err) {
    console.error("Error updating profile:", err);
    res.redirect("/profile");
  }
});

app.get("/", async (req, res) => {
  try {
    const newChats = await Chat.find({ userId: req.session.userId }).sort({ id: -1 });
    const user = await User.findById(req.session.userId);
    res.render("chatbot", { newChats, user });
  } catch (err) {
    console.error("Error rendering chat:", err);
    res.status(500).send("Error rendering chat.");
  }
});



app.post("/create", async (req, res) => {
  try {
    let chatName = req.body.chatname || "New Chat";
    let description = req.body.description || "No Description";

    const chats = await Chat.find({});
    let largestChatID = chats.length ? Math.max(...chats.map(chat => chat.id)) : 0;

    // Create a new Chat document
    const newChat = new Chat({
      title: chatName,
      description: description,
      userId: req.session.userId,
      id: largestChatID + 1,
      messages: [],
      favourite: false,
    });

    await newChat.save();

    // No need to store newChats in session, just redirect to the home page
    res.redirect('/');
  } catch (err) {
    console.error("Error creating chat:", err);
    res.status(500).send("Server error while creating chat.");
  }
});

app.get('/get-chat/:id', async (req, res) => {
  const chatId = parseInt(req.params.id, 10);
  
  if (isNaN(chatId)) {
    return res.status(400).send("Invalid chat ID");
  }

  try {
    const chat = await Chat.findOne({ id: chatId, userId: req.session.userId });
    if (!chat) {
      return res.status(404).send("Chat not found");
    }

    res.json({ chat });
  } catch (err) {
    console.error("Error fetching chat:", err);
    res.status(500).send("Server error while fetching chat.");
  }
});


app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.redirect("/login");
  });
});


app.post("/", async (req, res) => {
  const chatId = parseInt(req.body.chatId, 10);
  console.log(`Received chatId: ${chatId}`); // Log the chatId value
  const editChatTitle = req.body.editChatTitle;
  const editChatDesc = req.body.editChatDesc;

  if (isNaN(chatId)) {
    return res.status(400).send("Invalid chat ID");
  }

  try {
    const chat = await Chat.findOne({ id: chatId });
    if (chat) {
      chat.title = editChatTitle || chat.title;
      chat.description = editChatDesc || chat.description;
      await chat.save();
      res.redirect('/');
    } else {
      res.status(404).send("Chat not found");
    }
  } catch (err) {
    console.error("Error updating chat:", err);
    res.status(500).send("Server error while updating chat.");
  }
});


app.delete('/delete-chat/:id', async (req, res) => {
  const chatId = parseInt(req.params.id);

  try {
    const result = await Chat.deleteOne({ id: chatId });

    if (result.deletedCount > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Chat not found' });
    }
  } catch (error) {
    console.error('Error deleting chat:', error);
  }
});

app.get("/favs", async (req, res) => {
  try {
    // Fetch favourite chats
    const favouriteChats = await Chat.find({ userId: req.session.userId, favourite: true }).sort({ id: -1 });
    const user = await User.findById(req.session.userId);
    res.render("favourites", { favouriteChats, user });
  } catch (err) {
    console.error("Error rendering favourite chats:", err);
    res.status(500).send("Error rendering favourite chats.");
  }
});

app.post("/toggle-favourite", async (req, res) => {
  const chatId = parseInt(req.body.chatId, 10);
  
  if (isNaN(chatId)) {
    return res.status(400).send("Invalid chat ID");
  }

  try {
    const chat = await Chat.findOne({ id: chatId, userId: req.session.userId });
    if (!chat) {
      return res.status(404).send("Chat not found");
    }

    // Toggle the favourite status
    chat.favourite = !chat.favourite;
    await chat.save();

    res.json({ success: true, favourite: chat.favourite });
  } catch (err) {
    console.error("Error toggling favourite:", err);
    res.status(500).send("Server error while toggling favourite.");
  }
});




app.listen(port, async () => {
  await init();
  console.log(`Server is running on http://127.0.0.1:${port}`);
});
