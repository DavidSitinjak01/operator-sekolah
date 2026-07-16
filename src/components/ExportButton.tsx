'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileSpreadsheet, FileText, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/app'
import { useToast } from '@/hooks/use-toast'
import { exportToExcel, exportToPDF, type ExportColumn } from '@/lib/export-utils'

interface ExportButtonProps {
  title: string
  subtitle: string
  columns: ExportColumn[]
  apiUrl: string
  filename: string
  orientation?: 'portrait' | 'landscape'
  flattenRow?: (row: Record<string, unknown>, idx: number) => Record<string, unknown>
  extraParams?: Record<string, string>
}

export default function ExportButton({
  title,
  subtitle,
  columns,
  apiUrl,
  filename,
  orientation = 'landscape',
  flattenRow,
  extraParams,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()
  const { tahunPelajaran, semester } = useAppStore()

  const { refetch } = useQuery({
    queryKey: ['export', apiUrl, tahunPelajaran, semester],
    queryFn: async () => {
      const url = new URL(apiUrl, window.location.origin)
      url.searchParams.set('limit', '9999')
      url.searchParams.set('tahunPelajaran', tahunPelajaran)
      url.searchParams.set('semester', semester)
      if (extraParams) {
        for (const [k, v] of Object.entries(extraParams)) {
          if (v) url.searchParams.set(k, v)
        }
      }
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Gagal mengambil data')
      return res.json()
    },
    enabled: false,
  })

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true)
    try {
      const { data } = await refetch()
      if (!data?.data || data.data.length === 0) {
        toast({ title: 'Tidak Ada Data', description: 'Tidak ada data untuk diekspor.', variant: 'destructive' })
        return
      }

      const rows = data.data.map((row: Record<string, unknown>, idx: number) =>
        flattenRow ? flattenRow(row, idx) : { ...row, no: String(idx + 1) }
      )

      const opts = {
        title,
        subtitle,
        columns,
        data: rows,
        filename,
        orientation,
      }

      if (format === 'excel') {
        exportToExcel(opts)
      } else {
        exportToPDF(opts)
      }
    } catch {
      toast({ title: 'Gagal Export', description: 'Terjadi kesalahan saat mengekspor data.', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
          Export Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="w-4 h-4 mr-2 text-rose-600" />
          Export PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}