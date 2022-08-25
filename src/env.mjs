/** InfluxDB v2 URL */
// const url = process.env['INFLUX_URL'] || 'http://localhost:8086'
// const url = process.env['INFLUX_URL'] || 'http://localhost:3001/api/dashboards/home'
const url = process.env['INFLUX_URL'] || 'http://localhost:8080/'

/** InfluxDB authorization token */
const token = process.env['INFLUX_TOKEN'] || 'eyJrIjoibnhoZXF2SUpoMVFSTWo1bnBFY3RIVnd5V3JpaUdDWmciLCJuIjoiZ29zc2lwLXZpc3VhbGl6ZXIiLCJpZCI6MX0='
/** Organization within InfluxDB  */
const org = process.env['INFLUX_ORG'] || 'greg-org'
/**InfluxDB bucket used in examples  */
const bucket = 'my-bucket'
// ONLY onboarding example
/**InfluxDB user  */
const username = 'read'
/**InfluxDB password  */
const password = 'read'

export {url, token, org, bucket, username, password}