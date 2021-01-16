const express=require('express')
const router=express.Router();
const axios = require('axios');
const User=require('../models/user');
const Post=require('../models/post')
const Comment=require('../models/comment');

router.get('/create',function(req,res){
  if (req.isAuthenticated()){
    res.render('create',{errorMsg:req.flash('errorMsg'),title:req.flash('title'),content:req.flash('content'),city:req.flash('city')});
  }else{
    req.flash('errorMsg',['Please log in to create a post!'])
    res.redirect('/login')
  }
})
router.route('/')
.get(async function(req,res){
  const posts=await Post.find({}).sort({ starCount : 'desc'}).exec();;
  res.render('posts',{posts:posts,errorMsg:req.flash('errorMsg')})
})
.post(async function(req,res){
  if (!req.isAuthenticated()){
    req.flash('errorMsg',['Please log in to create a post!'])
    return res.redirect('/login');
  }
  const title=req.body.title;
  const content=req.body.content;
  const city=req.body.city;
  const appid=process.env.APPID;
  const errorMsg=[];
  if (title.length>50){
    errorMsg.push('Title should be less than 50 characters!')
  }
  if (content.length<10){
    errorMsg.push('Content should be more than 10 characters!')
  }
  const url=`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${appid}&units=metric`;
  let temperature;
  let weather;
  try{
    const response = await axios.get(url, { json: true });
    const weatherData=response.data;
    temperature=weatherData.main.temp;
    weather=weatherData.weather[0].description;
  }catch{
    errorMsg.push('City name is invalid or weather api quota is exceeded!')
  }
  if (errorMsg.length>0){
    req.flash('errorMsg',errorMsg);
    req.flash('content',content);
    req.flash('title',title);
    req.flash('city',city)
    return res.redirect('/posts/create')
  }
  const user=await User.findById(req.user._id).exec();
  const newPost=new Post({
    title:title,
    content:content,
    author:user.username,
    city:city,
    temperature:temperature,
    weather:weather
  });
  const post=await newPost.save();
  user.posts.push(newPost);
  await user.save();
  res.redirect('/posts/'+String(post._id));
})
router.route('/:id')
.get(async function(req,res){
  const id=req.params.id;
  let post;
  try{
    post=await Post.findById(id);
  }catch{
    req.flash('errorMsg','Cannot find the post!')
    return res.redirect('/posts')
  };
  if (!post){
    req.flash('errorMsg','Cannot find the post!')
    return res.redirect('/posts')
  };
  let starStatus=false;
  if (req.isAuthenticated()){
    const user=await User.findById(req.user._id);
    starStatus=user.favouritePostIds.includes(id);
  }
  res.render('post',{starStatus:starStatus,post:post,successMsg:req.flash('successMsg'),errorMsg:req.flash('errorMsg'),commentValue:req.flash('commentValue')});
})
.put(async function(req,res){
  if (!req.isAuthenticated()){
    req.flash('errorMsg',['Please log in to star a post!']);
    return res.redirect('/login');
  };
  const id=req.params.id;
  const post=await Post.findById(id);
  const user=await User.findById(req.user._id);
  if (user.favouritePostIds.includes(id)){
    post.starCount-=1;
    user.favouritePostIds=user.favouritePostIds.filter(i=>i!==id);
    user.favouritePosts=user.favouritePosts.filter(p=>p._id!=id);
    req.flash('successMsg','You have successfully unstared the post!');
  }else{
    post.starCount+=1;
    user.favouritePostIds.push(id);
    user.favouritePosts.push(post)
    req.flash('successMsg','You have successfully stared the post!')
  }
  user.save();
  post.save();
  res.redirect('/posts/'+id);
})
router.post('/:id/comments',async function(req,res){
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
    author:user.username,
    postTitle:post.title,
    postId:id,
  });
  post.comments.push(comment);
  post.save();
  user.comments.push(comment);
  user.save();
  req.flash('successMsg','You have successfully created a comment!')
  res.redirect('/posts/'+id);
});
module.exports=router;
