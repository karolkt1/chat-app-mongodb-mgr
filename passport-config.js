const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const registredUser = require('./models/registredUser')

async function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    const user = await registredUser.findOne({ email: email });
    if (user == null) {
      return done(null, false, { message: 'Nie ma takiego email w bazie' })
    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Błędne hasło' })
      }
    } catch (e) {
      return done(e)
    }

  }

  passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, authenticateUser))

  passport.serializeUser((user, done) => done(null, user._id))

  passport.deserializeUser(async (id, done) => {
    // const user = await registredUser.findOne({ _id: id })
    const user = await registredUser.findById(id)
      .then((user) => { done(null, user); })
      .catch((err) => { done(err, null); });
  })
}

module.exports = initialize