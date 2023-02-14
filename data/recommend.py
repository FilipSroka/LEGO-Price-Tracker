from datetime import datetime
import csv
import random
import json

def load_data():
    client = MongoClient(uri)
    db = client["pricesDB"]["wanted"].findOne({"username": user["username"]})
    collection = [i for i in db["collection"])]
    db = client["pricesDB"]["owned"].findOne({"username": user["username"]})
    for i in db:
        collection.append(i)
    return collection

def recommend(r, similarity, n):
    x = random.uniform(0, similarity[n][0])
    i = 0
    while True:
        x -= similarity[n][1][i][1]
        if x <= 0:
            if similarity[n][1][i][0] not in collection:
                r.add(similarity[n][1][i][0])
            return
        i += 1

def random_set(r, n):
    tmp = list(d.keys())
    while len(r) < n:
        r.add(tmp[random.randint(0, len(tmp)-1)])

def recommendation_system(n):
    collection = load_data()
    r = set()
    similarity = json.load(open("data5.json"))
    if len(collection) != 0:
        while len(r) < n:
            x = collection[random.randint(0,len(collection)-1)]
            print(d[x][0])
            recommend(r, similarity, x)
    else:
        random_set(r, n)
    return r
