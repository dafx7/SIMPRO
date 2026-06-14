'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface MonthlyData {
  month: string
  count: number
}

interface StatusData {
  name: string
  value: number
  color: string
}

interface FieldData {
  field: string
  count: number
}

interface ProposalChartProps {
  monthly: MonthlyData[]
  byStatus: StatusData[]
  byField: FieldData[]
}

const STATUS_COLORS = {
  DRAFT: '#9ca3af',
  SUBMITTED: '#3b82f6',
  UNDER_REVIEW: '#f59e0b',
  REVISION: '#f97316',
  APPROVED: '#22c55e',
  REJECTED: '#ef4444',
}

const FIELD_COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
}

export function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
  const formatted = data.map((d) => ({ ...d, name: formatMonth(d.month) }))
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          formatter={(value) => [value, 'Proposal']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
        />
        <Bar dataKey="count" fill="#1e40af" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function StatusPieChart({ data }: { data: StatusData[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Legend
          formatter={(value) => <span className="text-xs">{value}</span>}
        />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function FieldBarChart({ data }: { data: FieldData[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
        <YAxis type="category" dataKey="field" tick={{ fontSize: 11 }} width={130} />
        <Tooltip />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={FIELD_COLORS[index % FIELD_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
