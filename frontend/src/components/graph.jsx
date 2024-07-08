import Chart from 'chart.js/auto';

export class Graph {
    constructor(elementId) {
        this.ctx = document.getElementById(elementId);
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Data',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 3,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateData(newLabels, newData) {
        this.chart.data.labels = newLabels;
        this.chart.data.datasets[0].data = newData;
        this.chart.update();
    }

    updateSize() {
        this.chart.resize();
    }
}
