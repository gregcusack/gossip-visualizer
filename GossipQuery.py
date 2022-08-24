from influxdb import InfluxDBClient
from datetime import datetime
import pytz
from bidict import bidict
import sys
from Graph import Graph_struct




class GossipQuery():
    def __init__(self, location, query_type):
        self.location = location
        self.query_type = query_type
        self.client = InfluxDBClient(host='localhost', port=8087)
        self.client.switch_database('gossipDb')
        self.points = None
        self.result = None

    @staticmethod
    def convertFromLocaltoUTC(location, t0, t1):
        res = {}
        if location == "web":
            res["start"] = t0
            res["end"] = t1
        else:
            t0_dt = datetime.strptime(t0, '%Y-%m-%dT%H:%M:%S.%fZ')
            t1_dt = datetime.strptime(t1, '%Y-%m-%dT%H:%M:%S.%fZ')
            t0_utc = t0_dt.astimezone(pytz.UTC).strftime('%Y-%m-%dT%H:%M:%S.%fZ')[:-4] + "Z"
            t1_utc = t1_dt.astimezone(pytz.UTC).strftime('%Y-%m-%dT%H:%M:%S.%fZ')[:-4] + "Z"
            res["start"] = t0_utc
            res["end"] = t1_utc
        

        return res

    def query(self, op1, op2):
        if self.query_type == "connections":
            return self.execute_connections_query(op1, op2)
        elif self.query_type == "messages":
            return self.execute_messages_query(op1, op2)
        else:
            print("Error: invalid query_type for query(): {}", str(self.query_type))
            sys.exit(-1)
    
    def parse_result(self):
        points = self.result.get_points()
        if self.query_type == "connections": 
            return self.process_connection_results(points)
        elif self.query_type == "messages":
            return self.process_message_results(points)
        else:
            print("Error: invalid query_type for parse(): {}", str(self.query_type))
            sys.exit(-1) 


    def execute_messages_query(self, signature, source):
        query_string = 'SELECT current_host, timestamp_at_host FROM "gossip-messages" \
            where message_signature=\'' + signature + '\' and originating_host=\'' + source + '\' order by time asc' 

        self.result = self.client.query(query_string)
        return self.parse_result()

    def execute_connections_query(self, t0, t1):
        timerange = GossipQuery.convertFromLocaltoUTC(self.location, t0,t1)
        # query_string = 'SELECT time, host, peers FROM "gossip-peers"'

        query_string = 'SELECT time, host, peers FROM "gossip-peers" \
            where time > \'' + timerange["start"] + '\' and time < \'' + timerange["end"] + '\' order by time asc'

        self.result = self.client.query(query_string)    
        return self.parse_result() 

    def process_connection_results(self, points):
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
        # print("all keys: " + str(pub_key_set))
        for h, ps in hostMap.items():
            row_names.append(h)

        graph = Graph_struct(len(pub_key_set))

        print("Graph Edges:")
        graph_edges = []
        for h, ps in hostMap.items():
            for p in ps:
                # print(h,p)
                graph.add_edge(pub_key_set[h], pub_key_set[p])
                graph_edges.append([h,p])

        
        conn_comp = graph.connected_components()
        print("The connected components are :")
        print(conn_comp)

        connected_pubkeys = {}
        for idx, component in enumerate(conn_comp):
            connected_pubkeys["cluster_" + str(idx)] = [pubkey_index_bidict.inverse[i] for i in component]

        # for k, connections in connected_pubkeys.items():
        #     print("connected keys: " + str(k) + ", " + str(connections))
        
        # return conn_comp
        return connected_pubkeys, graph_edges

    def process_message_results(self, points):
        # print(points)
        result = []
        for point in points:
            # print(point)
            result.append(point)

        return sorted(result, key=lambda x: x["timestamp_at_host"])
