(function (root) {
	'use strict';

	function factory(angular, Spinner) {
		return angular
			.module("KM_tools", ['angularSpinner'])
			.constant('configPara', {
				ip: 'http://localhost:3000',
				//ip: 'https://nodesam03.herokuapp.com',
				api: '/ajax/'
			})
			// .service('configPara', function(){
				// this.ip = 'http://localhost:3000';
				// this.api = '/ajax/';
			// })
			.service('common', ['$http', '$q', 'usSpinnerService', 'configPara', function($http, $q, usSpinnerService, configPara){
				this.xhr = function(method, data){
					//return $q.resolve('error');
					usSpinnerService.spin('spinner-1');
					return $http.post(configPara.ip + configPara.api + method, data, {withCredentials: true}).then(function(data){
						usSpinnerService.stop('spinner-1');
						return data.data;
					});
				}
			}]);
	}

	if (typeof define === 'function' && define.amd) {
		/* AMD module */
		define(['angular', 'spin'], factory);
	} else {
		/* Browser global */
		factory(root.angular);
	}
}(window));