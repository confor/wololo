import * as React from 'preact';
import { render } from 'preact';

import { DatePicker } from './components/datepicker';
import { Graph } from './components/graph';
import { DetailsTable } from './components/table';

import { download, post } from './fetch';
const $ = n => document.querySelector(n);

const root = $('#app');
let dTable = null;
const realdTable = <DetailsTable ref={inst => dTable = inst}></DetailsTable>
console.log('d', dTable, 'real', realdTable);
render(realdTable, root);


// date picker
const dp = new DatePicker('#checkin', '#checkout');

dp.on('select', event => {
	const [startdt, enddt] = dp.getRange();
	const [startd, endd] = [ startdt.toJSDate(), enddt.toJSDate() ];
	dp.hide();

	for (const id of ['recent', 'monthly', 'all'])
		$(`#picker-${id}`).parentElement.classList.remove('is-active');
	$('#picker-custom').parentElement.classList.add('is-active');

	downloadRange(startd, endd);
});

$('#picker-recent').addEventListener('click', event => {
	for (const id of ['monthly', 'all', 'custom'])
		$(`#picker-${id}`).parentElement.classList.remove('is-active');
	$('#picker-recent').parentElement.classList.add('is-active');

	downloadData('recent');
});

$('#picker-monthly').addEventListener('click', event => {
	for (const id of ['recent', 'all', 'custom'])
		$(`#picker-${id}`).parentElement.classList.remove('is-active');
	$('#picker-monthly').parentElement.classList.add('is-active');

	downloadData('month');
});

$('#picker-all').addEventListener('click', event => {
	for (const id of ['recent', 'monthly', 'custom'])
		$(`#picker-${id}`).parentElement.classList.remove('is-active');
	$('#picker-all').parentElement.classList.add('is-active');

	downloadData('all');
});

$('#picker-custom').addEventListener('click', event => {
	dp.show();
});

// graph and default data
const myGraph = new Graph('main-graph');
const labels = ['0'];
const data = [0];
myGraph.updateData(labels, data);
window.addEventListener('resize', event => myGraph.updateSize());


// bulma navbar code
const navbar_toggles = document.querySelectorAll('.navbar-burger');

Array.prototype.forEach.call(navbar_toggles, (element) => {
	element.addEventListener('click', (event) => {
		const target = document.getElementById(element.dataset.target);

		element.classList.toggle('is-active');
		target.classList.toggle('is-active');
	});
});


async function downloadData(type) {
	const body = await download(type);
	const labels = [];
	const data = [];

	for (const item of body.data) {
		labels.push(item.time);
		data.push(item.delta);
	}

	myGraph.updateData(labels, data);
	dTable.setItems(body.data);
}

function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}

async function downloadRange(start, end) {
	start = {
		year: start.getFullYear(),
		month: start.getMonth() + 1,
		day: start.getDate()
	};
	end = {
		year: end.getFullYear(),
		month: end.getMonth() + 1,
		day: end.getDate()
	};

	const body = await post(start, end);
	const labels = [];
	const data = [];

	for (const item of body.data) {
		labels.push(item.time);
		data.push(item.delta);
	}

	myGraph.updateData(labels, data);
	dTable.setItems(body.data);
}

document.addEventListener('DOMContentLoaded', () => downloadData('recent'));
window.onerror = function(error, url, line) {
	alert('oh no!!!');
	console.error('AAAAA ERROR');
	console.log(arguments);
}
