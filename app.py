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
	title = db.Column(db.String(64))
	description = db.Column(db.String(64))
	userId = db.Column(db.Integer)

@app.route('/')
def index():
    return redirect(url_for('static', filename='home.html'))

@app.route('/todoapp/api/users', methods=['GET', 'POST'])
def create_user():
	if request.method == "POST":
		email = request.json['email']
		password = request.json['password']
		new_user = User(email=email, password=password)
		db.session.add(new_user)
		db.session.commit()
		return make_response(jsonify({'id': new_user.id, 'email': new_user.email, 'todos': []}), 201)	
	else:
		all_users = User.query.all()
		return("error")
	#else:
	#	all_users = User.query.all()
	#	return(all_users)

@app.route('/todoapp/api/users/signin', methods=['POST'])
def signin():
	if request.method == "POST":
		tryEmail = request.json['email']
		tryPass = request.json['password']
		user = User.query.filter_by(email=tryEmail, password=tryPass).all()
		if (user is None):
			print "not found"
			return make_response("error", 404)
		else:
			print user
			return make_response(jsonify({ 'id': user[0].id, 'email': user[0].email }))

if __name__ == '__main__':
	manager.run()