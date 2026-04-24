<template>
  <div class="sensitive-word-manager" v-if="visible">
    <div class="manager-overlay" @click="handleClose"></div>
    
    <div class="manager-content">
      <div class="manager-header">
        <span class="manager-title">敏感词管理</span>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      
      <div class="manager-body">
        <div class="manager-toolbar">
          <button class="add-btn" @click="handleAdd">
            + 新增敏感词
          </button>
          <span class="count-info">共 {{ sensitiveWords.length }} 个敏感词</span>
        </div>
        
        <div class="manager-list">
          <div v-if="sensitiveWords.length === 0" class="empty-state">
            暂无敏感词，请点击"新增敏感词"添加
          </div>
          
          <div 
            v-for="item in sensitiveWords" 
            :key="item.id"
            class="manager-item"
          >
            <div class="item-info">
              <span class="item-word">{{ item.word }}</span>
              <span class="item-category">[{{ getCategoryLabel(item.category) }}]</span>
            </div>
            <div class="item-actions">
              <button class="action-btn edit" @click="handleEdit(item)">
                编辑
              </button>
              <button class="action-btn delete" @click="handleDelete(item)">
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="edit-dialog" v-if="editingItem">
      <div class="dialog-overlay" @click="cancelEdit"></div>
      
      <div class="dialog-content">
        <div class="dialog-header">
          <span class="dialog-title">{{ isEditMode ? '编辑敏感词' : '新增敏感词' }}</span>
          <button class="close-btn" @click="cancelEdit">×</button>
        </div>
        
        <div class="dialog-body">
          <div class="form-item">
            <label class="form-label">敏感词 <span class="required">*</span></label>
            <input 
              type="text"
              v-model="editForm.word"
              placeholder="输入敏感词，如：诈骗、兼职"
              class="form-input"
              maxlength="20"
              ref="wordInputRef"
            />
            <div class="input-hint">请输入需要过滤的敏感词</div>
          </div>
          
          <div class="form-item">
            <label class="form-label">分类</label>
            <select 
              v-model="editForm.category"
              class="form-select"
            >
              <option value="default">默认</option>
              <option value="违法犯罪">违法犯罪</option>
              <option value="违规信息">违规信息</option>
              <option value="营销广告">营销广告</option>
              <option value="敏感政治">敏感政治</option>
              <option value="其他">其他</option>
            </select>
          </div>
          
          <div class="form-item">
            <label class="form-label">排序</label>
            <input 
              type="number"
              v-model.number="editForm.sortOrder"
              placeholder="数字越小越靠前"
              class="form-input small"
              min="0"
            />
            <div class="input-hint">数字越小，在列表中越靠前显示</div>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button class="btn cancel" @click="cancelEdit">取消</button>
          <button class="btn confirm" @click="saveEdit" :disabled="!canSave">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  sensitiveWords: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'create', 'update', 'delete']);

const editingItem = ref(null);
const isEditMode = ref(false);
const wordInputRef = ref(null);

const defaultForm = {
  id: null,
  word: '',
  category: 'default',
  sortOrder: 0
};

const editForm = ref({ ...defaultForm });

const canSave = computed(() => {
  const word = editForm.value && editForm.value.word;
  return word && word.trim();
});

watch(() => props.visible, (val) => {
  if (val) {
    editingItem.value = null;
    resetForm();
  }
});

watch(editingItem, (val) => {
  if (val && wordInputRef.value) {
    nextTick(() => {
      wordInputRef.value.focus();
    });
  }
});

function resetForm() {
  editForm.value = { ...defaultForm };
}

function getCategoryLabel(category) {
  const labels = {
    'default': '默认',
    '违法犯罪': '违法犯罪',
    '违规信息': '违规信息',
    '营销广告': '营销广告',
    '敏感政治': '敏感政治',
    '其他': '其他'
  };
  return labels[category] || category;
}

function handleClose() {
  emit('close');
}

function handleAdd() {
  console.log('[SensitiveWordManager] handleAdd 被点击');
  alert('点击了【新增敏感词】按钮');
  isEditMode.value = false;
  editingItem.value = { ...defaultForm };
  resetForm();
  editForm.value.sortOrder = props.sensitiveWords.length;
  console.log('[SensitiveWordManager] editingItem:', editingItem.value);
}

function handleEdit(item) {
  console.log('[SensitiveWordManager] handleEdit 被点击:', item);
  isEditMode.value = true;
  editingItem.value = { ...item };
  editForm.value = {
    id: item.id,
    word: item.word,
    category: item.category || 'default',
    sortOrder: item.sortOrder !== undefined ? item.sortOrder : 0
  };
}

function handleDelete(item) {
  console.log('[SensitiveWordManager] handleDelete 被点击:', item);
  if (confirm(`确定要删除敏感词"${item.word}"吗？`)) {
    console.log('[SensitiveWordManager] 发出 delete 事件:', item.id);
    emit('delete', item.id);
  }
}

function cancelEdit() {
  editingItem.value = null;
  resetForm();
}

function saveEdit() {
  console.log('[SensitiveWordManager] saveEdit 被点击');
  console.log('[SensitiveWordManager] canSave:', canSave.value);
  console.log('[SensitiveWordManager] editForm:', editForm.value);
  
  if (!canSave.value) {
    console.log('[SensitiveWordManager] canSave 为 false，不保存');
    alert('请输入敏感词内容！');
    return;
  }
  
  const data = {
    word: (editForm.value.word || '').trim(),
    category: editForm.value.category || 'default',
    sortOrder: editForm.value.sortOrder !== undefined ? editForm.value.sortOrder : 0
  };
  
  console.log('[SensitiveWordManager] 准备发出事件:', isEditMode.value ? 'update' : 'create', data);
  alert(`准备保存敏感词: ${data.word}\n事件类型: ${isEditMode.value ? 'update' : 'create'}`);
  
  if (isEditMode.value) {
    emit('update', { id: editForm.value.id, ...data });
  } else {
    emit('create', data);
  }
  
  cancelEdit();
}
</script>

<style scoped>
.sensitive-word-manager {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.manager-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.manager-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  max-height: 80vh;
  background-color: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.manager-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

.manager-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.manager-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.add-btn {
  padding: 8px 16px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background-color: #5a67d8;
}

.count-info {
  font-size: 13px;
  color: #999;
}

.manager-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.manager-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  background-color: #fafafa;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.item-word {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.item-category {
  font-size: 12px;
  color: #667eea;
  margin-left: 8px;
}

.item-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.action-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.edit {
  background: none;
  border: 1px solid #667eea;
  color: #667eea;
}

.action-btn.edit:hover {
  background-color: #667eea;
  color: white;
}

.action-btn.delete {
  background: none;
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
}

.action-btn.delete:hover {
  background-color: #ff4d4f;
  color: white;
}

.edit-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
}

.dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
}

.dialog-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 480px;
  background-color: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.dialog-body {
  padding: 20px;
}

.form-item {
  margin-bottom: 16px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.required {
  color: #ff4d4f;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #667eea;
}

.form-input.small {
  width: 120px;
}

.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  background-color: white;
  cursor: pointer;
}

.form-select:focus {
  border-color: #667eea;
}

.input-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.cancel {
  background: none;
  border: 1px solid #e0e0e0;
  color: #666;
}

.btn.cancel:hover {
  border-color: #999;
}

.btn.confirm {
  background-color: #667eea;
  border: none;
  color: white;
}

.btn.confirm:hover:not(:disabled) {
  background-color: #5a67d8;
}

.btn.confirm:disabled {
  background-color: #c0c0c0;
  cursor: not-allowed;
}
</style>
