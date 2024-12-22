import { supabase, insertData } from './database.js';
import { updateNavbar } from './auth.js';

// Global variables to store chart instances
let barChart = null;
let pieChart = null;
let lineChart = null;

// File upload handling
function initializeFileUpload() {
    const fileUpload = document.getElementById('file-upload');
    fileUpload.addEventListener('change', handleFileUpload);
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Hide the import container and show loading state
    document.querySelector('.import-container').style.display = 'none';
    
    if (file.name.endsWith('.csv')) {
        handleCSV(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        handleExcel(file);
    }
}

function handleCSV(file) {
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.errors.length) {
                console.error('CSV parsing errors:', results.errors);
                return;
            }
            // Map the data to exclude Timestamp column
            const cleanedData = results.data.map(row => ({
                time: row.time,
                type: row.type,
                category: row.category,
                amount: row.amount
            }));
            processData(cleanedData);
        }
    });
}

function handleExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {
                type: 'array',
                cellDates: true,
                dateNF: 'yyyy-mm-dd hh:mm',
                raw: false
            });
            
            // Get first sheet
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Convert to JSON with specific options
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                raw: false,
                dateNF: 'yyyy-mm-dd hh:mm',
                defval: '', // Default value for empty cells
                blankrows: false // Skip empty rows
            });

            // Validate the data structure
            if (jsonData.length === 0) {
                throw new Error('No data found in the Excel file');
            }

            // Check if required columns exist
            const requiredColumns = ['time', 'type', 'category', 'amount'];
            const fileColumns = Object.keys(jsonData[0]);
            const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));

            if (missingColumns.length > 0) {
                throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
            }

            // Clean and validate the data
            const cleanData = jsonData.map((row, index) => {
                // Only keep required fields and validate them
                const cleanRow = {
                    time: row.time,
                    type: row.type,
                    category: row.category,
                    amount: row.amount
                };

                // Validate time format
                const timestamp = new Date(cleanRow.time);
                if (isNaN(timestamp.getTime())) {
                    console.warn(`Invalid date format at row ${index + 1}, using current date`);
                    cleanRow.time = new Date().toISOString();
                }

                // Validate type
                if (!['input', 'output'].includes(cleanRow.type?.toLowerCase())) {
                    console.warn(`Invalid type at row ${index + 1}, defaulting to "output"`);
                    cleanRow.type = 'output';
                }

                // Validate amount (convert to number and handle currency formats)
                const amount = parseFloat(String(cleanRow.amount).replace(/[^0-9.-]+/g, ''));
                if (isNaN(amount)) {
                    console.warn(`Invalid amount at row ${index + 1}, defaulting to 0`);
                    cleanRow.amount = 0;
                } else {
                    cleanRow.amount = amount;
                }

                return cleanRow;
            });

            processData(cleanData);
        } catch (error) {
            console.error('Error processing Excel file:', error);
            alert(`Error processing Excel file: ${error.message}`);
        }
    };

    reader.onerror = function(error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
    };

    reader.readAsArrayBuffer(file);
}

async function processData(data) {
    // Show chart section
    document.getElementById('chart-section').classList.remove('hidden');
    
    // Format the data to match required structure
    const formattedData = data.map(row => ({
        time: new Date(row.time),
        type: row.type,
        category: row.category,
        amount: parseFloat(row.amount) || 0
    })).filter(row => !isNaN(row.amount));

    // Process data for each chart type
    const barChartData = processBarChartData(formattedData);
    const pieChartData = processPieChartData(formattedData);
    const lineChartData = processLineChartData(formattedData);

    // Render all charts
    renderBarChart(barChartData);
    renderPieChart(pieChartData);
    renderLineChart(lineChartData);

    // Save to Supabase
    const savedData = await insertData(formattedData)
    if (savedData) {
        console.log('Data successfully saved to Supabase')
    }
}

function processBarChartData(data) {
    // Group by month and type (input/output)
    const monthlyData = data.reduce((acc, row) => {
        const monthYear = row.time.toISOString().slice(0, 7);
        if (!acc[monthYear]) {
            acc[monthYear] = { input: 0, output: 0 };
        }
        acc[monthYear][row.type] += row.amount;
        return acc;
    }, {});

    return {
        categories: Object.keys(monthlyData),
        series: [
            {
                name: 'Input',
                data: Object.values(monthlyData).map(d => d.input)
            },
            {
                name: 'Output',
                data: Object.values(monthlyData).map(d => d.output)
            }
        ]
    };
}

function processPieChartData(data) {
    // Filter for output transactions only and group by category
    const outputsByCategory = data
        .filter(row => row.type === 'output')
        .reduce((acc, row) => {
            acc[row.category] = (acc[row.category] || 0) + row.amount;
            return acc;
        }, {});

    return Object.entries(outputsByCategory).map(([category, amount]) => ({
        name: category,
        value: amount
    }));
}

function processLineChartData(data) {
    // Group by date for the current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const dailyData = data
        .filter(row => row.time.toISOString().startsWith(currentMonth))
        .reduce((acc, row) => {
            const date = row.time.toISOString().slice(0, 10);
            if (!acc[date]) {
                acc[date] = 0;
            }
            acc[date] += row.type === 'output' ? row.amount : 0;
            return acc;
        }, {});

    return {
        categories: Object.keys(dailyData),
        series: [{
            name: 'Daily Spending',
            data: Object.values(dailyData)
        }]
    };
}

function renderBarChart(data) {
    const options = {
        series: data.series,
        chart: {
            type: 'bar',
            height: 350,
            stacked: false
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%'
            }
        },
        xaxis: {
            categories: data.categories,
            labels: {
                rotate: -45
            }
        },
        title: {
            text: 'Monthly Income vs Expenses',
            align: 'center'
        },
        colors: ['#4CAF50', '#F44336'],
        legend: {
            position: 'top'
        }
    };

    if (barChart) {
        barChart.destroy();
    }
    barChart = new ApexCharts(document.getElementById('bar-chart'), options);
    barChart.render();
}

function renderPieChart(data) {
    const options = {
        series: data.map(d => d.value),
        chart: {
            type: 'pie',
            height: 350
        },
        labels: data.map(d => d.name),
        title: {
            text: 'Expenses by Category',
            align: 'center'
        },
        legend: {
            position: 'bottom'
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    };

    if (pieChart) {
        pieChart.destroy();
    }
    pieChart = new ApexCharts(document.getElementById('pie-chart'), options);
    pieChart.render();
}

function renderLineChart(data) {
    const options = {
        series: data.series,
        chart: {
            height: 350,
            type: 'line',
            zoom: {
                enabled: false
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'straight'
        },
        title: {
            text: 'Daily Spending Trend',
            align: 'center'
        },
        grid: {
            row: {
                colors: ['#f3f3f3', 'transparent'],
                opacity: 0.5
            }
        },
        xaxis: {
            categories: data.categories,
            labels: {
                rotate: -45
            }
        }
    };

    if (lineChart) {
        lineChart.destroy();
    }
    lineChart = new ApexCharts(document.getElementById('line-chart'), options);
    lineChart.render();
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
});