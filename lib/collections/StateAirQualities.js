/* globals StateAirQualities:true, Mongo, Meteor */
StateAirQualities = new Mongo.Collection('StateAirQualities');

// shared client and server methods
StateAirQualities.latest = function() {
  return StateAirQualities.find();
};

if (Meteor.isServer) {
  (function () {
    StateAirQualities._ensureIndex({ recall_number: 1 }, { unique: 1 });
  })();
}
