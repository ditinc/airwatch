/* globals _, moment, Meteor, console, async */
/* globals StateAirQualities */
/* jshint curly:false */
(function() {
  Meteor.methods({
    /**
     *  The search field is used to search records by report_date AND (optionally)
     *  status.
     *  @param options - The object that contains the search parameters.
     *  @param options.from string - YYMMDD the beginning date
     *  @param options.to string - YYMMDD the ending date
     *  @param options.status string - the current status, 'Ongoing', 'Completed',
     *  'Terminated', and 'Pending'
     */
    buildSearchTmpl(options) {
      // status is optional
      if (_.has(options, 'status')) {
        return _.template('search=report_date:[<%=obj.from%>+TO+<%=obj.to%>]+AND+status:<%=obj.status%>');
      }
      return _.template('search=report_date:[<%=obj.from%>+TO+<%=obj.to%>]');
    },

    buildSearch(options) {
      return Meteor.call('buildSearchTmpl', options)(options);
    },

    /**
     *  The endpoint is built from the search template and the limit.  This is
     *  the actual URL sent to the remote API.
     *  @param options - The object that contains the url parameters.
     *  @param options.search string - the search template.
     *  @param options.limit string - the amount of records that the results will
     *  be limited.
     */
    buildEndpointTmpl() {
      return _.template('https://' + 'api.' + 'fda.' + 'gov' + '/food' + '/enforcement.json' + '?<%=obj.search%>&limit=<%=obj.limit%>');
    },

    buildEndpoint(options) {
      return Meteor.call('buildEndpointTmpl')(options);
    },

    /**
     * During server startup this method is called to check if the mongodb has any
     * existing records.  If not, call the remote API to fetch the last 100
     * records, searching by record_date.
     */
    getInitialStateAirQualities() {
      if (StateAirQualities.find({}).count() > 0) {
        return [];
      }
      const dateFormat = 'YYYYMMDD';
      const daysAgo = moment().subtract(Meteor.settings.INITIAL_DAYS_TO_LOAD, 'days');
      const today = moment();
      const searchOptions = {
        from: daysAgo.format(dateFormat),
        to: today.format(dateFormat),
      };
      const search = Meteor.call('buildSearch', searchOptions);
      const endpointOptions = {
        search,
        limit: 100,
      };
      const endpoint = Meteor.call('buildEndpoint', endpointOptions);
      return Meteor.call('fetchAsyncResponse', endpoint);
    },

    /**
     * After the server is running, periodically poll the remote API for new data.
     */
    pollStateAirQualities() {
      const dateFormat = 'YYYYMMDD';
      const daysAgo = moment().subtract(1, 'days');
      const today = moment();
      const searchOptions = {
        from: daysAgo.format(dateFormat),
        to: today.format(dateFormat),
      };
      const search = Meteor.call('buildSearch', searchOptions);
      const endpointOptions = {
        search,
        limit: 25,
      };
      const endpoint = Meteor.call('buildEndpoint', endpointOptions);
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
      return Meteor.call('saveResults', response);
    },
    /**
     * Upsert the JSON response documents into the mongodb
     */
    saveResults(response) {
      const upserts = [];
      if (response.data.results.length > 0) {
        _.each(response.data.results, function(stateAirQuality) {
          upserts.push(StateAirQualities.upsert({ stateCode: stateAirQuality.stateCode }, stateAirQuality));
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
      getInitialStateAirQualities(callback) {
        const upserts = Meteor.call('getInitialStateAirQualities');
        callback(null, upserts);
      },
    }, function(err) {
      console.log(err);
    });
    Meteor.setInterval(function() {
      Meteor.call('pollStateAirQualities');
    }, Meteor.settings.POLL_TIMER_SECONDS * 1000);
  });
})();
