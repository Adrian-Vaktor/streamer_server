const express = require('express');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');

const app = express();
const PORT = 4000;
const max_session_lifetime_milliseconds = 1000 * 60 * 60 * 24;


app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: max_session_lifetime_milliseconds },
    resave: false
}));




// parsing the incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//serving public file
app.use(express.static(__dirname));

// cookie parser middleware
app.use(cookieParser());

//username and password
const myusername = 'user1'
const mypassword = 'mypassword'




// a variable to save a session
var session;
var current_sessions = [];


app.get('/', (req,res) => {

    console.log( Object.keys(req.sessionStore.sessions) )
    console.log( sessions )

    // if(session.userid){
    //     res.send("Welcome User <a href=\'/logout'>click to logout</a>");
    // }else
    // res.sendFile('views/index.html',{root:__dirname})

    res.send('views/pooplube')
});

app.get( '/cs/:userId', (req,res) => {
    const newSessionId = req.params.userId
    req.session.regenerate((err) => {
        req.session.customSessionId = newSessionId;
        res.send('new session')
    })
})

app.post('/user',(req,res) => {
    if(req.body.username == myusername && req.body.password == mypassword){
        session=req.session;
        session.userid=req.body.username;
        console.log(req.session)
        res.send(`Hey there, welcome <a href=\'/logout'>click to logout</a>`);
    }
    else{
        res.send('Invalid username or password');
    }
})

app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log(`Server Running at port ${PORT}`));

