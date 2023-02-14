import os
import time
import random

from google.cloud import vision
from google.cloud.vision_v1 import types

with open('data3.txt', 'r') as data:
    rows = [i[:-1].split(';') for i in data]

# count = 0
# for i in rows:
#     if len(i) == 15:
#         count += 1
# print(count)

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = ''
client = vision.ImageAnnotatorClient()
image = types.Image()

for i in range(len(rows)):
    if len(rows[i]) == 15:
        print((i+1)*100/len(rows))
        image.source.image_uri = rows[i][13]
        response_label = client.label_detection(image=image)
        x = [i.description for i in response_label.label_annotations]
        print(x)
        rows[i] += x
        time.sleep(random.randint(5, 10))

with open('data4.txt', 'w') as f:
    for row in rows:
        f.write(';'.join(row)+'\n') 
