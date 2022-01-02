

const Utils = {
    shortenKey: function (key, len = 5) {
        return key.substring(0, len) + "..." + key.substring(key.length - len);
    },
    
    formatAmount: function (amount, maxdigit=7) {
        return Intl.NumberFormat.call(this, 'fr-FR', { maximumFractionDigits: maxdigit }).format(amount);
    },
    
    splitAsset: function (asset) {
        var sepIndex = asset.indexOf(':');
        var asset_code = asset.substring(0, sepIndex);
        if (asset_code) {
            var asset_issuer = asset.substring(sepIndex + 1);
            return {
                code: asset_code,
                issuer: asset_issuer
            }
        } 
        return {
            code: "native",
        };
    }
}

