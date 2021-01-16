const express=require('express')
const router=express.Router();
const User=require('../models/user');
const Post=require('../models/post')
const Comment=require('../models/comment');
router.route('/:username')
.get(async function(req,res){
  const username=req.params.username;
  const user=await User.findOne({username:username});
  if (!user){
    req.flash('errorMsg','Cannot find the user!')
    return res.redirect('/posts');
  }
  let followStatus=false;
  if (req.isAuthenticated()){
    const myself=await User.findById(req.user._id);
    if (myself.followings.includes(username)){
      followStatus=true;
    }
  }
  res.render('user',{followStatus:followStatus,user:user,successMsg:req.flash('successMsg')});
})
.put(async function(req,res){
  const action=req.body.btn;
  if (action==='follow'){
    if (!req.isAuthenticated()){
      req.flash('errorMsg',['Please log in to follow a user!']);
      return res.redirect('/login');
    };
    const username=req.params.username;
    const user=await User.findOne({username:username});
    const myself=await User.findById(req.user._id);
    if (myself.followings.includes(username)){
      myself.followings=myself.followings.filter(f=>f!==username);
      user.followerCount-=1;
      req.flash('successMsg','You have successfully unfollowed this user!');
    }else{
      myself.followings.push(username);
      user.followerCount+=1;
      req.flash('successMsg','You have successfully followed this user!');
    }
    myself.save();
    user.save();
    return res.redirect('/users/'+username)
  }
  else if (action==='intro'){
    if (!req.isAuthenticated()){
      req.flash('errorMsg',['Please log in to edit your intro!']);
      return res.redirect('/login');
    };
    const username=req.params.username;
    const user=await User.findOne({username:username});
    if (user._id!=req.user._id){
      req.flash('errorMsg',['You are not allowed to edit others introduction!']);
      return res.redirect('/home');
    }
    const intro=req.body.intro;
    if (intro.length<10){
      req.flash('errorMsg',['Introduction should be at least 10 characters long!']);
      req.flash('intro',intro);
      return res.redirect(`/users/${username}/edit`);
    }
    user.intro=intro;
    user.save();
    req.flash('successMsg','You have successfully updated your introduction!')
    return res.redirect('/home');
  }
})


router.get('/',async function(req,res){
  const users=await User.find({}).sort({ followerCount : 'desc'}).exec();
  res.render('users',{users:users})
})
router.get('/:username/edit',async function(req,res){
  if (!req.isAuthenticated()){
    req.flash('errorMsg',['Please log in to edit your intro!']);
    return res.redirect('/login');
  };
  const username=req.params.username;
  const user=await User.findOne({username:username});
  if (!user){
    req.flash('errorMsg','Cannot find the user!');
    return res.redirect('/home')
  }
  if (user._id!=req.user._id){
    req.flash('errorMsg',['You are not allowed to edit others introduction!']);
    return res.redirect('/home');
  }
  res.render('edit',{user:user,intro:req.flash('intro'),errorMsg:req.flash('errorMsg')});
})
module.exports=router;
