from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

from langchain import OpenAI, SQLDatabase, SQLDatabaseChain
import pymysql
import environ
env = environ.Env()
environ.Env.read_env()

API_KEY = env('OPENAI_API_KEY')

# Setup database
db = SQLDatabase.from_uri(
    "mysql+pymysql://root:@localhost:3306/mosad"
)

# setup llm
llm = OpenAI(temperature=0, openai_api_key=API_KEY)

# Create db chain
QUERY = """
If the question is not familiar with you. Please generate "תוכל להסביר יותר בפירוט? אני לא מצליח להבין מה אתה רוצה."
Given an input question, first create a syntactically correct mysql query to run, then look at the results of the query and return the answer in Hebrew. Must answer only Hebrew.
Use the following format:

Question: Question here
SQLQuery: SQL Query to run
SQLResult: Result of the SQLQuery
Answer: Final answer here

{question}
"""

# Setup the database chain
db_chain = SQLDatabaseChain(llm=llm, database=db, verbose=True)

@app.route('/get_prompt', methods=['POST'])

def get_prompt():
    data = request.json
    prompt = data.get('prompt')

    while True:
        # prompt = input("Enter a prompt: ")

        try:
            response = {
                'result': db_chain.run(QUERY.format(question=prompt))
            }

            return response
        except Exception as e:
            return e

# get_prompt()

app.run(host='0.0.0.0', port=8000, debug=True)
