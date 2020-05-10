from functools import wraps
from flask import Flask, jsonify, request, json 
from flask_pymongo import MongoClient 
from bson.objectid import ObjectId 
from bson.json_util import dumps
from datetime import datetime 
from flask_bcrypt import Bcrypt 
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, verify_jwt_in_request, get_jwt_claims
import getpass, sys, json

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

# A custom decorator that verifies the JWT is present in
# the request, as well as insuring that this user has a role of
# `admin` in the access token
def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt_claims()
        if claims['role'] != 'admin':
            return jsonify({'msg':'Admins only!'}), 403
        else:
            return fn(*args, **kwargs)
    return wrapper

@jwt.user_claims_loader
def add_claims_to_access_token(identity):
    return {'role': identity['role']}

@app.route('/users/create_user', methods=["POST"])
@admin_required
def create_user():
    users = db.users
    email = request.get_json()["email"]
    if users.count_documents({'email': email}) != 0:
        return jsonify({'msg': 'A user with that email is already registered'}), 400, {'ContentType':'application/json'}

    first = request.get_json()["first_name"]
    last = request.get_json()["last_name"]
    password = request.get_json()["password"]
    enc_password = bcrypt.generate_password_hash(password).decode('utf-8')
    role = request.get_json()["role"]
    created = datetime.utcnow()
    updated_at = created

    new_id = users.insert_one({
        'first_name': first,
        'last_name': last,
        'email': email,
        'password': enc_password,
        'role': role,
        'created': created,
        'updated_at': updated_at
    })

    return jsonify({'msg': 'User successfully registered'})


@app.route('/users/login', methods=["POST"])
def login():
    users = db.users

    email = request.get_json()["email"]
    password = request.get_json()["password"]

    this_user = users.find_one({'email': email})

    if this_user:
        if bcrypt.check_password_hash(this_user["password"], password):
            token = create_access_token(identity = {
                'id': str(this_user["_id"]),
                'role': str(this_user["role"])
            })
            return jsonify({'msg': 'Success', 'token': token})
        else:
            return jsonify({'msg': 'Wrong password'})
    else:
        return jsonify({'msg': 'A user with that email was not found'})

@app.route('/users/get_users', methods=["GET"])
@admin_required
def get_users():
    users = db.users
    resp = list(users.find())
    resp = {"msg": "success", "data": resp}
    return json.dumps(resp, default=str)

@app.route('/users/update_user', methods=["POST"])
@admin_required
def update_user():
    pass

@app.route('/users/delete_user', methods=["POST"])
@admin_required
def delete_user():
    pass



if __name__ == "__main__":
    app.run(debug=True)