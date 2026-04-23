<template>
  <div class="quick-reply-manager" v-if="visible">
    <div class="manager-overlay" @click="handleClose"></div>
    
    <div class="manager-content">
      <div class="manager-header">
        <span class="manager-title">快捷短语管理</span>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      
      <div class="manager-body">
        <div class="manager-toolbar">
          <button class="add-btn" @click="handleAdd">
            + 新增短语
          </button>
        </div>
        
        <div class="manager-list">
          <div v-if="quickReplies.length === 0" class="empty-state">
            暂无快捷短语，请点击"新增短语"添加
          </div>
          
          <div 
            v-for="item in quickReplies" 
            :key="item.id"
            class="manager-item"
          >
            <div class="item-info">
              <span class="item-keyword">[{{ item.keyword }}]</span>
              <span class="item-content">{{ item.content }}</span>
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
          <span class="dialog-title">{{ isEditMode ? '编辑短语' : '新增短语' }}</span>
          <button class="close-btn" @click="cancelEdit">×</button>
        </div>
        
        <div class="dialog-body">
          <div class="form-item">
            <label class="form-label">关键词</label>
            <input 
              type="text"
              v-model="editForm.keyword"
              placeholder="输入关键词，如：问候、再见"
              class="form-input"
              maxlength="20"
            />
          </div>
          
          <div class="form-item">
            <label class="form-label">回复内容</label>
            <textarea 
              v-model="editForm.content"
              placeholder="输入回复内容"
              class="form-textarea"
              maxlength="500"
              rows="4"
            ></textarea>
            <div class="char-count">{{ editForm.content.length }}/500</div>
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
import { ref, computed, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  quickReplies: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'create', 'update', 'delete']);

const editingItem = ref(null);
const isEditMode = ref(false);

const defaultForm = {
  id: null,
  keyword: '',
  content: '',
  sortOrder: 0
};

const editForm = ref({ ...defaultForm });

const canSave = computed(() => {
  return editForm.value.keyword.trim() && editForm.value.content.trim();
});

watch(() => props.visible, (val) => {
  if (val) {
    editingItem.value = null;
    resetForm();
  }
});

function resetForm() {
  editForm.value = { ...defaultForm };
}

function handleClose() {
  emit('close');
}

function handleAdd() {
  isEditMode.value = false;
  editingItem.value = { ...defaultForm };
  resetForm();
  editForm.value.sortOrder = props.quickReplies.length;
}

function handleEdit(item) {
  isEditMode.value = true;
  editingItem.value = { ...item };
  editForm.value = {
    id: item.id,
    keyword: item.keyword,
    content: item.content,
    sortOrder: item.sortOrder
  };
}

function handleDelete(item) {
  if (confirm(`确定要删除快捷短语"${item.keyword}"吗？`)) {
    emit('delete', item.id);
  }
}

function cancelEdit() {
  editingItem.value = null;
  resetForm();
}

function saveEdit() {
  if (!canSave.value) return;
  
  const data = {
    keyword: editForm.value.keyword.trim(),
    content: editForm.value.content.trim(),
    sortOrder: editForm.value.sortOrder || 0
  };
  
  if (isEditMode.value) {
    emit('update', { id: editForm.value.id, ...data });
  } else {
    emit('create', data);
  }
  
  cancelEdit();
}
</script>

<style scoped>
.quick-reply-manager {
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
}

.item-keyword {
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
  margin-right: 8px;
}

.item-content {
  font-size: 14px;
  color: #333;
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

.form-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
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

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  resize: none;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: #667eea;
}

.char-count {
  text-align: right;
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
