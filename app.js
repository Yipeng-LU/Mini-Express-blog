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
  postTitle:String,
  postId:String,
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
const Post=mongoose.model('Post',postSchema);
const Comment=mongoose.model('Comment',commentSchema);
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
  res.render('register',{errorMsg:req.flash('errorMsg'),username:req.flash('username')});
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
    req.flash('username',username)
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
  res.render('login',{errorMsg:req.flash('errorMsg'),successMsg:req.flash('successMsg'),username:req.flash('username')});
})
.post(function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      req.flash('errorMsg',['username or password is incorrect'])
      req.flash('username',req.body.username);
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
app.get('/create',function(req,res){
  if (req.isAuthenticated()){
    res.render('create',{errorMsg:req.flash('errorMsg'),title:req.flash('title'),content:req.flash('content')});
  }else{
    req.flash('errorMsg',['Please log in to create a post!'])
    res.redirect('/login')
  }
})
app.route('/posts')
.get(async function(req,res){
  const posts=await Post.find({});
  res.render('posts',{posts:posts,errorMsg:req.flash('errorMsg')})
})
.post(async function(req,res){
  if (!req.isAuthenticated()){
    req.flash('errorMsg',['Please log in to create a post!'])
    res.redirect('/login');
    return
  }
  const title=req.body.title;
  const content=req.body.content;
  const errorMsg=[];
  if (title.length>50){
    errorMsg.push('Title should be less than 50 characters!')
  }
  if (content.length<10){
    errorMsg.push('Content should be more than 10 characters!')
  }
  if (errorMsg.length>0){
    req.flash('errorMsg',errorMsg);
    req.flash('content',content);
    req.flash('title',title)
    return res.redirect('/create')
  }
  const user=await User.findById(req.user._id).exec();
  const newPost=new Post({
    title:title,
    content:content,
    author:user.username
  });
  newPost.save();
  user.posts.push(newPost);
  user.save();
  res.redirect('/home');
})
app.get('/posts/:id',async function(req,res){
  const id=req.params.id;
  let post;
  try{
    post=await Post.findById(id);
  }catch{
    req.flash('errorMsg','Cannot find the post!')
    return res.redirect('/posts')
  }
  res.render('post',{post:post,successMsg:req.flash('successMsg'),errorMsg:req.flash('errorMsg'),commentValue:req.flash('commentValue')});
})
app.get('/users/:username',async function(req,res){
  const username=req.params.username;
  const user=await User.findOne({username:username});
  if (!user){
    req.flash('errorMsg','Cannot find the user!')
    return res.redirect('/posts');
  }
  res.render('user',{user:user});
})
app.post('/posts/:id/comments',async function(req,res){
  if (!req.isAuthenticated()){
    req.flash('errorMsg',['Please log in to create a comment!']);
    return res.redirect('/login');
  }
  const content=req.body.content;
  const id=req.params.id;
  if (content.length<10){
    req.flash('errorMsg',['Comment should be at least 10 characters long!']);
    req.flash('commentValue',content)
    return res.redirect('/posts/'+id);
  }
  const post=await Post.findById(id);
  const user=await User.findById(req.user._id);
  const comment=new Comment({
    content:content,
    author:User.username,
    postTitle:post.title,
    postId:id,
  });
  post.comments.push(comment);
  post.save();
  user.comments.push(comment);
  user.save();
  req.flash('successMsg','You have successfully created a comment!')
  res.redirect('/posts/'+id);
})
app.listen(process.env.PORT,function(){
  console.log('Listening on port '+process.env.PORT)
})
