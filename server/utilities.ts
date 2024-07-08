import fs from 'fs';
import config from "./config.json";

function kWh_to_CLP(reading) {
	const i = config.pricing;
	const j = i['LIMITE DE INVIERNO'];
	const k = i['TRANSPORTE DE ELECTRICIDAD'];
	const l = i['ELECTRICIDAD CONSUMIDA'];
	const m = i['LIMITE DE INVIERNO'];

	const a = Object.values(k).reduce((sum, value) => sum + value, 0);
	const b = Object.values(l).reduce((sum, value) => sum + value, 0);

	const unit = a + b;

	const limit = j['CONSUMO'];
	const multiplier = j['MULTIPLICADOR'];

	let price = reading * unit;

	if (price >= limit)
		price *= multiplier;

	return price;
}

function tsv_to_lines(): Array<string> {
	const lines = fs.readFileSync('readings.tsv', 'utf8').trim().split('\n');

	let previousReading = null;
	const data = lines.slice(1).map((line, index) => {
		const [unixTimestamp, reading] = line.split('\t');
		const kWh = parseFloat(reading);
		const delta = previousReading !== null ? kWh - previousReading : 0;
		previousReading = kWh;

		return `readings,type=electricity_hourly kWh=${kWh},delta=${delta} ${unixTimestamp}000000000`;
	});

	return data;
}

function query(client, flux) {
	return new Promise((resolve, reject) => {
		const qc = client.getQueryApi(config.influx.org);

		const data = [];

		qc.queryRows(flux, {
			next: (row, tableMeta) => {
				data.push(tableMeta.toObject(row));
			},
			error: (error) => {
				reject(error);
			},
			complete: () => {
				resolve(data);
			},
		});
	});
}

export {
	kWh_to_CLP,
	tsv_to_lines,
	query
};
