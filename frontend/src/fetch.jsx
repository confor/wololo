const ROOT = 'http://localhost:3000';

async function post(start, end) {
	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			start,
			end
		}),
	};

	const response = await fetch(ROOT + '/data/range', options);

	if (response.ok) {
		const result = await response.json();
		return result;
	} else {
		console.error('Failed to fetch:', response.statusText);
	}
}


async function download(type) {
	const response = await fetch(ROOT + '/data/' + type);

	if (response.ok) {
		const result = await response.json();
		return result;
	} else {
		console.error('Failed to fetch:', response.statusText);
	}
}

export {
	post,
	download,
};
