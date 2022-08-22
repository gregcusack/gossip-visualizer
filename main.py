from concurrent.futures import process
from influxdb import InfluxDBClient
import numpy as np
import json
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import connected_components
import sys
from datetime import datetime

class Graph_struct:
   def __init__(self, V):
      self.V = V
      self.adj = [[] for i in range(V)]

   def DFS_Utililty(self, temp, v, visited):

      visited[v] = True

      temp.append(v)

      for i in self.adj[v]:
         if visited[i] == False:
            temp = self.DFS_Utililty(temp, i, visited)
      return temp

   def add_edge(self, v, w):
      self.adj[v].append(w)
      self.adj[w].append(v)

   def connected_components(self):
      visited = []
      conn_compnent = []
      for i in range(self.V):
         visited.append(False)
      for v in range(self.V):
         if visited[v] == False:
            temp = []
            conn_compnent.append(self.DFS_Utililty(temp, v, visited))
      return conn_compnent

def run_connected_components(adj_matrix):
    print("#################  CONNECTED COMPONENTS  #################")
    graph = csr_matrix(adj_matrix)
    print(graph)
    print(adj_matrix)

    n_components, labels = connected_components(csgraph=adj_matrix, directed=True, return_labels=True)
    print(n_components)

def process_results(points):
    hostMap = {}
    pub_key_set = {}
    count = 0
    for point in points:
        host = point['host']
        peers = point['peers'].split()
        if host not in pub_key_set:
            pub_key_set[host] = count
            count += 1
        if point['host'] not in hostMap:
            hostMap[host] = set()
        for peer in peers:
            hostMap[host].add(peer)
            if peer not in pub_key_set:
                pub_key_set[peer] = count
                count += 1

    print(hostMap)
    print("#################  PARSED QUERY  #################")
    row_names = []
    print("all keys: " + str(pub_key_set))
    for h, ps in hostMap.items():
        # print(h, ps)
        row_names.append(h)

    # graph = Graph_struct(len(row_names))
    graph = Graph_struct(len(pub_key_set))



    for h, ps in hostMap.items():
        for p in ps:
            print(pub_key_set[h],  pub_key_set[p])
            graph.add_edge(pub_key_set[h], pub_key_set[p])
    
    conn_comp = graph.connected_components()
    print("The connected components are :")
    print(conn_comp)


    # vals = sorted(pub_key_set)
    # new_dict = {k: [1 if x in v else 0 for x in vals] for k, v in hostMap.items()}
    # print(new_dict)
    # print(new_dict.values())
    # list_of_list = []
    # for k in new_dict.values():
    #     list_of_list.append(k) 
    
    # list_of_list = np.array(list_of_list)


    # run_connected_components(list_of_list)


def parse_result(result):

    points = result.get_points()
    process_results(points)
    # for point in points:
    #     print(point)
    
        # host = point['host']
        # peers = point['peers']
        # print(host, peers)



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
    parse_result(result) 



def run():
    if len(sys.argv) < 3:
        print("ERROR: need to enter start and end timestamp to query for connected components graph")
        sys.exit(-1)
    
    t0 = sys.argv[1]
    t1 = sys.argv[2]
    t0_dt = datetime.strptime(t0, '%Y-%m-%dT%H:%M:%SZ')
    t1_dt = datetime.strptime(t1, '%Y-%m-%dT%H:%M:%SZ')

    client = InfluxDBClient(host='localhost', port=8087)
    databases = client.get_list_database()
    client.switch_database('gossipDb')

    query(client, t0, t1)    


if __name__ == '__main__':
    run()