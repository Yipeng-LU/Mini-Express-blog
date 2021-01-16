const express=require('express')
const passport=require('passport');
const router=express.Router();
const User=require('../models/user');
const Post=require('../models/post')
const Comment=require('../models/comment');
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});
router.get('/',function(req,res){
  if (req.isAuthenticated()){
    return res.redirect('/home');
  }
  res.render('index');
});
router.route('/register')
.get(function(req,res){
  res.render('register',{errorMsg:req.flash('errorMsg'),username:req.flash('username')});
})
.post(async function(req,res){
  const username=req.body.username;
  const password=req.body.password;
  const password2=req.body.password2;
  messages=[];
  if (password!==password2){
    messages.push('passwords do not match!')
  }
  if (password.length<8){
    messages.push('passwords is too short!')
  }
  const isExist=await User.findOne({username:username});
  if (isExist){
    messages.push('Username already exists!')
  }
  if (messages.length!==0){
    req.flash('errorMsg',messages)
    req.flash('username',username)
    res.redirect('/register');
    return;
  }
  User.register({username:username},password,function(err,user){
    passport.authenticate('local')(req,res,function(){
      req.flash('successMsg','You have successfully registered!')
      res.redirect('/home')
    })
  })
});

router.route('/login')
.get(function(req,res){
  res.render('login',{errorMsg:req.flash('errorMsg'),successMsg:req.flash('successMsg'),username:req.flash('username')});
})
.post(function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      req.flash('errorMsg',['username or password is incorrect!'])
      req.flash('username',req.body.username);
      return res.redirect('/login');
     }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      req.flash('successMsg','You have successfully logged in!')
      return res.redirect('/home');
    });
  })(req, res, next);
})
router.get('/home',async function(req,res){
  if (req.isAuthenticated()){
    const user=await User.findById(req.user._id).exec();
    res.render('home',{user:user,successMsg:req.flash('successMsg'),errorMsg:req.flash('errorMsg')})
  }else{
    req.flash('errorMsg',['Please log in to view your homepage!'])
    res.redirect('/login')
  }
})
router.get('/logout',function(req,res){
  req.logout();
  req.flash('successMsg','You have successfully logged out!')
  res.redirect('/login');
});
module.exports=router;
