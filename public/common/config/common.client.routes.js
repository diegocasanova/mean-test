angular.module('common').config(['$stateProvider','$urlRouterProvider',
	function($stateProvider,$urlRouterProvider) {
		$stateProvider
	    .state('app', {
	      abstract: true,
	      templateUrl: "common/views/header.tpl.html",
	    })

        .state('login', {
            url: '/signin',
            templateUrl: 'common/views/signin.tpl.html',
            parent: 'app'
        })

        .state('home', {
            url: '/',
            templateUrl: 'home/views/home.client.view.html',
            parent: 'app'
        });

        $urlRouterProvider.otherwise('/');

	}
	]).
run(['$rootScope','$location','Authentication',function($rootScope, $location, Authentication) {
	$rootScope.$on( "$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
		if (!Authentication.isAuthenticated()) {
        // no logged user, redirect to /login
        if ( typeof toState.data != 'undefined' && toState.data.requiresLogin ) {

        	$location.path("/signin");
        }
    }});
}]);

