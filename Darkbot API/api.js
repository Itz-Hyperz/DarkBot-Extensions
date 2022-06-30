// You will likely need to install all of these:
// npm i passport passport-discord-faxes multer body-parser express-session
const passport = require('passport');
const DiscordStrategy = require('passport-discord-faxes').Strategy;
const multer = require('multer');
const bodyParser = require('body-parser');
const session  = require('express-session');

// These are already installed:
const express = require("express");
const config = require('./apiConfig.js');
const backend = require('./backend.js');

// Actual coding part
module.exports = async function(client, con, app) {
    // Express App Setup
    let multerStorage = multer.memoryStorage()
    app.use(multer({ storage: multerStorage }).any());
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(express.json());
    app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: false,
        cookie: {maxAge: 31556952000},
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.static('public'));
    app.use('/assets', express.static(__dirname + 'public/assets'))
    app.set('views', './views');
    app.set('view engine', 'ejs');
    
    // Passport Setup
    passport.serializeUser(function(user, done) { done(null, user) });
    passport.deserializeUser(function(obj, done) { done(null, obj) });
    passport.use(new DiscordStrategy({
        clientID: config.discord.oauthId,
        clientSecret: config.discord.oauthToken,
        callbackURL: `${(config.domain.endsWith('/') ? config.domain.slice(0, -1) : config.domain)}/auth/discord/callback`,
        scope: ['identify', 'guilds', 'email'],
        prompt: 'consent'
    }, function(accessToken, refreshToken, profile, done) {
        process.nextTick(function() {
            return done(null, profile);
        });
    }));

    // Routes
    app.get('', async function(req, res) {
        res.render('index.ejs');
    });

    app.get('/login', backend.checkAuth, function(req, res) {
        res.redirect('/');
    });

    // Passport Routes
    app.get('/auth/discord', passport.authenticate('discord'));
    app.get('/auth/discord/callback', passport.authenticate('discord', {failureRedirect: '/'}), async function(req, res) {
        req.session?.loginRef ? res.redirect(req.session.loginRef) : res.redirect('/');
        delete req.session?.loginRef
    });

    // Searched the redirects for the page (must be 1 before 404 page)
    config.redirects.forEach(element => {
        app.get(`/${element.name}`, (req, res) => {
            res.redirect(element.link);
        });
    });

    // MAKE SURE THIS IS LAST FOR 404 PAGE REDIRECT
    app.get('*', function(req, res){
        res.render('404.ejs');
    });

    // Log initialization
    setTimeout(async function() {
        client.darkbot.emit('apiReady', (app, config)); // Custom event emitter
    }, 1500);
};