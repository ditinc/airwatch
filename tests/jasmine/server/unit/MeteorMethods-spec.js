/*globals Meteor, describe, it, spyOn, expect */
/*globals StateAirQualities */
(function() {
  "use strict";
  describe("Meteor.methods", function() {
    it("should get initial state air qualities without existing data", function() {
      var fakeRecallCount = {
        count: function() {
          return 0;
        }
      };
      spyOn(StateAirQualities, "find").and.returnValue(fakeRecallCount);

      var fakeHttpResponse = {
        data: {
          results : [
            { recall_number: 'ABC123', status: 'Ongoing'},
            { recall_number: 'ABC124', status: 'Ongoing'}
          ]
        }
      };
      // NOTE: Meteor.http is being mocked within z-collections-stubs.js
      spyOn(Meteor.http, "get").and.returnValue(fakeHttpResponse);

      spyOn(StateAirQualities, "upsert").and.callFake(function(search, obj) {
        return obj;
      });

      var fakeResults = Meteor.methodMap.getInitialStateAirQualities.call({});
      expect(fakeResults).toEqual(fakeHttpResponse.data.results);
    });
    it("should get initial state air qualities with existing data", function() {
      var fakeRecallCount = {
        count: function() {
          return 1;
        }
      };
      spyOn(StateAirQualities, "find").and.returnValue(fakeRecallCount);

      var fakeResults = Meteor.methodMap.getInitialStateAirQualities.call({});
      expect(fakeResults).toEqual([]);
    });
    it("should poll state air qualities", function() {
      var fakeHttpResponse = {
        data: {
          results : [
            { recall_number: 'ABC123', status: 'Ongoing'}
          ]
        }
      };
      // NOTE: Meteor.http is being mocked within z-collections-stubs.js
      spyOn(Meteor.http, "get").and.returnValue(fakeHttpResponse);

      spyOn(StateAirQualities, "upsert").and.callFake(function(search, obj) {
        return obj;
      });

      var fakeResults = Meteor.methodMap.pollStateAirQualities.call({});
      expect(fakeResults).toEqual(fakeHttpResponse.data.results);
    });
    it("should build search template with invalid options", function() {
      var search = Meteor.call('buildSearch', {a:'',b:''});
      expect(search).toEqual('search=report_date:[+TO+]');
    });
    it("should build search template with valid options", function() {
      var search = Meteor.call('buildSearch', {from:'20150101',to:'20150613'});
      expect(search).toEqual('search=report_date:[20150101+TO+20150613]');
    });
    it("should build endpoint template with valid options", function() {
      var search = Meteor.call('buildSearch', {from:'20150101',to:'20150613'});
      var endpoint = Meteor.call('buildEndpoint', {search:search, limit:1});
      expect(endpoint).toEqual('https://'+'api.'+'fda.'+'gov'+'/food/enforcement.json?search=report_date:[20150101+TO+20150613]&limit=1');
    });
  });
})();
