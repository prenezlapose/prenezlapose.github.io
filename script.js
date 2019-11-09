const API_URL = 'https://script.google.com/macros/s/AKfycbwGJvCirCcMUYgTXRktFx5nx5rACK0jmB7ONktmV0kYa3NZ40w/exec';

var appData = {
  page: null,
  lastPage: null,
  error: false,
  gifs: [],
  cachedGifs: {}
}

var app = new Vue({
  el: '#app',
  data: function() {
    return appData;
  },
  watch: {
    page: async function() {
      this.gifs = [];

      if(this.page in this.cachedGifs) {
        if(this.cachedGifs[this.page].caching) {
          await this.cachedGifs[this.page].caching;
        }
        this.gifs = this.cachedGifs[this.page];
      } else {
        // Await result to avoid caching pages at the same time
        await this.fetchGifs(this.page).then(data => {
          this.gifs = data.gifs;
        }).catch(err => 
          this.error = true
        );
      }

      // Cache previous and next page
      this.cachePage(this.previousPage);
      this.cachePage(this.nextPage);
    }
  },
  computed: {
    previousPage: function() {
      return (this.page > 1) ? (this.page - 1) : null;
    },
    nextPage: function() {
      return (this.page < this.lastPage) ? (this.page + 1) : null;
    }
  },
  mounted: setURL,
  methods: {
    pageURL: value => value ? '#page' + value : '#',
    cachePage: function(page) {
      if(page && !(page in this.cachedGifs)) {
        this.cachedGifs[page] = {
          caching: this.fetchGifs(page)
        };
      }
    },
    fetchGifs: function(page) {
      return new Promise((resolve, reject) => {
        axios.get(API_URL, { 
          params: {
            action: "gifs",
            page: page
          }
        }).then(res => {
          if(res.status == 200 && !res.error) {
            this.lastPage = res.data.lastPage;
            // cache
            this.cachedGifs[res.data.page] = res.data.gifs;

            resolve(res.data);
          } else {
            reject();
          }
        }).catch(reject);
      });
    }
  }
});

function setURL() {
  var anchor = window.location.hash.substr(1);

  if(anchor.indexOf('page') == 0) {
    appData.page = parseInt(anchor.substr(4));
  } else {
    appData.page = 1;
  }

  if(appData.lastPage == null) {
    appData.lastPage = appData.page;
  }

  window.scrollTo(0,0);
}

window.onhashchange = setURL;