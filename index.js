import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();

//Connecting MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017", { dbName: "backend" })
  .then(() => {
    console.log("Database connected");
  })
  .catch((e) => {
    console.log(e);
  });

//Creating schema for MOngoDb
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

//Creating Modal using Schema
const User = mongoose.model("Users", userSchema);

//Using middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const isAuthenticated = async (req, res, next) => {
  //Access cookie
  const token = req.cookies.name;
  if (token) {
    //Only For getting LogedIn User Information
    const decoded = jwt.verify(token, "fjhbdkjsdiwkjssnj");
    req.user = await User.findById(decoded._id);

    next();
  } else {
    res.render("LogIn");
  }
};

const arr = [];

//Setting up view engine
app.set("view engine", "ejs");

//Rendering Html
app.get("/", isAuthenticated, (req, res) => {
  res.render("LogOut", { name: req.user.name });
});
//Rendering Register Page
app.get("/register", (req, res) => {
  res.render("Register");
});

//Rendering LogIn Page
app.get("/login", (req, res) => {
  res.render("LogIn");
});

//For Register Page
app.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  //Hashign password for not saving exect password into the database
  const hashedPass = await bcrypt.hash(password, 10);

  user = await User.create({
    name,
    email,
    password: hashedPass,
  });

  res.redirect("/login");
});

//For Login Page
app.post("/login", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  if (!user) return res.redirect("/register");

  //matching hashed password using bcrypt
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch)
    return res.render("LogIn", { email, message: "Incorrect Password" });

  const token = jwt.sign({ _id: user._id }, "fjhbdkjsdiwkjssnj");

  res.cookie("name", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

//For LogOut Page
app.get("/logout", (req, res) => {
  res.cookie("name", null, {
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

//Saving Name and Email in database
// app.post("/contact", async (req, res) => {
//   const { name, email } = req.body;
//   await Message.create({
//     name,
//     email,
//   });
//   res.render("success");
// });

//Setting Port
app.listen(5000, () => {
  console.log("Server is Listened");
});
