<template>
  <div class="quick-reply-panel">
    <div class="quick-reply-header">
      <span class="panel-title">快捷短语</span>
      <button class="manage-btn" @click="$emit('open-manager')">
        管理
      </button>
    </div>
    
    <div class="quick-reply-list">
      <div v-if="quickReplies.length === 0" class="empty-state">
        暂无快捷短语
      </div>
      
      <div 
        v-for="item in quickReplies" 
        :key="item.id"
        class="quick-reply-item"
        @click="handleClick(item)"
        :title="item.content"
      >
        <span class="quick-reply-keyword">[{{ item.keyword }}]</span>
        <span class="quick-reply-content">{{ truncateContent(item.content) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  quickReplies: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select', 'open-manager']);

function truncateContent(content) {
  if (!content) return '';
  return content.length > 15 ? content.substring(0, 15) + '...' : content;
}

function handleClick(item) {
  emit('select', item);
}
</script>

<style scoped>
.quick-reply-panel {
  width: 280px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
}

.quick-reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #e0e0e0;
  background-color: white;
}

.panel-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.manage-btn {
  padding: 4px 10px;
  font-size: 12px;
  color: #667eea;
  background: none;
  border: 1px solid #667eea;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.manage-btn:hover {
  background-color: #667eea;
  color: white;
}

.quick-reply-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 13px;
}

.quick-reply-item {
  padding: 10px 12px;
  margin-bottom: 6px;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.quick-reply-item:hover {
  background-color: #f0f4ff;
  border-color: #667eea;
}

.quick-reply-keyword {
  font-size: 12px;
  color: #667eea;
  font-weight: 500;
  margin-right: 6px;
}

.quick-reply-content {
  font-size: 13px;
  color: #333;
}
</style>
