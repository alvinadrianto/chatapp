const express = require('express');
const expressEjsLayouts = require('express-ejs-layouts');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');

require('./db');
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const User = require('./models/users');

app.set('view engine', 'ejs');
app.use(expressEjsLayouts);
app.use(cookieParser('secret'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

app.get('/', (req, res) => {
  const cookies = req.cookies;
  if (Object.keys(cookies).length === 0) {
    res.render('index', {
      layout: 'layouts/main-layout',
      title: 'Index',
    });
  } else {
    res.redirect('/home');
  }
});

app.get('/register', (req, res) => {
  const cookies = req.cookies;
  if (Object.keys(cookies).length === 0) {
    res.render('register', {
      layout: 'layouts/main-layout',
      title: 'Register Page',
      message: req.flash('message'),
    });
  } else {
    res.redirect('/home');
  }
});

app.post('/register', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user) {
    req.flash('message', 'Nama user sudah digunakan');
    res.redirect('/register');
  } else {
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    User.insertMany({
      username: req.body.username,
      password: hashPassword,
    })
      .then((result) => {
        req.flash('success', 'Berhasil register');
        res.redirect('/login');
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get('/login', (req, res) => {
  const cookies = req.cookies;
  if (Object.keys(cookies).length === 0) {
    res.render('login', {
      layout: 'layouts/main-layout',
      title: 'Login Page',
      message: req.flash('message'),
      success: req.flash('success'),
    });
  } else {
    res.redirect('/home');
  }
});

app.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) {
    req.flash('message', 'Username atau Password yang dimasukkan salah');
    res.redirect('/login');
  } else {
    const compare = await bcrypt.compare(req.body.password, user.password);
    if (compare) {
      res.cookie('user', req.body);
      res.redirect('/home');
    } else {
      req.flash('message', 'Username atau Password yang dimasukkan salah');
      res.redirect('/login');
    }
  }
});

app.get('/home', (req, res) => {
  const cookies = req.cookies;
  if (Object.keys(cookies).length === 0) {
    req.flash('message', 'Silahkan login terlebih dahulu');
    res.redirect('/login');
  } else {
    res.render('home', {
      layout: 'layouts/main-layout',
      title: 'Home',
      username: cookies.user.username,
    });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.redirect('/login');
});

app.get('/add-contact', async (req, res) => {
  const users = await User.find();
  const cookies = req.cookies;
  const usersFiltered = users.filter((usrs) => usrs.username !== cookies.user.username);
  res.render('add-contact', {
    title: 'Add Contact',
    layout: 'layouts/main-layout',
    users: usersFiltered,
  });
});

app.get('/add/:room', (req, res) => {
  res.redirect(`/${req.params.room}`);
  io.emit('add-contact', { username: req.params.room });
});

app.get('/:room', async (req, res) => {
  res.render('room', {
    title: req.params.room,
    layout: 'layouts/main-layout',
  });
});

io.on('connection', (socket) => {});

httpServer.listen(3000);
