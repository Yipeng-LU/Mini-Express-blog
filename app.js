//jshint esversion:6
// require('dotenv').config()
const express=require('express');
const bodyParser=require('body-parser');
const ejs=require('ejs');
const mongoose=require('mongoose');
const session = require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const flash=require('connect-flash');
const axios = require('axios');
const methodOverride=require('method-override')

const app=express();

app.set('view engine','ejs');

app.use(flash());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'))

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true,useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const User=require('./models/user');
const Post=require('./models/post')
const Comment=require('./models/comment');

const authRouter=require('./routes/authentication')
app.use('/',authRouter);
const postRouter=require('./routes/posts');
app.use('/posts',postRouter);
const userRouter=require('./routes/users');
app.use('/users',userRouter);

app.listen(process.env.PORT,function(){
  console.log('Listening on port '+process.env.PORT)
})
