const mongoose=require('mongoose');
const passportLocalMongoose=require('passport-local-mongoose');
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
const userSchema = new mongoose.Schema({
  username:String,
  password:String,
  posts:[postSchema],
  comments:[commentSchema],
  favouritePosts:[postSchema],
  favouritePostIds:[String],
  followings:[String],
  followerCount:{ type: Number, default: 0 },
  intro:{ type: String, default: '' }
});
userSchema.plugin(passportLocalMongoose);
const User=mongoose.model('User',userSchema);
module.exports=User;
