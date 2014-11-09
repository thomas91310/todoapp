import os
import passlib
from flask import Flask, render_template, session, redirect, url_for
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
	password = db.Column(PasswordType(schemes=['pbkdf2_sha512','md5_crypt'], deprecated=['md5_crypt']))

	def __repr__(self):
		return '<User %r>' % self.email

class Task(db.Model)
	__tablename__ = 'tasks'
	id = db.Column(db.Integer,primary_key=True)
	title = db.Column(db.String(64))
	description = db.Column(db.String(64))
	userId = db.Column(db.Integer)

@app.route('/')
def index():
    return "Hello, World!"

if __name__ == '__main__':
	manager.run()