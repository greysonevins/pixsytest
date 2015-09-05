var app = angular.module('flapperNews', ['ui.router']);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {

		$stateProvider
			.state('home', {
				url: '/home',
				templateUrl: '/home.html',
				controller: 'MainCtrl',
				resolve: {
					commentPromise: ['comments', function(comments){
						return comments.getAll();
					}]
				}
			})
			.state('login', {
				url: '/login',
				templateUrl: '/login.html',
				controller: 'AuthCtrl',
				onEnter: ['$state', 'auth', function($state, auth){
					if (auth.isLoggedIn()){
						$state.go('home');
					}
				}]
			})
			.state('register', {
				url: '/register',
				templateUrl: '/register.html',
				controller: 'AuthCtrl',
				onEnter: ['$state', 'auth', function($state, auth){
					if(auth.isLoggedIn()){
						$state.go('home');
					}
				}]
			});
		$urlRouterProvider.otherwise('home');
	}]);
app.factory('auth', ['$http', '$window', function($http, $window){
	var auth = {};
	auth.logIn = function(user){
	  return $http.post('/login', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};
	auth.saveToken = function (token){
		$window.localStorage['pixsy-user-token'] = token;
	};

	auth.getToken = function(){
		return $window.localStorage['pixsy-user-token'];
	}

	auth.isLoggedIn = function(){
		var token = auth.getToken();

		if(token){
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function(){
		if(auth.isLoggedIn()){
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.email;
		}
	};

	auth.register = function(user){
		return $http.post('/register', user).success(function(data){
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function(){
		$window.localStorage.removeItem('pixsy-user-token');
	};
  return auth;
}])
app.factory('comments', ['$http', 'auth', function($http, auth){
  var o = {
  	comments: []
  };
  o.getAll = function(){
  	return $http.get('/comments').success(function(data){
  		angular.copy(data, o.comments);
  	});
  };
  o.create = function(comment) {
	  return $http.post('/comments', comment, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	    o.posts.push(data);
	  });
	};

	o.upvote = function(comment) {
	return $http.put('/comments/' + comment._id + '/upvote', null, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	    comment.upvotes += 1;
	  });
	};
   return o;
}]);
app.controller('MainCtrl', [
'$scope',
'comments',
function($scope, comments){
	$scope.comments = comments.comments;
	$scope.addPost = function(){
  	if(!$scope.title || $scope.title === '') { return; }
  	comments.create({
  			body: $scope.title,
  			author: $scope.link,
  		});
  	$scope.title = '';
  	$scope.link = '';
	};
	$scope.incrementUpvotes = function(comment) {
	  comments.upvote(comment);
	};
}]);

app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}])
app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);
