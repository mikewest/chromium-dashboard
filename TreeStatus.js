var TreeStatus = function(data) {
  this.el = document.getElementById(data.id);
  var self = this;
  self.requestData_();
  window.setInterval(function() {
    self.requestData_();
  }, 10000);
};

///////////////////////////////////////////////////////////////////////////////

/**
 * The URL from which to pull the tree's status information.
 *
 * @const
 * @type {string}
 */
TreeStatus.STATUS_URL = 'http://6.chromium-status.appspot.com/current?format=json';

/**
 * @enum {string}
 */
TreeStatus.State = {
  CLOSED: 'closed',
  MAINTENANCE: 'maintenance',
  OPEN: 'open',
  THROTTLED: 'throttled'
};

/**
 * @typedef {{username: string, date: Date, message: string,
 *     state: TreeStatus.State}}
 */
TreeStatus.TreeData;

///////////////////////////////////////////////////////////////////////////////

/**
 * Triggers an async XHR request to STATUS_URL, and handles the response by
 * parsing the data, and recording the tree's current status.
 *
 * @private
 */
TreeStatus.prototype.requestData_ = function() {
  var xhr = new XMLHttpRequest();
  var self = this;
  xhr.open('get', TreeStatus.STATUS_URL, true);

  xhr.onload = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var data = JSON.parse(xhr.responseText);
      self.data_ = self.parseData_(data);
      self.update_();
    } else {
      // TODO(mkwst) Error handling.
    }
  };
  xhr.send(null);
};

/**
 * @param {object} data The parsed JSON object pulled from STATUS_URL.
 * @return {TreeStatus.TreeData}
 */
TreeStatus.prototype.parseData_ = function(data) {
  var result = {
    'username': data.username,
    'date': this.parseDate_(data.date),
    'message': data.message,
    'state': data.general_state
  };
   
  return result;
};

/**
 * Parses a date string in the form 'YYYY-MM-DD HH:MM:SS.MMMMMM' into a
 * real JavaScript Date object.
 *
 * @param {string} data Date string in the form
 *     'YYYY-MM-DD HH:MM:SS.MMMMMM' 
 * @return {?Date} Returns a Date object, or 'null' if invalid.
 */
TreeStatus.prototype.parseDate_ = function(data) {
  var mg = data.match(/(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/);
  if (mg) {
    return new Date(parseInt(mg[0], 10), parseInt(mg[1], 10),
        parseInt(mg[2], 10), parseInt(mg[3], 10),parseInt(mg[4], 10),
        parseInt(mg[5], 10));
  } else {
    return null;
  }
};

/**
 * Updates a DOM element's 'innerHTML' based on the tree's status.
 * @private
 */
TreeStatus.prototype.update_ = function() {
  if (this.data_.state === TreeStatus.State.OPEN) {
    document.documentElement.classList.add('open');
    document.documentElement.classList.remove('closed');
  } else {
    document.documentElement.classList.add('closed');
    document.documentElement.classList.remove('open');
  }
  this.el.innerHTML = this.data_.message;
};
