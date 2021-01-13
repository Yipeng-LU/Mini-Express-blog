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
const flash=require('connect-flash');

app.set('view engine','ejs');
app.use(flash());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
process.env.DATABASE_URL
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true,useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const commentSchema=new mongoose.Schema({
  content:String,
  author:String,
  postName:String,
  postId:mongoose.Schema.Types.ObjectId,
  publishDate:{ type: Date, default: Date.now },
  likesCount:{ type: Number, default: 0 },
})
const postSchema=new mongoose.Schema({
  title:String,
  content:String,
  author:String,
  publishDate:{ type: Date, default: Date.now },
  likesCount:{ type: Number, default: 0 },
  comments:[commentSchema]
})
const userSchema = new mongoose.Schema({
  username:String,
  password:String,
  posts:[postSchema],
  comments:[commentSchema],
  favouritePosts:[postSchema],
  favouriteComments:[commentSchema],
  followings:[String],
  followerCounts:{ type: Number, default: 0 }
});
userSchema.plugin(passportLocalMongoose);

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
});
app.route('/register')
.get(function(req,res){
  res.render('register',{errorMsg:req.flash('errorMsg')});
})
.post(async function(req,res){
  const username=req.body.username;
  const password=req.body.password;
  const password2=req.body.password2;
  messages=[];
  if (password!==password2){
    messages.push('passwords do not match')
  }
  if (password.length<8){
    messages.push('passwords is too short')
  }
  const isExist=await User.findOne({username:username});
  if (isExist){
    messages.push('Username already exists')
  }
  if (messages.length!==0){
    req.flash('errorMsg',messages)
    res.redirect('/register');
    return;
  }
  User.register({username:username},password,function(err,user){
    passport.authenticate('local')(req,res,function(){
      req.flash('successMsg','You have successfully registered')
      res.redirect('/dashboard')
    })
  })
});

app.route('/login')
.get(function(req,res){
  res.render('login',{errorMsg:req.flash('errorMsg'),successMsg:req.flash('successMsg')});
})
.post(function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      req.flash('errorMsg',['username or password is incorrect'])
      return res.redirect('/login');
     }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      req.flash('successMsg','You have successfully logged in')
      return res.redirect('/home');
    });
  })(req, res, next);
})
app.get('/home',async function(req,res){
  if (req.isAuthenticated()){
    const user=await User.findById(req.user._id).exec();
    res.render('home',{user:user,successMsg:req.flash('successMsg')})
  }else{
    req.flash('errorMsg',['Please log in to view your homepage'])
    res.redirect('/login')
  }
})
app.get('/logout',function(req,res){
  req.logout();
  req.flash('successMsg','You have successfully logged out!')
  res.redirect('/login');
})
app.listen(process.env.PORT,function(){
  console.log('Listening on port '+process.env.PORT)
})
