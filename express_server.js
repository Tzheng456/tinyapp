const express = require("express");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
const helpers = require("./helpers");
const getUserByEmail = helpers.getUserByEmail;
const generateRandomString = helpers.generateRandomString;

const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "session",
    keys: ["cool-side-of-the-pillow"],
  })
);

app.set("view engine", "ejs");

//server starts with empty URL and user databases
const urlDatabase = {};

const users = {};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//GETS

//root directory
app.get("/", (req, res) => {
  const userID = req.session.user_id;

  //redirects to /login if not logged in, else redirect to /urls
  if (!(userID in users)) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

//display a list of short/long urls that a logged-in user has, as well as edit and delete options for each item
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;

  //templateVars.loggedIn is modified to change what is rendered on urls_index
  let templateVars = {
    urls: urlDatabase,
    user: users[userID],
    userID,
    loggedIn: true,
  };

  //renders different elements on urls_index depending whether the user is logged in or not
  if (!(userID in users)) {
    templateVars.loggedIn = false;
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_index", templateVars);
  }
});

//shows a page where a logged-in user may add a new longURL
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = { user: users[userID] };

  //redirects to /login if not logged in
  if (!(userID in users)) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

//a page where an existing user can enter a valid email-password combination to log into their account
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = { user: users[userID] };

  //redirects to /urls if not logged in
  if (userID in users) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

//a page where a user can create an account
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = { user: users[userID] };

  //redirects to /urls if not logged in
  if (userID in users) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", templateVars);
  }
});

//a universal link to a shortURL that anyone can visit
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  //sends an error message if the shortURL does not exist in the server database
  if (!urlDatabase[shortURL]) {
    res.send(`No such id: ${shortURL}`);
  } else {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  }
});

//displays a page showing longURL, and shortURL with a link to the longURL, and an edit form for changing longURL associated with shortURL
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;

  //bundles relevant data to be rendered on urls_show.ejs
  const templateVars = {
    longURL: urlDatabase[shortURL].longURL,
    shortURL: shortURL,
    user: users[userID],
  };

  //checks if the correct user is logged in
  if (userID === urlDatabase[shortURL].userID) {
    res.render("urls_show", templateVars);
  } else {
    res.send("Permission denied!");
  }
});

//prints the JSON string of the URL database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//a Hello page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//POSTS

//adds a new URL to the database with a randomly generated shortURL string for the session user
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;

  //returns to an error if user is not logged in
  if (!(userID in users)) {
    return res.send("You need to be logged in to do that!\n");
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  //matches https:// in the input string, appends https:// before longURL if not matched
  if (!longURL.match(/https{0,1}:\/\/.*/g)) {
    urlDatabase[shortURL] = {
      longURL: "https://" + longURL,
      userID: userID,
    };
    return res.redirect(`/urls/${shortURL}`);
  }

  urlDatabase[shortURL] = { longURL: longURL, userID: userID };
  res.redirect(`/urls/${shortURL}`);
});

//deletes a URL from the URL database if the owner of the URL is logged in
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;

  //checks if the correct user is logged in
  if (userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.send("Permission denied!");
  }
});

//updates an existing shortURL to a different longURL if the owner of the URL is logged in
app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;

  //checks if the correct user is logged in
  if (userID === urlDatabase[shortURL].userID) {
    //matches https:// in the input string, appends https:// before longURL if not matched
    if (!longURL.match(/https{0,1}:\/\/.*/g)) {
      urlDatabase[shortURL] = {
        longURL: "https://" + longURL,
        userID: userID,
      };
      return res.redirect(`/urls/${shortURL}`);
    }
  } else {
    res.send("Permission denied!");
  }
});

//log-in
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  //retrieves userID from users database, undefined if not found
  const userID = getUserByEmail(email, users);

  //returns to error message if user not found
  if (!(userID in users)) {
    return res.send("User not found! Make sure this username is registered.");
  }

  //returns to error message if password is incorrect
  if (!bcrypt.compareSync(password, users[userID].password)) {
    return res.send("Incorrect password!");
  }

  // eslint-disable-next-line camelcase
  req.session.user_id = userID;
  res.redirect("/urls");
});

//delete all session cookies and redirect to /urls
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//register an account
app.post("/register", (req, res) => {
  //generate a random string for userID
  const userID = generateRandomString();
  const { email, password } = req.body;

  //hashes the entered password with salt
  const hashedPassword = bcrypt.hashSync(password, 10);

  //sends an error message if either email or password is omitted
  if (!(email && password)) {
    res.send("Enter email and password!");
  }

  //user is not already in the database -> create new user with the given information and redirect to /urls
  if (!getUserByEmail(email, users)) {
    users[userID] = {
      id: userID,
      email: email,
      password: hashedPassword,
    };
    // eslint-disable-next-line camelcase
    req.session.user_id = userID;
    res.redirect("/urls");
  } else {
    //sends an error corresponding to user already exists in db
    res.send("User already exists!");
  }
});
