const express = require("express");
const cookieParser = require("cookie-parser");
const { response } = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  lQZQHa: {
    longURL: "google.com",
    userID: "aJ48lW",
  },
};

const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "1@gmail.com",
    password: "123",
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
  // console.log(users[userID]);
  let templateVars = {
    urls: urlDatabase,
    user: users[userID],
    userID,
    loggedIn: true,
  };
  if (!(userID in users)) {
    console.log("NOTLOGGEDIN");
    templateVars = {
      urls: urlDatabase,
      user: users[userID],
      userID,
      loggedIn: false,
    };
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies.user_id;
  const templateVars = { user: users[userID] };
  if (!(userID in users)) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/login", (req, res) => {
  const userID = req.cookies.user_id;
  const templateVars = { user: users[userID] };
  if (userID in users) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

app.get("/register", (req, res) => {
  const userID = req.cookies.user_id;
  const templateVars = { user: users[userID] };
  console.log(templateVars);
  if (userID in users) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  // const longURLFromForm = req.params.longURL;
  console.log(req.params);
  if (!urlDatabase[shortURL]) {
    res.send(`No such id: ${shortURL}`);
  } else {
    // urlDatabase[shortURL].longURL = longURLFromForm;
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies.user_id;
  const shortURL = req.params.shortURL;
  const templateVars = {
    longURL: urlDatabase[shortURL].longURL,
    shortURL: shortURL,
    user: users[userID],
  };
  if (userID === urlDatabase[shortURL].userID) {
    res.render("urls_show", templateVars);
  } else {
    res.send("Permission denied!");
  }
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
  const userID = req.cookies.user_id;
  if (!(userID in users)) {
    res.send("You need to be logged in to do that!\n");
  } else {
    // console.log("userID in /urls post:", userID);
    const shortURL = generateRandomString();
    // console.log("shortURL in /urls POST:", shortURL);
    const longURL = req.body.longURL;
    if (longURL.match(/https{0,1}:\/\//g)) {
      urlDatabase[shortURL] = { longURL: longURL, userID: userID };
      res.redirect(`/urls/${shortURL}`);
    } else {
      urlDatabase[shortURL] = {
        longURL: "https://" + longURL,
        userID: userID,
      };
      res.redirect(`/urls/${shortURL}`);
    }
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.cookies.user_id;
  const shortURL = req.params.shortURL;
  if (userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.send("Permission denied!");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  // console.log("/urls/:shortURL POST:", shortURL);
  const longURL = req.body.longURL;

  if (longURL.match(/https{0,1}:\/\//g)) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    urlDatabase[shortURL].longURL = "https://" + longURL;
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPass = req.body.password;
  const userID = userLookup(userEmail);

  if (!(userID in users)) {
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
