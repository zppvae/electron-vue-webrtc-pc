<template>
<!-- 呼叫速率 -->
  <div class="definitionPage">
    <div class="sidebar-left">
      <span>选择呼叫速率</span>
      <el-select v-model="resolution" placeholder="请选择呼叫速率" @change="setResolution">
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.name"
          :value="item.value">
        </el-option>
      </el-select>
    </div>
    
  </div>
</template>

<script>
export default {
  name: "definitionPage",
  data() {
    return {
      options: [{
          value: '256',
          label: '256kbps',
          name: '初级清晰度'
        }, {
          value: '576',
          label: '576kbps',
          name: '标准清晰度'
        }, {
          value: '1264',
          label: '1264kbps',
          name: '高级清晰度'
        }, {
          value: '2464',
          label: '2464kbps',
          name: '超高清晰度'
        }],
        resolution: '576'
    }
  },
  methods: {
    setResolution() {
      console.log('setResolution====>', this.resolution)
      this.$store.commit("setResolution",this.resolution);
    }
  }
};
</script>

<style scoped>
  
</style>