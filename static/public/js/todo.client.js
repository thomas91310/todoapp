Todo = {
  USER: null,

  config: {
    host: 'http://localhost:5000/todoapp/api'
  },

  endSession: function(options) {
    var success = options.success;
    var error   = options.error;

    if(Todo.USER) {
      var userId   = Todo.USER.id;
      var apiToken = Todo.USER.api_token;

      $.ajax([Todo.config.host, 'users/sign_out' ].join('/'),{
        data: { user_id: userId, api_token: apiToken },
        type: 'DELETE',
        success: success,
        error:   error
      });
      Todo.USER = null;
    } else {
      success();
    }
  },

  startSession: function(options, callback) { //ADDED CALLBACK
    this._postUser(options, [Todo.config.host, 'users/signin' ].join('/'), callback);
  },

  createTodo: function(options, callback) { //ADDED CALLBACK

      console.log("todo created ", options.todo);
    var successCallback = function(data) {
        callback(data);
    };

    var errorCallback = function(data) {
        callback("error");
    };

    $.ajax([Todo.config.host, 'users', Todo.USER.id, 'todos'].join('/'), {
      data:    { user_id: Todo.USER.id, api_token: Todo.USER.api_token, todo: options.todo },
      type:    'POST',
      success: successCallback,
      error:   errorCallback
    });
  },

  loadTodos: function(options, callback) { //ADDED CALLBACK
    var apiToken = Todo.USER.api_token;
    var userId   = Todo.USER.id;
    var success  = options.success;
    var error    = options.error;

      var successCallback = function(data) {
          callback(data);
      };

    $.ajax([Todo.config.host, 'users', userId, 'todos' ].join('/'), {
      data: { api_token: apiToken },
      success: successCallback,
      error:   error
    });
  },

  updateTodo: function(options) {
    var todoId   = options.todoId;
    var data     = options.data;
    var success  = options.success;
    var error    = options.error;
    var apiToken = Todo.USER.api_token;
    var userId   = Todo.USER.id;

    $.ajax([Todo.config.host, 'users', userId, 'todos', todoId ].join('/'), {
      data:    { todo: data, api_token: apiToken },
      type:    'PUT',
      success: success,
      error:   error
    });
  },

  createUser: function(options, callback) { //ADDED CALLBACK
    this._postUser(options, [Todo.config.host, 'users' ].join('/'), callback);
  },

  _postUser: function(options, route, callback) { //ADDED CALLBACK
    var email    = options.email;
    var password = options.password;
    var success  = options.success;
    var error    = options.error;

    var successCallback = function(user) {
      console.log("data :", user);
      Todo.USER = user;
      callback(Todo.USER);

      if(success) {
        success(user);
      }
    };

    var errorCallback = function() {
        callback("error");
    };

    $.ajax(route, {
      data: JSON.stringify({ email: email, password: password }, null, '\t'),
      contentType: 'application/json;charset=UTF-8',
      type: 'POST',
      success: successCallback,
      error:   errorCallback
    });
  }

};

