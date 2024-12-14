// hashPassword.js
const bcrypt = require('bcryptjs');

const password = 'your_chosen_password';

bcrypt.hash(password, 10).then(hash => {
  console.log('Hashed password:', hash);
});
