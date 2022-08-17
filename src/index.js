import Graph from "react-graph-vis";
import React, { useState, useEffect, useRef, useCallback, API } from "react";
import ReactDOM from "react-dom";
import axios from "axios"
// import { InfluxDB } from "influx";
const Influx = require('influx')
const influx = new Influx.InfluxDB('http://read:read@localhost:8087/database')
// const influx = new Influx.InfluxDB('http://gcusack:nZpypzlcGA@localhost:8080')


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

//   const [isSending, setIsSending] = useState(false);
//   const isMounted = useRef(true);

  const pingInfluxHosts = async() => {
      influx.ping(5000). then(hosts => {
          hosts.forEach(host => {
              if (host.online) {
                console.log(`${host.url.host} responded in ${host.rtt}ms running ${host.version}`);
              } else {
                console.log(`${host.url.host} is offline :(`);
              }
          })
      })
  }

//   const appendArray = ()

  const fetchQuery = async () => {
     influx.query('SELECT mean("gossip_listen_loop_iterations_since_last_report") AS "gossip_listen_loop_iterations_since_last_report" FROM "testnet"."autogen"."cluster_info_stats3" WHERE time > now()-2m  GROUP BY time(10s) fill(null)'
        ).then(rawData => {
            // console.log(rawData);
            console.log(rawData[0]["time"], "---", rawData[0]["gossip_listen_loop_iterations_since_last_report"]);
            // console.log(rawData[1]);
            const id1 = rawData[0]["gossip_listen_loop_iterations_since_last_report"]
            const color = randomColor();
            const x = 100;
            const y = 100;
            setState(({ graph: { nodes, edges }, counter, ...rest }) => {
                const id = counter + 1;
                const from = Math.floor(Math.random() * (counter - 1)) + 1;
                return {
                    graph: {
                        nodes: [
                            ...nodes,
                            { id1, label: `Node ${id1}`, color, x, y }
                        ],
                        edges: [
                            ...edges,
                            { from, to: id1 }
                        ]
                    },
                    counter: id1,
                    ...rest
                }
            });
        })
    
      
      
  }

  useEffect(() => {
      const interval = setInterval(() => {
        // pingInfluxHosts()
      fetchQuery()
          console.log('running every 3 seconds!');
      }, 3000);


  }, []); //typically you'd put in a boolean. .

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
      {/* <input type="button" disabled={isSending} onClick={sendRequest} /> */}
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