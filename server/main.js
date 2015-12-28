/* globals _, moment, Meteor, async */
/* globals AirQualityIndexes */
/* jshint curly:false */
(function() {
  Meteor.methods({
    getErrors() {
      return Meteor.errs;
    },
    /**
     *  The endpoint is built from the search template.  This is
     *  the actual URL sent to the remote API.
     *  @param options - The object that contains the url parameters.
     *  @param options.search string - the search template.
     */
    buildEndpointTmpl() {
      const url = 'http://www.airnowapi.org/aq/data/?startDate=<%obj.startDate%>&endDate=<%obj.endDate%>&parameters=PM25&BBOX=-179.999,-66.987172,84.795532,83.699551&dataType=A&format=application/json&verbose=0&API_KEY=50A21A36-4F81-44F5-A331-C91522E6116C';
      return _.template(url);
    },

    buildEndpoint(options) {
      return Meteor.call('buildEndpointTmpl')(options);
    },

    /**
     * During server startup this method is called to check if the mongodb has any
     * existing records.  If not, call the remote API to fetch new data.
     */
    getInitialAirQualityIndexes() {
      const dateFormat = 'YYYY-MM-DDTHH';
      const today = moment();
      const searchOptions = {
        startDate: today.format(dateFormat),
        endDate: today.format(dateFormat),
      };

      const endpoint = Meteor.call('buildEndpoint', searchOptions);
      return Meteor.call('fetchAsyncResponse', endpoint);
    },

    /**
     * Fetch the data asynchronously using HTTP GET.
     */
    fetchAsyncResponse(endpoint) {
      this.unblock();
      let response;
      try {
        response = Meteor.http.get(endpoint);
      } catch (err) {
        // no results found
        response = { data: { results: [] } };
      }
      return Meteor.call('saveResults', response.data);
    },
    /**
     * Upsert the JSON response documents into the mongodb
     */
    saveResults(response) {
      const upserts = [];
      if (response.length > 0) {
        _.each(response, function(aqi) {
          if (aqi.Latitude === undefined || aqi.Longitude === undefined) {
            return;
          }
          if (aqi.Category < 1 || aqi.Category > 6) {
            return;
          }
          const existingAqi = AirQualityIndexes.findOne({ 'Latitude': aqi.Latitude, Longitude: aqi.Longitude });
          if (existingAqi !== undefined) {
            let canUpsert = false;
            if (existingAqi.AQI !== aqi.AQI || existingAqi.Category !== aqi.Category || existingAqi.UTC !== aqi.UTC) {
              canUpsert = true;
            }
            if (canUpsert) {
              upserts.push(AirQualityIndexes.upsert({ Latitude: aqi.Latitude, Longitude: aqi.Longitude }, aqi));
            }
          } else {
            upserts.push(AirQualityIndexes.upsert({ Latitude: aqi.Latitude, Longitude: aqi.Longitude }, aqi));
          }
        });
      }
      return upserts;
    },
  });

  Meteor.setInterval(function() {
    async.auto({
      getInitialAirQualityIndexes(callback) {
        const upserts = Meteor.call('getInitialAirQualityIndexes');
        callback(null, upserts);
        Meteor.errs = undefined;
      },
    }, function(err) {
      Meteor.err = err;
    });
  }, Meteor.settings.POLL_TIMER_SECONDS * 1000);

  /**
   * Called upon initial server warm-up
   */
  Meteor.startup(function() {
    async.auto({
      getInitialAirQualityIndexes(callback) {
        const upserts = Meteor.call('getInitialAirQualityIndexes');
        callback(null, upserts);
        Meteor.errs = undefined;
      },
    }, function(err) {
      Meteor.err = err;
    });
  });
})();
