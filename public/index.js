angular
.module("index", ['KM_tools', 'ngRoute', 'socket.io', 'infinite-scroll'])
.config(['$routeProvider', function ($routeProvider) {
			$routeProvider
			.when('/search', {
				templateUrl : '_search.html',
				controller : '_search'
			})
			.when('/borrowed', {
				templateUrl : '_borrowed.html',
				controller : '_borrowed'
			})
			.when('/lent', {
				templateUrl : '_lent.html',
				controller : '_lent'
			})
			.when('/mylist', {
				templateUrl : '_mylist.html',
				controller : '_mylist'
			})
			.when('/new', {
				templateUrl : '_edit.html',
				controller : '_new'
			})
			.when('/edit/:itemId', {
				templateUrl : '_edit.html',
				controller : '_edit'
			})
			.when('/user/:userId', {
				templateUrl : '_user.html',
				controller : '_user'
			})
			.when('/editUser', {
				templateUrl : '_editUser.html',
				controller : '_editUser'
			})
			.when('/directDb', {
				templateUrl : '_directDb.html',
				controller : '_directDb'
			})
			.otherwise({
				templateUrl : '_search.html',
				controller : '_search'
			});
		}
	])
.config(['$socketProvider', 'configPara', function ($socketProvider, configPara) {
			$socketProvider.setConnectionUrl(configPara.ip);
		}
	])
.service('rootData', ['common', '$socket', '$rootScope', function (common, $socket, $rootScope) {
			var listData = {
				search : [],
				borrowed : [],
				lent : [],
				mylist : []
			},
			historyRec = {
				data : ['', '', '', '', '', '', '', '', '', ''],
				ptr : 0,
				showBackArrow : false
			};
			this.historyRec = historyRec;
			this.historyRec.set = function (url, level) {
				historyRec.showBackArrow = (level < 2) ? false : true;
				historyRec.ptr = level;
				historyRec.data[level] = url;
			};
			this.historyRec.push = function (url) {
				historyRec.showBackArrow = true;
				historyRec.data[++historyRec.ptr] = url;
			};
			this.historyRec.pop = function (url) {
				if (historyRec.ptr > 0) {
					--historyRec.ptr;
					if (historyRec.ptr === 0) {
						historyRec.showBackArrow = false;
					}
				}
			};
			this.listData = listData;
			var UpdateAll = function () {
				return common.xhr('getAllData', {}).then(function (data) {
					Object.keys(data).forEach(function (key) {
						listData[key] = data[key];
					});
					return listData;
				});
			};
			this.UpdateAll = UpdateAll;
			$socket.on('connect', UpdateAll);
			$socket.on('update', function () {
				console.log('update received');
				UpdateAll();
			});
			Object.keys(listData).forEach(function (key) {
				$socket.on('update ' + key, function (data, fn) {
					listData[key] = data;
					fn(); //fn() will run on the server side
				});
			});
		}
	])
.controller("index_main", ['$scope', 'common', 'rootData', function ($scope, common, rootData) {
			$scope.showAlert = false;
			$scope.errorMsg = '';
			$scope.historyRec = rootData.historyRec;
			common.xhr('isLoggedIn', {}).then(function (msg) {
				if (msg) {
					rootData.UpdateAll().then(function (listData) {
						console.log(rootData.listData)
					});
				} else {
					window.location.assign("signInUp.html");
				}
			});
			$scope.logoff = function () {
				common.xhr('logoff', {}).then(function (msg) {
					if (msg) {
						$scope.showAlert = true;
						$scope.errorMsg = msg;
					} else {
						window.location.assign("signInUp.html");
					}
				});
			};
			$scope.GoBack = function () {
				if (rootData.historyRec.ptr > 1) {
					rootData.historyRec.ptr = rootData.historyRec.ptr - 2;
					window.location.assign('#/' + rootData.historyRec.data[rootData.historyRec.ptr + 1]);
				}
			};
		}
	])
.controller("_search", ['$scope', 'common', 'rootData', function ($scope, common, rootData) {
			rootData.historyRec.set('search', 1);
			//console.log(rootData.historyRec.data, rootData.historyRec.ptr);
			$scope.listData = rootData.listData;
			$scope.showAlert = false;
			$scope.errorMsg = '';
			$scope.itemsInList = 5;
			$scope.LoadMore = function () {
				$scope.itemsInList = $scope.itemsInList + 5;
			};
			$scope.SearchItem = function () {
				common.xhr('SearchItem', {
					searchString : $scope.search
				}).then(function (items) {
					$scope.items = items;
				});
			};
			$scope.GrabItem = function (itemId) {
				common.xhr('GrabItem', {
					id : itemId
				}).then(function (msg) {
					if (msg) {
						$scope.showAlert = true;
						$scope.errorMsg = msg + 'error';
					} else {
						$scope.showAlert = true;
						$scope.errorMsg = 'One item got!';
					}
				});
			};
		}
	])
.controller("_borrowed", ['$scope', 'common', 'rootData', function ($scope, common, rootData) {
			rootData.historyRec.set('borrowed', 1);
			$scope.listData = rootData.listData;
			$scope.showAlert = false;
			$scope.errorMsg = '';
			$scope.itemsInList = 5;
			$scope.LoadMore = function () {
				$scope.itemsInList = $scope.itemsInList + 5;
			};
		}
	])
.controller("_lent", ['$scope', 'common', 'rootData', function ($scope, common, rootData) {
			rootData.historyRec.set('lent', 1);
			$scope.listData = rootData.listData;
			$scope.showAlert = false;
			$scope.errorMsg = '';
			$scope.itemsInList = 5;
			$scope.LoadMore = function () {
				$scope.itemsInList = $scope.itemsInList + 5;
			};
			$scope.ReceiveItem = function (holderId, itemId) {
				console.log(itemId);
				common.xhr('ReceiveItem', {
					from : holderId,
					item : itemId
				}).then(function (msg) {
					if (msg) {
						$scope.showAlert = true;
						$scope.errorMsg = msg + 'error';
					} else {
						$scope.showAlert = true;
						$scope.errorMsg = 'One item got back!';
					}
				});
			};
		}
	])
.controller('_mylist', ['$scope', 'common', 'rootData', function ($scope, common, rootData) {
			rootData.historyRec.push('mylist');
			$scope.listData = rootData.listData;
			$scope.itemsInList = 5;
			$scope.LoadMore = function () {
				$scope.itemsInList = $scope.itemsInList + 5;
			};
		}
	])
.controller('_new', ['$scope', 'common', 'rootData', function ($scope, common, rootData) {
			rootData.historyRec.push('new');
			$scope.showQuantity = true;
			$scope.item = {
				MLS : 123,
				quantity : 2,
				street : '1 king st',
				city : 'London',
				province : 'FS',
				postcode : 'H0H0H0',
				description : 'good location'
			};
			$scope.ChangeItem = function () {
				common.xhr('NewItem', $scope.item).then(function (msg) {
					if (msg) {
						$scope.showAlert = true;
						$scope.errorMsg = msg + 'error';
					} else {
						$scope.showAlert = true;
						$scope.errorMsg = 'Item created!';
					}
				});
			};
		}
	])
.controller('_edit', ['$scope', 'common', 'rootData', '$routeParams', function ($scope, common, rootData, $routeParams) {
			rootData.historyRec.push('edit/' + $routeParams.itemId);
			$scope.showQuantity = false;
			common.xhr('GetItem', {
				id : $routeParams.itemId
			}).then(function (item) {
				$scope.item = item;
			});
			$scope.ChangeItem = function () {
				common.xhr('UpdateItem', $scope.item).then(function (msg) {
					if (msg) {
						$scope.showAlert = true;
						$scope.errorMsg = msg;
					} else {
						$scope.showAlert = true;
						$scope.errorMsg = 'Item updated!';
					}
				});
			};
			$scope.DeleteItem = function () {
				common.xhr('DeleteItem', $scope.item).then(function (msg) {
					if (msg) {
						$scope.showAlert = true;
						$scope.errorMsg = msg;
					} else {
						$scope.showAlert = true;
						$scope.errorMsg = 'Item deleted!';
						rootData.UpdateAll();
					}
				});
			};
		}
	])
.controller('_user', ['$scope', 'common', 'rootData', '$routeParams', function ($scope, common, rootData, $routeParams) {
			rootData.historyRec.push('user/' + $routeParams.userId);
			common.xhr('GetUser', {
				id : $routeParams.userId
			}).then(function (tempUser) {
				$scope.user = tempUser;
				common.xhr('GetUser', {})
				.then(function (tempUser2) {
					$scope.isThisUser = (Number($routeParams.userId) === tempUser2.id);
				});
			});
		}
	])
.controller('_editUser', ['$scope', 'common', 'rootData', '$routeParams', function ($scope, common, rootData, $routeParams) {
			rootData.historyRec.push('editUser/');
			common.xhr('GetUser', {}).then(function (user) {
				$scope.user = user;
			});
			$scope.UpdateUser = function () {
				common.xhr('UpdateUser', $scope.user).then(function (msg) {
					if (msg) {
						$scope.showAlert = true;
						$scope.errorMsg = msg;
					} else {
						$scope.showAlert = true;
						$scope.errorMsg = 'User updated!';
					}
				});
			};
		}
	])
.controller('_directDb', ['$scope', 'common', 'rootData', '$routeParams', function ($scope, common, rootData, $routeParams) {
			rootData.historyRec.push('directDb/');
			$scope.item = {content: '', command: ''};
			$scope.DirectDb = function () {
				$scope.item.content += '--- COMMAND --- \n';
				$scope.item.content += $scope.item.command;
				$scope.item.content += '\n--- RESPONSE --- \n';
				common.xhr('DirectDb', {command: $scope.item.command}).then(function (msg) {
					$scope.item.command = '';
					$scope.item.content += JSON.stringify(msg);
					$scope.item.content += '\n\n';
					setTimeout(function(){
						document.getElementById("textarea1").scrollTop = document.getElementById("textarea1").scrollHeight;
					}, 200);
					
				});
			};
		}
	]);