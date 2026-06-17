import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'amber' | 'red' | 'orange' | 'gray'
  description?: string
}

const colorMap = {
  blue: 'bg-wbi-teal/10 text-wbi-teal-dark',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-wbi-gold/10 text-wbi-gold-dark',
  red: 'bg-red-50 text-red-600',
  orange: 'bg-orange-50 text-orange-600',
  gray: 'bg-gray-100 text-gray-600',
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  description,
}: StatsCardProps) {
  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:shadow-wbi-teal/10 hover:-translate-y-0.5">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1 font-heading text-wbi-forest">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', colorMap[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
