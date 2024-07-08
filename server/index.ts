import Fastify from 'fastify';
import cors from '@fastify/cors';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

import config from "./config.json";
import schema from "./schema.json";
import { kWh_to_CLP, tsv_to_lines, query } from './utilities';

const fastify = Fastify({ logger: true });
await fastify.register(cors);
const client = new InfluxDB(config.influx.connection);

fastify.get('/update', async (request, reply) => {
	const data = tsv_to_lines();
	const writer = client.getWriteApi(config.influx.org, config.influx.bucket);
	writer.writeRecords(data);
	await writer.close();

	return data.length;
});

const routes = {
	'/data/recent': [ '-2d', 'hourly', '1h', 'mean' ],
	'/data/month': [ '-32d', 'daily', '24h', 'mean' ],
	'/data/all': [ '0', 'daily', '24h', 'mean' ],
};

for (const [ route, params ] of Object.entries(routes)) {
	fastify.get(route, async (req, reply) => {
		const flux = `
			from(bucket: "iot_sensors")
			  |> range(start: ${params[0]})
			  |> filter(fn: (r) => r["_measurement"] == "readings")
			  |> filter(fn: (r) => r["_field"] == "delta" or r["_field"] == "kWh")
			  |> filter(fn: (r) => r["type"] == "electricity_${params[1]}")
			  |> aggregateWindow(every: ${params[2]}, fn: ${params[3]}, createEmpty: false)
			  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
			  |> yield(name: "readings")
		`;

		const response = await query(client, flux);
		const data = response.map(row => {
			return {
				date: row._time.split('T')[0],
				time: row._time.split('T')[1].split(':').slice(0, 2).join(':'),
				kWh: row.kWh,
				delta: parseFloat(row.delta.toFixed(6)),
				price: parseInt(kWh_to_CLP(row.delta).toFixed(0)),
			}
		});

		reply.send({
			'success': true,
			params,
			data,
		});
	});
}

fastify.post('/data/range', { schema: schema['POST /data/range'] }, async (request, reply) => {
	const start = request.body.start;
	const end = request.body.end;
	// this is so fucking ugly
	const startdate = `${String(start.year).padStart(2, '0')}-${String(start.month).padStart(2, '0')}-${String(start.day).padStart(2, '0')}T00:00:00Z`;
	const enddate = `${String(end.year).padStart(2, '0')}-${String(end.month).padStart(2, '0')}-${String(end.day).padStart(2, '0')}T00:00:00Z`;

	console.log('weve received a request for', startdate, 'to', enddate);

	const flux = `
		from(bucket: "iot_sensors")
		  |> range(start: ${startdate}, stop: ${enddate})
		  |> filter(fn: (r) => r["_measurement"] == "readings")
		  |> filter(fn: (r) => r["_field"] == "delta" or r["_field"] == "kWh")
		  |> filter(fn: (r) => r["type"] == "electricity_daily")
		  |> aggregateWindow(every: 24h, fn: mean, createEmpty: false)
		  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
		  |> yield(name: "readings")
	`;

	const response = await query(client, flux);
	const data = response.map(row => {
		return {
			date: row._time.split('T')[0],
			time: row._time.split('T')[1].split(':').slice(0, 2).join(':'),
			kWh: row.kWh,
			delta: parseFloat(row.delta.toFixed(6)),
			price: parseInt(kWh_to_CLP(row.delta).toFixed(0)),
		}
	});

	reply.send({
		'success': true,
		data,
	});
});

await fastify.listen({
	port: 3000
});
