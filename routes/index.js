var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
module.exports = router;



var mongoose = require('mongoose');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');


var auth = jwt({secret: 'SECRET', userProperty: 'payload'});


router.get('/comments', function(req, res,next){
	Comment.find(function(err, comments){
		if (err){ return next(err); }

		res.json(comments);
	});
});

router.post('/comments', auth,  function(req, res, next) {
  var comment = new Comment(req.body);
  comment.author = req.payload.email;
  comment.save(function(err, comment){
    if(err){ return next(err); }

    res.json(comment);
  });
});

router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find comment')); }

    req.comment = comment;
    return next();
  });
});

router.put('/comments/:comment/upvote', auth, function(req, res, next){
	req.comment.upvote(function(err, comment){
		if (err) {return next(err); }
		res.json(comment);
	});
});

router.post('/register', function(req, res, next){
	if(!req.body.email || !req.body.password){
		  return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.email;

  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
});

router.post('/login', function(req, res, next){
	if (!req.body.email || !req.body.password){
		 return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});
