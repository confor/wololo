import { easepick } from '@easepick/core';
import { RangePlugin } from '@easepick/range-plugin';


export class DatePicker {
	constructor(startElement, endElement) {
		this.picker = new easepick.create({
			element: startElement,
			zIndex: 100,
			firstDay: 1,
			autoApply: true,
			RangePlugin: {
				elementEnd: endElement,
			},
			plugins: [ RangePlugin ],
			css: [
				'https://cdn.jsdelivr.net/npm/@easepick/core@1.2.1/dist/index.css',
				'https://cdn.jsdelivr.net/npm/@easepick/range-plugin@1.2.1/dist/index.css',
			]
		});
	}

	setDates(start, end) {
		this.picker.setStartDate(start);
		this.picker.setEndDate(end);
	}

	getRange() {
		return [ this.picker.getStartDate(), this.picker.getEndDate() ];
	}

	on(event, handler) {
		return this.picker.on(event, handler);
	}

	show() {
		this.picker.show();
	}

	hide() {
		this.picker.hide();
	}
}
