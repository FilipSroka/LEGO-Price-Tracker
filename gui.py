import io
import json
import os
import random
from sys import maxsize
import tkinter as tk
from tkinter.filedialog import askopenfile
import webbrowser
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib import pyplot as plt
from pymongo import MongoClient
from datetime import datetime
from PIL import Image, ImageTk
import csv
import re
import urllib

THE_PATH = ["/bin/", "/usr/bin/", "/usr/local/bin/", "./"]
window = tk.Tk()
# window.config(bg="grey80")
window.title("LEGO Price Tracker App")
window.geometry("1000x600")
window.resizable(False, False)
uri = ""
user = {"role": "guest", "username": None}

d = {}
with open('data.txt', 'r') as data:
    for i in data:
        i = i[:-1].split(';')
        d[i[0]] = i[1:]

v1 = tk.IntVar()
v2 = tk.IntVar()
v3 = tk.IntVar()
v4 = tk.IntVar()
v5 = tk.IntVar()
v6 = tk.IntVar()
v7 = tk.IntVar()

r1 = tk.StringVar()
r2 = tk.StringVar()
r3 = tk.StringVar()
r4 = tk.StringVar()
r5 = tk.StringVar()
r6 = tk.StringVar()
r7 = tk.StringVar()
r8 = tk.StringVar()
r9 = tk.StringVar()
r10 = tk.StringVar()

def mainPage():
    client = MongoClient(uri)
    db = client['pricesDB']
    collection = db['wanted']

    forum = tk.Button(text="Forum", height=3, width=7)
    inStoreDeals = tk.Button(text="In-Store Deals", height=3, width=11)

    if collection.count_documents({'username': user["username"]}) == 1:
        shoppingAssistant = tk.Button(text="Shopping Assistant", command=lambda:shoppingAssistantPage(labels+buttons+[forum, inStoreDeals, shoppingAssistant, wantedPrice, uploadCollection, searchEntry, checkPrice, login]), height=3, width=14)
        wantedPrice = tk.Button(text="Wanted Prices", command=lambda:wantedPriceScrape(labels+buttons+[forum, inStoreDeals, shoppingAssistant, wantedPrice, uploadCollection, searchEntry, checkPrice, login]), height=3, width=11)
    else:
        shoppingAssistant = tk.Button(text="Shopping Assistant", height=3, width=14, state=tk.DISABLED)
        wantedPrice = tk.Button(text="Wanted Prices", height=3, width=11, state=tk.DISABLED)

    if user["role"] == "user":
        uploadCollection = tk.Button(text="Upload Collection", command=lambda:upload(labels+buttons+[forum, inStoreDeals, shoppingAssistant, wantedPrice, uploadCollection, searchEntry, checkPrice, login]), height=3, width=13)
    else:
        uploadCollection = tk.Button(text="Upload Collection", command=lambda:upload(labels+buttons+[forum, inStoreDeals, shoppingAssistant, wantedPrice, uploadCollection, searchEntry, checkPrice, login]), height=3, width=13, state=tk.DISABLED)

    searchEntry = tk.Entry(font=("", 35), width=5)
    checkPrice = tk.Button(text="Check Price", command=lambda:checkPriceScrape(searchEntry.get(), labels+buttons+[forum, inStoreDeals, shoppingAssistant, wantedPrice, uploadCollection, searchEntry, checkPrice, login]), height=3, width=13)

    if user["role"] == "guest":
        login = tk.Button(text="Log In/Register", command=lambda:loginPage(labels+buttons+[forum, inStoreDeals, shoppingAssistant, wantedPrice, uploadCollection, searchEntry, checkPrice, login]), height=3, width=12)
    else:
        login = tk.Button(text="Sign Out", command=lambda:signOut(labels+buttons+[forum, inStoreDeals, shoppingAssistant, wantedPrice, uploadCollection, searchEntry, checkPrice, login]), height=3, width=12)

    images = []
    labels = []
    buttons = []
    recommended = recommendation_system(8)
    for i in range(0, len(recommended), 2):
        adjustmentx, adjustmenty = 0, 0
        raw_data = urllib.request.urlopen(d[recommended[i]][12]).read()
        im = Image.open(io.BytesIO(raw_data))
        if im.size[0] > im.size[1]:
            new_width = 225
            new_height = new_width * im.size[1] // im.size[0]
            adjustmenty = (168 - new_height) / 2

        else:
            new_height = 168
            new_width = new_height * im.size[0] // im.size[1]
            adjustmentx = (225 - new_width) / 2
        im = im.resize((new_width, new_height))
        image = ImageTk.PhotoImage(im)
        images.append(image)
        label1 = tk.Label(image=image)
        label1.place(x=12.5+250*i//2+adjustmentx, y=100+adjustmenty)
        labels.append(label1)
        button = tk.Button(text="Check Price", command= lambda setID=recommended[i]:checkPriceScrape(setID, labels+buttons+[forum, inStoreDeals, shoppingAssistant, wantedPrice, uploadCollection, searchEntry, checkPrice, login]))
        button.place(x=12.5+250*i//2, y=288, height=40, width=225)
        buttons.append(button)

        adjustmentx, adjustmenty = 0, 0
        raw_data = urllib.request.urlopen(d[recommended[i+1]][12]).read()
        im = Image.open(io.BytesIO(raw_data))
        if im.size[0] > im.size[1]:
            new_width = 225
            new_height = new_width * im.size[1] // im.size[0]
            adjustmenty = (168 - new_height) / 2
        else:
            new_height = 168
            new_width = new_height * im.size[0] // im.size[1]
            adjustmentx = (225 - new_width) / 2
        im = im.resize((new_width, new_height))
        image = ImageTk.PhotoImage(im)
        images.append(image)
        label1 = tk.Label(image=image)
        label1.place(x=12.5+250*i//2+adjustmentx, y=355+adjustmenty)
        labels.append(label1)
        button = tk.Button(text="Check Price", command=lambda setID=recommended[i+1]:checkPriceScrape(setID, labels+buttons+[forum, inStoreDeals, shoppingAssistant, wantedPrice, uploadCollection, searchEntry, checkPrice, login]))
        button.place(x=12.5+250*i//2, y=543, height=40, width=225)
        buttons.append(button)

    forum.place(x=12.5, y=10)
    inStoreDeals.place(x=82, y=10)
    shoppingAssistant.place(x=187, y=10)
    wantedPrice.place(x=319, y=10)
    uploadCollection.place(x=424, y=10)
    searchEntry.place(x=586, y=10)
    checkPrice.place(x=710, y=10)
    login.place(x=875, y=10)

    window.mainloop()

def loginPage(widgets):
    clear(widgets)

    backButton = tk.Button(text="< Back", command=lambda:back([backButton, errorLabel, loginHeader, loginLabel, loginEntry, passwordLabel, passwordEntry, loginButton, registerHeader, usernameLabel, usernameEntry, password1Label, password1Entry, password2Label, password2Entry, registerButton]))

    errorLabel = tk.Label(text="Something went wrong", fg="red")

    loginHeader = tk.Label(text="Log In")
    loginLabel = tk.Label(text="Login:")
    loginEntry = tk.Entry()

    passwordLabel = tk.Label(text="Password:")
    passwordEntry = tk.Entry(show="*")

    loginButton = tk.Button(
        text="Log In",
        command=lambda:loginUser(loginEntry.get(), passwordEntry.get(), [backButton, errorLabel, loginHeader, loginLabel, loginEntry, passwordLabel, passwordEntry, loginButton, registerHeader, usernameLabel, usernameEntry, password1Label, password1Entry, password2Label, password2Entry, registerButton])
    )

    registerHeader = tk.Label(text="Create Account")
    usernameLabel = tk.Label(text="Username:")
    usernameEntry = tk.Entry()

    password1Label = tk.Label(text="Password:")
    password1Entry = tk.Entry(show="*")

    password2Label = tk.Label(text="Confirm Password:")
    password2Entry = tk.Entry(show="*")

    registerButton = tk.Button(
        text="Register",
        command=lambda:registerUser(usernameEntry.get(), password1Entry.get(), password2Entry.get(), [backButton, errorLabel, loginHeader, loginLabel, loginEntry, passwordLabel, passwordEntry, loginButton, registerHeader, usernameLabel, usernameEntry, password1Label, password1Entry, password2Label, password2Entry, registerButton])
    )

    backButton.place(x=25, y=10)

    loginHeader.place(x=200, y=80)

    loginLabel.place(x=200, y=100)
    loginEntry.place(x=200, y=120)

    passwordLabel.place(x=200, y=150)
    passwordEntry.place(x=200, y=170)

    loginButton.place(x=200, y=200)


    registerHeader.place(x=200, y=250)

    usernameLabel.place(x=200, y=270)
    usernameEntry.place(x=200, y=290)

    password1Label.place(x=200, y=320)
    password1Entry.place(x=200, y=340)

    password2Label.place(x=200, y=370)
    password2Entry.place(x=200, y=390)

    registerButton.place(x=200, y=420)

def shoppingAssistantPage(widgets):
    clear(widgets)
    backButton = tk.Button(text="< Back", command=lambda:back([backButton, thresholdLabel, thresholdEntry, themesLabel, allThemes, friends, harryPotter, marvel, monkieKid, ninjago, starWars, calculateButton, resultsLabel, result1, result2, result3, result4, result5, result6, result7, result8, result9, result10]))
    thresholdLabel = tk.Label(text="Threshold:")
    thresholdEntry = tk.Entry()
    themesLabel = tk.Label(text="Themes:")

    allThemes = tk.Checkbutton(text="All", onvalue=1, offvalue=0, variable=v1)
    allThemes.select()
    friends = tk.Checkbutton(text="Friends", onvalue=1, offvalue=0, variable=v2)
    harryPotter = tk.Checkbutton(text="Harry Potter", onvalue=1, offvalue=0, variable=v3)
    marvel = tk.Checkbutton(text="Marvel", onvalue=1, offvalue=0, variable=v4)
    monkieKid = tk.Checkbutton(text="Monkie Kid", onvalue=1, offvalue=0, variable=v5)
    ninjago = tk.Checkbutton(text="NINJAGO", onvalue=1, offvalue=0, variable=v6)
    starWars = tk.Checkbutton(text="Star Wars", onvalue=1, offvalue=0, variable=v7)

    calculateButton = tk.Button(
        text="Calculate",
        command=lambda:shoppingAssistant(thresholdEntry.get())
    )

    resultsLabel = tk.Label(text="Results:")
    result1 = tk.Label(textvariable=r1)
    result2 = tk.Label(textvariable=r2)
    result3 = tk.Label(textvariable=r3)
    result4 = tk.Label(textvariable=r4)
    result5 = tk.Label(textvariable=r5)
    result6 = tk.Label(textvariable=r6)
    result7 = tk.Label(textvariable=r7)
    result8 = tk.Label(textvariable=r8)
    result9 = tk.Label(textvariable=r9)
    result10 = tk.Label(textvariable=r10)

    backButton.place(x=25, y=10)

    thresholdLabel.place(x=200, y=100)
    thresholdEntry.place(x=200, y=120)

    themesLabel.place(x=200, y=150)
    allThemes.place(x=200, y=170)
    friends.place(x=200, y=190)
    harryPotter.place(x=200, y=210)
    marvel.place(x=200, y=230)
    monkieKid.place(x=200, y=250)
    ninjago.place(x=200, y=270)
    starWars.place(x=200, y=290)

    calculateButton.place(x=200, y=320)

    resultsLabel.place(x=450, y=100)
    result1.place(x=450, y=120)
    result2.place(x=450, y=140)
    result3.place(x=450, y=160)
    result4.place(x=450, y=180)
    result5.place(x=450, y=200)
    result6.place(x=450, y=220)
    result7.place(x=450, y=240)
    result8.place(x=450, y=260)
    result9.place(x=450, y=280)
    result10.place(x=450, y=300)

def shoppingAssistant(threshold):
    if threshold == "":
        return
    else:
        threshold = float(threshold)
    client = MongoClient(uri)
    db = client['pricesDB']

    match = []
    alone = []
    themes = []

    if v1.get() == 1:
        themes.append("All")
    if v2.get() == 1:
        themes.append("Friends")
    if v3.get() == 1:
        themes.append("HarryPotter")
    if v4.get() == 1:
        themes.append("Marvel")
    if v5.get() == 1:
        themes.append("MonkieKid")
    if v6.get() == 1:
        themes.append("NINJAGO")
    if v7.get() == 1:
        themes.append("StarWars")

    c = db["wanted"].find_one({"username": user["username"]})

    for i in c["collection"]:
        if i["id"] in d and ("All" in themes or re.sub('[^A-Za-z0-9]+', '', d[i["id"]][1]) in themes):
            l = db["lowest"].find_one({"id": i["id"]})
            if l:
                tmp = []
                for j in l:
                    if j != "_id" and j != "id" and l[j] != "Not available from this retailer":
                        tmp.append(helper(l[j]))
                for j in range(i["quantity"]):
                    if len(tmp) > 0:
                        if float(d[i["id"]][2][1:]) >= threshold:
                            alone.append({"combination": str([i["id"]])[1:-1], "total": float(d[i["id"]][2][1:]), "loss": float(d[i["id"]][2][1:])-min(tmp)})
                        else:
                            match.append({"id": i["id"], "RRP": float(d[i["id"]][2][1:]), "low": min(tmp)})
    do_matching([], match, 0, 0, 0, threshold, alone, set())
    alone = sorted(alone, key=lambda x: (float(x["loss"]), float(x["total"])))[:10]
    rs = [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10]
    for r in rs:
        r.set("")
    for i in range(len(alone)):
        rs[i].set(str(i+1) + ". Combination: " + str(alone[i]["combination"])[1:-1] + " Total: £" + f'{alone[i]["total"]:.2f}' + " Loss: £" + f'{alone[i]["loss"]:.2f}')

def do_matching(combination, sets, index, total, loss, threshold, solution, memo):
    if total >= threshold:
        if str(combination) not in memo:
            memo.add(str(combination))
            solution.append({"combination": combination, "total": total, "loss": loss})
        return
    if index == len(sets):
        return
    do_matching(combination+[int(sets[index]["id"])], sets, index+1, total+sets[index]["RRP"], loss+sets[index]["RRP"]-sets[index]["low"], threshold, solution, memo)
    do_matching(combination, sets, index+1, total, loss, threshold, solution, memo)

def upload(widgets):
    file = askopenfile(mode="r", filetypes=(("CSV Files", "*.csv"),))
    if file:
        clear(widgets)
        if "owned" in str(file):
            importOwned(file)
        else:
            importWanted(file)
        mainPage()

def importOwned(file):
    try:
        username = user["username"]
        reader = csv.reader(file)
        next(reader)

        rows = []
        for row in reader:
            if row == []:
                break
            if row[32] != "" and row[0][:-2] in d:
                rows.append(row[0][:-2])

        client = MongoClient(uri)
        db = client['pricesDB']
        collection = db['owned']
        if collection.count_documents({'username': username}) == 1:
            collection.update_one({'username': username}, {'$set': {'collection': rows}})
        else:
            collection.insert_one({'username': username, 'collection': rows})
    except:
        pass

def importWanted(file):
    try:
        username = user["username"]
        reader = csv.reader(file)
        next(reader)

        rows = []
        for row in reader:
            if row == []:
                break
            if row[31] != "" and row[0][:-2] in d:
                rows.append({"id": row[0][:-2], "quantity": int(row[18])})

        client = MongoClient(uri)
        db = client['pricesDB']
        collection = db['wanted']
        if collection.count_documents({'username': username}) == 1:
            collection.update_one({'username': username}, {'$set': {'collection': rows}})
        else:
            collection.insert_one({'username': username, 'collection': rows})
    except:
        pass

# FROM OS LAB 5
def checkPriceScrape(setID, widgets):
    if setID not in d:
        return
    clear(widgets)
    cmd = "node"
    args = ["node", "final/index.js", setID]
    execname = add_path(cmd, THE_PATH)
    if not execname:
        print('Executable file ' + str(cmd) + ' not found')
    else:
        # execute the command
        try:
            PID = os.fork()
        except OSError:
            pass
        if PID == 0:
            os.execv(execname, args)
        else:
            _, status = os.wait()
            if os.WIFEXITED(status):
                # ORIGINAL FROM HERE
                data = json.load(open("output.json"))
                client = MongoClient(uri)
                db = client['pricesDB']
                collection = db['pricesC'].find({"id": setID})
                dates = []
                prices = []
                allprices = []
                for i in collection:
                    tmp = []
                    for j in i["prices"]:
                        if j["price"] != "Not available from this retailer" and j["price"] != "":
                            tmp.append(helper(j["price"]))
                            allprices.append(helper(j["price"]))
                    if len(tmp) != 0:
                        dates.append(datetime.strptime(i["date"].split(" ")[0], "%d/%m/%Y"))
                        prices.append(min(tmp))

                tmp = []
                for i in data["prices"]:
                    if i["price"] != "Not available from this retailer" and i["price"] != "":
                        try:
                            tmp.append(float(i["price"][1:]))
                            allprices.append(float(i["price"][1:]))
                        except:
                            tmp.append(float(i["price"][2:]))
                            allprices.append(float(i["price"][2:]))
                if len(tmp) != 0:
                    dates.append(datetime.strptime(data["date"].split(" ")[0], "%d/%m/%Y"))
                    prices.append(min(tmp))

                figure = plt.Figure(figsize=(6,5), dpi=100)
                ax = figure.add_subplot(111)
                chart_type = FigureCanvasTkAgg(figure, window)
                ax.set_title(setID + " " + d[setID][0])
                ax.set_xlabel("Date")
                ax.set_ylabel("Price (GBP)")
                ax.plot(dates, prices, marker="o", label="Price History")
                ax.axhline(y=float(d[setID][2][1:]), color='r', linestyle='--', label="RRP")
                for i in range(len(dates)):
                    if i == 0 or prices[i] != prices[i-1]:
                        ax.annotate("£" + str("{:.2f}".format(prices[i])), (dates[i], prices[i]))
                ax.set_ylim(ymin=0, ymax=1.1*max(float(d[setID][2][1:]), max(allprices)))
                ax.legend(loc="lower right")
                for label in ax.get_xaxis().get_ticklabels()[::2]:
                    label.set_visible(False)
                fig = chart_type.get_tk_widget()
                fig.place(x=25, y=25)

                labels = []
                tmp = sorted([i for i in data["prices"] if i["price"] != "Not available from this retailer"], key=lambda x: helper(x["price"]))
                if len(tmp) == 0:
                    n = tk.Label(text="Not available from any retailers", fg="red")
                    n.place(x=600, y=115)
                    labels.append(n)
                else:
                    for i in range(len(tmp)):
                        if helper(tmp[i]["price"]) == helper(tmp[0]["price"]):
                            n = tk.Label(text="Retailer: " + tmp[i]["retailer"] + " " * (15-len(tmp[i]["retailer"])) + "Price: " + tmp[i]["price"], fg="green")
                        elif helper(tmp[i]["price"]) == helper(tmp[-1]["price"]):
                            n = tk.Label(text="Retailer: " + tmp[i]["retailer"] + " " * (15-len(tmp[i]["retailer"])) +"Price: " + tmp[i]["price"], fg="red")
                        else:
                            n = tk.Label(text="Retailer: " + tmp[i]["retailer"] + " " * (15-len(tmp[i]["retailer"])) +"Price: " + tmp[i]["price"], fg="dark orange")

                        n.bind("<Button-1>", lambda e, url=tmp[i]["url"]: webbrowser.open_new(url))
                        n.place(x=600, y=115+30*i)
                        labels.append(n)

                    statisticsLabel = tk.Label(text="Summary:")
                    filteredPrices = [i for i in allprices if i <= 0.95 * float(d[setID][2][1:])]
                    if len(filteredPrices) == 0:
                        avgDiscountedPrice = tk.Label(text="Never been discounted.")
                        percentileLabel = tk.Label(text="It is the Retail Price.")
                        message = "WAIT FOR IT TO GO ON SALE!!!"
                    else:
                        avgDiscountedPrice = tk.Label(text="Average Discounted Price is £" + str("{:.2f}".format(sum(filteredPrices)/max(1, len(filteredPrices))))+".")
                        percentile = determinePercentile(prices[-1], sorted(filteredPrices))
                        percentileLabel = tk.Label(text="Top " + str("{:.2f}".format(percentile)) + "% of all discounted prices.")

                        if percentile == 0:
                            message = "Best price!"
                        elif percentile < 10:
                            message = "Very good price!"
                        elif percentile < 20:
                            message = "Good price."
                        elif percentile < 30:
                            message = "OK price..."
                        else:
                            message = "You can do better..."

                    verdictLabel = tk.Label(text=message)
                    statisticsLabel.place(x=600, y=395)
                    avgDiscountedPrice.place(x=600, y=415)
                    percentileLabel.place(x=600, y=435)
                    verdictLabel.place(x=600, y=455)
                backButton = tk.Button(text="< Back", command=lambda:back([backButton, fig, statisticsLabel, avgDiscountedPrice, percentileLabel, verdictLabel]+labels))
                backButton.place(x=25, y=10)
                badTracking = tk.Button(text="Report Bad Tracking", command=lambda:reportBadTracking(badTracking, successMessage, data))
                badTracking.place(x=600, y=85)
                labels.append(badTracking)
                successMessage = tk.Label(text="Report Sent Successfully!")
                labels.append(successMessage)


def determinePercentile(n, A):
    i = 0
    while i < len(A) and n > A[i]:
        i += 1
    return i * 100 / len(A)

def reportBadTracking(button, successMessage, data):
    collection = MongoClient(uri)["pricesDB"]["reports"]
    collection.insert_one({data["id"]: data["prices"]})
    button.destroy()
    successMessage.place(x=600, y=85)


# FROM OS LAB 5
def add_path(cmd, path):
    if cmd[0] not in ['/', '.']:
        for d in path:
            execname = d + cmd
            if os.path.isfile(execname) and os.access(execname, os.X_OK):
                return execname
        return False
    else:
        return cmd


def loginUser(username, password, widgets):
    widgets[1].place_forget()
    collection = MongoClient(uri)["pricesDB"]["users"]
    if collection.count_documents({"username": username, "password": password}) == 1:
        user["role"] = "user"
        user["username"] = username
        clear(widgets)
        mainPage()
    else:
        widgets[1].place(x=200, y=50)

def registerUser(username, password1, password2, widgets):
    widgets[1].place_forget()
    collection = MongoClient(uri)["pricesDB"]["users"]
    if collection.count_documents({"username": username}) == 1:
        widgets[1].place(x=200, y=50)
    else:
        if username != "" and password1 == password2 and password1 != "":
            collection.insert_one({"username": username, "password": password1})
            clear(widgets)
            user["role"] = "user"
            user["username"] = username
            mainPage()
        else:
            widgets[1].place(x=200, y=50)

def load_data():
    try:
        client = MongoClient(uri)
        db = client["pricesDB"]["wanted"].find_one({"username": user["username"]})
        collection = [i["id"] for i in db["collection"]]
    except:
        collection = []
    try:
        collection += client["pricesDB"]["owned"].find_one({"username": user["username"]})["collection"]
    except:
        pass
    return collection

def recommend(r, similarity, n, collection):
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
    length = 0
    for i in collection:
        length += len(similarity[i][1])
    if len(collection) != 0 and length >= 8:
        while len(r) < n:
            x = collection[random.randint(0,len(collection)-1)]
            recommend(r, similarity, x, collection)
    else:
        random_set(r, n)
    return list(r)

def signOut(widgets):
    clear(widgets)
    user["role"] = "guest"
    user["username"] = None
    mainPage()

def back(widgets):
    rs = [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10]
    for r in rs:
        r.set("")
    clear(widgets)
    mainPage()

def callback(url):
   webbrowser.open_new_tab(url)

def helper(x):
    try:
        return float(x[1:])
    except:
        return float(x[2:])

def clear(widgets):
    for i in widgets:
        i.destroy()

# FROM OS LAB 5
def wantedPriceScrape(widgets):
    clear(widgets)
    client = MongoClient(uri)
    db = client["pricesDB"]
    c = db["wanted"].find_one({"username": user["username"]})["collection"]
    sets = [i["id"] for i in c]
    cmd = "node"
    args = ["node", "scraper/index.js", ",".join(sets)]
    execname = add_path(cmd, THE_PATH)
    if not execname:
        print('Executable file ' + str(cmd) + ' not found')
    else:
        # execute the command
        try:
            PID = os.fork()
        except OSError:
            pass
        if PID == 0:
            os.execv(execname, args)
        else:
            _, status = os.wait()
            if os.WIFEXITED(status):
                # ORIGINAL FROM HERE
                data = json.load(open("output.json"))

                canvas = tk.Canvas(window, borderwidth=0, background="#ffffff")
                frame = tk.Frame(canvas, background="#ffffff")
                vsb = tk.Scrollbar(window, orient="vertical", command=canvas.yview)
                canvas.configure(yscrollcommand=vsb.set)

                vsb.pack(side="right", fill="y")
                canvas.pack(side="left", fill="both", expand=True)
                canvas.create_window((4,4), window=frame, anchor="nw")

                frame.bind("<Configure>", lambda event, canvas=canvas: onFrameConfigure(canvas))

                tk.Button(frame, text="< Back", command=lambda:back([canvas, vsb])).grid(row=0, column=0, sticky="w", padx=25, pady=10)


                last = 1
                frame.rowconfigure(last, weight=0)
                images = []
                info = []
                for i in range(len(data)):
                    tosort = []
                    notsort = []
                    for j in data[i]:
                        if j["price"] == "Not available from this retailer":
                            notsort.append(j)
                        else:
                            tosort.append(j)
                    tmp = sorted(tosort, key=lambda x: helper(x["price"]))

                    raw_data = urllib.request.urlopen(d[sets[i]][12]).read()
                    im = Image.open(io.BytesIO(raw_data))

                    if im.size[0] > im.size[1]:
                        new_width = 225
                        new_height = new_width * im.size[1] // im.size[0]
                    else:
                        new_height = 168
                        new_width = new_height * im.size[0] // im.size[1]

                    im = im.resize((new_width, new_height))
                    image = ImageTk.PhotoImage(im)
                    images.append(image)
                    x = tk.Label(frame, image=image)
                    x.image = image
                    tk.Label(frame, text="-"*175).grid(row=last, columnspan=2, rowspan=1)
                    last += 1
                    x.grid(column=0, row=last, rowspan=len(data[i])-1, columnspan=1, sticky="w", padx=50)
                    last += 1
                    info.append(x)
                    tk.Label(frame, text=sets[i] + ": " + d[sets[i]][0]).grid(column=1, row=last, sticky="w", padx=25)
                    last += 1
                    for j in range(len(tmp)):
                        if helper(tmp[j]["price"]) == helper(tmp[0]["price"]):
                            n = tk.Label(frame, text="Retailer: " + tmp[j]["retailer"] + " " * (15-len(tmp[j]["retailer"])) + "Price: " + tmp[j]["price"], fg="green")
                        elif helper(tmp[j]["price"]) == helper(tmp[-1]["price"]):
                            n = tk.Label(frame, text="Retailer: " + tmp[j]["retailer"] + " " * (15-len(tmp[j]["retailer"])) +"Price: " + tmp[j]["price"], fg="red")
                        else:
                            n = tk.Label(frame, text="Retailer: " + tmp[j]["retailer"] + " " * (15-len(tmp[j]["retailer"])) +"Price: " + tmp[j]["price"], fg="dark orange")
                        n.grid(column=1, row=last, sticky="w", padx=25)
                        n.bind("<Button-1>", lambda e, url=tmp[j]["url"]: webbrowser.open_new(url))
                        last += 1
                    for j in range(len(notsort)):
                        tk.Label(frame, text="Retailer: " + notsort[j]["retailer"] + " " * (15-len(notsort[j]["retailer"])) +"Price: " + notsort[j]["price"], fg="red").grid(column=1, row=last, sticky="w", padx=25)
                        last += 1
                    tk.Label(frame, text="-"*175).grid(row=last, columnspan=2, rowspan=1)
                    last += 1
                frame.columnconfigure(0, weight=0)
                frame.columnconfigure(1, weight=1)

def onFrameConfigure(canvas):
    canvas.configure(scrollregion=canvas.bbox("all"))

if __name__ == "__main__":
    mainPage()
