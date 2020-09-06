// if (process.env.NODE_ENV !== 'production') {
//     require('dotenv').config()
// }

const express = require('express')
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const socketIO = require('socket.io')
const http = require('http').createServer(app);
const users = [];
const port = process.env.PORT || 3000;

// Database config
const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))
const registredUser = require('./models/registredUser')
const MongoStore = require("connect-mongo")(session);

const initializePassport = require('./passport-config');
initializePassport(passport,
    email => registredUser.findOne(email),
    id => registredUser.findOne({ _id: id })
);

app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));

// Custom Requests
app.delete('/logout', (req, res) => {
    req.logOut();
    res.redirect('login');
})

// GET requests
app.get('/', checkAuthenticated, async (req, res) => {
    res.render('chat.ejs', { name: req.user.name, pageTitle: 'Home' });
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs', { pageTitle: 'Login' });
})

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs', { pageTitle: 'Register', errorMessage: "" });
})

app.get('/users', async (req, res) => {
    try {
        const users = await registredUser.find()
        res.send(users);
    } catch (err) {
        res.send(err);
    }
})

// POST Requests
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hasEmailDuplicate = await registredUser.findOne({ email: req.body.email }).exec()
        if (hasEmailDuplicate) {
            return res.render('register.ejs', {
                pageTitle: 'Register',
                errorMessage: 'Adres e-mail w użyciu'
            });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new registredUser({
            email: req.body.email,
            name: req.body.name,
            password: hashedPassword
        })
        await user.save()

        res.redirect("/login");
    } catch {
        res.redirect("/register");
    }
})

// Authentication functions
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next();
}

// Server launch for chat
let server = http.listen(port, () => {
    console.log(`listening on port ${port}`);
});

let connection = socketIO(server)

connection.on('connection', function (clientSocket) {

    clientSocket.on('typing', (data) => {
        clientSocket.broadcast.emit(`typing`, data.name)
    })

    clientSocket.on('chat', (data) => {
        connection.sockets.emit('chat', data);
    });

});