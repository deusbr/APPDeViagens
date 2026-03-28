// ============================================================
// TravelCost — charts.js
// Chart.js configuration with Aero Ledger design system
// ============================================================

let pieChart = null;
let lineChart = null;
let barChart = null;

function getChartColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    primary: style.getPropertyValue('--primary').trim() || '#0058bc',
    primaryContainer: style.getPropertyValue('--primary-container').trim() || '#0070eb',
    secondary: style.getPropertyValue('--secondary').trim() || '#006e28',
    tertiary: style.getPropertyValue('--tertiary').trim() || '#745b00',
    tertiaryContainer: style.getPropertyValue('--tertiary-container').trim() || '#d0a600',
    error: style.getPropertyValue('--error').trim() || '#ba1a1a',
    surface: style.getPropertyValue('--surface').trim() || '#f9f9ff',
    surfaceHigh: style.getPropertyValue('--surface-container-high').trim() || '#e6e8f3',
    onSurface: style.getPropertyValue('--on-surface').trim() || '#181c23',
    outline: style.getPropertyValue('--outline').trim() || '#717786',
  };
}

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#181c23',
      titleFont: { family: 'Inter', weight: '700', size: 12 },
      bodyFont: { family: 'Inter', weight: '500', size: 11 },
      cornerRadius: 8,
      padding: 10,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 4
    }
  }
};

// --- PIE / DONUT Chart (Category Breakdown) ---
function renderPieChart(canvasId, categoryTotals) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const colors = getChartColors();

  if (pieChart) pieChart.destroy();

  const catColors = {
    flight: colors.primary,
    hotel: colors.tertiary,
    food: colors.secondary,
    car: colors.primaryContainer,
    gas: '#e65100',
    transport: '#5c6bc0',
    extras: '#8e24aa'
  };

  const labels = [];
  const data = [];
  const bgColors = [];

  Object.keys(categoryTotals).forEach(cat => {
    const catInfo = CATEGORIES[cat];
    if (catInfo) {
      labels.push(catInfo.label);
      data.push(categoryTotals[cat]);
      bgColors.push(catColors[cat] || colors.outline);
    }
  });

  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: bgColors,
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      ...chartDefaults,
      cutout: '65%',
      plugins: {
        ...chartDefaults.plugins,
        tooltip: {
          ...chartDefaults.plugins.tooltip,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)}`
          }
        }
      }
    }
  });
}

// --- LINE Chart (Daily Spending Trends) ---
function renderLineChart(canvasId, expenses, startDate, endDate) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const colors = getChartColors();

  if (lineChart) lineChart.destroy();

  // Group expenses by day
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = [];
  const dailyTotals = [];
  const current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    days.push(current.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
    const dayTotal = expenses
      .filter(e => e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);
    dailyTotals.push(dayTotal);
    current.setDate(current.getDate() + 1);
  }

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 250);
  gradient.addColorStop(0, colors.primary + '30');
  gradient.addColorStop(1, colors.primary + '00');

  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        data: dailyTotals,
        borderColor: colors.primary,
        backgroundColor: gradient,
        fill: true,
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: colors.primary,
        pointBorderColor: colors.surface,
        pointBorderWidth: 3,
        pointHoverRadius: 7
      }]
    },
    options: {
      ...chartDefaults,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter', size: 10, weight: '600' },
            color: colors.outline,
            maxTicksLimit: 8
          }
        },
        y: {
          grid: { color: colors.surfaceHigh, drawBorder: false },
          ticks: {
            font: { family: 'Inter', size: 10, weight: '600' },
            color: colors.outline,
            callback: (v) => 'R$ ' + v.toLocaleString('pt-BR')
          }
        }
      },
      plugins: {
        ...chartDefaults.plugins,
        tooltip: {
          ...chartDefaults.plugins.tooltip,
          callbacks: {
            label: (ctx) => `Gasto: ${formatCurrency(ctx.raw)}`
          }
        }
      }
    }
  });
}

// --- BAR Chart (Budget vs Actual) ---
function renderBarChart(canvasId, categories) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const colors = getChartColors();

  if (barChart) barChart.destroy();

  const labels = categories.map(c => c.label);
  const budgetData = categories.map(c => c.budget);
  const actualData = categories.map(c => c.actual);

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Orçamento',
          data: budgetData,
          backgroundColor: colors.surfaceHigh,
          borderRadius: 6,
          barPercentage: 0.6
        },
        {
          label: 'Real',
          data: actualData,
          backgroundColor: actualData.map((v, i) => v > budgetData[i] ? colors.error : colors.primary),
          borderRadius: 6,
          barPercentage: 0.6
        }
      ]
    },
    options: {
      ...chartDefaults,
      indexAxis: 'y',
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            font: { family: 'Inter', size: 11, weight: '600' },
            color: colors.onSurface,
            usePointStyle: true,
            pointStyle: 'rectRounded',
            padding: 16
          }
        },
        tooltip: {
          ...chartDefaults.plugins.tooltip,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: colors.surfaceHigh, drawBorder: false },
          ticks: {
            font: { family: 'Inter', size: 10, weight: '600' },
            color: colors.outline,
            callback: (v) => 'R$ ' + v.toLocaleString('pt-BR')
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter', size: 12, weight: '600' },
            color: colors.onSurface
          }
        }
      }
    }
  });
}

function destroyCharts() {
  if (pieChart) { pieChart.destroy(); pieChart = null; }
  if (lineChart) { lineChart.destroy(); lineChart = null; }
  if (barChart) { barChart.destroy(); barChart = null; }
}
