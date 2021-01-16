const mongoose=require('mongoose');
const commentSchema=new mongoose.Schema({
  content:String,
  author:String,
  postTitle:String,
  postId:String,
  publishDate:{ type: Date, default: Date.now },
})
const postSchema=new mongoose.Schema({
  title:String,
  content:String,
  author:String,
  city:String,
  weather:String,
  temperature:Number,
  publishDate:{ type: Date, default: Date.now },
  starCount:{ type: Number, default: 0 },
  comments:[commentSchema]
})
const Post=mongoose.model('Post',postSchema);
module.exports=Post;
