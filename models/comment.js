const mongoose=require('mongoose');
const commentSchema=new mongoose.Schema({
  content:String,
  author:String,
  postTitle:String,
  postId:String,
  publishDate:{ type: Date, default: Date.now },
})
const Comment=mongoose.model('Comment',commentSchema);
module.exports=Comment;
