<template>
  <span :contenteditable="editable" class="tableValue" :class="[...customClass, { editable }]" @input="onInput" @blur="onBlur">{{
    modelValue
  }}</span>
</template>

<script setup>
import { ref, watch } from 'vue';
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: [String, Number],
  editable: Boolean,
  customClass: Array
});

const emit = defineEmits(['update:modelValue']);

const localValue = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newVal) => {
    localValue.value = newVal;
  }
);

const onInput = (event) => {
  localValue.value = event.target.innerText;
  emit('update:modelValue', localValue.value);
};

const onBlur = () => {
  emit('update:modelValue', localValue.value);
};
</script>

<style scoped>
/* Add your custom styles here */
.editable {
  background-color: #f9f9f9;
}
.selected {
  background-color: rgba(var(--v-theme-primary), var(--v-activated-opacity));
}
.tableValue {
  height: 34px;
}
</style>
