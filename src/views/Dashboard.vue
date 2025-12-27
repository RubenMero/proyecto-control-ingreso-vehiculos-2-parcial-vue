<template>
  <div class="main-wrapper">
    <Sidebar :isHidden="sidebarHidden" />
    <div :class="['content-area', { 'full-width': sidebarHidden }]">
      <Topbar @toggle-sidebar="sidebarHidden = !sidebarHidden" />
      <main class="container">
        <h2>Panel Principal</h2>
        
        <div class="cards-container">
          <div class="info-card card-blue">
            <h3>Total Ingresos (Hoy)</h3>
            <p class="card-number">{{ totalIngresosHoy }}</p>
            <p class="card-subtitle">Registros en el día</p>
          </div>
          <div class="info-card card-green">
            <h3>Vehículos en Campus</h3>
            <p class="card-number">{{ vehiculosActivos }}</p>
            <p class="card-subtitle">Actualmente dentro</p>
          </div>
          <div class="info-card card-orange">
            <h3>Capacidad Ocupada</h3>
            <p class="card-number">{{ capacidadPorcentaje }}%</p>
            <p class="card-subtitle">{{ vehiculosActivos }} / 500 espacios</p>
          </div>
          <div class="info-card card-purple">
            <h3>Salidas Registradas</h3>
            <p class="card-number">{{ salidasHoy }}</p>
            <p class="card-subtitle">Movimientos de salida hoy</p>
          </div>
        </div>

        <div v-if="authStore.userRole !== 'GUARDIA'" class="section-card chart-container">
          <h3>Actividad de Ingresos por Hora</h3>
          <div class="chart-controls">
            <button 
              @click="periodoGrafico = 'hoy'"
              :class="['btn-chart', { active: periodoGrafico === 'hoy' }]"
            >
              Hoy
            </button>
            <button 
              @click="periodoGrafico = 'mes'"
              :class="['btn-chart', { active: periodoGrafico === 'mes' }]"
            >
              Últimos 30 días
            </button>
          </div>
          <div class="chart">
            <div class="chart-bars">
              <div 
                v-for="(item, idx) in chartData" 
                :key="idx"
                class="chart-bar-wrapper"
              >
                <div 
                  class="chart-bar"
                  :style="{ height: (item.value / maxChartValue * 100) + '%' }"
                >
                  <span v-if="item.value > 0" class="bar-value">{{ item.value }}</span>
                </div>
                <span class="bar-label">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <h3>Últimos 5 Movimientos</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="ultimosMovimientos.length === 0">
                <td colspan="4">No hay movimientos recientes</td>
              </tr>
              <tr v-for="mov in ultimosMovimientos" :key="mov.id">
                <td>{{ mov.horaSalida || mov.horaIngreso }}</td>
                <td>{{ mov.placa }}</td>
                <td>{{ mov.tipoVehiculo }}</td>
                <td>
                  <span :class="['badge', mov.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger']">
                    {{ mov.estado === 'ACTIVO' ? 'Dentro' : 'Salió' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'

const authStore = useAuthStore()
const sidebarHidden = ref(false)
const periodoGrafico = ref('hoy')
let updateInterval = null

const getTodayString = () => new Date().toISOString().split('T')[0]

const ingresos = computed(() => {
  return JSON.parse(localStorage.getItem('ingresos') || '[]')
})

const totalIngresosHoy = computed(() => {
  const today = getTodayString()
  return ingresos.value.filter(i => i.fechaIngreso === today).length
})

const vehiculosActivos = computed(() => {
  return ingresos.value.filter(i => i.estado === 'ACTIVO').length
})

const capacidadPorcentaje = computed(() => {
  return ((vehiculosActivos.value / 500) * 100).toFixed(1)
})

const salidasHoy = computed(() => {
  const today = getTodayString()
  return ingresos.value.filter(i => i.fechaIngreso === today && i.estado === 'INACTIVO').length
})

const ultimosMovimientos = computed(() => {
  return [...ingresos.value]
    .sort((a, b) => b.ingresoTimestamp - a.ingresoTimestamp)
    .slice(0, 5)
})

const chartData = computed(() => {
  if (periodoGrafico.value === 'hoy') {
    const labels = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00']
    const datos = [0, 0, 0, 0, 0, 0]
    const today = getTodayString()
    
    ingresos.value.filter(i => i.fechaIngreso === today).forEach(i => {
      const h = new Date(i.ingresoTimestamp).getHours()
      if (h >= 6 && h < 9) datos[0]++
      else if (h >= 9 && h < 12) datos[1]++
      else if (h >= 12 && h < 15) datos[2]++
      else if (h >= 15 && h < 18) datos[3]++
      else if (h >= 18 && h < 21) datos[4]++
      else if (h >= 21) datos[5]++
    })
    
    return labels.map((label, idx) => ({ label, value: datos[idx] }))
  } else {
    const labels = ['Hace 3 sem', 'Hace 2 sem', 'Sem Pasada', 'Esta Sem']
    const datos = [0, 0, 0, 0]
    const now = Date.now()
    const semana = 7 * 24 * 60 * 60 * 1000
    
    ingresos.value.forEach(i => {
      const dif = now - i.ingresoTimestamp
      if (dif <= semana) datos[3]++
      else if (dif <= semana * 2) datos[2]++
      else if (dif <= semana * 3) datos[1]++
      else if (dif <= semana * 4) datos[0]++
    })
    
    return labels.map((label, idx) => ({ label, value: datos[idx] }))
  }
})

const maxChartValue = computed(() => {
  const max = Math.max(...chartData.value.map(d => d.value), 1)
  return max
})

onMounted(() => {
  updateInterval = setInterval(() => {
    // Forzar actualización cada minuto
  }, 60000)
})

onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval)
})
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

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.info-card {
  text-align: center;
  color: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-blue { background: linear-gradient(135deg, #3498db, #2980b9); }
.card-green { background: linear-gradient(135deg, #28a745, #20923c); }
.card-orange { background: linear-gradient(135deg, #f39c12, #e67e22); }
.card-purple { background: linear-gradient(135deg, #9b59b6, #8e44ad); }

.card-number {
  font-size: 2.8em;
  font-weight: 700;
  margin: 10px 0;
}

.card-subtitle {
  font-size: 0.9em;
  opacity: 0.9;
}

.section-card {
  background-color: white;
  padding: 25px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.chart-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.btn-chart {
  padding: 8px 20px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  background: #ddd;
  color: #333;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-chart.active {
  background: #D30F2A;
  color: white;
}

.chart {
  min-height: 200px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  height: 180px;
  gap: 15px;
  padding: 10px;
  border-bottom: 2px solid #eee;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.chart-bar {
  width: 100%;
  max-width: 50px;
  background: linear-gradient(180deg, #ff4d6a, #D30F2A);
  border-radius: 6px 6px 0 0;
  position: relative;
  transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.bar-value {
  position: absolute;
  top: -25px;
  font-size: 12px;
  font-weight: bold;
  color: #D30F2A;
}

.bar-label {
  font-size: 11px;
  color: #666;
  margin-top: 10px;
  text-align: center;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.data-table thead th {
  background-color: #D30F2A;
  color: white;
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.data-table tbody td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.data-table tbody tr:hover {
  background-color: #f8f9fa;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
}

.badge-success {
  background-color: #d4edda;
  color: #28a745;
}

.badge-danger {
  background-color: #f8d7da;
  color: #dc35b5;
}
</style>