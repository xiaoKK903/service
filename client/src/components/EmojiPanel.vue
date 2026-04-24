<template>
  <div class="emoji-panel">
    <div class="emoji-categories">
      <div 
        v-for="category in emojiCategories" 
        :key="category.id"
        class="category-tab"
        :class="{ active: activeCategory === category.id }"
        @click="activeCategory = category.id"
        :title="category.name"
      >
        {{ category.icon }}
      </div>
    </div>
    
    <div class="emoji-grid">
      <div 
        v-for="emoji in activeEmojis" 
        :key="emoji.code + emoji.name"
        class="emoji-item"
        @click="handleEmojiClick(emoji)"
        :title="emoji.name"
      >
        <span class="emoji-code">{{ emoji.code }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { emojiCategories } from '../data/emojis';

const emit = defineEmits(['select']);

const activeCategory = ref(emojiCategories[0]?.id || 'smileys');

const activeEmojis = computed(() => {
  const category = emojiCategories.find(c => c.id === activeCategory.value);
  return category?.emojis || [];
});

function handleEmojiClick(emoji) {
  emit('select', emoji);
}
</script>

<style scoped>
.emoji-panel {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 300px;
  background-color: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.emoji-categories {
  display: flex;
  justify-content: center;
  gap: 2px;
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  background-color: white;
  border-radius: 8px 8px 0 0;
}

.category-tab {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  background-color: transparent;
}

.category-tab:hover {
  background-color: #f0f0f0;
}

.category-tab.active {
  background-color: #667eea;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.emoji-grid {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  align-content: start;
  max-height: 200px;
}

.emoji-item {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
  background-color: white;
  border: 1px solid transparent;
}

.emoji-item:hover {
  background-color: #f0f4ff;
  border-color: #667eea;
  transform: scale(1.1);
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.2);
}

.emoji-code {
  font-size: 20px;
  line-height: 1;
}
</style>
