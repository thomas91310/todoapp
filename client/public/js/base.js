var todolist = angular.module('todolist', ['mgcrea.ngStrap', 'ngAnimate', 'ui']);

todolist.directive('ngBlur', function() {
    return function(scope, elem, attrs) {
        elem.bind('blur', function() {
            scope.$apply(attrs.ngBlur);
        });
    }
});

todolist.controller('TodoCtrl', ['$scope', 'filterFilter', '$http', '$modal', '$location', function($scope, filterFilter, $http, $modal, $location) {

    $scope.placeholder = "Loading";
    $scope.choiceFilter = {}; //filter actives, done, all
    $scope.userLoggedIn = undefined; //user logged in : Todo.USER

    //MODALS
    var modalSignup = $modal({scope: $scope, template: 'modalSignup.html', animation: "am-fade-and-scale", show: false});
    var modalResult = $modal({scope: $scope, template: 'modalResult.html', animation: "am-flip-x", show: false});

    if($location.path() == '') {
        $location.path('/');
    }

    $scope.location = $location; //set the location

    $scope.showModal = function(modalName) {
        if (modalName == "signup") {
            modalSignup.$promise.then(modalSignup.show);
            $scope.formData.emailSignup = undefined;
            $scope.formData.passwordSignup = undefined;
        }
        else if (modalName == "result")
            modalResult.$promise.then(modalResult.show);
    };

    $scope.$watch('todos', function() {  //watching todos, call each time a todo is changed.
        if ($scope.todos != undefined) {
            $scope.remaining = filterFilter($scope.todos, {is_complete: false}).length;
            $scope.allChecked = !$scope.remaining;
            $scope.todos.forEach(function(todo) {
                var toUpdate = { };
                toUpdate.todoId = todo.id;
                toUpdate.data = { description: todo.description, is_complete: todo.is_complete };
                Todo.updateTodo(toUpdate);   //send todo to API
            });
        }
    }, true);

    $scope.$watch('location.path()',function(path) {  //depending on the location, display the proper todos
        $scope.choiceFilter = (path == '/actives') ? {is_complete: false} :
                              (path == '/done') ? {is_complete: true} :
                              null;
    },true);

    $scope.removeTodo = function (index) {   //Remove a todo from the list. Works on the client side only, no route to delete a todo.
        var toRemove = $scope.todos[index];
        $scope.todos.splice(index, 1);
    };

    $scope.editTodo = function(todo) { //edit a todo.
        todo.editing = false;
        var options = {};
        options.todoId = todo.id;
        options.data = { description: todo.description, is_complete: todo.is_complete };
        Todo.updateTodo(options);    //send the updated todo.
    };

    $scope.addTodo = function() {
        var toSend = {};
        toSend.todo = { description: $scope.newTodo };
        if (toSend.todo.description !== undefined) {
            Todo.createTodo(toSend, function(data) { //add a todo
                if (data == "error") //error when creating the todo
                    setModalAndDisplay($scope, "Error when creating the todo", "Please try again later.", "result");
                else {
                    $scope.newTodo = ""; //reset input value
                    var options = {};
                    Todo.loadTodos(options, function(data) {
                       $scope.$apply(function() {
                           $scope.todos = data; //reload todos.
                       });
                    });
                }
            });
        }
    };

    $scope.checkAllTodos = function(allChecked) {  //check all todos as completed
        if ($scope.todos != undefined) {
            $scope.todos.forEach(function(todo) {
                todo.is_complete = allChecked;
            });
        }
    };

    $scope.trySignin = function() {
        var signinCredidentials = {};
        signinCredidentials.email = $scope.emailSignin;
        signinCredidentials.password = $scope.passwordSignin;
        if (signinCredidentials.email != undefined && signinCredidentials.password != undefined) {
            Todo.startSession(signinCredidentials, function(user) {
                if (user !== "error") {
                    $scope.$apply(function() {
                        $scope.placeholder = "Add new todo";
                        $scope.userLoggedIn = Todo.USER; //userLoggedIn in scope
                        $scope.emailSignin = undefined;  //reset to orginal value
                        $scope.passwordSignin = undefined; //reset to orginal value
                        signinSetProperties(); //change buttons properties to allow sign out but not sign in
                        $scope.loadTodos(); //load todos of this user
                    });
                } else
                    setModalAndDisplay($scope, "Error when signing in", "User not found. Please sign up before trying to sign in.", "result");
            });
        }
        else
            setModalAndDisplay($scope, "Error when signing in", "Please verify your email & password", "result");
    };

    $scope.formData = {};

    $scope.trySignup = function() {
        var signupCredidentials = {};
        signupCredidentials.email = $scope.formData.emailSignup;
        signupCredidentials.password = $scope.formData.passwordSignup;
        if (signupCredidentials.email != undefined && signupCredidentials.password != undefined)
            Todo.createUser(signupCredidentials, function(data) {
                if (data == "error") //signup failed
                    setModalAndDisplay($scope, "Error when signing up.", "Someone might exists with the same email", "result");
                else {   //signup succeeded
                    modalSignup.hide();
                    if ($scope.userLoggedIn == undefined) {
                        $scope.emailSignin = signupCredidentials.email;
                        $scope.passwordSignin = signupCredidentials.password;
                        setModalAndDisplay($scope, "User signed up !", "Nobody is signed in, so we sign you in.", "result");
                        $scope.trySignin();
                        $("#emailSignup").val('');
                        $("#passwordSignup").val('');
                    } else {
                        setModalAndDisplay($scope, "User signed up !", "Email : " + data.email + ". You can now sign out from this account and sign in with the new one !", "result");
                    }
                }
            });
        else { //error before calling API
            modalSignup.hide();
            setModalAndDisplay($scope, "Error when signing up.", "Please verify your email & password", "result");
        }
    };

    $scope.trySignout = function() {
        if (Todo.USER != null) { //trying to signout
            var options = {};
            Todo.endSession(options);
            signoutSetProperties();
            $scope.userLoggedIn = undefined; //reset user
            $scope.todos = []; //reset todos
        }
        else
            setModalAndDisplay($scope, "Error when signing you out.", "Please verify that you are logged in", "result");
    };

    $scope.loadTodos = function() {
        var options = { };
        Todo.loadTodos(options, function(todos) {
            $scope.$apply(function() {
                $scope.todos = todos;
            });
        });
    }

}]);

function signinSetProperties() {
    $("#signin").addClass('disabled');
    $("#loggedInAs").css('display', 'inline-block');
    $("#signout").removeClass('disabled');
    $("#todo-form").css('display', 'block');
    $('#main').css('display', 'block');
    $("#footer").css('display', 'block');
}

function signoutSetProperties() {
    $("#signout").addClass('disabled');
    $("#main").css('display', 'none');
    $("#todo-form").css('display', 'none');
    $("#footer").css('display', 'none');
    $("#signin").removeClass('disabled');
    $("#loggedInAs").css('display', 'none');
}

function setModalAndDisplay(scope, title, description, nameModal) {
    scope.titleModal = title;
    scope.descriptionModal = description;
    scope.showModal(nameModal);
}