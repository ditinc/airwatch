/* LUtil is inspired by leaflet-demo (https://github.com/MeteorHudsonValley/leaflet-demo) */
/* globals window, L, $, Blaze, Template, Meteor, _, ReactiveVar, moment */
/* globals FoodRecalls, StatesData */
(function () {
  window.LUtil = {
    // reference to the single 'map' object to control
    map: null,
    geojson: null,
    details: null,
    currentOrigin: null,
    currentSelectedState: null,
    lines: [],
    currentDestinations: [],
    originMarker: null,
    detMinMax: 1,
    filMinMax: 1,
    // location of marker images
    imagePath: 'packages/bevanhunt_leaflet/images',
    // init function to be called ONCE on startup
    initLeaflet() {
      $(window).resize(function() {
        $('#map').css('height', window.innerHeight);
      });
      $(window).resize(); // trigger resize event
    },

    // (element=div to populate, view=latlong for center)
    initMap(element = 'map', view = {}) {
      const self = this;
      L.Icon.Default.imagePath = self.imagePath;
      view.zoom = view.zoom || 5;
      view.latlong = view.latlong || [37.8, -92];
      const baseLayer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href=\'http://www.openstreetmap.org/copyright\'>OpenStreetMap</a>',
        maxZoom: 19,
      });

      this.map = L.map(element, {
        zoomControl: false,
        layers: [baseLayer],
      })
      .setView(
        view.latlong,
        view.zoom
      );

      self.geojson = L.geoJson(StatesData, {
        style: this.styleDefault,
        onEachFeature: this.onEachFeature,
      }).addTo(this.map);

      this.addControls();
    },

    highlightOrigin(state) {
      const self = this;
      for (const key in self.geojson._layers) {
        if (self.geojson._layers.hasOwnProperty(key)) {
          if (self.geojson._layers[key].feature.properties.abbreviation === state) {
            self.currentOrigin = self.geojson._layers[key];
            self.geojson._layers[key].setStyle({
              weight: 2,
              opacity: 1,
              color: 'black',
              dashArray: '',
              fillOpacity: 0.6,
              fillColor: 'blue',
            });
          }
        }
      }
    },

    resetMap() {
      $('.recall-detail').html('');
      $('.recall-detail').scrollTop();
      $('.recall-detail').hide();
      const self = this;
      if (self.currentDestinations.length !== 0) {
        for (const state in self.currentDestinations) {
          if (self.currentOrigin !== self.currentDestinations[state]) {
            self.geojson.resetStyle(self.currentDestinations[state]);
          }
        }
      }

      _.each(self.lines, function(line) {
        self.map.removeLayer(self.lines[line]);
      });

      self.lines = [];

      self.currentDestinations = [];

      if (self.originMarker !== null) {
        self.map.removeLayer(self.originMarker);
      }

      if (self.currentOrigin !== null) {
        self.geojson.resetStyle(self.currentOrigin);
      }

      window.LUtil.detMinMax = 1;
      $('#detMinMaxSpan').removeClass('glyphicon glyphicon-plus');
      $('#detMinMaxSpan').addClass('glyphicon glyphicon-minus');
      $('.recall-detail').css({ 'height': '250px' });
    },

    markOrigin(city, state, mfg) {
      const self = this;
      if (city === null || state === null) {
        return;
      }

      $.getJSON('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + city + ' ' + state + ' USA ', function(data) {
        const latlon = [data[0].lat, data[0].lon];
        self.originMarker = L.marker(latlon).addTo(self.map);
        self.originMarker.bindPopup('<b>' + mfg + '</b><br />' + city + ', ' + state).openPopup();
      });
    },

    highlightDestination(states) {
      const self = this;
      const parsedStates = this.parseStates(states);
      for (let st = 0; st < parsedStates.length; st++) {
        for (const key in self.geojson._layers) {
          if (self.geojson._layers.hasOwnProperty(key)) {
            if (self.geojson._layers[key].feature.properties.abbreviation === parsedStates[st]) {
              self.currentDestinations.push(self.geojson._layers[key]);
              let fillColor = 'red';
              let fillOpacity = 0.2;
              if (self.currentOrigin === self.geojson._layers[key]) {
                fillColor = 'purple';
                fillOpacity = 0.4;
              }
              self.geojson._layers[key].setStyle({
                weight: 2,
                opacity: 1,
                color: 'black',
                fillOpacity,
                fillColor,
              });
            }
          }
        }
      }
    },

    getStateName(stateAbbr) {
      for (let j = 0; j < StatesData.features.length; j++) {
        if (StatesData.features[j].properties.abbreviation === stateAbbr) {
          return StatesData.features[j].properties.name;
        }
      }
      return null;
    },

    parseStates(states) {
      const parsedStates = [];
      const acceptedDelimiters = [' ', ',', '', '(', ')', '&', '.'];
      let nationwide = false;

      // TODO: accept 'US'
      if (states.toLowerCase().indexOf('nationwide') >= 0) {
        nationwide = true;
      }

      for (let j = 0; j < StatesData.features.length; j++) {
        if (nationwide || states.indexOf(StatesData.features[j].properties.name) >= 0) {
          parsedStates.push(StatesData.features[j].properties.abbreviation);
          continue;
        }
        for (let k = 0; k < states.length; k++) {
          const parsingAbbr = states.substring(k, k + 2);
          if (StatesData.features[j].properties.abbreviation === parsingAbbr) {
            if (acceptedDelimiters.indexOf(states.substring(k - 1, k)) >= 0 &&
                acceptedDelimiters.indexOf(states.substring(k + 2, k + 3)) >= 0) {
              parsedStates.push(StatesData.features[j].properties.abbreviation);
            }
          }
        }
      }
      return parsedStates;
    },

    onEachFeature(feature, layer) {
      layer.on({
        click() {
          if (window.LUtil.currentSelectedState !== null) {
            window.LUtil.currentSelectedState.setStyle({
              fillColor: 'white',
            });
          }
          layer.setStyle({
            fillColor: 'yellow',
          });
          $('#stateSelector').select2('val', feature.properties.abbreviation);
          window.LUtil.currentSelectedState = layer;
        },
      });
    },

    styleDefault() {
      return {
        weight: 2,
        opacity: 5,
        color: 'black',
        dashArray: '',
        fillOpacity: 0.1,
        fillColor: 'white',
      };
    },

    // register event handlers
    handleEvent(event, callback) {
      if (!event || !callback) {
        return;
      }
      // TODO: validate event and callback
      this.map.on(event, callback);
    },

    // remove layer
    removeLayer(layer) {
      this.map.removeLayer(layer);
    },

    addLayer(layer) {
      this.map.addLayer(layer);
    },

    addTileLayer(_layer, _obj = '') {
      L.tileLayer(_layer, _obj)
        .addTo(this.map);
    },

    onAddHandler(selector, html) {
      return function() {
        this._div = L.DomUtil.create('div', selector);
        this._div.innerHTML = html;
        L.DomEvent.disableClickPropagation(this._div);
        L.DomEvent.disableScrollPropagation(this._div);
        return this._div;
      };
    },

    onAddHandlerWithTemplate(selector, template) {
      return function() {
        this._div = L.DomUtil.create('div', selector);
        Blaze.render(template, this._div);
        L.DomEvent.disableClickPropagation(this._div);
        return this._div;
      };
    },

    addControls() {
      const self = this;
      // TODO: switch this to onAddHandlerWithTemplate and move the HTML
      // into a Meteor Blaze template
      const recallSelector = L.control({ position: 'topright' });
      recallSelector.onAdd = self.onAddHandler('info', '<b>  Recall Filtering </b><a href="#" id="filMinMax" class="pull-left"><span id="filMinMaxSpan" class="glyphicon glyphicon-minus"></span></a> <div id="recallSelector"></div>');
      recallSelector.addTo(this.map);
      $('#latestFoodRecallForm').appendTo('#recallSelector').show();

      self.details = L.control({ position: 'bottomright' });
      self.details.onAdd = self.onAddHandler('info recall-detail', '');
      self.details.update = function(props) {
        const myself = this;
        if (props) {
          Blaze.renderWithData(Template.mapRecallDetails, props, this._div);
        } else {
          myself.hide();
        }
      };
      self.details.addTo(self.map);

      const logo = L.control({ position: 'topleft' });
      logo.onAdd = self.onAddHandlerWithTemplate('logo', Template.mapLabel);
      logo.addTo(self.map);
    },

    getCrit(state, reasonFilter) {
      const stateName = this.getStateName(state);
      return { $and: [
                    { $or: [
                          { state },
                          { state: stateName },
                          { distribution_pattern: { $regex: '.*' + state + '.*' } },
                          { distribution_pattern: { $regex: '.*' + stateName + '.*' } },
                          { distribution_pattern: { $regex: '.*nationwide.*' } },
                    ] },
                    { reason_for_recall: { $regex: reasonFilter, $options: 'i' } }] };
    },
  };

  Template.map.events({
    'change #stateSelector'(event) {
      window.LUtil.resetMap();
      const state = $(event.currentTarget).val();
      const template = Template.instance();
      const reasonFilter = $('#latestFoodRecallReasonFilter').val();

      if (window.LUtil.currentSelectedState !== null) {
        window.LUtil.currentSelectedState.setStyle({
          fillColor: 'white',
        });
        window.LUtil.currentSelectedState = null;
      }

      if (state === null) {
        template.filter.set({ reason_for_recall: { $regex: reasonFilter, $options: 'i' } });
        return FoodRecalls.latest(template.filter.get(), template.limit.get());
      }
      template.filter.set(window.LUtil.getCrit(state, reasonFilter));

      // TODO: check recallsByState and verify elements meet inclusion criteria req.
      template.subscription = template.subscribe('LatestFoodRecalls', template.filter.get(), template.limit.get());

      $('#latestFoodRecalls').select2('data', { id: '', text: 'select a recall' });

      for (const key in window.LUtil.geojson._layers) {
        if (window.LUtil.geojson._layers.hasOwnProperty(key)) {
          if (window.LUtil.geojson._layers[key].feature.properties.abbreviation === state) {
            window.LUtil.currentSelectedState = window.LUtil.geojson._layers[key];
            window.LUtil.geojson._layers[key].setStyle({
              fillColor: 'yellow',
            });
          }
        }
      }
      return FoodRecalls.latest(template.filter.get(), template.limit.get());
    },

    'change #latestFoodRecalls'() {
      window.LUtil.resetMap();

      if (window.LUtil.currentSelectedState !== null) {
        window.LUtil.currentSelectedState.setStyle({
          fillColor: 'yellow',
        });
      }

      const val = $('#latestFoodRecalls').select2('val');

      if (_.isUndefined(val) || _.isEmpty(val)) {
        return;
      }

      const self = Template.instance();
      const fr = self.latestFoodRecalls().fetch();
      let originState = null;
      let originCity = null;
      let mfg = null;
      let destinationStates = null;

      for (let i = 0; i < fr.length; i++) {
        if (fr[i].recall_number === val) {
          window.LUtil.details.update(fr[i]);
          originState = fr[i].state;
          originCity = fr[i].city;
          mfg = fr[i].recalling_firm;
          destinationStates = fr[i].distribution_pattern;
        }
      }

      window.LUtil.markOrigin(originCity, originState, mfg);

      for (let j = 0; j < StatesData.features.length; j++) {
        if (StatesData.features[j].properties.abbreviation === originState) {
          window.LUtil.highlightOrigin(originState);
          window.LUtil.highlightDestination(destinationStates);
        }
      }
      $('.recall-detail').show();
    },

    'change #latestFoodRecallLimit'() {
      const template = Template.instance();
      const reasonFilter = $('#latestFoodRecallReasonFilter').val();
      const limit = parseInt($('#latestFoodRecallLimit').val(), 10);
      template.limit.set(limit, 10);
      const state = $('#stateSelector').val();
      if (state === null) {
        template.filter.set({ reason_for_recall: { $regex: reasonFilter, $options: 'i' } });
      } else {
        template.filter.set(window.LUtil.getCrit(state, reasonFilter));
      }
    },

    'click #affordanceOpen'() {
      $('#mapSplashModal').modal('show');
    },

    'click #filMinMax'() {
      if (window.LUtil.filMinMax === 0) {
        window.LUtil.filMinMax = 1;
        $('#latestFoodRecallForm').show();
        $('#filMinMaxSpan').removeClass('glyphicon glyphicon-plus');
        $('#filMinMaxSpan').addClass('glyphicon glyphicon-minus');
      } else if (window.LUtil.filMinMax === 1) {
        window.LUtil.filMinMax = 0;
        $('#latestFoodRecallForm').hide();
        $('#filMinMaxSpan').removeClass('glyphicon glyphicon-minus');
        $('#filMinMaxSpan').addClass('glyphicon glyphicon-plus');
      }
    },

    'click #applyFilter'() {
      const template = Template.instance();
      const reasonFilter = $('#latestFoodRecallReasonFilter').val();
      const limit = parseInt($('#latestFoodRecallLimit').val(), 10);

      // set the reactive var with updated filter, this.autorun within the
      // create method will re-run the subscription with the new value every
      // time this changes.
      const state = $('#stateSelector').val();

      if (state === null) {
        template.filter.set({ reason_for_recall: { $regex: reasonFilter, $options: 'i' } });
      } else {
        template.filter.set(window.LUtil.getCrit(state, reasonFilter));
      }

      template.limit.set(limit);
    },
  });

  Template.map.helpers({
    latestFoodRecalls() {
      return Template.instance().latestFoodRecalls();
    },

    StatesData() {
      return Object.keys(StatesData).map(function(k) { return StatesData[k]; })[1];
    },

    formatDate(reportDate) {
      return moment(reportDate, 'YYYYMMDD').format('M/DD/YYYY');
    },
  });

  Template.map.created = function() {
    const self = Template.instance();
    self.filter = new ReactiveVar({});
    self.limit = new ReactiveVar(10);
    this.autorun(function () {
      // TODO: show loading indicator.
      self.subscription = self.subscribe('LatestFoodRecalls', self.filter.get(), self.limit.get());
      if (self.subscription.ready()) {
        // reset the select2 interface and hide the details
        $('#latestFoodRecalls').select2({
          placeholder: 'Select a Recall',
          allowClear: true,
        });
        $('.recall-detail').hide();
      }
    });
    self.latestFoodRecalls = function() {
      if (self.subscription.ready()) {
        return FoodRecalls.latest(self.filter.get(), self.limit.get());
      }
      return false;
    };
  };

  Template.map.rendered = function() {
    window.LUtil.initMap();
    $('#stateSelector').val('');
    $('#latestFoodRecalls').val('');
    $('#latestFoodRecalls').select2({
      placeholder: 'Select a Recall',
      allowClear: true,
    });
    $('.recall-detail').hide();
    $('#stateSelector').select2({
      placeholder: 'Filter by State',
      allowClear: true,
    });

    $('#latestFoodRecallLimit').select2();

    if (window.screen.width < 800) {
      $('#forkMe').hide();
    }

    Blaze.render(Template.mapSplashModal, $('<div>').appendTo('body').get(0));
  };
})();
