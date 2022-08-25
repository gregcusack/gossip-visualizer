import Graph from "react-graph-vis";
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import axios from 'axios'
// import DateTimePicker from 'react-datetime-picker'
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';
const Influx = require('influx')
// const influx = new Influx.InfluxDB('http://read:read@localhost:8087/database')
// axios({ url: "test", baseURL: "http://localhost:8000" });
axios.defaults.baseURL = 'http://localhost:8000';


const options = {
  
  physics: {
    hierarchicalRepulsion: {
      centralGravity: 0.0,
      springLength: 100,
      springConstant: 0.01,
      nodeDistance: 120,
      damping: 0.09,
      avoidOverlap: 100
    },
    stabilization: {
      enabled: true,
      iterations: 100,
      updateInterval: 100,
      onlyDynamicEdges: false,
      fit: true
    },
  },
  edges: {
    color: "#000000",
    // physics: false,
    length: 500,
  },

};



function randomColor() {
  var letters = '6789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * letters.length)];
  }
  // console.log("color:", color)
  return color;


  // return `#${red}${green}${blue}`;
}

const App = () => {
  const [network, setNetwork] = useState(undefined)
  const [connections, setConnections] = useState({});
  const [edges, setEdges] = useState({});
  const [nodeKeys, setNodeKeys] = useState({});
  const [nodeIndexCount, setNodeIndexCount] = useState({
    count: 6,
  });

  const now = new Date();
  const yesterdayBegin = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const [value, onChange] = useState([yesterdayBegin, todayNoon])

  
  useEffect(() => {
    const fetchData = async () => {
      const startTs = value[0].toISOString()
      const endTs = value[1].toISOString()

      const queryString = '/query-connections/'.concat(startTs).concat('/').concat(endTs)
      console.log(queryString)
      const res = await axios.get(queryString)
      setConnections(res.data.connected_components)
      setEdges(res.data.edges)

      // setCreateInstances(true)
    }
    fetchData()
      .catch(console.error)
  }, [value]);


  const client = new Influx.InfluxDB({
    host: 'localhost',
    database: 'my_db',
    port: 8087,
    username: 'read',
    password: 'read',
    schema: [
      {
        measurement: 'perf',
        fields: {
          time: Influx.FieldType.STRING,
          gossip_listen_loop_iterations_since_last_report: Influx.FieldType.Float,
        },
        tags: [
          'localhost'
        ]
      }
    ]
  })


  const createGossipConnection = (x, y, idFrom, idTo) => {
    const color = randomColor();
    // console.log("idFrom, idTo: ", idFrom, idTo);
    // console.log("toConnect: ", idTo)
    if(nodeKeys.hasOwnProperty(idFrom) && nodeKeys.hasOwnProperty(idTo)) {
      const intIdTo = nodeIndexCount[idTo]
      const intIdFrom = nodeIndexCount[idFrom]
      // console.log("connecting From, To: ", intIdTo, intIdFrom);
      // console.log("key already exists!: ", idFrom)
      setState(({ graph: { nodes, edges }, counter, ...rest }) => {
        // console.log(x, y)
        return {
          graph: {
            nodes: [
              ...nodes
            ],
            edges: [
              ...edges,
              { from: intIdFrom, to: intIdTo }
            ]
          },
          ...rest
        }
      });

    } else if(nodeKeys.hasOwnProperty(idFrom) && !nodeKeys.hasOwnProperty(idTo)) {
      nodeKeys[idTo] = true;
      nodeIndexCount[idTo] = nodeIndexCount.count; 
      const intIdTo = nodeIndexCount[idTo]
      const intIdFrom = nodeIndexCount[idFrom]
      nodeIndexCount.count += 1;
      // console.log("connecting From, To: ", intIdTo, intIdFrom);
      setState(({ graph: { nodes, edges }, counter, ...rest }) => {
        // console.log(x, y)
        return {
          graph: {
            nodes: [
              ...nodes,
              { id: intIdTo, label: `${idTo}`, color, x, y }
            ],
            edges: [
              ...edges,
              { from: intIdFrom, to: intIdTo }
            ]
          },
          ...rest
        }
      });
    }
    else if(!nodeKeys.hasOwnProperty(idFrom) && !nodeKeys.hasOwnProperty(idTo)) {
      nodeKeys[idFrom] = true;
      nodeKeys[idTo] = true;
      nodeIndexCount[idTo] = nodeIndexCount.count; 
      nodeIndexCount.count += 1;
      nodeIndexCount[idFrom] = nodeIndexCount.count; 
      nodeIndexCount.count += 1;
      const intIdTo = nodeIndexCount[idTo]
      const intIdFrom = nodeIndexCount[idFrom]
      setState(({ graph: { nodes, edges }, counter, ...rest }) => {
        // console.log(x, y)
        return {
          graph: {
            nodes: [
              ...nodes,
              { id: intIdFrom, label: `${idFrom}`, color, x, y },
              { id: intIdTo, label: `${idTo}`, color, x, y }
            ],
            edges: [
              ...edges,
              { from: intIdFrom, to: intIdTo }
            ]
          },
          ...rest
        }
      });
    } else { //idfrom does not exist, idTo exists
      nodeIndexCount[idFrom] = nodeIndexCount.count; 
      nodeIndexCount.count += 1;
      const intIdFrom = nodeIndexCount[idFrom]
      const intIdTo = nodeIndexCount[idTo]

      nodeKeys[idFrom] = true;
      setState(({ graph: { nodes, edges }, counter, ...rest }) => {
        console.log(x, y)
        return {
          graph: {
            nodes: [
              ...nodes,
              { id: intIdFrom, label: `${idFrom}`, color, x, y }
            ],
            edges: [
              ...edges,
              { from: intIdFrom, to: intIdTo }
            ]
          },
          ...rest
        }
      });
    }
    
  }

  const plotPeers = () => {
    Object.values(edges).forEach((edge) => {
      createGossipConnection(311, -211, edge[0], edge[1])
    })
  }

  const [state, setState] = useState({
    counter: 5,
    graph: {
      nodes: [
      ],
      edges: [
      ]
    },
    events: {
      select: ({ nodes, edges }) => {
        console.log("Selected nodes:");
        console.log(nodes);
        console.log("Selected edges:");
        console.log(edges);
        alert("Selected node: " + nodes);
      },
      stabilized: () => {
        console.log("heyyy greg")
        if (network) { // Network will be set using getNetwork event from the Graph component
          network.fit();
      }
        
      }
    }
    

  })
  const { graph, events } = state;

  const renderConnections = () => {
    const divs = []
    Object.keys(connections).forEach((key) => {
      return <div> {key} : {connections[key].forEach((val) => {
        divs.push(<div>{key} : {val}</div>) 
      })} </div>
    })
    return divs
  }

  const renderEdges = () => {
    const divs = []
    Object.keys(edges).forEach((key) => {
      return <div> {edges[key].forEach((val) => {
        divs.push(<div>{val}</div>) 
      })} </div>
    })
    return divs
  }


  const isMounted = useRef(false);
  // const renderDivs = useRef(false)

  const [message, setMessage] = useState({
    signature: '',
    originatingHost: ''
  });
  
  const [signature, setSignature] = useState('3y9Cx7m8KjA6nr2K6UzSwewVTdpmdB4DSomkV1bpLSRNdrME6QevQmK38QSmKAS4ciNMDKztkFvuhvEk5dQ1ihWF');
  const [originatingHost, setOriginatingHost] = useState('9qWd7mp1rHYNp57JKwc23jzCCdCcMqySPHPXDKTYeX3Q');

  const [messageResults, setMessageResults] = useState({});
  const [renderDivs, setRenderDivs] = useState(false)
  
  const renderMessageResults = () => {
    if (renderDivs) {
      const divs = []
      divs.push(<div><p>Message Signature: {signature} <br /> Host pubkey that created the message: {originatingHost}</p></div>);
      divs.push(<div>Timestamp &emsp; &emsp; &emsp;&emsp;&emsp;&emsp;&emsp; Pubkey of host message is currently at</div>);

      Object.keys(messageResults).forEach((key) => {
        divs.push(<div>{messageResults[key].timestamp_at_host} : {messageResults[key].current_host}</div>);
      })
      divs.push(<p></p>)
      return divs;
    }
  }


  useEffect(() => {
    if(isMounted.current) {
      const fetchData = async () => {
        const sig = message.signature;
        const host = message.originatingHost;
        const queryString = '/query-messages/'.concat(sig).concat('/').concat(host)
        console.log(queryString)
        const res = await axios.get(queryString)
        console.log("query res: ", res.data);
        setMessageResults(res.data)
        setRenderDivs(true)
      }
      fetchData()
        .catch(console.error)
    } else {
      isMounted.current = true;
    }

  }, [message]);


  const handleSubmit = (e) => {
    e.preventDefault(); // prevents page from being refreshed
    setMessage({signature: signature, originatingHost: originatingHost})

  }

  return (
    <div>
      <h1>Solana Gossip Visualizer</h1>
      <div><DateTimeRangePicker 
        format='y-MM-dd h:mm:ss a'
        // returnValue='range'
        onChange={onChange} value={value} 
        />
      </div>
      {<div>Cluster Connections: {renderConnections()}</div>}
      {/* <div>
        {<button onClick={renderEdges}>PRESS TO SHOW ALL EDGES</button>}
      </div> */}
      {/* {<div>{renderEdges()}</div>} */}

      
      <button onClick={plotPeers}>PRESS TO PLOT PEERS</button>
      
      <p>
        Track Gossip Messages below by message signature and originating host!
      </p>
      <div>
        <form onSubmit={handleSubmit}>
          <label>
            Message Signature:
            <input 
              type="text" 
              required
              style={{width: "750px"}}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
          </label>
          <br />
          <label>
            Message Origin:
            <input 
              type="text" 
              required
              style={{width: "370px"}}
              value={originatingHost}
              onChange={(e) => setOriginatingHost(e.target.value)}
            />
          </label>
          <button>Search</button>
        </form>
      </div>
      <div>
        {renderMessageResults()} 
      </div>

      <Graph graph={graph} options={options} events={events} getNetwork = { network=> { setNetwork(network) } } style={{ height: "1000px", backgroundColor:'gray' }} />
    </div>
  );

}

ReactDOM.render(
  <App />,
  document.getElementById("root")
);