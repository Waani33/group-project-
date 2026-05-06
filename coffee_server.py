from flask import Flask, jsonify
from flask_cors import CORS
from coffee import press_coffee_button

app = Flask(__name__)
CORS(app)

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "online", "device": "arduino"})

@app.route("/coffee/start", methods=["POST"])
def coffee_start():
    try:
        press_coffee_button()
        return jsonify({"status": "success", "message": "Coffee Arduino ran"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/plan/set", methods=["POST"])
def plan_set():
    return jsonify({"status": "saved"})

@app.route("/alarm/fire", methods=["POST"])
def alarm_fire():
    return jsonify({"status": "alarm ignored by Arduino server"})

@app.route("/alarm/dismiss", methods=["POST"])
def alarm_dismiss():
    return jsonify({"status": "dismiss ignored by Arduino server"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)