import os
import passlib
from flask import Flask, jsonify, request, make_response, render_template, session, redirect, url_for
from flask.ext.script import Manager
from flask.ext.bootstrap import Bootstrap
from flask.ext.sqlalchemy import SQLAlchemy
from sqlalchemy_utils import PasswordType

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] =\
    'sqlite:///' + os.path.join(basedir, 'data.sqlite')
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True

db = SQLAlchemy(app)

manager = Manager(app)
bootstrap = Bootstrap(app)

class User(db.Model):
	__tablename__ = 'users'
	id = db.Column(db.Integer, primary_key=True)
	email = db.Column(db.String(64), unique=True)
	#password = db.Column(PasswordType(schemes=['pbkdf2_sha512','md5_crypt'], deprecated=['md5_crypt']))
	password = db.Column(db.String(64))

	def __repr__(self):
		print "here in repr"
		return '<Email : %r, Pass : %r>' % (self.email,self.password)

class Task(db.Model):
	__tablename__ = 'tasks'
	id = db.Column(db.Integer, primary_key=True)
	description = db.Column(db.String(64))
	done = db.Column(db.Boolean, unique=False, default=False)
	userId = db.Column(db.Integer)

@app.route('/')
def index():
    return redirect(url_for('static', filename='home.html'))

#SIGNUP
@app.route('/todoapp/api/users', methods=['POST'])
def create_user():
	if request.method == "POST":
		email = request.json['email']
		password = request.json['password']
		newUser = User(email=email, password=password)
		db.session.add(newUser)
		db.session.commit()
		return make_response(jsonify({'id': newUser.id, 'email': newUser.email, 'todos': []}), 201)	
	else:
		return("error")

#LOGIN
@app.route('/todoapp/api/users/signin', methods=['POST'])
def signin():
	if request.method == "POST":
		tryEmail = request.json['email']
		tryPass = request.json['password']
		user = User.query.filter_by(email=tryEmail, password=tryPass).all()
		if (user is None or len(user) != 1):
			return make_response("error", 404)
		else:
			return make_response(jsonify({ 'id': user[0].id, 'email': user[0].email }))

#GET TODOS
@app.route('/todoapp/api/users/<idUser>/todos', methods=['GET'])
def load_todos(idUser):
	if request.method == "GET":
		tasks = Task.query.filter_by(userId=idUser).all()
		if (tasks is None):
			return make_response("error", 500)
		else:
			print("len tasks : %d" % len(tasks))
			print(tasks)
			tasksToSend = []
			for task in tasks:
				tasksToSend.append( {'description': task.description, 'done': task.done})
			print tasksToSend
			return make_response(jsonify({ 'todos' : tasksToSend }), 200)

#ADD TODO
@app.route('/todoapp/api/users/<idUser>/todos', methods=['POST'])
def create_todo(idUser):
	if request.method == "POST":
		description = request.json['description']
		print description
		newTask = Task(description=description, userId=idUser)
		db.session.add(newTask)
		db.session.commit()
		return make_response("success", 201)
	else:
		return make_response("error", 500)
	
if __name__ == '__main__':
	manager.run()