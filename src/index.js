const Web3 = require('web3')
const ProviderEngine = require('web3-provider-engine')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const Web3Subprovider = require("web3-provider-engine/subproviders/provider.js")
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
const SubscriptionsSubprovider = require('web3-provider-engine/subproviders/subscriptions.js')

const context = window || global

context.chrome = { webstore: true }
context.Web3 = Web3

let callbacks = {}
let hookedSubProvider
let globalSyncOptions = {}

const AlphaWallet = {
  init (rpcUrl, options, syncOptions) { 
    const engine = new ProviderEngine()
    const web3 = new Web3(engine)
    context.web3 = web3
    globalSyncOptions = syncOptions

    engine.addProvider(new CacheSubprovider())
    engine.addProvider(new SubscriptionsSubprovider())
    engine.addProvider(new FilterSubprovider())
    engine.addProvider(hookedSubProvider = new HookedWalletSubprovider(options))

    let username, password;
    let start = rpcUrl.indexOf("://");
    if (start != -1) {
      start += 3;
      const end = rpcUrl.indexOf("@", start + 1);
      if (end != -1) {
          const credentials = rpcUrl.substring(start, end);
          let [u, p] = credentials.split(":");
          username = u;
          password = p;
      }
    }
    if (typeof username === 'undefined' || typeof password === 'undefined') {
      engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(rpcUrl)))
    } else {
      engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(rpcUrl,0,username,password)))
    }

    engine.on('error', err => console.error(err.stack))
    engine.enable = options.enable
    engine.isAlphaWallet = true
    engine.start()

    return engine
  },
  addCallback (id, cb, isRPC) {
    cb.isRPC = isRPC
    callbacks[id] = cb
  },
  executeCallback (id, error, value) {
    console.log(`executing callback: \nid: ${id}\nvalue: ${value}\nerror: ${error}\n`)

    let callback = callbacks[id]

    if (callback.isRPC) {
        const response = {'id': id, jsonrpc: '2.0', result: value, error: {message: error} }

      if (error) {
        callback(response, null)
      } else {
        callback(null, response)
      }
    } else {
      callback(error, value)
    }
    delete callbacks[id]
  }
}

if (typeof context.AlphaWallet === 'undefined') {
  context.AlphaWallet = AlphaWallet
}

ProviderEngine.prototype.setHost = function (host) {
  var length = this._providers.length;
  this._providers[length - 1].provider.host = host;
}

ProviderEngine.prototype.send = function (payload) {
  const self = this

  let result = null
  switch (payload.method) {

    case 'eth_accounts':
      let address = globalSyncOptions.address
      result = address ? [address] : []
      break

    case 'eth_coinbase':
      result = globalSyncOptions.address || null
      break

    case 'eth_uninstallFilter':
      self.sendAsync(payload, noop)
      result = true
      break

    case 'net_version':
      result = globalSyncOptions.networkVersion || null
      break

    case 'net_listening':
      try {
        self._providers.filter(p => p.provider !== undefined)[0].provider.send(payload)
        result = true
      } catch (e) {
        result = false
      }
      break

    // throw not-supported Error
    default:
      var message = `The AlphaWallet Web3 object does not support synchronous methods like ${payload.method} without a callback parameter.`
      throw new Error(message)
  }
  // return the result
  return {
    id: payload.id,
    jsonrpc: payload.jsonrpc,
    result: result,
  }
}

ProviderEngine.prototype.isConnected = function () {
    return this.send({
        id: 9999999999,
        jsonrpc: '2.0',
        method: 'net_listening',
        params: []
    }).result
}

ProviderEngine.prototype.sendAsyncOriginal = ProviderEngine.prototype.sendAsync
ProviderEngine.prototype.sendAsync = function (payload, cb) {
  switch (payload.method) {
    case 'net_version':
      var result = {
        id: payload.id,
        jsonrpc: payload.jsonrpc,
        result: globalSyncOptions.networkVersion || null
      };
      cb(null, result);
      break;
    case 'eth_requestAccounts':
      var result = {
        id: payload.id,
        jsonrpc: payload.jsonrpc,
        result: [globalSyncOptions.address]
      };
      cb(null, result);
      break;
    case 'eth_chainId':
      var result = {
        id: payload.id,
        jsonrpc: payload.jsonrpc,
        result: "0x" + globalSyncOptions.networkVersion.toString(16) || null
      };
      cb(null, result);
      break;
    default:
      //Patch the payload so nodes accept it, to prevent error: "invalid json request"
      if (payload.id) {
        this.sendAsyncOriginal(payload, cb);
      } else {
        var payload2 = payload
        payload2['id'] = 1
        this.sendAsyncOriginal(payload2, cb);
      }
  }
};

ProviderEngine.prototype.request = function (payload) {
  return new Promise((resolve, reject) => {
    this.sendAsync(payload, function(error, response) {
      if (error) {
        reject(error)
      } else {
        resolve(response.result)
      }
    })
  })
}

module.exports = AlphaWallet
