const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const session = require("express-session");
const multer = require('multer');

dotenv.config();

const app = express();
const port = 3000;

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).single('profilePicture');

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
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
  profilePicture: { type: String, default: "https://cdn.business2community.com/wp-content/uploads/2017/08/blank-profile-picture-973460_640.png" },
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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
  res.render("chatbot");
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

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user && (await bcrypt.compare(req.body.password, user.password))) {
      req.session.userId = user._id;
      res.redirect("/profile");
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
      console.log(user.profilePicture)
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


app.listen(port, async () => {
  await init();
  console.log(`Server is running on http://127.0.0.1:${port}`);
});
