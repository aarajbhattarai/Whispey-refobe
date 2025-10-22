'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Tooltip } from 'recharts'
import {
  Phone,
  Clock,
  CheckCircle,
  TrendUp,
  CircleNotch,
  Warning,
  CalendarBlank,
  CurrencyDollar,
  Lightning,
  XCircle,
  ChartBar,
  Activity,
  Target,
  Users,
  Percent,
  ArrowUp,
  ArrowDown,
} from 'phosphor-react'

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useOverviewQuery } from '../hooks/useOverviewQuery'
import { getUserProjectRole } from '@/services/getUserRole'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loader2, MoreHorizontal, Trash2, Download } from 'lucide-react'
import { EnhancedChartBuilder, ChartProvider } from './EnhancedChartBuilder'
import { FloatingActionMenu } from './FloatingActionMenu'
import { useDynamicFields } from '../hooks/useDynamicFields'
import { useUser } from "@clerk/nextjs"
import CustomTotalsBuilder from './CustomTotalBuilds'
import { CustomTotalsService } from '@/services/customTotalService'
import { CustomTotalConfig, CustomTotalResult } from '../types/customTotals'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'
import { useTheme } from 'next-themes'
import { useMobile } from '@/hooks/use-mobile'

interface OverviewProps {
  project: any
  agent: any
  dateRange: {
    from: string
    to: string
  }
  quickFilter?: string
  isCustomRange?: boolean
  isLoading?: boolean // New prop from parent
}

const ICON_COMPONENTS = {
  phone: Phone,
  clock: Clock,
  'dollar-sign': CurrencyDollar,
  'trending-up': TrendUp,
  calculator: Activity,
  users: Users
}

const COLOR_CLASSES = {
  blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
}

const AVAILABLE_COLUMNS = [
  { key: 'customer_number', label: 'Customer Number', type: 'text' as const },
  { key: 'duration_seconds', label: 'Duration (seconds)', type: 'number' as const },
  { key: 'avg_latency', label: 'Avg Latency', type: 'number' as const },
  { key: 'call_started_at', label: 'Call Date', type: 'date' as const },
  { key: 'call_ended_reason', label: 'Call Status', type: 'text' as const },
  { key: 'total_llm_cost', label: 'LLM Cost', type: 'number' as const },
  { key: 'total_tts_cost', label: 'TTS Cost', type: 'number' as const },
  { key: 'total_stt_cost', label: 'STT Cost', type: 'number' as const },
  { key: 'metadata', label: 'Metadata', type: 'jsonb' as const },
  { key: 'transcription_metrics', label: 'Transcription Metrics', type: 'jsonb' as const }
]

// Mobile-responsive skeleton components
function MetricsGridSkeleton({ role, isMobile }: { role: string | null; isMobile: boolean }) {
  const getVisibleCardCount = () => {
    if (role === 'user') return 4 // Hide cost cards for users
    return 6 // Show all cards for other roles
  }

  return (
    <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-6 gap-4'}`}>
      {Array.from({ length: getVisibleCardCount() }).map((_, index) => (
        <div key={index} className="group">
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm">
            <div className={isMobile ? 'p-3' : 'p-5'}>
              <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
                <div className={`${isMobile ? 'w-7 h-7' : 'w-9 h-9'} bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse`}></div>
                <div className={`${isMobile ? 'w-8 h-4' : 'w-12 h-5'} bg-gray-100 dark:bg-gray-700 rounded animate-pulse`}></div>
              </div>
              <div className="space-y-1">
                <div className={`${isMobile ? 'h-2 w-16' : 'h-3 w-20'} bg-gray-200 dark:bg-gray-600 animate-pulse rounded`}></div>
                <div className={`${isMobile ? 'h-6 w-12' : 'h-8 w-16'} bg-gray-200 dark:bg-gray-600 animate-pulse rounded`}></div>
                <div className={`${isMobile ? 'h-2 w-12' : 'h-3 w-16'} bg-gray-100 dark:bg-gray-700 animate-pulse rounded`}></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ChartGridSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 gap-6'}`}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm">
          <div className={`border-b border-gray-200 dark:border-gray-700 ${isMobile ? 'px-4 py-4' : 'px-7 py-6'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'w-7 h-7' : 'w-9 h-9'} bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse`}></div>
                <div>
                  <div className={`${isMobile ? 'h-4 w-24 mb-1' : 'h-5 w-32 mb-2'} bg-gray-200 dark:bg-gray-600 animate-pulse rounded`}></div>
                  <div className={`${isMobile ? 'h-3 w-32' : 'h-4 w-48'} bg-gray-100 dark:bg-gray-700 animate-pulse rounded`}></div>
                </div>
              </div>
              <div className="text-right">
                <div className={`${isMobile ? 'h-3 w-8 mb-1' : 'h-4 w-12 mb-1'} bg-gray-100 dark:bg-gray-700 animate-pulse rounded`}></div>
                <div className={`${isMobile ? 'h-4 w-6' : 'h-5 w-8'} bg-gray-200 dark:bg-gray-600 animate-pulse rounded`}></div>
              </div>
            </div>
          </div>
          <div className={isMobile ? 'p-4' : 'p-7'}>
            <div className={`${isMobile ? 'h-48' : 'h-80'} bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center`}>
              <Loader2 className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} animate-spin text-gray-400 dark:text-gray-500`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const Overview: React.FC<OverviewProps> = ({ 
  project, 
  agent,
  dateRange,
  isLoading: parentLoading
}) => {

  const { theme } = useTheme()
  const { isMobile } = useMobile(768)
  const [role, setRole] = useState<string | null>(null)
  const [customTotals, setCustomTotals] = useState<CustomTotalConfig[]>([])
  const [customTotalResults, setCustomTotalResults] = useState<CustomTotalResult[]>([])
  const [loadingCustomTotals, setLoadingCustomTotals] = useState(false)
  const [roleLoading, setRoleLoading] = useState(true)

  const { user } = useUser()
  const userEmail = user?.emailAddresses?.[0]?.emailAddress

  // Data fetching - only run when we have agent data
  const { data: analytics, loading: analyticsLoading, error } = useOverviewQuery({
    agentId: agent?.id,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  })

  const { 
    metadataFields, 
    transcriptionFields, 
    loading: fieldsLoading,
    error: fieldsError 
  } = useDynamicFields(agent?.id)

  // Load user role
  useEffect(() => {
    if (userEmail && project?.id && !parentLoading) {
      const getUserRole = async () => {
        setRoleLoading(true)
        try {
          const userRole = await getUserProjectRole(userEmail, project.id)
          setRole(userRole.role)
        } catch (error) {
          console.error('Failed to load user role:', error)
          setRole('user')
        } finally {
          setRoleLoading(false)
        }
      }
      getUserRole()
    } else if (parentLoading) {
      setRoleLoading(true) // Keep role loading while parent loads
    } else {
      setRoleLoading(false)
      setRole('user')
    }
  }, [userEmail, project?.id, parentLoading])

  const loadCustomTotals = async () => {
    if (!project?.id || !agent?.id) return
    try {
      const configs = await CustomTotalsService.getCustomTotals(project.id, agent.id)
      setCustomTotals(configs)
    } catch (error) {
      console.error('Failed to load custom totals:', error)
    }
  }

  useEffect(() => {
    if (role !== null && !roleLoading && !parentLoading) {
      loadCustomTotals()
    }
  }, [role, roleLoading, parentLoading, project?.id, agent?.id])

  useEffect(() => {
    const run = async () => {
      if (customTotals.length === 0 || roleLoading || parentLoading || !agent?.id) return
      setLoadingCustomTotals(true)
      try {
        const results = await CustomTotalsService.batchCalculateCustomTotals(
          customTotals,
          agent.id,
          dateRange.from,
          dateRange.to
        )
        setCustomTotalResults(results)
      } catch (e) {
        console.error('Batch calc failed', e)
      } finally {
        setLoadingCustomTotals(false)
      }
    }
    run()
  }, [customTotals, dateRange.from, dateRange.to, roleLoading, parentLoading, agent?.id])

  // Build PostgREST-friendly filters and OR string to mirror SQL logic
  const buildFiltersForDownload = (
    config: CustomTotalConfig,
    agentId: string,
    dateFrom?: string,
    dateTo?: string
  ) => {
    const andFilters: { column: string; operator: string; value: any }[] = []

    // Always constrain by agent and date range (ANDed)
    andFilters.push({ column: 'agent_id', operator: 'eq', value: agentId })
    if (dateFrom) andFilters.push({ column: 'call_started_at', operator: 'gte', value: `${dateFrom} 00:00:00` })
    if (dateTo) andFilters.push({ column: 'call_started_at', operator: 'lte', value: `${dateTo} 23:59:59.999` })

    const getColumnName = (col: string, jsonField?: string, forText?: boolean) => {
      if (!jsonField) return col
      return `${col}${forText ? '->>' : '->'}${jsonField}`
    }

    // COUNT/COUNT_DISTINCT existence checks when targeting JSON field, to match SQL
    if ((config.aggregation === 'COUNT' || (config.aggregation === 'COUNT_DISTINCT' && !!config.jsonField)) && config.jsonField) {
      const existsCol = getColumnName(config.column, config.jsonField, true)
      andFilters.push({ column: existsCol, operator: 'not.is', value: null })
      andFilters.push({ column: existsCol, operator: 'neq', value: '' })
    }

    // Build filter group based on filterLogic
    const isTextOp = (op: string) => ['contains', 'json_contains', 'equals', 'json_equals', 'starts_with'].includes(op)

    const toSimpleCond = (f: CustomTotalConfig['filters'][number]) => {
      const col = getColumnName(f.column, f.jsonField, isTextOp(f.operation))
      switch (f.operation) {
        case 'equals':
        case 'json_equals':
          return { column: col, operator: 'eq', value: f.value }
        case 'contains':
        case 'json_contains':
          return { column: col, operator: 'ilike', value: `%${f.value}%` }
        case 'starts_with':
          return { column: col, operator: 'ilike', value: `${f.value}%` }
        case 'greater_than':
        case 'json_greater_than':
          return { column: col.includes('->') ? `${col}::numeric` : col, operator: 'gt', value: f.value }
        case 'less_than':
        case 'json_less_than':
          return { column: col.includes('->') ? `${col}::numeric` : col, operator: 'lt', value: f.value }
        case 'json_exists': {
          return { column: col, operator: 'json_exists', value: null }
        }
        default:
          return null
      }
    }

    const filters = (config.filters || []).map(toSimpleCond).filter(Boolean) as { column: string; operator: string; value: any }[]

    let orString: string | null = null
    if (config.filterLogic === 'OR' && filters.length > 0) {
      const parts = filters.map(f => {
        if (f.operator === 'json_exists') {
          return `and(${f.column}.not.is.null,${f.column}.neq.)`
        }
        if (f.operator === 'eq') return `${f.column}.eq.${encodeURIComponent(String(f.value))}`
        if (f.operator === 'ilike') return `${f.column}.ilike.*${encodeURIComponent(String(f.value).replace(/%/g, ''))}*`
        if (f.operator === 'gt') return `${f.column}.gt.${encodeURIComponent(String(f.value))}`
        if (f.operator === 'lt') return `${f.column}.lt.${encodeURIComponent(String(f.value))}`
        return ''
      }).filter(Boolean)
      orString = parts.join(',') || null
    } else {
      // AND logic: merge into andFilters, expanding json_exists into two filters
      for (const f of filters) {
        if (f.operator === 'json_exists') {
          andFilters.push({ column: f.column, operator: 'not.is', value: null })
          andFilters.push({ column: f.column, operator: 'neq', value: '' })
        } else {
          andFilters.push(f)
        }
      }
    }

    return { andFilters, orString }
  }

  const handleDownloadCustomTotal = async (config: CustomTotalConfig) => {
    try {
      let query = supabase
        .from('pype_voice_call_logs')
        .select('id,agent_id,customer_number,call_id,call_ended_reason,call_started_at,call_ended_at,duration_seconds,metadata,transcription_metrics,avg_latency,created_at')
        .order('created_at', { ascending: false })
        .limit(2000)

      const { andFilters, orString } = buildFiltersForDownload(config, agent.id, dateRange?.from, dateRange?.to)
      for (const f of andFilters) {
        switch (f.operator) {
          case 'eq':
            query = query.eq(f.column, f.value)
            break
          case 'ilike':
            query = query.ilike(f.column, f.value)
            break
          case 'gte':
            query = query.gte(f.column, f.value)
            break
          case 'lte':
            query = query.lte(f.column, f.value)
            break
          case 'gt':
            query = query.gt(f.column, f.value)
            break
          case 'lt':
            query = query.lt(f.column, f.value)
            break
          case 'not.is':
            query = query.not(f.column, 'is', f.value)
            break
          case 'neq':
            query = query.neq(f.column, f.value)
            break
        }
      }
      if (orString) {
        query = query.or(orString)
      }

      const { data, error } = await query
      if (error) {
        alert(`Failed to fetch logs: ${error.message}`)
        return
      }
      
      const asObj = (v: any): Record<string, any> => {
        try {
          if (!v) return {}
          return typeof v === 'string' ? (JSON.parse(v) || {}) : v
        } catch {
          return {}
        }
      }

      const pickJsonValue = (obj: Record<string, any>, key?: string): any => {
        if (!obj || !key) return undefined
        if (key in obj) return obj[key]
        const noSpace = key.replace(/\s+/g, '')
        if (noSpace in obj) return obj[noSpace]
        const lowerFirst = key.charAt(0).toLowerCase() + key.slice(1)
        if (lowerFirst in obj) return obj[lowerFirst]
        const found = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase())
        return found ? obj[found] : undefined
      }

      const rows = (data || []).map((row: any) => {
        const tm = asObj(row.transcription_metrics)
        const md = asObj(row.metadata)
        const flattenedMd = Object.fromEntries(Object.entries(md).map(([k, v]) => [
          `metadata_${k}`, typeof v === 'object' ? JSON.stringify(v) : v
        ]))
        const flattenedTm = Object.fromEntries(Object.entries(tm).map(([k, v]) => [
          `transcription_${k}`, typeof v === 'object' ? JSON.stringify(v) : v
        ]))

        return {
          id: row.id,
          customer_number: row.customer_number,
          call_id: row.call_id,
          call_ended_reason: row.call_ended_reason,
          call_started_at: row.call_started_at,
          duration_seconds: row.duration_seconds,
          avg_latency: row.avg_latency,
          ...flattenedMd,
          ...flattenedTm,

          ...(config.jsonField && config.column === 'transcription_metrics'
            ? { [config.jsonField]: pickJsonValue(tm, config.jsonField) }
            : {}),
          ...(config.jsonField && config.column === 'metadata'
            ? { [config.jsonField]: pickJsonValue(md, config.jsonField) }
            : {}),
        }
      })

      if (!rows.length) {
        alert('No logs found for this custom total and date range.')
        return
      }

      const csv = Papa.unparse(rows)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${config.name.replace(/\s+/g, '_').toLowerCase()}_${dateRange.from}_to_${dateRange.to}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      console.error(e)
      alert('Failed to download CSV')
    }
  }

  const handleSaveCustomTotal = async (config: CustomTotalConfig) => {
    if (!project?.id || !agent?.id) return
    try {
      const result = await CustomTotalsService.saveCustomTotal(config, project.id, agent.id)
      if (result.success) {
        await loadCustomTotals()
      } else {
        alert(`Failed to save: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to save custom total:', error)
      alert('Failed to save custom total')
    }
  }

  const handleDeleteCustomTotal = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this custom total?')) return

    try {
      const result = await CustomTotalsService.deleteCustomTotal(configId)
      if (result.success) {
        await loadCustomTotals()
      } else {
        alert(`Failed to delete: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to delete custom total:', error)
      alert('Failed to delete custom total')
    }
  }

  const formatCustomTotalValue = (result: CustomTotalResult, config: CustomTotalConfig) => {
    if (result.error) return 'Error'
    
    const value = typeof result.value === 'number' ? result.value : parseFloat(result.value as string) || 0
    
    switch (config.aggregation) {
      case 'AVG':
        return value.toFixed(2)
      case 'SUM':
        if (config.column.includes('cost')) {
          return `रु ${value.toFixed(2)}`
        }
        return value.toLocaleString()
      case 'COUNT':
      case 'COUNT_DISTINCT':
        return value.toLocaleString()
      default:
        return value.toString()
    }
  }

  // Get theme-aware colors
  const getChartColors = () => {
    const isDark = theme === 'dark'
    return {
      primary: '#007aff',
      success: isDark ? '#30d158' : '#28a745',
      danger: isDark ? '#ff453a' : '#dc3545',
      grid: isDark ? '#374151' : '#f3f4f6',
      text: isDark ? '#d1d5db' : '#6b7280',
      background: isDark ? '#1f2937' : '#ffffff',
      muted: isDark ? '#9ca3af' : '#6b7280'
    }
  }

  const colors = getChartColors()

  // Prepare chart data
  const successFailureData = (analytics?.successfulCalls !== undefined && analytics?.totalCalls !== undefined) ? [
    { name: 'Success', value: analytics.successfulCalls, color: colors.success },
    { name: 'Failed', value: analytics.totalCalls - analytics.successfulCalls, color: colors.danger }
  ] : []

  const successRate = (analytics?.totalCalls && analytics?.successfulCalls !== undefined && analytics.totalCalls > 0) 
    ? (analytics.successfulCalls / analytics.totalCalls) * 100 
    : 0

  // Show skeleton while parent is loading, role is loading, or analytics is loading
  if (parentLoading || roleLoading || analyticsLoading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900">
        <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-8 space-y-8'}`}>
          <MetricsGridSkeleton role={role} isMobile={isMobile} />
          <ChartGridSkeleton isMobile={isMobile} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900">
        <div className={isMobile ? 'p-4' : 'p-8'}>
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-6 max-w-sm">
              <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto shadow-sm`}>
                <Warning weight="light" className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} text-red-400 dark:text-red-500`} />
              </div>
              <div className="space-y-2">
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 dark:text-gray-100`}>Unable to Load Analytics</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No analytics data available
  if (!analytics) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900">
        <div className={isMobile ? 'p-4' : 'p-8'}>
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-8">
              <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center mx-auto shadow-sm`}>
                <CalendarBlank weight="light" className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-gray-400 dark:text-gray-500`} />
              </div>
              <div className="space-y-2">
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-medium text-gray-900 dark:text-gray-100`}>No Data Available</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                  No calls found for the selected time period. Try adjusting your date range or check back later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-8 space-y-8'}`}>
        {/* Metrics Grid - Responsive layout */}
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-6 gap-4'}`}>
          {/* Total Calls */}
          <div className="group">
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300">
              <div className={isMobile ? 'p-3' : 'p-5'}>
                <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
                  <div className={`p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800`}>
                    <Phone weight="regular" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 dark:text-blue-400`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>Total Calls</h3>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-light text-gray-900 dark:text-gray-100 tracking-tight`}>{analytics?.totalCalls?.toLocaleString() || '0'}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 dark:text-gray-500 font-medium`}>All time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Minutes */}
          <div className="group">
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300">
              <div className={isMobile ? 'p-3' : 'p-5'}>
                <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
                  <div className={`p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800`}>
                    <Clock weight="regular" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-emerald-600 dark:text-emerald-400`} />
                  </div>
                  {!isMobile && (
                    <div className="text-right">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                        {analytics?.totalCalls && analytics?.totalMinutes ? Math.round(analytics.totalMinutes / analytics.totalCalls) : 0}m avg
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>Total Minutes</h3>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-light text-gray-900 dark:text-gray-100 tracking-tight`}>{analytics?.totalMinutes?.toLocaleString() || '0'}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 dark:text-gray-500 font-medium`}>
                    {isMobile && analytics?.totalCalls && analytics?.totalMinutes 
                      ? `${Math.round(analytics.totalMinutes / analytics.totalCalls)}m avg`
                      : 'Duration'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Cost - Only show if user has permission */}
          {role !== 'user' && (
            <div className="group">
              <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300">
                <div className={isMobile ? 'p-3' : 'p-5'}>
                  <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
                    <div className={`p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800`}>
                      <CurrencyDollar weight="regular" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-amber-600 dark:text-amber-400`} />
                    </div>
                    {!isMobile && (
                      <div className="text-right">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">INR</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>Total Cost</h3>
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-light text-gray-900 dark:text-gray-100 tracking-tight`}>रु {analytics?.totalCost?.toFixed(2) || '0.00'}</p>
                    <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 dark:text-gray-500 font-medium`}>Cumulative</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Average Latency - Only show if user has permission */}
          {role !== 'user' && (
            <div className="group">
              <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300">
                <div className={isMobile ? 'p-3' : 'p-5'}>
                  <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
                    <div className={`p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800`}>
                      <Lightning weight="regular" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-purple-600 dark:text-purple-400`} />
                    </div>
                    {!isMobile && (
                      <div className="text-right">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">avg</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>Response Time</h3>
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-light text-gray-900 dark:text-gray-100 tracking-tight`}>
                      {analytics?.averageLatency?.toFixed(2) || '0.00'}
                      <span className={`${isMobile ? 'text-sm ml-0.5' : 'text-lg ml-1'} text-gray-400 dark:text-gray-500`}>s</span>
                    </p>
                    <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 dark:text-gray-500 font-medium`}>Performance</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Successful Calls */}
          <div className="group">
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300">
              <div className={isMobile ? 'p-3' : 'p-5'}>
                <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
                  <div className={`p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800`}>
                    <CheckCircle weight="regular" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-600 dark:text-green-400`} />
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 bg-green-50 dark:bg-green-900/20 ${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded-md border border-green-100 dark:border-green-800`}>
                      <ArrowUp weight="bold" className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-green-600 dark:text-green-400`} />
                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-green-600 dark:text-green-400`}>
                        {analytics ? successRate.toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>Successful</h3>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-light text-green-600 dark:text-green-400 tracking-tight`}>{analytics?.successfulCalls?.toLocaleString() || '0'}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 dark:text-gray-500 font-medium`}>Completed calls</p>
                </div>
              </div>
            </div>
          </div>

          {/* Failed Calls */}
          <div className="group">
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300">
              <div className={isMobile ? 'p-3' : 'p-5'}>
                <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
                  <div className={`p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800`}>
                    <XCircle weight="regular" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-600 dark:text-red-400`} />
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 bg-red-50 dark:bg-red-900/20 ${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded-md border border-red-100 dark:border-red-800`}>
                      <ArrowDown weight="bold" className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-red-600 dark:text-red-400`} />
                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-red-600 dark:text-red-400`}>
                        {analytics ? (100 - successRate).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>Failed</h3>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-light text-red-600 dark:text-red-400 tracking-tight`}>{analytics?.totalCalls && analytics?.successfulCalls !== undefined ? (analytics.totalCalls - analytics.successfulCalls).toLocaleString() : '0'}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 dark:text-gray-500 font-medium`}>Incomplete calls</p>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Totals - show loading state per card */}
          {customTotals.map((config) => {
            const result = customTotalResults.find(r => r.configId === config.id)
            const IconComponent = ICON_COMPONENTS[config.icon as keyof typeof ICON_COMPONENTS] || Users
            const colorClass = COLOR_CLASSES[config.color as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.blue

            return (
              <div key={config.id} className="group">
                <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300">
                  <div className={isMobile ? 'p-3' : 'p-5'}>
                    <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
                      <div className={`p-2 ${colorClass.replace('bg-', 'bg-').replace('text-', 'border-')} rounded-lg border`}>
                        <IconComponent weight="regular" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${colorClass.split(' ')[1]}`} />
                      </div>

                      <div className={`flex items-center gap-1 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} p-0 hover:bg-gray-100 dark:hover:bg-gray-700`}
                          onClick={() => handleDownloadCustomTotal(config)}
                          title="Download matching logs"
                        >
                          <Download className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-gray-400 dark:text-gray-500`} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} p-0 hover:bg-gray-100 dark:hover:bg-gray-700`}
                            >
                              <MoreHorizontal className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-gray-400 dark:text-gray-500`} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteCustomTotal(config.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate`} title={config.name}>
                        {config.name}
                      </h3>
                      <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-light text-gray-900 dark:text-gray-100 tracking-tight`}>
                        {loadingCustomTotals || !result ? (
                          <Loader2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
                        ) : (
                          formatCustomTotalValue(result, config)
                        )}
                      </p>
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 dark:text-gray-500 font-medium`}>
                        {config.filters.length > 0 
                          ? `${config.filters.length} filter${config.filters.length > 1 ? 's' : ''}`
                          : 'No filters'
                        }
                      </p>
                      {result?.error && (
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-red-500 dark:text-red-400 mt-1`}>
                          {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {process.env.NODE_ENV === 'development' && (
          <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className={isMobile ? 'p-3' : 'p-4'}>
              <div className="text-sm">
                <strong>Debug - Dynamic Fields:</strong>
                <div>Metadata: {metadataFields.join(', ') || 'None'}</div>
                <div>Transcription: {transcriptionFields.join(', ') || 'None'}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart Grid - Single column on mobile */}
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 gap-6'}`}>
          {/* Daily Calls Chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className={`border-b border-gray-200 dark:border-gray-700 ${isMobile ? 'px-4 py-4' : 'px-7 py-6'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800`}>
                    <TrendUp weight="regular" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 dark:text-blue-400`} />
                  </div>
                  <div>
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-gray-100 tracking-tight`}>Daily Call Volume</h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 mt-0.5`}>
                      {isMobile ? 'Trend analysis' : 'Trend analysis over selected period'}
                    </p>
                  </div>
                </div>
                {!isMobile && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Peak</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {analytics?.dailyData && analytics.dailyData.length > 0 
                          ? Math.max(...analytics.dailyData.map(d => d.calls || 0)) 
                          : 0
                        }
                      </div>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Avg</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {analytics?.dailyData && analytics.dailyData.length > 0 
                          ? Math.round(analytics.dailyData.reduce((sum, d) => sum + (d.calls || 0), 0) / analytics.dailyData.length) 
                          : 0
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={isMobile ? 'p-4' : 'p-7'}>
              <div className={isMobile ? 'h-48' : 'h-80'}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.dailyData || []} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <defs>
                      <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007aff" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#007aff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="1 1" stroke={colors.grid} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: isMobile ? 9 : 11, fill: colors.text, fontWeight: 500 }}
                      height={40}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getMonth() + 1}/${date.getDate()}`
                      }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: isMobile ? 9 : 11, fill: colors.text, fontWeight: 500 }}
                      width={isMobile ? 35 : 45}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: colors.background,
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        fontSize: isMobile ? '12px' : '13px',
                        fontWeight: '500',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        backdropFilter: 'blur(20px)',
                        color: theme === 'dark' ? '#f3f4f6' : '#374151'
                      }}
                      labelStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#374151', fontWeight: '600' }}
                      labelFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric' 
                        })
                      }}
                      formatter={(value) => [`${value}`, 'Calls']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="calls" 
                      stroke={colors.primary} 
                      strokeWidth={isMobile ? 2 : 3}
                      fill="url(#callsGradient)"
                      dot={false}
                      activeDot={{ 
                        r: isMobile ? 4 : 6, 
                        fill: colors.primary, 
                        strokeWidth: 3, 
                        stroke: colors.background,
                        filter: 'drop-shadow(0 2px 4px rgba(0, 122, 255, 0.3))'
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Success Analysis Chart - Mobile optimized */}
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className={`border-b border-gray-200 dark:border-gray-700 ${isMobile ? 'px-4 py-4' : 'px-7 py-6'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800`}>
                    <Target weight="regular" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-600 dark:text-green-400`} />
                  </div>
                  <div>
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-gray-100 tracking-tight`}>Success Analysis</h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 mt-0.5`}>Call completion metrics</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400`}>Success Rate</div>
                  <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-light text-green-600 dark:text-green-400`}>{analytics ? successRate.toFixed(1) : '0.0'}%</div>
                </div>
              </div>
            </div>
            <div className={isMobile ? 'p-4' : 'p-7'}>
              <div className={`${isMobile ? 'h-48' : 'h-80'} flex items-center justify-center`}>
                <div className="relative">
                  <div className={isMobile ? 'w-32 h-32' : 'w-48 h-48'}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={successFailureData}
                          cx="50%"
                          cy="50%"
                          innerRadius={isMobile ? 35 : 55}
                          outerRadius={isMobile ? 55 : 85}
                          paddingAngle={2}
                          dataKey="value"
                          strokeWidth={0}
                          startAngle={90}
                          endAngle={450}
                        >
                          {successFailureData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: colors.background,
                            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '12px',
                            fontSize: isMobile ? '12px' : '13px',
                            fontWeight: '500',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            backdropFilter: 'blur(20px)',
                            color: theme === 'dark' ? '#f3f4f6' : '#374151'
                          }}
                          formatter={(value, name) => [`${value} calls`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`${isMobile ? 'text-xl' : 'text-3xl'} font-light text-gray-900 dark:text-gray-100 mb-1`}>{analytics?.totalCalls || 0}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide`}>Total</div>
                  </div>
                </div>
                <div className={`${isMobile ? 'ml-4 space-y-2' : 'ml-8 space-y-3'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full`} style={{ backgroundColor: colors.success }}></div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-gray-300`}>Success</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-light text-gray-500 dark:text-gray-400`}>{analytics?.successfulCalls || 0}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full`} style={{ backgroundColor: colors.danger }}></div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-gray-300`}>Failed</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-light text-gray-500 dark:text-gray-400`}>{analytics?.totalCalls && analytics?.successfulCalls !== undefined ? (analytics.totalCalls - analytics.successfulCalls) : 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Minutes Chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className={`border-b border-gray-200 dark:border-gray-700 ${isMobile ? 'px-4 py-4' : 'px-7 py-6'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800`}>
                    <ChartBar weight="regular" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 dark:text-blue-400`} />
                  </div>
                  <div>
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-gray-100 tracking-tight`}>Usage Minutes</h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 mt-0.5`}>
                      {isMobile ? 'Daily duration' : 'Daily conversation duration'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className={isMobile ? 'p-4' : 'p-7'}>
              <div className={isMobile ? 'h-48' : 'h-80'}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.dailyData || []} margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
                    <defs>
                      <linearGradient id="minutesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="1 1" stroke={colors.grid} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: isMobile ? 9 : 11, fill: colors.text, fontWeight: 500 }}
                      height={40}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getMonth() + 1}/${date.getDate()}`
                      }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: isMobile ? 9 : 11, fill: colors.text, fontWeight: 500 }}
                      width={isMobile ? 35 : 40}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: colors.background,
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        fontSize: isMobile ? '12px' : '13px',
                        fontWeight: '500',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(20px)',
                        color: theme === 'dark' ? '#f3f4f6' : '#374151'
                      }}
                      formatter={(value) => [`${value} min`, 'Duration']}
                      labelFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric' 
                        })
                      }}
                    />
                    <Bar 
                      dataKey="minutes" 
                      fill="url(#minutesGradient)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Average Latency Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
            <div className={`border-b border-gray-200 dark:border-gray-700 ${isMobile ? 'px-4 py-4' : 'px-7 py-6'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800`}>
                    <Activity weight="regular" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-orange-600 dark:text-orange-400`} />
                  </div>
                  <div>
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-gray-100 tracking-tight`}>Response Performance</h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 mt-0.5`}>
                      {isMobile ? 'Latency metrics' : 'Average latency metrics'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className={isMobile ? 'p-4' : 'p-7'}>
              <div className={isMobile ? 'h-48' : 'h-80'}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.dailyData || []} margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
                    <defs>
                      <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff9500" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ff9500" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="1 1" stroke={colors.grid} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: isMobile ? 9 : 11, fill: colors.text, fontWeight: 500 }}
                      height={40}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getMonth() + 1}/${date.getDate()}`
                      }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: isMobile ? 9 : 11, fill: colors.text, fontWeight: 500 }}
                      width={isMobile ? 35 : 40}
                      tickFormatter={(value) => `${value}s`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: colors.background,
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        fontSize: isMobile ? '12px' : '13px',
                        fontWeight: '500',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(20px)',
                        color: theme === 'dark' ? '#f3f4f6' : '#374151'
                      }}
                      formatter={(value) => [`${value}s`, 'Latency']}
                      labelFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric' 
                        })
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg_latency" 
                      stroke="#ff9500" 
                      strokeWidth={isMobile ? 2 : 3}
                      fill="url(#latencyGradient)"
                      dot={false}
                      activeDot={{ 
                        r: isMobile ? 4 : 6, 
                        fill: '#ff9500', 
                        strokeWidth: 3, 
                        stroke: colors.background,
                        filter: 'drop-shadow(0 2px 4px rgba(255, 149, 0, 0.3))'
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Analytics Section - Hidden on mobile for better performance */}
        {!isMobile && (
          <ChartProvider>
            <div className="space-y-6">
              <EnhancedChartBuilder 
                agentId={agent?.id}
                dateFrom={dateRange.from}
                dateTo={dateRange.to}
                metadataFields={metadataFields}
                transcriptionFields={transcriptionFields}
                fieldsLoading={fieldsLoading}
              />

              {/* Floating Action Menu - only show when we have required data */}
              {userEmail && !fieldsLoading && agent?.id && project?.id && (
                <FloatingActionMenu
                  metadataFields={metadataFields}
                  transcriptionFields={transcriptionFields}
                  agentId={agent.id}
                  projectId={project.id}
                  userEmail={userEmail}
                  availableColumns={AVAILABLE_COLUMNS}
                  onSaveCustomTotal={handleSaveCustomTotal}
                />
              )}
            </div>
          </ChartProvider>
        )}
      </div>
    </div>
  )
}

export default Overview