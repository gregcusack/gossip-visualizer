from concurrent.futures import process
from sqlite3 import connect
from unittest.util import strclass
from influxdb import InfluxDBClient
import numpy as np
import json
import sys
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Graph import Graph_struct
from typing import Optional
from bidict import bidict

app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"HELLOOW WORLD"}

@app.get("/query/{t0}/{t1}")
def run_query(t0: str, t1: str):
    conn_components, edges = run(t0, t1)
    return {"connected_components" : conn_components, "edges": edges}

@app.get("/test")
def run_test():
    return {"c0": [1, 2, 3]}

def process_results(points):
    pubkey_index_bidict = bidict({})
    hostMap = {}
    pub_key_set = {}
    count = 0
    for point in points:
        host = point['host']
        peers = point['peers'].split()
        if host not in pub_key_set:
            pub_key_set[host] = count
            pubkey_index_bidict[host] = count
            count += 1
        if point['host'] not in hostMap:
            hostMap[host] = set()
        for peer in peers:
            hostMap[host].add(peer)
            if peer not in pub_key_set:
                pub_key_set[peer] = count
                pubkey_index_bidict[peer] = count
                count += 1

    # print(hostMap)
    print("#################  PARSED QUERY  #################")
    row_names = []
    print("all keys: " + str(pub_key_set))
    for h, ps in hostMap.items():
        row_names.append(h)

    graph = Graph_struct(len(pub_key_set))

    print("Graph Edges:")
    graph_edges = []
    for h, ps in hostMap.items():
        for p in ps:
            print(h,p)
            graph.add_edge(pub_key_set[h], pub_key_set[p])
            graph_edges.append([h,p])

    
    conn_comp = graph.connected_components()
    print("The connected components are :")
    print(conn_comp)

    connected_pubkeys = {}
    for idx, component in enumerate(conn_comp):
        connected_pubkeys["cluster_" + str(idx)] = [pubkey_index_bidict.inverse[i] for i in component]

    for k, connections in connected_pubkeys.items():
        print("connected keys: " + str(k) + ", " + str(connections))
    
    # return conn_comp
    return connected_pubkeys, graph_edges


def parse_result(result):

    points = result.get_points()
    return process_results(points)


def query(client, t0, t1):
    # result = client.query('SELECT time, host, peers FROM "gossip-peers" \
    #     where time > \'2022-08-22T14:16:51.00Z\' and time < \'2022-08-22T14:25:38.00Z\' order by time asc')
    result = client.query('SELECT time, host, peers FROM "gossip-peers" \
        where time > \'' + t0 + '\' and time < \'' + t1 + '\' order by time asc')    
    # result = client.query('SELECT time, host, peers FROM "gossip-peers" \
    #     where host=\'Am5n3J8Qym76r1uaCyZV3WMrmgg8zbPDKWDco72jV5zq\' and \
    #     time > \'2022-08-19T16:20:30Z\' and time < \'2022-08-19T16:20:32Z\' order by time asc')
    # result = client.query('SELECT count(host), count(peers) FROM "gossip-peers" where host=\'Am5n3J8Qym76r1uaCyZV3WMrmgg8zbPDKWDco72jV5zq\' group by host, time(1s)')
    # result = client.query('select time, host, peers from "gossip-peers" order by time desc limit 10')
    return parse_result(result) 


def run(t0, t1):
    
    t0_dt = datetime.strptime(t0, '%Y-%m-%dT%H:%M:%S.%fZ')
    t1_dt = datetime.strptime(t1, '%Y-%m-%dT%H:%M:%S.%fZ')

    client = InfluxDBClient(host='localhost', port=8087)
    databases = client.get_list_database()
    client.switch_database('gossipDb')

    return query(client, t0, t1)    


if __name__ == '__main__':
    # uvicorn.run(app, host="0.0.0.0", port=8000)
    if len(sys.argv) < 3:
        print("ERROR: need to enter start and end timestamp to query for connected components graph")
        sys.exit(-1)
    
    t0 = sys.argv[1]
    t1 = sys.argv[2]
    run(t0, t1)