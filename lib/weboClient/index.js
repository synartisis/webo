let socket
connect()

const sections = ['config', 'files', 'build', 'raw']

const vm = new Vue({
  el: '#app',
  data: {
    sections,
    activeSection: null,
    data: null,
    filter: null,
    projectData: null,
    log: '',
  },

  methods: {
    selectSection: function(section) {
      this.activeSection = section
      loadSection(section)
    },
    filtered: function() {
      if (!this.data) return null
      return this.data
        .filter(o => this.filter.html || o.ext !== 'html')
        .filter(o => this.filter.js || o.ext !== 'js')
        .filter(o => this.filter.css || o.ext !== 'css')
        .filter(o => this.filter.other || ['html', 'js', 'css'].includes(o.ext))
        .filter(o => !this.filter.path || o.path.includes(this.filter.path))
        .filter(o => !this.filter.token || JSON.stringify(o).includes(this.filter.token))
    },
    resetFilter: function() {
      this.filter = { path: null, token: null, html: true, js: true, css: true, other: false, }
    },
  },

  mounted() {
    this.resetFilter()
    setTimeout(() => this.selectSection(sections[0]))
  },

})


function loadSection(section) {
  if (vm) vm.data = null
  switch (section) {
    case 'config':
      fetch('/webo/api/config').then(o => o.json())
      .then(json => {
        vm.data = json
        vm.projectData = { context: json.context, fileCount: json.fileCount }
      })
      break;
    case 'files':
      fetch('/webo/api/files').then(o => o.json()).then(json => vm.data = json)
      break;
    case 'raw':
      fetch('/webo/api').then(o => o.json()).then(json => vm.data = json)
      break;
  }
}


let logDiv
function connect() {
  socket = new WebSocket('ws://' + location.hostname + ':3737/webo/')
  socket.onclose = () => setTimeout(connect, 3000)

  socket.onmessage = event => {    
    const { action, data } = JSON.parse(event.data)
    if (action === 'log') {
      if (!logDiv) logDiv = document.querySelector('#build .screen-scroll')
      vm.log += data
      logDiv.scrollTop = logDiv.scrollHeight
    }
  }
}










function build() {
  fetch('/webo/build')//.then(o => o.json()).then(json => document.querySelector('#out').textContent += '\n' + JSON.stringify(json, null, 2))
}
