<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showCalendar = ref(false)
const calendarRef = ref<HTMLElement | null>(null)

// Current view state
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())

// Selected date
const selectedDate = computed(() => {
  if (!props.modelValue) return null
  return new Date(props.modelValue)
})

// Initialize view to selected date or current date
onMounted(() => {
  if (props.modelValue) {
    const date = new Date(props.modelValue)
    currentYear.value = date.getFullYear()
    currentMonth.value = date.getMonth()
  }
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (e: MouseEvent) => {
  if (calendarRef.value && !calendarRef.value.contains(e.target as Node)) {
    showCalendar.value = false
  }
}

// Month names
const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// Get days in current month view
const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startWeekDay = firstDay.getDay()
  
  const days: { date: number; month: number; year: number; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = []
  
  // Previous month days
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate()
  
  for (let i = startWeekDay - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i
    days.push({
      date,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday: false,
      isSelected: isDateSelected(prevYear, prevMonth, date)
    })
  }
  
  // Current month days
  const today = new Date()
  for (let date = 1; date <= daysInMonth; date++) {
    days.push({
      date,
      month,
      year,
      isCurrentMonth: true,
      isToday: today.getFullYear() === year && today.getMonth() === month && today.getDate() === date,
      isSelected: isDateSelected(year, month, date)
    })
  }
  
  // Next month days
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  const remainingDays = 42 - days.length // 6 rows * 7 days
  
  for (let date = 1; date <= remainingDays; date++) {
    days.push({
      date,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isToday: false,
      isSelected: isDateSelected(nextYear, nextMonth, date)
    })
  }
  
  return days
})

const isDateSelected = (year: number, month: number, date: number): boolean => {
  if (!selectedDate.value) return false
  return selectedDate.value.getFullYear() === year &&
         selectedDate.value.getMonth() === month &&
         selectedDate.value.getDate() === date
}

const selectDate = (day: { date: number; month: number; year: number }) => {
  const dateStr = `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
  emit('update:modelValue', dateStr)
  showCalendar.value = false
}

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const goToToday = () => {
  const today = new Date()
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth()
}

const clearDate = () => {
  emit('update:modelValue', '')
  showCalendar.value = false
}

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const date = new Date(props.modelValue)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const toggleCalendar = () => {
  showCalendar.value = !showCalendar.value
  if (showCalendar.value && props.modelValue) {
    const date = new Date(props.modelValue)
    currentYear.value = date.getFullYear()
    currentMonth.value = date.getMonth()
  }
}
</script>

<template>
  <div class="date-picker" ref="calendarRef">
    <div class="date-input-wrapper" @click="toggleCalendar">
      <div class="date-input">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span :class="{ 'placeholder': !modelValue }">
          {{ displayValue || '选择截止日期（可选）' }}
        </span>
      </div>
      <button 
        v-if="modelValue" 
        type="button" 
        class="clear-btn"
        @click.stop="clearDate"
        title="清除日期"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    
    <Transition name="calendar">
      <div v-if="showCalendar" class="calendar-dropdown">
        <div class="calendar-header">
          <button type="button" class="nav-btn" @click="prevMonth">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="current-month">
            <span class="month-year">{{ currentYear }}年 {{ monthNames[currentMonth] }}</span>
            <button type="button" class="today-btn" @click="goToToday">今天</button>
          </div>
          <button type="button" class="nav-btn" @click="nextMonth">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        
        <div class="calendar-weekdays">
          <span v-for="day in weekDays" :key="day" class="weekday">{{ day }}</span>
        </div>
        
        <div class="calendar-days">
          <button
            v-for="(day, index) in calendarDays"
            :key="index"
            type="button"
            class="day-btn"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'selected': day.isSelected
            }"
            @click="selectDate(day)"
          >
            {{ day.date }}
          </button>
        </div>
        
        <div class="calendar-footer">
          <button type="button" class="clear-date-btn" @click="clearDate">
            清除日期
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.date-picker {
  position: relative;
}

.date-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.date-input-wrapper:hover {
  border-color: var(--color-border-hover);
}

.date-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.date-input svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.date-input .placeholder {
  color: var(--color-text-muted);
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  background: var(--color-bg-card);
  color: var(--color-error);
}

.calendar-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-md);
  z-index: 1000;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}

.current-month {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.month-year {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
}

.today-btn {
  padding: 4px 8px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.today-btn:hover {
  background: var(--color-accent-light);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: var(--spacing-sm);
}

.weekday {
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-text-muted);
  padding: var(--spacing-xs);
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-btn {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 500;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.day-btn:hover {
  background: var(--color-bg-tertiary);
}

.day-btn.other-month {
  color: var(--color-text-muted);
  opacity: 0.5;
}

.day-btn.today {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-accent);
}

.day-btn.selected {
  background: var(--color-accent);
  color: white;
}

.day-btn.selected:hover {
  background: var(--color-accent-light);
}

.calendar-footer {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.clear-date-btn {
  width: 100%;
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-date-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-error);
  color: var(--color-error);
}

/* Calendar animation */
.calendar-enter-active,
.calendar-leave-active {
  transition: all var(--transition-fast);
}

.calendar-enter-from,
.calendar-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
