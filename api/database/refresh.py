from flask import Flask, Blueprint, jsonify
import psycopg2
from collections import defaultdict
from datetime import datetime, timedelta

app = Flask(__name__)

refresh_blueprint = Blueprint("refresh", __name__)

last_refresh_time = datetime.now() - timedelta(days=1)

@refresh_blueprint.route('/refresh', methods=['POST'])
def refresh():
    global last_refresh_time
    current_time = datetime.now()
    
    cooldown_period = timedelta(seconds=10)
    time_since_last_refresh = current_time - last_refresh_time

    ignore_duplicates = time_since_last_refresh < cooldown_period
    conn = None
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="newpassword",
            host="localhost",
            port="5432"
        )
        cursor = conn.cursor()
        
        query = "SELECT * FROM extracted_fields;"
        cursor.execute(query)
        records = cursor.fetchall()

        column_names = [desc[0] for desc in cursor.description]
        data_to_return = [dict(zip(column_names, record)) for record in records]
        
        # Custom logic to find duplicates based on 'client_id' and 'field_name' only
        seen = defaultdict(int)
        duplicates = []
        for record in data_to_return:
            key = (record['client_id'], record['field_name'], record['field_value'])
            seen[key] += 1
            if seen[key] > 1:
                duplicates.append(record)
        
        if duplicates and not ignore_duplicates:
            last_refresh_time = current_time
            return jsonify({
                "data": data_to_return,
                "duplicates": duplicates,
                "prompt": "Duplicate entries found. What would you like to do?"
            })
        return jsonify({"data": data_to_return})
            
    except Exception as e:
        return jsonify({"error": str(e)})
    
    finally:
        if conn:
            cursor.close()
            conn.close()
            