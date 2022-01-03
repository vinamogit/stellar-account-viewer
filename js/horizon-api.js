
var that = this;
const Horizon = {

    network: "PUBLIC",

    calls: function () {
        return localStorage.getItem("callscount");
    },

    _updateCallRate: async function () {

        try {

            var current = parseInt(localStorage.getItem("callsdate"));
            if (!current) {
                current = 0;
            }
            var now = new Date();
            if (current < now.getTime()) {
                var d = new Date();
                d.setHours(new Date().getHours() + 1, 0, 0, 0);
                localStorage.setItem("callsdate", d.getTime());
                localStorage.setItem("callscount", 0);
            }

            var count = parseInt(this.calls()) + 1;
            localStorage.setItem("callscount", count);

        } catch (e) {
            console.error(e);
        }

    },

    _getBaseUrl: function (network) {
        if (network == "PUBLIC") {
            return "https://horizon.stellar.org/";
        }

        return "https://horizon-testnet.stellar.org/";
    },

    accounts: async function (pubKey) {
        this._updateCallRate();
        let response = await fetch(this._getBaseUrl(network) + "accounts/" + pubKey);
        return response.json();

    },

    operations: async function (pubKey) {
        this._updateCallRate();
        let response = await fetch(this._getBaseUrl(network) + "accounts/" + pubKey + '/operations');
        return response.json();

    },

    assets: async function (code, issuer, limit = 1) {
        this._updateCallRate();

        var params = "?limit=" + limit;
        if (code) {
            params += "&asset_code=" + code;
        }
        if (issuer) {
            params += "&asset_issuer=" + issuer;
        }

        let response = await fetch(this._getBaseUrl(network) + "assets" + params);
        return response.json();

    },

    strictSend: async function (type, code, issuer, destination, amount) {
        this._updateCallRate();

        var params = "?source_asset_type=" + type;
        params += "&destination_assets=" + destination;
        params += "&source_amount=" + amount;
        if (code) {
            params += "&source_asset_code=" + code;
        }
        if (issuer) {
            params += "&source_asset_issuer=" + issuer;
        }

        let response = await fetch(this._getBaseUrl(network) + "paths/strict-send" + params);
        return response.json();

    },

    trade_aggregations: async function(base, counter, resolution, start, end) {
        this._updateCallRate();

        var params = "?base_asset_type=" + base.type;
        if (base.code) {
            params += "&base_asset_code=" + base.code;
        }
        if (base.issuer) {
            params += "&base_asset_issuer=" + base.issuer;
        }
        params += "&counter_asset_type=" + counter.type;
        if (counter.code) {
            params += "&counter_asset_code=" + counter.code;
        }
        if (counter.issuer) {
            params += "&counter_asset_issuer=" + counter.issuer;
        }
        params += "&resolution=" + resolution;
        params += "&start_time=" + start;
        params += "&end_time=" + end;

        let response = await fetch(this._getBaseUrl(network) + "trade_aggregations" + params);
        return response.json();

    },

    liquidityPools: async function (poolId) {
        this._updateCallRate();

        let response = await fetch(this._getBaseUrl(network) + "liquidity_pools/" + poolId);
        return response.json();

    },
};