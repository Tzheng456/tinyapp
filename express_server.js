const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

//GETS

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls", (req, res) => {
  const userID = req.cookies.user_id;
  console.log(userID);
  const templateVars = { urls: urlDatabase, user: users[userID] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies.user_id;
  const templateVars = { user: users[userID] };
  res.render("urls_new", templateVars);
});

app.get("/login", (req, res) => {
  const userID = req.cookies.user_id;
  const templateVars = { user: users[userID] };
  if (users[userID]) {
    res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  const userID = req.cookies.user_id;
  const templateVars = { user: users[userID] };
  if (users[userID]) {
    res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies.user_id;
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[userID],
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//POSTS

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPass = req.body.password;
  const userID = userLookup(userEmail);

  if (!userID) {
    res.redirect(403, "/urls");
  }
  if (users[userID].password !== userPass) {
    res.redirect(403, "/urls");
  }
  res.cookie("user_id", userLookup(userEmail));
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const userEmail = req.body.email;
  const userPass = req.body.password;
  if (!userEmail || !userPass) {
    res.redirect(400, "/urls");
  }
  if (!userLookup(userEmail)) {
    users[userID] = {
      id: userID,
      email: userEmail,
      password: userPass,
    };
    res.cookie("user_id", userID);
    console.log("users:", users);
    res.redirect("/urls");
  } else {
    res.redirect(400, "/urls");
  }
});
// eslint-disable-next-line func-style
function generateRandomString() {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

//returns the userID of user with userEmail
// eslint-disable-next-line func-style
function userLookup(userEmail) {
  for (let user in users) {
    if (users[user].email === userEmail) {
      return user;
    }
  }
  return undefined;
}
