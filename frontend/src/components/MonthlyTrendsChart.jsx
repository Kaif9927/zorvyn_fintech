import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const tickColor = '#94a3b8'
const gridColor = 'rgba(255, 255, 255, 0.06)'

function formatMonthLabel(key) {
  const [y, m] = key.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleString('en-US', { month: 'short' })
}

export function MonthlyTrendsChart({ data, loading }) {
  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-zinc-500">
        Loading chart…
      </div>
    )
  }

  const labels = (data || []).map((d) => formatMonthLabel(d.month))
  const income = (data || []).map((d) => Number(d.income))
  const expense = (data || []).map((d) => Number(d.expense))

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: income,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Spend',
        data: expense,
        borderColor: '#f472b6',
        backgroundColor: 'rgba(244, 114, 182, 0.1)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          color: tickColor,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        callbacks: {
          label(ctx) {
            const v = ctx.parsed.y
            return `${ctx.dataset.label}: $${v.toLocaleString()}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tickColor, maxRotation: 0 },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (value) => `$${value}`,
        },
      },
    },
  }

  return (
    <div className="h-72 w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}
