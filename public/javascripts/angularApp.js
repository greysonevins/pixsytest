var app = angular.module('pixsy-test', ['ui.router']);

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
	        if(auth.isLoggedIn()){
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
}])
app.factory('auth', ['$http', '$window', '$rootScope', function($http, $window, $rootScope){
   var auth = {
    saveToken: function (token){
      $window.localStorage['pixsy-token'] = token;
    },
    getToken: function (){
      return $window.localStorage['pixsy-token'];
    },
    isLoggedIn: function(){
      var token = auth.getToken();

      if(token){
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        
        return payload.exp > Date.now() / 1000;
      } else {
        return false;
      }
    },
    currentUser: function(){
      if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));

        return payload.email;
      }
    },
    register: function(user){
      return $http.post('/register', user).success(function(data){
        auth.saveToken(data.token);
      });
    },
    logIn: function(user){
      return $http.post('/login', user).success(function(data){
        auth.saveToken(data.token);
      });
    },
    logOut: function(){
      $window.localStorage.removeItem('pixsy-token');
    }
  };

  return auth;
}])
app.controller('MainCtrl', [
'$scope',
'comments',
function($scope, comments){
	$scope.comments = comments.comments;
	$scope.addPost = function(){
  	if(!$scope.body || $scope.body === '') { return; }
  	comments.create({
  			body: $scope.body
  		});
  	$scope.body = '';
  	$scope.link = '';
	};
	$scope.incrementUpvotes = function(comment) {
	  comments.upvote(comment);
	};
}])

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
