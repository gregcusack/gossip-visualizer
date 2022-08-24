import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from GossipQuery import GossipQuery

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

@app.get("/query-connections/{t0}/{t1}")
def run_connection_query(t0: str, t1: str):
    gossip_query = GossipQuery("connections")
    conn_components, edges = gossip_query.query(t0, t1)
    # conn_components, edges = connections_query(t0, t1)
    return {"connected_components" : conn_components, "edges": edges}

@app.get("/query-messages/{signature}/{source}")
def run_messages_query(signature: str, source: str):
    gossip_query = GossipQuery("messages")
    return gossip_query.query(signature, source)


@app.get("/test")
def run_test():
    return {"c0": [1, 2, 3]}


if __name__ == '__main__':
    # uvicorn.run(app, host="0.0.0.0", port=8000)
    if len(sys.argv) < 4:
        print("ERROR: need to enter start and end timestamp to query for connected components graph")
        sys.exit(-1)
    
    if sys.argv[1] == "connections":
        t0 = sys.argv[2]
        t1 = sys.argv[3]
        gossip_query = GossipQuery(sys.argv[1])
        gossip_query.query(t0, t1)

    elif sys.argv[1] == "messages":
        signature = sys.argv[2]
        source = sys.argv[3]
        gossip_query = GossipQuery(sys.argv[1])
        gossip_query.query(signature, source)
    else:
        print("ERROR: need \"connections <start ts> <end ts>\" OR \" messages <msg siganture> <source pubkey>\"")
        sys.exit(-1)
