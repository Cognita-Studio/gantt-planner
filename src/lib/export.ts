import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import ExcelJS from 'exceljs'
import type { GanttItem, Dependency } from '../types'

export async function exportToPng(element: HTMLElement, filename = 'gantt.png') {
  const dataUrl = await toPng(element, { backgroundColor: '#0f1117', pixelRatio: 2 })
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

export async function exportToPdf(element: HTMLElement, filename = 'gantt.pdf') {
  const dataUrl = await toPng(element, { backgroundColor: '#0f1117', pixelRatio: 2 })
  const img = new Image()
  img.src = dataUrl
  await new Promise(r => { img.onload = r })
  const w = img.width
  const h = img.height
  const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'px', format: [w, h] })
  pdf.addImage(dataUrl, 'PNG', 0, 0, w, h)
  pdf.save(filename)
}

export async function exportToExcel(items: GanttItem[], deps: Dependency[], projectName: string) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Tasks')

  ws.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Name', key: 'name', width: 40 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Parent ID', key: 'parent_id', width: 36 },
    { header: 'Start', key: 'start_date', width: 14 },
    { header: 'End', key: 'end_date', width: 14 },
    { header: 'Progress %', key: 'progress', width: 12 },
    { header: 'Assignee', key: 'assignee', width: 20 },
    { header: 'Auto Dates', key: 'auto_dates', width: 12 },
  ]

  for (const item of items) {
    ws.addRow({
      ...item,
      auto_dates: item.auto_dates ? 'Yes' : 'No',
    })
  }

  const ws2 = wb.addWorksheet('Dependencies')
  ws2.columns = [
    { header: 'From Item ID', key: 'from_item_id', width: 36 },
    { header: 'To Item ID', key: 'to_item_id', width: 36 },
    { header: 'Type', key: 'type', width: 8 },
    { header: 'Lag Days', key: 'lag_days', width: 12 },
  ]
  for (const dep of deps) ws2.addRow(dep)

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName.replace(/\s+/g, '_')}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
