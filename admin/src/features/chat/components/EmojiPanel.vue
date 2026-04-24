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
  width: 320px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
}

.emoji-categories {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  background-color: white;
}

.category-tab {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
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
}

.emoji-item {
  width: 34px;
  height: 34px;
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
  font-size: 22px;
  line-height: 1;
}
</style>
