//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({secret: 'creativedevils',name:'cgBlogSessionId',saveUninitialized: false}));

app.use((req, res, next)=>{
  console.log("LOGGLE: " + req.url);
  if(req.session.username == null && req.url != "/" && req.url != "/login" && req.url != "/signup" && req.url != "/home/myself" && req.url != "/home/profile" && req.url != "/signup?button=" )
    res.redirect("/");
  next();
});


 mongoose.connect("mongodb://localhost:27017/newDB");

//mongoose.connect("mongodb+srv://publicUser:gammugum@giantbear.zhoxbpj.mongodb.net/findItDb?retryWrites=true&w=majority");

const postSchema = {
  title: String,
  author: String, 
  content: String,
  likes : Number,
  dislikes: Number
};

const Post = mongoose.model("Post", postSchema);

const userSchema = {
  name: String,
  password: String
};

const User = mongoose.model("User", userSchema);

app.get("/", function(req, res){
  res.render("index");
});

app.get("/logout", function(req, res){
  req.session.destroy((err)=>{})
  res.redirect("/");
});

app.post("/login", function(req, res){

  var username = '^' + req.body.userid + '$';
  var password = req.body.password;
  console.log(username + password);

  User.findOne({
    'name': {'$regex': username,$options:'i'},
    'password': [password]
  }, function(err, user) {
    if (!user) {
      console.log("login error", err);
      res.status(404).send({message: 'Invalid credentials'}); //Send error response here
    } else {
      console.log("login in");
      req.session.loggedIn = true
      req.session.username = req.body.userid
      res.redirect("/home");
    }
  });
});

app.get("/signup", function(req, res){
  res.render("signup");
});

app.post("/signup", function(req, res){

  const username = '^' + req.body.userid + '$';
  User.findOne({'name':{'$regex': username,$options:'i'}},function(err, result) {
      if(!result){
        const user = new User({
          name: req.body.userid,
          password: req.body.password
        });
        user.save();
        req.session.loggedIn = true
        req.session.username = req.body.userid
        res.redirect("/home");
      }else{
        res.status("409").send({message: 'User already exists'})
      }
  });
});


app.get("/home", function(req, res){
 
  Post.find().sort({"title":1})
  Post.find({}, function(err, posts){
    res.render("home", {
      name: req.session.username,
      posts: posts
      });
  }).sort({"title":1});
});

app.get("/home/compose", function(req, res){
  res.render("compose");
});

app.post("/home/compose", function(req, res){
  console.log("username from seesion is:", req.session.username)
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    author: req.session.username,
    likes : 0,
    dislikes:0
  });

  
  post.save(function(err){
    res.redirect("/home");
  })
  Post.find().sort({"title":1})
        
    
  
});

app.get("/home/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("add", {
      title: post.title,
      name: post.author,
      content: post.content
    });
  });

});

app.get("/home/myself", function(req, res){
  res.render("myself");
});

app.get("/home/profile", function(req, res){
  res.render("profile", {contactContent: req.session.username});
});

app.post('/home/post/like',(req,res)=>{
  console.log(req);
  let postId=req.body.postId
  console.log("postid in appjs is:"+postId);
  Post.findByIdAndUpdate(postId, {$inc : {'likes' : 1}}, function(err, post){
      console.log("response post is:" + post)
    if(err){
      console.log("error in updating is:" + err);
    }
    if(!post){
      console.log("post is null or undefined")
    }
    res.status("200").send({message:"Success"});
  });
});

app.post('/home/post/dislike',(req,res)=>{
  console.log(req);
  let postId=req.body.postId
  console.log("postid in appjs is:"+postId);
  Post.findByIdAndUpdate(postId, {$inc : {'dislikes' : 1}}, function(err, post){
      console.log("response post is:" + post)
    if(err){
      console.log("error in updating is:" + err);
    }
    if(!post){
      console.log("post is null or undefined")
    }
    res.status("200").send({message:"Success"});
  });
});

port=process.env.PORT || 3000;
app.listen(port, function() {
  console.log(`Server started on port ${port}`);
});
