angular
  .module("signInUp", ['KM_tools', 'ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/signin', {
        templateUrl: '_signin.html',
        controller: '_signin'
      })
      .when('/signup', {
        templateUrl: '_signup.html',
        controller: '_signup'
      })
      .otherwise({
        templateUrl: '_signin.html',
        controller: '_signin'
      });

  }])
  .controller("signInUp_main", ['$scope', 'common', function($scope, common) {
		common.xhr('isLoggedIn', {}).then(function(msg){
			if (msg) {
				window.location.assign("index.html");
			}
		});
  }])
  .controller("_signin", ['$scope', 'common', function($scope, common) {
		$scope.showAlert = false;
		$scope.errorMsg = '';
    $scope.login = function(){
			common.xhr('signin', $scope.cred).then(function(msg){
				if (msg) {
					$scope.showAlert = true;
					$scope.errorMsg = msg;
				} else {
					window.location.assign("index.html");
				}
			});
		};
  }])
  .controller("_signup", ['$scope', 'common', function($scope, common) {
		$scope.showAlert = false;
		$scope.showAlert_success = false;
		$scope.errorMsg = '';
    $scope.signup = function(){
			console.log($scope.cred);
			if ($scope.cred.email) {
				common.xhr('signup', $scope.cred).then(function(msg){
					if (msg) {
						$scope.showAlert = true;
						$scope.showAlert_success = false;
						$scope.errorMsg = msg;
					} else {
						temp = $scope.cred.username;
						$scope.showAlert = false;
						$scope.showAlert_success = true;
						$scope.errorMsg = 'Sign up successful. Welcome, ' + temp + '!';
					}
				});
			} else {
				$scope.showAlert = true;
				$scope.showAlert_success = false;
				$scope.errorMsg = 'Email is not valid.';
			}
		};
  }]);
