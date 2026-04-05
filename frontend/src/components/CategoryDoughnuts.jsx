import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const legendColor = '#94a3b8'

function buildChart(rows, type) {
  const filtered = rows.filter((r) => r.type === type)
  if (filtered.length === 0) {
    return null
  }
  const labels = filtered.map((r) => r.category)
  const data = filtered.map((r) => Number(r.total))
  const color =
    type === 'income'
      ? ['#22d3ee', '#06b6d4', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4']
      : ['#f472b6', '#fb7185', '#fda4af', '#fecdd3', '#fbcfe8', '#fce7f3']

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: labels.map((_, i) => color[i % color.length]),
        borderWidth: 0,
      },
    ],
  }
}

export function CategoryDoughnuts({ data, loading }) {
  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-zinc-500">
          Loading…
        </div>
        <div className="h-64 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-zinc-500">
          Loading…
        </div>
      </div>
    )
  }

  const income = buildChart(data || [], 'income')
  const expense = buildChart(data || [], 'expense')
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          font: { size: 11 },
          color: legendColor,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    },
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="zorvyn-glass rounded-xl p-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-100">Income by category</h3>
        <div className="mx-auto h-56 max-w-xs">
          {income ? (
            <Doughnut data={income} options={opts} />
          ) : (
            <p className="py-16 text-center text-sm text-zinc-500">No income data</p>
          )}
        </div>
      </div>
      <div className="zorvyn-glass rounded-xl p-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-100">Expense by category</h3>
        <div className="mx-auto h-56 max-w-xs">
          {expense ? (
            <Doughnut data={expense} options={opts} />
          ) : (
            <p className="py-16 text-center text-sm text-zinc-500">No expense data</p>
          )}
        </div>
      </div>
    </div>
  )
}
