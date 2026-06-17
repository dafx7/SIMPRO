interface WelcomeBannerProps {
  title: string
  subtitle: string
}

export default function WelcomeBanner({ title, subtitle }: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-wbi-forest to-wbi-teal p-6 sm:p-8 text-white shadow-lg shadow-wbi-teal/20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-8 right-10 h-28 w-28 rounded-full bg-wbi-gold/25" />
        <div className="absolute top-6 right-32 h-16 w-16 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 right-0 h-32 w-32 rounded-full bg-wbi-teal-light/30" />
      </div>
      <div className="relative z-10">
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        <p className="text-white/80 mt-1">{subtitle}</p>
      </div>
    </div>
  )
}
