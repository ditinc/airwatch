/* globals _, moment, Meteor, console, async */
/* globals AirQualityIndexes */
/* jshint curly:false */
(function() {
  Meteor.methods({

    /**
     *  The endpoint is built from the search template.  This is
     *  the actual URL sent to the remote API.
     *  @param options - The object that contains the url parameters.
     *  @param options.search string - the search template.
     */
    buildEndpointTmpl() {
      const url = 'http://www.airnowapi.org/aq/data/?startDate=<%obj.startDate%>&endDate=<%obj.endDate%>&parameters=PM25&BBOX=-124.205070,28.716781,-75.337882,45.419415&dataType=A&format=application/json&verbose=0&API_KEY=50A21A36-4F81-44F5-A331-C91522E6116C';
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
      if (AirQualityIndexes.find({}).count() > 0) {
        return [];
      }
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
     * After the server is running, periodically poll the remote API for new data.
     */
    pollAirQualityIndexes() {
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
          upserts.push(AirQualityIndexes.upsert({ lat: aqi.Latitude, lon: aqi.Longitude }, aqi));
        });
      }
      return upserts;
    },
  });

  /**
   * Called upon initial server warm-up
   */
  Meteor.startup(function() {
    async.auto({
      getInitialAirQualityIndexes(callback) {
        const upserts = Meteor.call('getInitialAirQualityIndexes');
        callback(null, upserts);
      },
    }, function(err) {
      console.log(err);
    });
  });
})();
