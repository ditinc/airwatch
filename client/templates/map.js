/* LUtil is inspired by leaflet-demo (https://github.com/MeteorHudsonValley/leaflet-demo) */
/* globals window, L, $, Blaze, Template, Meteor, _, ReactiveVar, moment */
/* globals AirQualityIndexes, StatesData */
(function () {
  window.LUtil = {
    // reference to the single 'map' object to control
    map: null,
    geojson: null,
    details: null,
    currentSelectedState: null,
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

    resetMap() {
      $('.airQuality-detail').html('');
      $('.airQuality-detail').scrollTop();
      $('.airQuality-detail').hide();

      window.LUtil.detMinMax = 1;
      $('#detMinMaxSpan').removeClass('glyphicon glyphicon-plus');
      $('#detMinMaxSpan').addClass('glyphicon glyphicon-minus');
      $('.airQuality-detail').css({ 'height': '250px' });
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
      const stateSelector = L.control({ position: 'topright' });
      stateSelector.onAdd = self.onAddHandler('info', '<div id="airQualityStateSelector"></div>');
      stateSelector.addTo(this.map);
      $('#airQualityForm').appendTo('#airQualityStateSelector').show();

      self.details = L.control({ position: 'bottomright' });
      self.details.onAdd = self.onAddHandler('info airQuality-detail', '');
      self.details.update = function(props) {
        const myself = this;
        if (props) {
          Blaze.renderWithData(Template.airQualityDetails, props, this._div);
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

      if (window.LUtil.currentSelectedState !== null) {
        window.LUtil.currentSelectedState.setStyle({
          fillColor: 'white',
        });
        window.LUtil.currentSelectedState = null;
      }

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
      return AirQualityIndexes.latest(template.filter.get(), template.limit.get());
    },

    'click #affordanceOpen'() {
      $('#mapSplashModal').modal('show');
    },

    'click #filMinMax'() {
      if (window.LUtil.filMinMax === 0) {
        window.LUtil.filMinMax = 1;
        $('#airQualityForm').show();
        $('#filMinMaxSpan').removeClass('glyphicon glyphicon-plus');
        $('#filMinMaxSpan').addClass('glyphicon glyphicon-minus');
      } else if (window.LUtil.filMinMax === 1) {
        window.LUtil.filMinMax = 0;
        $('#airQualityForm').hide();
        $('#filMinMaxSpan').removeClass('glyphicon glyphicon-minus');
        $('#filMinMaxSpan').addClass('glyphicon glyphicon-plus');
      }
    },
  });

  Template.map.helpers({
    airQualitys() {
      return Template.instance().airQualitys();
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
      self.subscription = self.subscribe('LatestAirQualityIndexes', self.filter.get(), self.limit.get());
      if (self.subscription.ready()) {
        $('.airQuality-detail').hide();
      }
    });
    self.airQualities = function() {
      if (self.subscription.ready()) {
        return AirQualityIndexes.latest(self.filter.get(), self.limit.get());
      }
      return false;
    };
  };

  Template.map.rendered = function() {
    window.LUtil.initMap();
    $('#stateSelector').val('');
    $('.airQuality-detail').hide();
    $('#stateSelector').select2({
      placeholder: 'Filter by State',
      allowClear: true,
    });

    if (window.screen.width < 800) {
      $('#forkMe').hide();
    }

    Blaze.render(Template.mapSplashModal, $('<div>').appendTo('body').get(0));
  };
})();
