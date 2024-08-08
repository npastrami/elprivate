from flask import Blueprint, request, jsonify
import psycopg2
from datetime import datetime, timedelta

ignored_duplicates = []
ignored_time = {}

handle_duplicates_blueprint = Blueprint("duplicates", __name__)

@handle_duplicates_blueprint.route('/duplicates', methods=['POST'])
def handle_duplicates():
    user_choice = request.json.get('user_choice')
    duplicates = request.json.get('duplicates')
    current_time = datetime.now()

    print(f"Received duplicates: {duplicates}")
    conn = None
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="kr3310",
            host="localhost",
            port="5432"
        )
        cursor = conn.cursor()
        queries = []

        for duplicate_list in duplicates:
            duplicate_dict = duplicate_list

            if duplicate_dict in ignored_duplicates:
                last_ignored_time = ignored_time.get(str(duplicate_dict))
                if (current_time - last_ignored_time) < timedelta(seconds=10):
                    continue
                else:
                    ignored_duplicates.remove(duplicate_dict)

            query_elements = [f"{key}='{value}'" for key, value in duplicate_dict.items() if key in ['field_name', 'field_value']]
            query_string = " AND ".join(query_elements)

            if user_choice in ["remove_duplicate", "remove_all"]:
                query = "DELETE FROM client_data WHERE id IN (SELECT id FROM client_data WHERE field_name=%s AND field_value=%s LIMIT 1);"
                queries.append((query, (duplicate_dict['field_name'], duplicate_dict['field_value'])))

            elif user_choice == "ignore":
                ignored_duplicates.append(duplicate_dict)
                ignored_time[str(duplicate_dict)] = current_time

            elif user_choice == "ignore_all":
                ignored_duplicates.append(duplicate_dict)
                ignored_time[str(duplicate_dict)] = current_time
                # Add logic to set cooldown period

        if user_choice in ["remove_duplicate", "remove_all"]:
            for query, params in queries:
                print(f"Executing query: {query} with parameters {params}")
                cursor.execute(query, params)

        conn.commit()
        return jsonify({"message": "Duplicates handled successfully"})
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)})
    
    finally:
        if conn:
            cursor.close()
            conn.close()