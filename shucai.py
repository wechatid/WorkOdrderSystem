import time

import requests
"""
模拟数据采集与数据存储
"""
data_url = "http://172.18.147.22:915/"
sucai = "http://172.20.218.88/checkshucai"
cuncu_url = 'http://localhost:80/devices/create'

while True:
    reslt = requests.get(sucai).json()["value"]
    if reslt:
        r_data = requests.get(data_url).json()
        response = requests.post(cuncu_url, json=r_data)
        print(response.json())

    else:
        print("停止采集数据...")
        pass

    time.sleep(5)