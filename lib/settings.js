/* globals Meteor */
(function() {
  if (typeof Meteor.settings === 'undefined') {
    Meteor.settings = {};
  }
  Meteor.settings.debug = true;
  Meteor.settings.POLL_TIMER_SECONDS = 1200;
})();
