'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface SimilarProposal {
  proposalId: string
  title: string
  jurusan: string
  similarityScore: number
}

interface SimilarityData {
  highestScore: number
  isFlagged: boolean
  threshold: number
  similarProposals: SimilarProposal[]
}

interface Props {
  proposalId: string
  status: string
  role: string
}

export default function SimilarityWarning({ proposalId, status, role }: Props) {
  const [similarityData, setSimilarityData] = useState<SimilarityData | null>(null)

  useEffect(() => {
    if (status === 'DRAFT' || role !== 'ADMIN') return

    fetch('http://localhost:8000/check-similarity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.isFlagged) {
          setSimilarityData(data)
          fetch('http://localhost:8000/update-similarity-flag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              proposalId,
              similarityScore: data.highestScore,
              similarityFlag: data.isFlagged,
            }),
          }).catch(() => {})
        }
      })
      .catch(() => {})
  }, [proposalId, status, role])

  if (!similarityData) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-wbi-gold/30 bg-gradient-to-br from-wbi-gold/10 via-orange-50 to-white">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-wbi-gold to-orange-500" />
      <div className="p-5 pl-6 space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wbi-gold/20 text-wbi-gold-dark">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <div>
            <p className="font-heading font-semibold text-wbi-forest">Peringatan Kemiripan Proposal</p>
            <p className="text-muted-foreground text-xs">
              Skor kemiripan tertinggi{' '}
              <strong className="text-wbi-gold-dark">{Math.round(similarityData.highestScore * 100)}%</strong>{' '}
              (melebihi batas {Math.round(similarityData.threshold * 100)}%)
            </p>
          </div>
        </div>

        {similarityData.similarProposals.length > 0 && (
          <div className="space-y-2 pl-1">
            <p className="font-medium text-wbi-olive text-xs uppercase tracking-wide">Proposal serupa</p>
            {similarityData.similarProposals.map((p) => {
              const pct = Math.round(p.similarityScore * 100)
              return (
                <div key={p.proposalId} className="rounded-xl bg-white/70 p-3 border border-wbi-gold/15">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-800 truncate">&quot;{p.title}&quot;</p>
                    <span className="text-xs font-bold text-wbi-gold-dark whitespace-nowrap">{pct}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.jurusan}</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-wbi-gold/15 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-wbi-gold to-orange-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
