import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

<template>
  <div class="main-wrapper">
    <Sidebar :isHidden="sidebarHidden" />
    <div :class="['content-area', { 'full-width': sidebarHidden }]">
      <Topbar @toggle-sidebar="sidebarHidden = !sidebarHidden" />
      <main class="container">
        <h2>Generación de Reportes</h2>

        <div class="section-card">
          <h3>Selección de Parámetros</h3>
          <form @submit.prevent="generarReporte">
            <div class="filter-controls">
              <div class="form-group">
                <label for="tipoReporte">Tipo de Reporte</label>
                <select v-model="form.tipoReporte" id="tipoReporte" required>
                  <option value="">Seleccione</option>
                  <option value="ingresos">Ingresos y Salidas (Histórico)</option>
                  <option value="usuarios">Estadísticas por Tipo de Usuario</option>
                  <option value="permanencia">Tiempos de Permanencia</option>
                  <option value="vehiculos">Listado de Vehículos Registrados</option>
                </select>
              </div>
              <div v-if="!isGuardia" class="form-group">
                <label for="fechaDesde">Fecha Desde</label>
                <input v-model="form.fechaDesde" type="date" id="fechaDesde" required>
              </div>
              <div v-if="!isGuardia" class="form-group">
                <label for="fechaHasta">Fecha Hasta</label>
                <input v-model="form.fechaHasta" type="date" id="fechaHasta" required>
              </div>
            </div>
            <div class="filter-actions">
              <button type="submit" class="btn btn-primary">Generar Reporte</button>
            </div>
          </form>
        </div>

        <div v-if="reporteGenerado" class="section-card">
          <div class="data-header">
            <h3>{{ tituloReporte }}</h3>
            <div v-if="!isGuardia" class="export-buttons">
              <button class="btn btn-success" @click="exportar('excel')">Exportar Excel</button>
              <button class="btn btn-secondary" @click="exportar('pdf')">Imprimir / PDF</button>
            </div>
          </div>

          <!-- Gráfico Visual -->
          <div v-if="chartData.length > 0" class="report-chart-box">
            <h4>Análisis Visual</h4>
            <div class="chart-bars-horizontal">
              <div v-for="(item, idx) in chartData" :key="idx" class="chart-row">
                <div class="chart-label">{{ item.label }}</div>
                <div class="chart-bar-container">
                  <div 
                    class="chart-bar-fill"
                    :style="{ width: (item.value / maxChartValue * 100) + '%' }"
                  >
                    <span class="bar-text">{{ item.value }} ({{ item.percent }}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contenido del Reporte -->
          <div v-html="contenidoReporte"></div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'

const authStore = useAuthStore()
const sidebarHidden = ref(false)
const reporteGenerado = ref(false)
const tituloReporte = ref('')
const contenidoReporte = ref('')
const chartData = ref([])

const form = ref({
  tipoReporte: '',
  fechaDesde: '',
  fechaHasta: ''
})

const isGuardia = computed(() => authStore.userRole === 'GUARDIA')

const getTodayString = () => new Date().toISOString().split('T')[0]

const maxChartValue = computed(() => {
  if (chartData.value.length === 0) return 1
  return Math.max(...chartData.value.map(d => d.value), 1)
})

const generarReporte = () => {
  let fechaDesde = form.value.fechaDesde
  let fechaHasta = form.value.fechaHasta

  if (isGuardia.value) {
    fechaDesde = getTodayString()
    fechaHasta = getTodayString()
  } else if (!fechaDesde || !fechaHasta) {
    authStore.showNotification('Debe seleccionar el rango de fechas', 'error')
    return
  }

  const ingresos = JSON.parse(localStorage.getItem('ingresos') || '[]')
  const vehiculos = JSON.parse(localStorage.getItem('vehiculos') || '[]')

  const filtrados = ingresos.filter(i => 
    i.fechaIngreso >= fechaDesde && i.fechaIngreso <= fechaHasta
  )

  tituloReporte.value = `Reporte: ${form.value.tipoReporte.toUpperCase()} (${fechaDesde} a ${fechaHasta})`

  switch (form.value.tipoReporte) {
    case 'ingresos':
      generarReporteIngresos(filtrados)
      break
    case 'usuarios':
      generarReporteUsuarios(filtrados)
      break
    case 'permanencia':
      generarReportePermanencia(filtrados)
      break
    case 'vehiculos':
      if (isGuardia.value) {
        authStore.showNotification('Acceso denegado a este reporte', 'error')
        return
      }
      generarReporteVehiculos(vehiculos)
      break
  }

  reporteGenerado.value = true
  authStore.showNotification('Reporte generado exitosamente', 'success')
}

const generarReporteIngresos = (data) => {
  chartData.value = []
  const total = data.length
  const activos = data.filter(i => i.estado === 'ACTIVO').length

  contenidoReporte.value = `
    <div class="info-summary">
      <p><strong>Total de Registros:</strong> ${total}</p>
      <p><strong>Activos:</strong> ${activos}</p>
      <p><strong>Inactivos:</strong> ${total - activos}</p>
    </div>
    <h4>Detalle de Movimientos (Primeros 20)</h4>
    <table class="data-table">
      <thead>
        <tr><th>Placa</th><th>Ingreso</th><th>Salida</th><th>Estado</th></tr>
      </thead>
      <tbody>
        ${data.slice(0, 20).map(i => `
          <tr>
            <td>${i.placa}</td>
            <td>${i.horaIngreso}</td>
            <td>${i.horaSalida || '---'}</td>
            <td><span class="badge ${i.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}">${i.estado}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

const generarReporteUsuarios = (data) => {
  const conteo = {}
  let total = data.length

  data.forEach(i => {
    conteo[i.tipoUsuario] = (conteo[i.tipoUsuario] || 0) + 1
  })

  chartData.value = Object.entries(conteo).map(([label, value]) => ({
    label,
    value,
    percent: ((value / total) * 100).toFixed(1)
  }))

  contenidoReporte.value = `
    <div class="info-summary">
      <p><strong>Total de Ingresos Analizados:</strong> ${total}</p>
    </div>
    <p style="margin-top: 15px;"><i>* El gráfico superior muestra la distribución porcentual.</i></p>
  `
}

const generarReportePermanencia = (data) => {
  const salidas = data.filter(i => i.salidaTimestamp)
  const total = salidas.length

  const rangos = {
    '< 1h': 0,
    '1-4h': 0,
    '4-8h': 0,
    '> 8h': 0
  }

  salidas.forEach(i => {
    const horas = (i.salidaTimestamp - i.ingresoTimestamp) / (1000 * 3600)
    if (horas < 1) rangos['< 1h']++
    else if (horas < 4) rangos['1-4h']++
    else if (horas < 8) rangos['4-8h']++
    else rangos['> 8h']++
  })

  chartData.value = Object.entries(rangos).map(([label, value]) => ({
    label,
    value,
    percent: total > 0 ? ((value / total) * 100).toFixed(1) : 0
  }))

  const avgMs = salidas.reduce((sum, i) => sum + (i.salidaTimestamp - i.ingresoTimestamp), 0) / (total || 1)
  const avgHours = (avgMs / (1000 * 3600)).toFixed(2)

  contenidoReporte.value = `
    <div class="info-summary">
      <p><strong>Total de Salidas Registradas:</strong> ${total}</p>
      <p><strong>Tiempo Promedio de Permanencia:</strong> ${avgHours} horas</p>
    </div>
  `
}

const generarReporteVehiculos = (data) => {
  chartData.value = []
  contenidoReporte.value = `
    <div class="info-summary">
      <p><strong>Total de Vehículos Autorizados:</strong> ${data.length}</p>
    </div>
    <table class="data-table">
      <thead>
        <tr><th>Placa</th><th>Propietario</th><th>Tipo</th><th>Estado</th></tr>
      </thead>
      <tbody>
        ${data.map(v => `
          <tr>
            <td>${v.placa}</td>
            <td>${v.propietario}</td>
            <td>${v.tipoUsuario}</td>
            <td><span class="badge ${v.estado === 'Autorizado' ? 'badge-success' : 'badge-danger'}">${v.estado}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

const exportar = (tipo) => {
  if (tipo === 'pdf') exportarPDF()
  if (tipo === 'excel') exportarExcel()
}
const exportarPDF = () => {
  const doc = new jsPDF()
  doc.text(tituloReporte.value, 14, 15)

  const table = document.querySelector('.data-table')
  if (!table) {
    authStore.showNotification('No hay datos para exportar', 'error')
    return
  }

  const headers = [...table.querySelectorAll('th')].map(th => th.innerText)
  const rows = [...table.querySelectorAll('tbody tr')].map(tr =>
    [...tr.children].map(td => td.innerText)
  )

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 25
  })

  doc.save('reporte.pdf')
}
const exportarExcel = () => {
  const table = document.querySelector('.data-table')
  if (!table) {
    authStore.showNotification('No hay datos para exportar', 'error')
    return
  }

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.table_to_sheet(table)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  saveAs(blob, 'reporte.xlsx')
}

</script>

<style scoped>
.main-wrapper {
  display: flex;
  min-height: 100vh;
}

.content-area {
  margin-left: 250px;
  flex-grow: 1;
  transition: margin-left 0.3s ease;
}

.content-area.full-width {
  margin-left: 0;
}

.container {
  padding: 20px;
}

h2 {
  color: #D30F2A;
  margin-bottom: 20px;
  border-bottom: 2px solid #131212;
  padding-bottom: 10px;
}

.section-card {
  background-color: white;
  padding: 25px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

h3, h4 {
  color: #D30F2A;
  margin-bottom: 15px;
}

.filter-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.filter-actions {
  margin-top: 20px;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.export-buttons {
  display: flex;
  gap: 10px;
}

.report-chart-box {
  background: #fdfdfd;
  border: 1px solid #eee;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.chart-bars-horizontal {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.chart-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.chart-label {
  min-width: 120px;
  font-weight: 600;
  font-size: 0.95em;
}

.chart-bar-container {
  flex: 1;
  background: #e9ecef;
  height: 35px;
  border-radius: 5px;
  overflow: hidden;
}

.chart-bar-fill {
  background: linear-gradient(90deg, #D30F2A, #ff4d6a);
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 10px;
  transition: width 0.8s ease;
}

.bar-text {
  color: white;
  font-size: 0.85em;
  font-weight: 600;
  white-space: nowrap;
}

.info-summary {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.info-summary p {
  margin-bottom: 8px;
}
</style>