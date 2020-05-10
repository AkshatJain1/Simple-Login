from flask import Flask, jsonify, request, json 
from flask_pymongo import MongoClient 
from bson.objectid import ObjectId 
from datetime import datetime 
from flask_bcrypt import Bcrypt 
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token
import getpass, sys

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = 'my_precious'

bcrypt = Bcrypt(app)
jwt = JWTManager(app)

CORS(app)

try:
    user_password = open("./credentials.txt", "r").read()
except FileNotFoundError:
    sys.exit("No password found. You are not an authenticated user. Please ask Akshat for the password.")

client = MongoClient("mongodb+srv://dev_user:" + user_password + "@simple-login-5a4hv.gcp.mongodb.net/test?retryWrites=true&w=majority")
db = client.get_database("simpleloginreg")

print(next(db.users.find({})))

if __name__ == "__main__":
    app.run(debug=True)