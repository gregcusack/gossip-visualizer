import Graph from "react-graph-vis";
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from 'axios'
// import DateTimePicker from 'react-datetime-picker'
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';
import { setSelectionRange } from "@testing-library/user-event/dist/utils";
import { consoleLogger } from "@influxdata/influxdb-client";
const Influx = require('influx')
// const influx = new Influx.InfluxDB('http://read:read@localhost:8087/database')
const influx = new Influx.InfluxDB('http://read:read@localhost:8087/gossipDb')
// axios({ url: "test", baseURL: "http://localhost:8000" });
axios.defaults.baseURL = 'http://localhost:8000';


const gossipQuery = "select host from \"gossip-peers\" order by desc limit 1";

const options = {
  // layout: {
  //   improvedLayout: true,
  //   hierarchical: {
  //     enabled: false,
  //     blockShifting: false,
  //     nodeSpacing: 10000,
  //     treeSpacing: 1000,
  //     levelSeparation: 10000,
  //     edgeMinimization: false

  //   }
  // },
  
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
  // const red = Math.floor(Math.random() * 256).toString(16).padStart(2, '7');
  // const green = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  // const blue = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  // // console.log("color: ", red, blue, green)
  var letters = '6789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * letters.length)];
  }
  console.log("color:", color)
  return color;


  // return `#${red}${green}${blue}`;
}

const App = () => {
  const createNode = (x, y) => {
    const color = randomColor();
    setState(({ graph: { nodes, edges }, counter, ...rest }) => {
      const id = counter + 1;
      console.log(x, y)
      const from = Math.floor(Math.random() * (counter - 1)) + 1;
      return {
        graph: {
          nodes: [
            ...nodes,
            { id, label: `Node ${id}`, color, x, y }
          ],
          edges: [
            ...edges,
            { from, to: id }
          ]
        },
        counter: id,
        ...rest
      }
    });
  }


  

  const [network, setNetwork] = useState(undefined)
  const [connections, setConnections] = useState({});
  const [edges, setEdges] = useState({});
  const [nodeKeys, setNodeKeys] = useState({});
  const [createInstances, setCreateInstances] = useState(false);
  const [nodeIndexCount, setNodeIndexCount] = useState({
    count: 6,
    // 'CheittPFTFkseatgHhRsMKnDwwtwUuDozZzzR3q8GEeJ': 6
  });
  // const [value, onChange] = useState(new Date());

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

  const createGossipInstance = (x, y, id, toConnect) => {
    const color = randomColor();
    setState(({ graph: { nodes, edges }, counter, ...rest }) => {
      console.log(x, y)
      const from = toConnect;
      return {
        graph: {
          nodes: [
            ...nodes,
            { id, label: `${id}`, color, x, y }
          ],
          edges: [
            ...edges,
            { from, to: id }
          ]
        },
        counter: id,
        ...rest
      }
    });
  }

  //ID needs to be "id" can't be anything else
  const createGossipInstance2 = (x, y, id, idFrom) => {
    const color = randomColor();
    setState(({ graph: { nodes, edges }, counter, ...rest }) => {
      // console.log(x, y)
      const from = idFrom;
      return {
        graph: {
          nodes: [
            ...nodes,
            { id, label: `${id}`, color, x, y }
          ],
          edges: [
            ...edges,
            { from: idFrom, to: id }
          ]
        },
        counter: id,
        ...rest
      }
    });
  }


  const [prevNode, setPrevNode] = useState(() => {
    // return 5;
    return "CheittPFTFkseatgHhRsMKnDwwtwUuDozZzzR3q8GEeJ"
  });


  const fetchQueryWrap = async () =>  {
    let nodeId = await fetchQuery();
    // console.log('running every 3 seconds!');
    // console.log('nodeId added: ', nodeId);

    setPrevNode(nodeId);
  }

  const fetchQuery = async () => {
    const nodeId = influx.query(gossipQuery
    //  const nodeId = influx.query('SELECT mean("gossip_listen_loop_iterations_since_last_report") AS "gossip_listen_loop_iterations_since_last_report" FROM "testnet"."autogen"."cluster_info_stats3" WHERE time > now()-2m  GROUP BY time(10s) fill(null)'
        ).then(rawData => {
            // console.log(rawData);
            // console.log(rawData[0]["host"])
            // console.log(rawData[0]["time"], "---", rawData[0]["gossip_listen_loop_iterations_since_last_report"]);
            var id1 = rawData[0]["host"]
            // createGossipInstance(311, -211, id1, prevNode);
            createGossipInstance2(311, -211, id1, prevNode);

            return id1;
        })
    
      return nodeId;
      
  }

  // useEffect(() => {
  //     const interval = setInterval(() => {
  //       // pingInfluxHosts()
  //     const prev = fetchQuery()
  //         console.log('running every 3 seconds!');
  //     }, 3000);
  //     setPrevNodeWrap();
  // }, []); //typically you'd put in a boolean. .

  // useEffect(() => {
  //   Object.keys(edges).forEach((edge) => {
  //     console.log("suhhhhh: edge: ", edge)
  //   })
  //   // const createGossipConnection()
  // }, [createInstances]);

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
    // console.log(edges)
    Object.values(edges).forEach((edge) => {
      // console.log("suhhhhh: edge: ", edge)
      // console.log("edge", edge[0], edge[1])
      // let nodeId = createGossipInstance(311, -211, edge[0], prevNode)
      let nodeId = createGossipConnection(311, -211, edge[0], edge[1])
      // let nodeId = createGossipConnection(311, -211, 0, 1)

      // console.log("nodeId ret: ", nodeId)
      // setPrevNode(nodeId)

    })
    // Object.keys(edges).forEach((edge) => {
    //   console.log("suhhhhh: edge: ", edge)
    // })
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
        // { id: 1, label: "Node 1", color: "#e04141" },
        // { id: 2, label: "Node 2", color: "#e09c41" },
        // { id: 3, label: "Node 3", color: "#e0df41" },
        // { id: 4, label: "Node 4", color: "#7be041" },
        // { id: 5, label: "Node 5", color: "#41e0c9" },
        // { id: "CheittPFTFkseatgHhRsMKnDwwtwUuDozZzzR3q8GEeJ", label: "CheittPFTFkseatgHhRsMKnDwwtwUuDozZzzR3q8GEeJ", color: "#41e1c9"}
      ],
      edges: [
        // { from: 1, to: 2 },
        // { from: 1, to: 3 },
        // { from: 2, to: 4 },
        // { from: 2, to: 5 },
        // { from: 5, to: 3 },
        // { from: "CheittPFTFkseatgHhRsMKnDwwtwUuDozZzzR3q8GEeJ", to: 5 }
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
      doubleClick: ({ pointer: { canvas } }) => {
        createNode(canvas.x, canvas.y);
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

  return (
    <div>
      {/* <button onClick={decrementCount}>-</button>
      <span>{count}</span>
      <span>{theme}</span>
      <button onClick={incrementCount}>+</button> */}

      {/* <button onClick={fetchQueryWrap}>PRESS TO ADD A NODE</button> */}
      {/* <div><DateTimePicker onChange={onChange} value={value} /></div> */}
      <h1>Solana Gossip Visualizer</h1>
      <div><DateTimeRangePicker 
        format='y-MM-dd h:mm:ss a'
        // returnValue='range'
        onChange={onChange} value={value} 
        />
      </div>
      {/* <button onClick={onChange}>Press to Query Gossip DB</button> */}
      {/* <tbody>
        {connections.map((row) => {
          return <val key={row.uniqueId} />
        })}
      </tbody> */}
      {<div>{renderConnections()}</div>}
      {/* {<div>{renderEdges()}</div>} */}
      <button onClick={plotPeers}>PRESS TO PLOT PEERS</button>


      
      {/* <h1>React graph vis</h1>
      <p>
        <a href="https://github.com/crubier/react-graph-vis">Github</a> -{" "}
        <a href="https://www.npmjs.com/package/react-graph-vis">NPM</a>
      </p>
      <p><a href="https://github.com/crubier/react-graph-vis/tree/master/example/src/index.js">Source of this page</a></p>
      <p>A React component to display beautiful network graphs using vis.js</p>
      <p>Make sure to visit <a href="http://visjs.org">visjs.org</a> for more info.</p>
      <p>This package allows to render network graphs using vis.js.</p>
      <p>Rendered graphs are scrollable, zoomable, retina ready, dynamic</p>
      <p>In this example, we manage state with react: on double click we create a new node, and on select we display an alert.</p> */}
      <Graph graph={graph} options={options} events={events} getNetwork = { network=> { setNetwork(network) } } style={{ height: "1000px", backgroundColor:'gray' }} />
    </div>
  );

}

ReactDOM.render(
  <App />,
  document.getElementById("root")
);