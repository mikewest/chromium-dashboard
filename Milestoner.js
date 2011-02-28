
var Milestoner = function(data) {
  this.root_ = document.getElementById(data.id);

  this.generateCallback_();

  var self = this;
  // Pull latest data once every hour.
  this.update_();
  window.setInterval(function() {
    self.update_();
  }, Milestoner.HOURLY_MILLISECONDS);
  // Update HTML display every minute.
  window.setInterval(function() {
    self.writeHTML_();
  }, Milestoner.MINUTELY_MILLISECONDS);
};

Milestoner.STATUS_URL = "https://www.google.com/calendar/feeds/google.com_u9ank8slvuscb8ntja02j0m7n4%40group.calendar.google.com/private-db14d05bd22a1efd2e2aa27796a9c121/full?alt=json-in-script&callback=%CALLBACK%";
Milestoner.OUTPUT_FORMAT = "<h1>%DATE%</h1><ol>%ENTRIES%</ol>";
Milestoner.ENTRY_FORMAT = "<li><time datetime='%MACHINE%'>%HUMAN%</time> %TITLE% <em>(%LEFT%)</em></li>";
Milestoner.MINUTELY_MILLISECONDS = 1000 * 60;
Milestoner.HOURLY_MILLISECONDS = 1000 * 60 * 60;
Milestoner.DAILY_MILLISECONDS = 1000 * 60 * 60 * 24;
Milestoner.DATE_STRINGS = {
  'days': [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ],
  'months': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};

Milestoner.prototype.generateCallback_ = function() {
  var self = this;
  window['milestonerCallback'] = function(data) {
    self.handleJSONP_(data);
  };
  Milestoner.STATUS_URL = Milestoner.STATUS_URL.replace("%CALLBACK%", 'milestonerCallback');
};

/**
 * Callback that will be performed when STATUS_URL is successfully loaded
 *
 * @param {object} The calendar's data.
 * @private
 */
Milestoner.prototype.handleJSONP_ = function(data) {
  this.entries_ = [];
  var i;
  for (i = data.feed.entry.length - 1; i >= 0; i--) {
    var entry = data.feed.entry[i];
    var entryDate = new Date(entry['gd$when'][0].startTime);
    this.entries_.push({
      'date': entryDate,
      'title': entry['title']['$t'],
      'human': entryDate.getDate() + "." + (entryDate.getMonth()+1),
      'machine': entryDate.getFullYear() + "-" + (entryDate.getMonth()+1) +
          "-" + entryDate.getDate()
    });
  }
  this.entries_.sort(function(a, b) {
    return a.date - b.date;
  });
  this.writeHTML_();
};

/**
 * Writes a series of elements in ENTRY_FORMAT to the Milestoner root
 * node.
 *
 * @private
 */
Milestoner.prototype.writeHTML_ = function() {
  var html = [];
  var now = new Date();
  var i;
  for (i = 0; i < this.entries_.length; i++) {
    var entry = this.entries_[i];
    var left = (entry.date - new Date()) / Milestoner.DAILY_MILLISECONDS;
    if (left > -1) {
      if (left > 0) {
        left = (Math.floor(left * 1000) / 1000) + " days";
      } else {
        left = "<strong>TODAY</strong>";
      }
      html.push(Milestoner.ENTRY_FORMAT
                          .replace("%MACHINE%", entry.machine)
                          .replace("%HUMAN%", entry.human)
                          .replace("%TITLE%", entry.title)
                          .replace("%LEFT%", left));
    }
  }
  this.root_.innerHTML = Milestoner.OUTPUT_FORMAT
      .replace("%DATE%", Milestoner.DATE_STRINGS.days[now.getDay()] +
          ", " + Milestoner.DATE_STRINGS.months[now.getMonth()] + " " +
              now.getDate() )
      .replace("%ENTRIES%", html.slice(0, 5).join(''));
};

/**
 * Loads the JSONP data from STATUS_URL, which will trigger a callback
 * after successfully loading.
 *
 * @private
 */
Milestoner.prototype.update_ = function() {
  var scriptTag = document.createElement('script');
  scriptTag.src = Milestoner.STATUS_URL;
  scriptTag.onload = function(e) {
    scriptTag.parentNode.removeChild(scriptTag);
  };
  document.body.appendChild(scriptTag);
};
