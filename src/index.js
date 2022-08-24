import Graph from "react-graph-vis";
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import axios from 'axios'
// import DateTimePicker from 'react-datetime-picker'
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';
import { consoleLogger } from "@influxdata/influxdb-client";
const Influx = require('influx')
// const influx = new Influx.InfluxDB('http://read:read@localhost:8087/database')
const influx = new Influx.InfluxDB('http://read:read@localhost:8087/gossipDb')
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
  const [createInstances, setCreateInstances] = useState(false);
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
      // console.log("key does not exist");
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
    
    // return id;
  }

  const plotPeers = () => {
    Object.values(edges).forEach((edge) => {
      createGossipConnection(311, -211, edge[0], edge[1])
    })
  }

  // useEffect(() => {
  //   console.log("what up yoo");
  //   network.setOptions({ physics: false }); // Disable physics after stabilization
  //   network.fit();
  //   // if (network) { // Network will be set using getNetwork event from the Graph component
      
  //   // }
    
  //   // const createGossipConnection()
  // }, [network]);

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
    // console.log('connecrtions', connections)
    const divs = []
    Object.keys(connections).forEach((key) => {
      // console.log('herEEEEE', key, connections[key])
      // divs.push(<div>{key} : {connections[key]}) </div>)
      return <div> {key} : {connections[key].forEach((val) => {
        // console.log(val)
        // return <div>{val}, </div>
        divs.push(<div>{key} : {val}</div>) 
      })} </div>
    })
    // console.log('divs connections', divs)
    return divs
  }

  const renderEdges = () => {
    const divs = []
    Object.keys(edges).forEach((key) => {
      // console.log('edges', edges[key])
      // divs.push(<div>{key} : {connections[key]}) </div>)
      return <div> {edges[key].forEach((val) => {
        // console.log(val)
        // return <div>{val}, </div>
        divs.push(<div>{val}</div>) 
      })} </div>
    })
    // console.log('divs edges', divs)
    return divs
  }


  const isMounted = useRef(false);
  // const renderDivs = useRef(false)

  const [message, setMessage] = useState({
    signature: '',
    originatingHost: ''
  });
  
  const [signature, setSignature] = useState('2FNSB73ay8WCVp4Ua7VEWnsSEWXLEF56FxjUBpDGgFat26vQvzdU2C7MwAu7XNXhTTUyFS11bWW713fXepHpaQBj');
  const [originatingHost, setOriginatingHost] = useState('2bFNkyX9Sb6vCeYwdnrN4ViK77pe3Br5xRXS6GyKkQYH');

  const [messageResults, setMessageResults] = useState({});
  const [renderDivs, setRenderDivs] = useState(false)
  
  const renderMessageResults = () => {
    if (renderDivs) {
      const divs = []
      divs.push(<div>Cluster Connections: </div>);
      divs.push(<div>Signature: {signature} <br /> fromHost: {originatingHost}</div>);
      Object.keys(messageResults).forEach((key) => {
        console.log('message: ', messageResults[key])

        const current_host = messageResults[key].current_host;
        const ts = Intl.DateTimeFormat('en-US', {
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit', 
          fractionalSecondDigits: 3, 
          hour12: false
        }).format(messageResults[key].timestamp_at_host)
        
        console.log(ts)
        console.log(current_host)

        divs.push(<div>{ts} : {current_host}</div>);

      })
      return divs;
    }
  }


  useEffect(() => {
    if(isMounted.current) {
      console.log("sig: ", message.signature);
      console.log("host: ", message.originatingHost);

      const fetchData = async () => {
        const sig = message.signature;
        const host = message.originatingHost;
        const queryString = '/query-messages/'.concat(sig).concat('/').concat(host)
        console.log(queryString)
        const res = await axios.get(queryString)
        console.log("query res: ", res.data);
        setMessageResults(res.data)
        // renderDivs.current = true;
        setRenderDivs(true)
        // renderMessageResults(res.data)




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
      {/* {<div>{renderEdges()}</div>} */}

      
      <button onClick={plotPeers}>PRESS TO PLOT PEERS</button>
      
      <p>
        Track Messages below by message signature and originating host!
      </p>
      <div>
        <form onSubmit={handleSubmit}>
          <label>
            Message Signature:
            <input 
              type="text" 
              required
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
              value={originatingHost}
              onChange={(e) => setOriginatingHost(e.target.value)}
            />
          </label>
          <button>Search</button>
          {/* <p>{signature}, {originatingHost}</p> */}
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