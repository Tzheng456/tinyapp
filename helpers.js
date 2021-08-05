//returns the userID of user with userEmail
// eslint-disable-next-line func-style
function getUserByEmail(userEmail, users) {
  for (let user in users) {
    if (users[user].email === userEmail) {
      return user;
    }
  }
  return undefined;
}

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

module.exports = { getUserByEmail, generateRandomString };
