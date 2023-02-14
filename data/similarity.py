# 0 - id
# 1 - name
# 2 - theme
# 3 - price
# 4 - age
# 5 - pieces
# 6 - tag
# 7 - rating
# 8 - reviews
# 9 - minifgures
# 10 - height
# 11 - width
# 12 - depth
# 13 - image
# 14 - link
# 15+ - tags

from curses import mouseinterval
import json

def ED(A, B):
    s = 0
    for i in range(len(A)):
        s += (A[i] - B[i]) ** 2
    return s ** 0.5

def JI(setA, setB):
    return len(setA.intersection(setB)) / len(setA.union(setB))

with open('data4.txt', 'r') as data:
    rows = [i[:-1].split(';') for i in data]

d = {}
minVal = None
maxVal = None

for i in range(len(rows)):
    idA = rows[i][0]
    themeA = rows[i][2]
    priceA = float(rows[i][3][1:])
    
    try:
        ageA = int(rows[i][4][:-1])
    except: 
        ageA = 2
    
    piecesA = int(rows[i][5])

    tagA = rows[i][6]
    
    try:
        ratingA = float(rows[i][7])
    except:
        ratingA = rows[i][7]
    
    reviewsA = float(rows[i][8])
    try:
        minifiguresA = int(rows[i][9])
    except:
        minifiguresA = 0

    try:
        heightA = int(rows[i][10])
    except:
        heightA = rows[i][10]

    try:
        widthA = int(rows[i][11])
    except:
        widthA = rows[i][11]

    try:
        depthA = int(rows[i][12])
    except:
        depthA = rows[i][12]

    setA = set([themeA, tagA] + rows[i][15:])

    for j in range(i+1, len(rows)):
        
        idB = rows[j][0]
        themeB = rows[j][2]
        priceB = float(rows[j][3][1:])
        
        try:
            ageB = int(rows[j][4][:-1])
        except:
            ageB = 2

        piecesB = int(rows[j][5])
        tagB = rows[j][6]
        
        try:
            ratingB = float(rows[j][7])
        except:
            ratingB = rows[j][7]
        
        reviewsB = float(rows[j][8])

        try:
            minifiguresB = int(rows[j][9])
        except:
            minifiguresB = 0

        try:
            heightB = int(rows[j][10])
        except:
            heightB = rows[j][10]

        try:
            widthB = int(rows[j][11])
        except:
            widthB = rows[j][11]

        try:
            depthB = int(rows[j][12])
        except:
            depthB = rows[j][12]

        setB = set([themeB, tagB] + rows[i][15:])

        vA = [priceA, ageA, piecesA, reviewsA, ratingA, minifiguresA, heightA, widthA, depthA]
        vB = [priceB, ageB, piecesB, reviewsB, ratingB, minifiguresB, heightB, widthB, depthB]
        
        if tagA == 'New' or tagB == 'New' or reviewsA == 0 or reviewsB == 0:
            vA[3] = 0
            vB[3] = 0

        if ratingA == 'unavailable' or ratingB == 'unavailable':
            vA[4] = 0
            vB[4] = 0

        if minifiguresA == 0 or minifiguresB == 0:
            vA[5] = 0
            vB[5] = 0

        if heightA == 'unavailable' or heightB == 'unavailable':
            vA[6] = 0
            vB[6] = 0

        if widthA == 'unavailable' or widthB == 'unavailable':
            vA[7] = 0
            vB[7] = 0

        if depthA == 'unavailable' or depthB == 'unavailable':
            vA[8] = 0
            vB[8] = 0

        ji = JI(setA, setB)

        ed = ED(vA, vB)

        if idA in d:
            d[idA].append((idB, ji, ed))
        else:
            d[idA] = [(idB, ji, ed)]

        if idB in d:
            d[idB].append((idA, ji, ed))
        else:
            d[idB] = [(idA, ji, ed)]

        if minVal == None or ed < minVal:
            minVal = ed
        elif maxVal == None or ed > maxVal:
            maxVal = ed

r = maxVal - minVal
d2 = {}
keys = list(d.keys())
for k in range(len(keys)):
    i = keys[k]
    total = 0
    for j in range(k, len(d[i])):
        similarity = (d[i][j][1] + 1 - ((d[i][j][2] - minVal) / r)) / 2
        if similarity > 0.75:
            if i in d2:
                d2[i][0] += similarity
                d2[i][1].append((d[i][j][0], similarity))
            else:
                d2[i] = [similarity, [(d[i][j][0], similarity)]]

            if d[i][j][0] in d2:
                d2[d[i][j][0]][0] += similarity
                d2[d[i][j][0]][1].append((i, similarity))
            else:
                d2[d[i][j][0]] = [similarity, [(i, similarity)]]

    d2[i][1].sort(key = lambda x : x[1], reverse = True)

json.dump(d2, open('data5.json', 'w'))

