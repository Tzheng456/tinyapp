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

module.exports = getUserByEmail;
