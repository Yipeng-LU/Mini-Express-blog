//jshint esversion:6
require('dotenv').config()
const express=require('express');
const bodyParser=require('body-parser');
const ejs=require('ejs');
const mongoose=require('mongoose');
const session = require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const app=express();
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.use(session({
  secret: 'This is my secret.',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect('mongodb://localhost/myMiniBlogDB', {useNewUrlParser: true,useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  posts:[String],
  comments:[String],
  favouritePosts:[String],
  favouriteComments:[String],
});
userSchema.plugin(passportLocalMongoose);
const postSchema=new mongoose.Schema({
  title:String,
  content:String,
  author:String,
  publishDate:Date,
  likers:[String],
  comments:[String]
})
const commentSchema=new mongoose.Schema({
  content:String,
  author:String,
  publishDate:Date,
  likers:[String],
})
const User=mongoose.model('User',userSchema);
const Post=mongoose.model('Post',userSchema);
const Comment=mongoose.model('Comment',userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});
app.get('/',function(req,res){
  res.render('index');
})
app.listen(process.env.PORT||8000,function(){
  console.log('Listening on port 8000.')
})
