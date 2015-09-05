var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
	body: String,
	author: String,
	upvotes: {type: Number, default: 0},
	downvotes: {type: Number, default: 0},
	created_at : {type: Date},
	updated_at : {type: Date}
});

CommentSchema.pre('save', function(next){
	now = new Date();
	this.updated_at = now;
	if (!this.created_at ){
		this.created_at = now;
	}
	next();
});

CommentSchema.methods.upvote = function(cb) {
	this.upvotes += 1;
	this.save(cb);
};

CommentSchema.methods.downvote = function(cb) {
	this.downvotes += 1;
	this.save(cb);
};

mongoose.model('Comment', CommentSchema);