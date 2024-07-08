import { InfluxDB, Point } from '@influxdata/influxdb-client';
import config from "./config.json";
import schema from "./schema.json";

import { kWh_to_CLP, tsv_to_lines, query } from './utilities';

import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({
	logger: true
});

await fastify.register(cors);

const client = new InfluxDB(config.influx.connection);

fastify.get('/update', async (request, reply) => {
	const data = tsv_to_lines();
	const writer = client.getWriteApi(config.influx.org, config.influx.bucket);
	writer.writeRecords(data);
	await writer.close();

	return data.length;
});

fastify.get('/data/recent', async (req, reply) => {
	const flux = `
		from(bucket: "iot_sensors")
		  |> range(start: -2d)
		  |> filter(fn: (r) => r["_measurement"] == "readings")
		  |> filter(fn: (r) => r["_field"] == "delta" or r["_field"] == "kWh")
		  |> filter(fn: (r) => r["type"] == "electricity_hourly")
		  |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
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

fastify.get('/data/month', async (req, reply) => {
	const flux = `
		from(bucket: "iot_sensors")
		  |> range(start: -32d)
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

fastify.get('/data/all', async (req, reply) => {
	const flux = `
		from(bucket: "iot_sensors")
		  |> range(start: 0)
		  |> filter(fn: (r) => r["_measurement"] == "readings")
		  |> filter(fn: (r) => r["_field"] == "delta" or r["_field"] == "kWh")
		  |> filter(fn: (r) => r["type"] == "electricity_daily")
		  |> aggregateWindow(every: 48h, fn: mean, createEmpty: false)
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
