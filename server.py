from geopy import geocoders
from bson import json_util
import json
import pymongo
from bson.objectid import ObjectId
from flask import Flask, render_template, request, make_response, jsonify

app = Flask(__name__)

app.debug = True


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/locations/', methods=['GET'])
def get_locations():
    location_collection = get_collection()
    locations = location_collection.find().sort('order', pymongo.ASCENDING)
    data = []

    for l in locations:
        # Fix for funky ObjectID - otherwise things blow up
        l['id'] = str(l['_id'])
        del l['_id']
        data.append(l)

    resp = make_response(json.dumps(data, default=json_util.default))
    resp.status_code = 200
    resp.mimetype = 'application/json'

    return resp


@app.route('/locations/<location_id>',  methods=['GET'])
def get_location(location_id):
    oid = None

    try:
        oid = ObjectId(location_id)
    except:
        return jsonify(message='invalid id')

    locations = get_collection()
    l = locations.find_one({'_id': oid})

    if l is None:
        return jsonify(message='no todo with id: ' + location_id)
    # Fix for funky ObjectID
    l['id'] = str(l['_id'])
    del l['_id']

    return jsonify(address=l['address'], nickname=l['nickname'], latitude=l['latitude'],
     longitude=l['longitude'], id=l['id'], order=l['order'])


@app.route('/locations/', methods=['POST'])
def create_location():
    data = request.json
    address = data['address']

    # Send posted address to google geocoding service
    g = geocoders.Google('api-goes-here')
    (place, (latitude, longitude)) = g.geocode(address)

    data['address'] = place
    data['latitude'] = latitude
    data['longitude'] = longitude

    # fix for missing order in post requests from curl
    if 'order' in data:
        print "There's order"
    else:
        data['order'] = 0

    locations = get_collection()
    oid = locations.insert(data)
    location = locations.find_one({'_id': ObjectId(oid)})
    location['id'] = str(location['_id'])
    del location['_id']
    return jsonify(address=address, nickname=data['nickname'], latitude=latitude, longitude=longitude,
        id=location['id'], order=data['order'])


@app.route('/locations/<location_id>',  methods=['PUT'])
def update_location(location_id):
    data = request.json
    locations = get_collection()
    locations.update({'_id': ObjectId(location_id)}, {'$set': data})
    return jsonify(message='OK')


@app.route('/locations/<location_id>',  methods=['DELETE'])
def delete_location(location_id):
    locations = get_collection()
    locations.remove(ObjectId(location_id))
    return jsonify(message='OK')


def get_collection():
    conn = pymongo.Connection('localhost:27017')
    return conn[app.db_name].locations


if __name__ == '__main__':

    app.db_name = 'locations_prod'
    app.run(host='0.0.0.0')
