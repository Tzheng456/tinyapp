const express = require("express");
const helpers = require("./helpers");
const getUserByEmail = helpers.getUserByEmail;
const generateRandomString = helpers.generateRandomString;
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1"],
  })
);
app.set("view engine", "ejs");

const urlDatabase = {
  // b6UTxQ: {
  //   longURL: "https://www.tsn.ca",
  //   userID: "aJ48lW",
  // },
  // i3BoGr: {
  //   longURL: "https://www.google.ca",
  //   userID: "aJ48lW",
  // },
  // lQZQHa: {
  //   longURL: "google.com",
  //   userID: "aJ48lW",
  // },
};

const users = {
  // aJ48lW: {
  //   id: "aJ48lW",
  //   email: "1@gmail.com",
  //   password: "123",
  // },
  // user2RandomID: {
  //   id: "user2RandomID",
  //   email: "user2@example.com",
  //   password: "dishwasher-funk",
  // },
};

//GETS

app.get("/", (req, res) => {
  const userID = req.session.user_id;
  if (!(userID in users)) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  let templateVars = {
    urls: urlDatabase,
    user: users[userID],
    userID,
    loggedIn: true,
  };
  if (!(userID in users)) {
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
  const userID = req.session.user_id;
  const templateVars = { user: users[userID] };
  if (!(userID in users)) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = { user: users[userID] };
  if (userID in users) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = { user: users[userID] };
  if (userID in users) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.send(`No such id: ${shortURL}`);
  } else {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
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
  const userID = req.session.user_id;
  if (!(userID in users)) {
    res.send("You need to be logged in to do that!\n");
  } else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    if (longURL.match(/https{0,1}:\/\/.*/g)) {
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
  const userID = req.session.user_id;
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
  const userID = getUserByEmail(userEmail, users);

  if (!(userID in users)) {
    console.log("user not found");
    res.redirect(403, "/urls");
  }
  if (!bcrypt.compareSync(userPass, users[userID].password)) {
    console.log("wrong password");
    res.redirect(403, "/urls");
  }
  // eslint-disable-next-line camelcase
  req.session.user_id = getUserByEmail(userEmail, users);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  // eslint-disable-next-line camelcase
  req.session.user_id = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const userEmail = req.body.email;
  const userPass = req.body.password;
  const hashedPassword = bcrypt.hashSync(userPass, 10);
  if (!userEmail || !userPass) {
    res.redirect(400, "/urls");
  }

  if (!getUserByEmail(userEmail, users)) {
    users[userID] = {
      id: userID,
      email: userEmail,
      password: hashedPassword,
    };
    // eslint-disable-next-line camelcase
    req.session.user_id = userID;
    res.redirect("/urls");
  } else {
    res.redirect(400, "/urls");
  }
});
