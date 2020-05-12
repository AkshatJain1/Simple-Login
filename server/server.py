from functools import wraps
from flask import Flask, jsonify, request, json 
from flask_pymongo import MongoClient 
from bson.objectid import ObjectId 
from bson.json_util import dumps
from datetime import datetime 
from flask_bcrypt import Bcrypt 
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, verify_jwt_in_request, 
    get_jwt_claims, jwt_refresh_token_required, create_refresh_token,
    get_jwt_identity, get_raw_jwt, jwt_required
)
import getpass, sys, json

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = 'my_precious'
app.config['JWT_BLACKLIST_ENABLED'] = True
app.config['JWT_BLACKLIST_TOKEN_CHECKS'] = ['access', 'refresh']

blacklist = set()

bcrypt = Bcrypt(app)
jwt = JWTManager(app)

CORS(app)



'''
    Create Database from MongoDB Atlas
'''
try:
    user_password = open("./credentials.txt", "r").read()
except FileNotFoundError:
    sys.exit("No password found. You are not an authenticated user. Please ask Akshat for the password.")

client = MongoClient("mongodb+srv://dev_user:" + user_password + "@simple-login-5a4hv.gcp.mongodb.net/test?retryWrites=true&w=majority")
db = client.get_database("simpleloginreg")




'''
    Authentication functions
'''

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

@jwt.token_in_blacklist_loader
def check_if_token_in_blacklist(decrypted_token):
    jti = decrypted_token["jti"]
    return jti in blacklist

@app.route('/auth/refresh', methods=['POST'])
@jwt_refresh_token_required
def refresh():
    current_user = get_jwt_identity()
    ret = {
        'access_token': create_access_token(identity=current_user)
    }
    return jsonify(ret), 200

@app.route('/auth/login', methods=["POST"])
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
            refresh_token = create_refresh_token(identity= {
                'id': str(this_user["_id"]),
                'role': str(this_user["role"])
            })
            resp = {'msg': 'Success', 'access_token': token, 'refresh_token': refresh_token, 'user': this_user}
            return json.dumps(resp, default=str)
        else:
            return jsonify({'msg': 'Wrong password'})
    else:
        return jsonify({'msg': 'A user with that email was not found'})

@app.route('/auth/logoutAccess', methods=['DELETE'])
@jwt_required
def logoutAccess():
    jti = get_raw_jwt()['jti']
    blacklist.add(jti)
    return jsonify({"msg": "Successfully logged out"})

@app.route('/auth/logoutRefresh', methods=['DELETE'])
@jwt_refresh_token_required
def logoutRefresh():
    jti = get_raw_jwt()['jti']
    blacklist.add(jti)
    return jsonify({"msg": "Successfully logged out"}), 200




''' 
    CRUD actions
'''

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
    }).inserted_id

    resp = {'msg': 'User successfully registered', 'new_id': new_id}

    return json.dumps(resp, default=str)

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
    users = db.users

    idToUpdate = request.get_json()['id']
    update = request.get_json()['update']
    update["updated_at"] = datetime.utcnow()
    try:
        response = users.update_one({'_id': ObjectId(oid=idToUpdate)}, {'$set': update})
        count = response.modified_count
        if count == 0:
            return jsonify({'msg': 'no updates made'})
        elif count == 1:
            return jsonify({'msg': 'success'})
    except:
        return jsonify({'msg': 'Something is wrong with your request'}), 400


@app.route('/users/delete_user', methods=["DELETE"])
@admin_required
def delete_user():
    users = db.users
    
    idToDelete = request.args['id']
    if users.delete_one({'_id': ObjectId(oid=idToDelete)}).deleted_count == 1:
        return jsonify({'msg': 'success'})
    else:
        return jsonify({'msg': 'No user with that id found'})



if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)