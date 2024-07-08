import * as React from 'preact';
import { Component } from 'preact';
import { useState } from 'preact/hooks';

export class DetailsTable extends Component {
	constructor(props) {
		super(props);
		this.state = {
			items: [],
		}
	}

	setItems(items) {
		this.setState({ items });
	}

	clearItems() {
		this.setState({ items: [] });
	}

	componentDidMount() {
		console.log('Hello from a new <MyButton> component!')
	}

	componentDidUpdate() {
		console.log('A <DetailsTable> component was updated!')
	}

	render(props) {
		return (
			<table class="table is-striped is-fullwidth is-hoverable">
				<thead>
					<tr>
						<th>Fecha</th>
						<th>Medición</th>
						<th>Consumo</th>
						<th>Costo</th>
					</tr>
				</thead>
				<tbody>
					{this.state.items.map(item => (
						<tr>
							<td>{item.date} {item.time}</td>
							<td>{item.kWh} kWh</td>
							<td>{item.delta} kWh</td>
							<td>${item.price}</td>
						</tr>
					))}
				</tbody>
			</table>
		);
  }
}
