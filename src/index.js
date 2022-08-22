import Graph from "react-graph-vis";
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from 'axios'
// import DateTimePicker from 'react-datetime-picker'
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';

import { acceptsEncodings } from "express/lib/request";
const Influx = require('influx')
// const influx = new Influx.InfluxDB('http://read:read@localhost:8087/database')
const influx = new Influx.InfluxDB('http://read:read@localhost:8087/gossipDb')
// axios({ url: "test", baseURL: "http://localhost:8000" });
axios.defaults.baseURL = 'http://localhost:8000';


const gossipQuery = "select host from \"gossip-peers\" order by desc limit 1";

const options = {
  layout: {
    hierarchical: false 
  },
  edges: {
    color: "#000000"
  }
};



function randomColor() {
  const red = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  const green = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  const blue = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  return `#${red}${green}${blue}`;
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

  


  const [connections, setConnections] = useState([])
  // const [value, onChange] = useState(new Date());

  const now = new Date();
  const yesterdayBegin = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const [value, onChange] = useState([yesterdayBegin, todayNoon])

  
  useEffect(() => {
    const fetchData = async () => {
      // const data = axios.get('/test').then(res => setConnections(res.data))
      // const res = await axios.get('/test')
      const startTs = value[0].toISOString()
      const endTs = value[1].toISOString()
      // const v = value[0].toISOString()
      // console.log(v)
      const queryString = '/query/'.concat(startTs).concat('/').concat(endTs)
      console.log(queryString)
      const res = await axios.get(queryString)
      console.log(res.data)
      console.log(value[0])
      console.log(value[1])
    }
    fetchData()
      .catch(console.error)
  }, [value]);

  // return connections.map((p, index) => {
  //   return <p key={index}>{p.c0}</p>
  // })

  
  



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

  const [prevNode, setPrevNode] = useState(() => {
    return 1;
  });


  const fetchQueryWrap = async () =>  {
    let nodeId = await fetchQuery();
    console.log('running every 3 seconds!');
    console.log('nodeId added: ', nodeId);

    setPrevNode(nodeId);


  }


 
  // this.setNodeIdList(nodeIdList = (id1) => ({
  //   myArray: [...nodeIdList.myArray, id1]
  // }));

  const fetchQuery = async () => {
    const nodeId = influx.query(gossipQuery
    //  const nodeId = influx.query('SELECT mean("gossip_listen_loop_iterations_since_last_report") AS "gossip_listen_loop_iterations_since_last_report" FROM "testnet"."autogen"."cluster_info_stats3" WHERE time > now()-2m  GROUP BY time(10s) fill(null)'
        ).then(rawData => {
            // console.log(rawData);
            console.log(rawData[0]["host"])
            // console.log(rawData[0]["time"], "---", rawData[0]["gossip_listen_loop_iterations_since_last_report"]);
            var id1 = rawData[0]["host"]
            createGossipInstance(311, -211, id1, prevNode);
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

  const [state, setState] = useState({
    counter: 5,
    graph: {
      nodes: [
        { id: 1, label: "Node 1", color: "#e04141" },
        { id: 2, label: "Node 2", color: "#e09c41" },
        { id: 3, label: "Node 3", color: "#e0df41" },
        { id: 4, label: "Node 4", color: "#7be041" },
        { id: 5, label: "Node 5", color: "#41e0c9" }
      ],
      edges: [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
        { from: 2, to: 5 },
        { from: 5, to: 3 },
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
      }
    }

  })
  const { graph, events } = state;
  return (
    <div>
      {/* <button onClick={decrementCount}>-</button>
      <span>{count}</span>
      <span>{theme}</span>
      <button onClick={incrementCount}>+</button> */}

      <button onClick={fetchQueryWrap}>PRESS TO ADD A NODE</button>
      {/* <div><DateTimePicker onChange={onChange} value={value} /></div> */}
      <div><DateTimeRangePicker 
        format='y-MM-dd h:mm:ss a'
        // returnValue='range'
        onChange={onChange} value={value} 
        />
      </div>

      
      <h1>React graph vis</h1>
      <p>
        <a href="https://github.com/crubier/react-graph-vis">Github</a> -{" "}
        <a href="https://www.npmjs.com/package/react-graph-vis">NPM</a>
      </p>
      <p><a href="https://github.com/crubier/react-graph-vis/tree/master/example/src/index.js">Source of this page</a></p>
      <p>A React component to display beautiful network graphs using vis.js</p>
      <p>Make sure to visit <a href="http://visjs.org">visjs.org</a> for more info.</p>
      <p>This package allows to render network graphs using vis.js.</p>
      <p>Rendered graphs are scrollable, zoomable, retina ready, dynamic</p>
      <p>In this example, we manage state with react: on double click we create a new node, and on select we display an alert.</p>
      <Graph graph={graph} options={options} events={events} style={{ height: "640px" }} />
    </div>
  );

}

ReactDOM.render(
  <App />,
  document.getElementById("root")
);