#!/usr/bin/env python

from openai import OpenAI
from dotenv import load_dotenv
import json
import argparse

load_dotenv()

def load_jsonl(filename):
  with open(filename, "r") as fh:
    return [json.loads(line) for line in fh]

def save_jsonl(filename, data):
  with open(filename, "w") as fh:
    for line in data:
      fh.write(json.dumps(line) + "\n")

client = OpenAI()

parser = argparse.ArgumentParser(prog="pickGoodQuotes")
parser.add_argument("--input", required=True)
parser.add_argument("--output", required=True)
parser.add_argument("--mode", required=True, choices=[
  "clean",
  "pick",
])
args = parser.parse_args()

data = load_jsonl(args.input)
print(f"Loaded {len(data)} rows from {args.input}")

out_fh = open(args.output, "w")
for i, row in enumerate(data):
  if args.mode == "clean":
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {
                "role": "user",
                "content": f"if this quote has weird unicode characters, please output a cleaned version, otherwise output the same quote. also fix any spacing or punctuation errors. here is the quote: {row['quote']}"
            }
        ]
    )
    row["quote"] = completion.choices[0].message.content

  out_fh.write(json.dumps(row) + "\n")

  if i % 100 == 0:
    print(f"Processed {i}/{len(data)} rows")

# completion = client.chat.completions.create(
#     model="gpt-4o-mini",
#     messages=[
#         {"role": "system", "content": "You are a helpful assistant."},
#         {
#             "role": "user",
#             "content": "Write a haiku about recursion in programming."
#         }
#     ]
# )

# print(completion.choices[0].message)
