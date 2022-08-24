from influxdb import InfluxDBClient

if __name__ == "__main__":
    client = InfluxDBClient(username="gcusack", password="nZpypzlcGA", host='internal-metrics.solana.com', ssl=True, verify_ssl=True, port=8086)
    # client = InfluxDBClient(host='localhost', port=8087)
    # InfluxDBClient(u)

    version = client.ping()
    print(version)
    # databases = client.get_list_database()
    # client.switch_database('gossipDb')

