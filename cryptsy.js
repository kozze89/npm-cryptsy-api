var stringify = require('querystring').stringify,
  hmac = require('crypto').createHmac,
  request = require('request'),
  publicMethods = ['marketdata','marketdatav2','orderdata',
    'singleorderdata','singlemarketdata'];

/**
 * CryptsyClient constructor. Needs keys to make private requests
 * @param {String} key Public key from cryptsy
 * @param {String} secret Private key from cryptsy
 */
function CryptsyClient(key, secret) {
  this.key = key;
  this.secret = secret;
}

CryptsyClient.prototype.apiQuery = function(method, callback, args) {
  var argsTmp = {};

  for(var i in args) {
    if(args[i]) {
      argsTmp[i] = args[i];
    }
  }

  args = argsTmp;

  var options = {
    uri: 'https://api.cryptsy.com/api',
    json: true,
    agent: false,
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/4.0 (compatible; Cryptsy API node client)',
      'Content-type': 'application/x-www-form-urlencoded'
    }
  };

  args.method = method;

  if(publicMethods.indexOf(method) > -1) {
    options.method = 'GET';
    options.uri = 'http://pubapi.cryptsy.com/api.php?' + stringify(args);
  } else {
    if (!this.key || !this.secret) {
      throw new Error('Must provide key and secret to make this API request');
    } else {
      args.nonce = new Date().getTime();
      var message = stringify(args);
      var signedMessage = new hmac('sha512', this.secret);
      signedMessage.update(message);

      options.headers.Key = this.key;
      options.headers.Sign = signedMessage.digest('hex');
      options.body = message;
    }
  }

  request(options, function(err, res, body) {
    var error = function(msg) {
      return callback(null, 'There was an error in the reqeust: '+ msg);
    };

    // Look for HTTP errors
    if (err) {
      return error(err);
    }

    // Check cryptsy errors
    if (parseInt(body.success) === 1 &&
        typeof callback === typeof Function) {
      callback(body.return);
    } else if (body.error) {
      return error(body.error);
    }
  });
};

/**
 * This function gets the market id for a market in the format 'LTCBTC'
 */
CryptsyClient.prototype.getmarketid = function(marketname, callback) {
  if(!this.markets || !this.markets.length) {
    this.getmarkets(function() {
      return callback(this.markets[marketname]);
    });
  } else {
    return callback(this.markets[marketname]);
  }
};

/**
 * Old API method
 */
CryptsyClient.prototype.marketdata = function(callback) {
  this.apiQuery('marketdata', callback);
};

/**
 * New API method
 */
CryptsyClient.prototype.marketdatav2 = function(callback) {
  this.apiQuery('marketdatav2', callback);
};

CryptsyClient.prototype.singlemarketdata = function(marketid, callback) {
  this.apiQuery('singlemarketdata', callback, {
    marketid: marketid
  });
};

CryptsyClient.prototype.orderdata = function(callback) {
  this.apiQuery('orderdata', callback);
};

CryptsyClient.prototype.singleorderdata = function(marketid, callback) {
  this.apiQuery('singleorderdata', callback, {
    marketid: marketid
  });
};

CryptsyClient.prototype.getinfo = function(callback) {
  this.apiQuery('getinfo', callback);
};

CryptsyClient.prototype.getmarkets = function(callback) {
  var callback2 = function(markets) {
    this.markets = {};
    for(var i in markets) {
      this.markets[markets[i].primary_currency_code +
        markets[i].secondary_currency_code] = markets[i].marketid;
    }
    callback(markets);
  };

  this.apiQuery('getmarkets', callback2);
};

CryptsyClient.prototype.mytransactions = function(callback) {
  this.apiQuery('mytransactions', callback);
};

CryptsyClient.prototype.markettrades = function(marketid, callback) {
  this.apiQuery('markettrades', callback, {
    marketid: marketid
  });
};

CryptsyClient.prototype.marketorders = function(marketid, callback) {
  this.apiQuery('marketorders', callback, {
    marketid: marketid
  });
};

CryptsyClient.prototype.mytrades = function(marketid, limit, callback) {
  this.apiQuery('mytrades', callback, {
    marketid: marketid,
    limit: limit
  });
};

CryptsyClient.prototype.allmytrades = function(callback) {
  this.apiQuery('allmytrades', callback);
};

CryptsyClient.prototype.myorders = function(marketid, callback) {
  this.apiQuery('myorders', callback, {
    marketid: marketid
  });
};

CryptsyClient.prototype.allmyorders = function(callback) {
  this.apiQuery('allmyorders', callback);
};

CryptsyClient.prototype.createorder =
  function(marketid, ordertype, quantity, price, callback) {
  this.apiQuery('createorder', callback, {
    marketid: marketid,
    ordertype: ordertype,
    quantity: quantity,
    price: price
  });
};

CryptsyClient.prototype.cancelorder = function(orderid, callback) {
  this.apiQuery('cancelorder', callback, { orderid: orderid });
};

CryptsyClient.prototype.calculatefees =
  function(ordertype, quantity, price, callback) {
  this.apiQuery('calculatefees', callback, {
    ordertype: ordertype,
    quantity: quantity,
    price: price
  });
};


module.exports = CryptsyClient;
